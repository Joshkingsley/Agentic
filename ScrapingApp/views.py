import os
import json
import time
import logging
import requests
from bs4 import BeautifulSoup
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
from brightdata import SyncBrightDataClient
import os
import time
from django.shortcuts import render
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_SCRAPE_TEXT_CHARS = 8000
MAX_DISCOVERED_URLS = 3

# Category → icon mapping (mirrors the frontend CATEGORIES constant)
CATEGORY_ICONS = {
    "Footwear": "👟",
    "Flowers": "🌹",
    "Clothes": "👕",
    "Textiles": "🧵",
    "Electronics": "🔌",
    "General Merchandise": "📦",
}

# Known item catalogue — used to cross-reference scraped results against
# the frontend's ITEM_DEFAULTS and POOL_DEFAULTS so IDs line up.
ITEM_ID_MAP = {
    "Industrial Utility Workboots": "fw-1",
    "Terrain Offroad Trail Shoes":  "fw-2",
    "Premium Long-Stem Red Roses":  "fl-1",
    "Double-Weave Cotton Hoodies":  "cl-1",
    "Raw Indigo Denim Rolls":       "tx-1",
    "Solid State Storage Blocks":   "el-1",
}




def _get_brightdata_client() -> SyncBrightDataClient:
    """
    Returns a configured Bright Data client.
    Raises clearly if the token is missing rather than failing silently.
    """
    api_token = os.getenv("BRIGHTDATA_API_TOKEN", "d60bdfe5-08f3-42f7-93c1-78afa970e1cf")
    if not api_token:
        raise EnvironmentError(
            "BRIGHTDATA_API_TOKEN is not set. "
            "Add it to your .env file — get it from the Bright Data control panel."
        )
    return SyncBrightDataClient(token=api_token)


# ─── AGENT 1 — DISCOVERY (Bright Data SERP) ──────────────────────────────────

BLOCKED_DOMAINS = {
    "merkandi.us",
    "merkandi.com",
    "alibaba.com",      # blocks scraping
    "aliexpress.com",   # blocks scraping
    "amazon.com",       # blocks scraping
}

def discovery_agent(niche_query: str, country_code: str = "US") -> list[str]:
    """
    Discovers target wholesale/liquidation URLs using Bright Data's
    built-in Google Search — no SerpAPI key needed.

    The same BRIGHTDATA_API_TOKEN used for scraping also authenticates
    search requests, so this is a single-vendor, single-credential setup.

    Falls back to a hardcoded list of high-value wholesale platforms
    when BRIGHTDATA_API_TOKEN is absent (dev/demo mode).
    """
    try:
        client = _get_brightdata_client()
    except EnvironmentError:
        # Dev/demo fallback — no credentials configured
        logger.warning("BRIGHTDATA_API_TOKEN not set — using hardcoded fallback URLs.")
        encoded = requests.utils.quote(niche_query)
        return [
            f"https://www.liquidation.com/c/wholesale?q={encoded}",
            f"https://www.directliquidation.com/search/?search={encoded}",
            f"https://www.bulq.com/search?q={encoded}",
        ][:MAX_DISCOVERED_URLS]

    try:
        with client:
            results = client.search.google(
                query=f"{niche_query} wholesale closeout liquidation",
                location=country_code,   # e.g. "US", "Kenya"
                language="en",
                num_results=20,
            )

            if not results or not results.data:
                logger.warning("Bright Data search returned no results for: %s", niche_query)
                return []
            
            links = [
                r.get("url") or r.get("link")
                for r in results.data
                if r.get("url") or r.get("link")
            ]

            seen_domains = set()
            unique_links = []

            for r in results.data:
                link = r.get("url") or r.get("link")
                if not link:
                    continue
                domain = urlparse(link).netloc.replace("www.", "")
                if domain in BLOCKED_DOMAINS:
                    logger.info("Skipping blocked domain: %s", domain)
                    continue
                if domain in seen_domains:
                    continue
                seen_domains.add(domain)
                unique_links.append(link)
                if len(unique_links) >= MAX_DISCOVERED_URLS:
                    break

            return unique_links

    except Exception as exc:
        logger.error("Discovery agent (Bright Data search) failed: %s", exc)
        return []


# ─── SCRAPER — BRIGHT DATA SDK ────────────────────────────────────────────────

def fetch_arbitrage_target(url: str) -> BeautifulSoup | None:
    """
    Fetches raw HTML using the Bright Data Python SDK.

    The SDK handles proxy zone selection, session rotation, CAPTCHA solving,
    and JS rendering automatically — no manual proxy URL construction needed.

    Falls back to a plain requests call (browser UA) in dev mode when
    BRIGHTDATA_API_TOKEN is absent.
    """
    try:
        client = _get_brightdata_client()
    except EnvironmentError:
        # Dev fallback
        logger.warning(
            "BRIGHTDATA_API_TOKEN not set — falling back to direct request for %s", url
        )
        return _direct_fetch(url)

    try:
        with client:
            result = client.scrape_url(url)

            if not result or not result.data:
                logger.warning("Bright Data SDK returned empty result for %s", url)
                return None

            logger.info(
                "Scraped %s via Bright Data SDK (%.0fms, cost: $%.4f).",
                url,
                result.elapsed_ms() if hasattr(result, "elapsed_ms") else 0,
                result.cost if hasattr(result, "cost") else 0,
            )
            # result.data is raw HTML string
            return BeautifulSoup(result.data, "html.parser")

    except Exception as exc:
        logger.error("Bright Data SDK scrape failed for %s: %s", url, exc)
        # Attempt direct fetch as last resort rather than returning nothing
        logger.info("Attempting direct fallback fetch for %s", url)
        return _direct_fetch(url)


def _direct_fetch(url: str) -> BeautifulSoup | None:
    """
    Plain requests fallback — used in dev mode or when the SDK call fails.
    Not suitable for production targets with bot detection.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as exc:
        logger.error("Direct fallback fetch also failed for %s: %s", url, exc)
        return None

# ─── GROQ CLIENT (singleton) ─────────────────────────────────────────────────

def _get_groq_client():
    api_key = os.getenv("GROQ_API_KEY", "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")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY is not set.")
    return Groq(api_key=api_key)

# ─── AGENT 2 — PARSING ───────────────────────────────────────────────────────

def parsing_agent(soup: BeautifulSoup, source_url: str = "") -> list[dict]:
    """
    Sends stripped page text to Groq and returns a list of structured
    deal objects whose shape matches the frontend normaliseApiItem() contract:

      id, name, category, price (US wholesale), ke_spot_price,
      confidence, profit, expiry, volume, moq, route,
      freight_cost, tariff_rate, clearing_fees,
      change_in_price_from_last_month, arbitrage_opportunity,
      news (list of {source, headline, impact})
    """
    clean_text = soup.get_text(separator="\n", strip=True)[:MAX_SCRAPE_TEXT_CHARS]

    prompt = f"""
You are a trade intelligence extraction engine for a US-to-Kenya arbitrage platform called COMAS.

Analyze the scraped wholesale/liquidation page text below and extract every distinct
product, lot, or inventory package listed.

For EACH item return a JSON object with EXACTLY these fields:

- "name"                         : string — product or lot title
- "category"                     : one of ["Footwear", "Flowers", "Clothes", "Textiles",
                                   "Electronics", "General Merchandise"]
- "price"                        : float — listed wholesale USD price per unit (not lot total)
- "ke_spot_price"                : float — estimated Kenya spot price in USD
                                   (apply a 4-6x markup on the US wholesale price
                                    to account for EAC tariffs, freight, clearing fees,
                                    and local retail demand; use your best estimate)
- "confidence"                   : integer 0-100 — your confidence that this is a real
                                   arbitrage opportunity based on the data quality
- "profit"                       : float — estimated net profit per unit after all costs
                                   (ke_spot_price minus price minus freight minus tariff
                                    minus clearing; use approximate industry defaults if
                                    exact costs are unavailable)
- "expiry"                       : string — deal/listing expiry date if visible, else "N/A"
- "volume"                       : string — total available stock (e.g. "1,200 units")
- "moq"                          : string — minimum order quantity (e.g. "50 units")
- "route"                        : string — likely freight route
                                   (default "Newark → Mombasa → Nairobi" for US goods)
- "freight_cost"                 : float — estimated freight cost per unit in USD
- "tariff_rate"                  : float — EAC import tariff as a decimal (e.g. 0.25)
- "clearing_fees"                : float — estimated clearing & handling per unit in USD
- "change_in_price_from_last_month": string — any visible price change, or "N/A"
- "arbitrage_opportunity"        : string — brief plain-English explanation of the margin
- "news"                         : array of up to 2 objects, each with:
    - "source"   : string — headline source name
    - "headline" : string — relevant market or logistics signal
    - "impact"   : "Positive" | "Negative" | "Neutral"

Return ONLY a valid JSON array. No markdown fences, no keys wrapping the array,
no commentary outside the JSON.

Scraped text:
{clean_text}
"""

    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content
        parsed = json.loads(raw)

        # Normalise: Groq sometimes wraps the array in a top-level key
        items: list[dict] = []
        if isinstance(parsed, list):
            items = parsed
        elif isinstance(parsed, dict):
            for val in parsed.values():
                if isinstance(val, list):
                    items = val
                    break
            if not items:
                items = [parsed]

        # Enrich each item with derived/frontend-compatible fields
        enriched = []
        for idx, item in enumerate(items):
            item = _enrich_item(item, idx, source_url)
            enriched.append(item)

        logger.info("Parsing agent extracted %d items from %s", len(enriched), source_url)
        return enriched

    except json.JSONDecodeError as exc:
        logger.error("Parsing agent — JSON decode error: %s", exc)
        return []
    except Exception as exc:
        logger.error("Parsing agent failed: %s", exc)
        return []


def _enrich_item(item: dict, idx: int, source_url: str) -> dict:
    """
    Fills in missing fields with sensible defaults and ensures every key
    the frontend `normaliseApiItem()` function expects is present.
    Also assigns a stable `id` by cross-referencing ITEM_ID_MAP.
    """
    name = item.get("name", "Unknown Item")
    category = item.get("category", "General Merchandise")

    us_spot = float(item.get("price", 0) or 0)
    ke_spot = float(item.get("ke_spot_price", 0) or 0)
    if ke_spot == 0 and us_spot > 0:
        # Conservative default multiplier if the model didn't estimate
        ke_spot = round(us_spot * 4.5, 2)

    freight  = float(item.get("freight_cost",  us_spot * 0.12) or us_spot * 0.12)
    tariff_r = float(item.get("tariff_rate",   0.25) or 0.25)
    clearing = float(item.get("clearing_fees", us_spot * 0.08) or us_spot * 0.08)

    profit = float(item.get("profit", 0) or 0)
    if profit == 0:
        profit = round(ke_spot - us_spot - freight - (us_spot * tariff_r) - clearing, 2)

    confidence = int(item.get("confidence", 85) or 85)
    confidence = max(0, min(100, confidence))

    # Build a 7-point synthetic price history so the sparkline renders
    import random
    base = us_spot * 0.85
    prices = [
        round(base + (us_spot - base) * (i / 6) + random.uniform(-us_spot * 0.02, us_spot * 0.02), 2)
        for i in range(7)
    ]

    # Attempt stable ID lookup; fall back to a generated slug
    matched_id = None
    for key, val in ITEM_ID_MAP.items():
        if key.lower() in name.lower():
            matched_id = val
            break
    item_id = matched_id or f"{category[:2].lower()}-{idx + 1}"

    return {
        # Core identity
        "id":       item_id,
        "name":     name,
        "category": category,
        "icon":     CATEGORY_ICONS.get(category, "📦"),

        # Pricing
        "price":        us_spot,    # raw wholesale
        "usSpot":       us_spot,    # alias used by frontend SpreadCard
        "keSpot":       ke_spot,    # alias used by frontend SpreadCard
        "profit":       profit,
        "prices":       prices,     # sparkline history

        # Costs
        "freightCost":  freight,
        "tariffRate":   tariff_r,
        "clearingFees": clearing,

        # Trade metadata
        "confidence": confidence,
        "expiry":     item.get("expiry", "N/A"),
        "volume":     item.get("volume", "N/A"),
        "moq":        item.get("moq",    "N/A"),
        "route":      item.get("route",  "Newark → Mombasa → Nairobi"),

        # Market signals
        "change_in_price_from_last_month": item.get("change_in_price_from_last_month", "N/A"),
        "arbitrage_opportunity":           item.get("arbitrage_opportunity", ""),
        "news":                            item.get("news", []),

        # Provenance
        "source_url": source_url,
    }


# ─── AGENT 3 — COMMUNICATION ─────────────────────────────────────────────────

def communication_agent(trade_signals: list[dict]) -> str:
    """
    Synthesises all parsed deals into a brief investor-facing narrative summary.
    """
    if not trade_signals:
        return (
            "No notable arbitrage targets were detected in this search cycle. "
            "Consider broadening the niche query or refreshing the pipeline."
        )

    # Send only the fields relevant to narrative generation (keep context lean)
    summary_input = [
        {
            "name":     d.get("name"),
            "category": d.get("category"),
            "usSpot":   d.get("usSpot"),
            "keSpot":   d.get("keSpot"),
            "profit":   d.get("profit"),
            "confidence": d.get("confidence"),
            "arbitrage_opportunity": d.get("arbitrage_opportunity"),
        }
        for d in trade_signals
    ]

    prompt = (
        "You are a senior trade analyst for COMAS, a US-to-Kenya arbitrage platform. "
        "Summarise the following real-time wholesale deals into a concise, professional "
        "investor briefing (3-5 sentences). Highlight the top 2 opportunities by profit "
        "margin, explain why they are strong plays, and flag any confidence concerns.\n\n"
        f"Deals:\n{json.dumps(summary_input, indent=2)}"
    )

    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=300,
        )
        return completion.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("Communication agent failed: %s", exc)
        return "Summary unavailable due to an internal error. Please review the parsed deals directly."


# ─── DJANGO VIEWS ─────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class ArbitragePipelineView(View):
    """
    POST /api/arbitrage/pipeline/
    Body: { "query": "industrial workboots", "country": "US" }

    Runs the full 3-agent pipeline:
      1. Discovery  — finds target wholesale URLs
      2. Parsing    — scrapes + LLM-structures each page into deal objects
      3. Communication — generates an investor narrative summary

    Response shape matches what the frontend normaliseApiItem() expects.
    """

    def post(self, request, *args, **kwargs):
        # ── Parse request body ──────────────────────────────────────────────
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Request body must be valid JSON."}, status=400)

        niche_query  = body.get("query", "").strip()
        country_code = body.get("country", "US").upper().strip()

        if not niche_query:
            return JsonResponse(
                {"error": "The 'query' field is required and must not be empty."},
                status=400,
            )

        pipeline_start = time.time()

        # ── Agent 1: Discovery ──────────────────────────────────────────────
        discovered_urls = discovery_agent(niche_query, country_code)

        if not discovered_urls:
            return JsonResponse(
                {
                    "status": "partial_success",
                    "message": "No URLs discovered for this query. Try a broader search term.",
                    "query": niche_query,
                    "discovered_urls": [],
                    "scraped_sources": [],
                    "parsed_deals": [],
                    "summary": "",
                    "elapsed_ms": int((time.time() - pipeline_start) * 1000),
                },
                status=200,
            )

        # ── Agent 2: Scrape + Parse ─────────────────────────────────────────
        all_deals:      list[dict] = []
        scraped_sources: list[str] = []
        scrape_errors:   list[str] = []

        for url in discovered_urls:
            soup = fetch_arbitrage_target(url)
            if soup is None:
                scrape_errors.append(url)
                continue

            scraped_sources.append(url)
            deals = parsing_agent(soup, source_url=url)
            all_deals.extend(deals)

        # ── Agent 3: Communication ──────────────────────────────────────────
        summary = communication_agent(all_deals)

        elapsed_ms = int((time.time() - pipeline_start) * 1000)

        # ── Build response ──────────────────────────────────────────────────
        status_code = "success" if all_deals else "partial_success"

        return JsonResponse(
            {
                "status":           status_code,
                "query":            niche_query,
                "country":          country_code,
                "discovered_urls":  discovered_urls,
                "scraped_sources":  scraped_sources,
                "scrape_errors":    scrape_errors,
                "parsed_deals":     all_deals,       # ← consumed by frontend normaliseApiItem()
                "deal_count":       len(all_deals),
                "summary":          summary,
                "elapsed_ms":       elapsed_ms,
            },
            status=200,
        )

    def get(self, request, *args, **kwargs):
        """Health-check endpoint — GET /api/arbitrage/pipeline/"""
        return JsonResponse(
            {
                "status": "ok",
                "service": "COMAS Arbitrage Pipeline",
                "version": "1.0.0",
                "endpoints": {
                    "pipeline":  "POST /api/arbitrage/pipeline/",
                    "health":    "GET  /api/arbitrage/pipeline/",
                    "categories":"GET  /api/arbitrage/categories/",
                    "deals":     "GET  /api/arbitrage/deals/<item_id>/",
                },
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class CategoryListView(View):
    """
    GET /api/arbitrage/categories/
    Returns the canonical category list used to populate frontend filter chips.
    """

    def get(self, request, *args, **kwargs):
        categories = [
            {"id": "footwear",     "icon": "👟", "name": "Footwear",                "tracks": 2},
            {"id": "flowers",      "icon": "🌹", "name": "Flowers",                 "tracks": 1},
            {"id": "clothes",      "icon": "👕", "name": "Clothes",                 "tracks": 1},
            {"id": "textiles",     "icon": "🧵", "name": "Textiles",                "tracks": 1},
            {"id": "electronics",  "icon": "🔌", "name": "Electronics Accessories", "tracks": 1},
        ]
        return JsonResponse({"categories": categories})


@method_decorator(csrf_exempt, name="dispatch")
class ItemDetailView(View):
    """
    GET /api/arbitrage/deals/<item_id>/
    Returns the static rich detail payload for a known item (mirrors ITEM_DEFAULTS
    in ItemDetail.jsx).  Useful for pre-loading data without running the full pipeline.
    """

    # Minimal static catalogue — extend as needed or replace with a DB query
    CATALOGUE = {
        "fw-1": {
            "id": "fw-1", "category": "Footwear", "name": "Industrial Utility Workboots",
            "hs_code": "6403.40.00", "unit": "pair",
            "usSpot": 45.00, "keSpot": 295.00, "profit": 250,
            "confidence": 94, "freightCost": 15.50, "tariffRate": 0.25, "clearingFees": 9.75,
            "route": "Newark → Mombasa → Nairobi Inland",
            "moq": "100 units", "expiry": "3/10/26",
        },
        "fl-1": {
            "id": "fl-1", "category": "Flowers", "name": "Premium Long-Stem Red Roses",
            "hs_code": "0603.11.00", "unit": "stem",
            "usSpot": 0.28, "keSpot": 1.20, "profit": 0.64,
            "confidence": 92, "freightCost": 0.35, "tariffRate": 0.065, "clearingFees": 0.08,
            "route": "JKIA → Amsterdam → JFK Air Cargo",
            "moq": "1,000 stems", "expiry": "3/10/26",
        },
        "tx-1": {
            "id": "tx-1", "category": "Textiles", "name": "Raw Indigo Denim Rolls (14oz)",
            "hs_code": "5209.42.00", "unit": "roll (30m)",
            "usSpot": 150.00, "keSpot": 820.00, "profit": 593,
            "confidence": 87, "freightCost": 45.00, "tariffRate": 0.22, "clearingFees": 32.00,
            "route": "Newark → Mombasa → Industrial Area Nairobi",
            "moq": "20 rolls", "expiry": "3/10/26",
        },
        "el-1": {
            "id": "el-1", "category": "Electronics", "name": "Solid State Storage Blocks",
            "hs_code": "8471.70.00", "unit": "unit",
            "usSpot": 110.00, "keSpot": 630.00, "profit": 395,
            "confidence": 93, "freightCost": 15.00, "tariffRate": 0.10, "clearingFees": 12.00,
            "route": "Silicon Valley → JKIA → Kilimani Warehouse",
            "moq": "30 units", "expiry": "3/10/26",
        },
    }

    def get(self, request, item_id: str, *args, **kwargs):
        item = self.CATALOGUE.get(item_id)
        if not item:
            return JsonResponse(
                {"error": f"Item '{item_id}' not found in catalogue."},
                status=404,
            )
        return JsonResponse({"status": "ok", "item": item})
    
@method_decorator(csrf_exempt, name="dispatch")
class InitialFeedView(View):
    """
    GET /api/arbitrage/feed/
    Runs the pipeline across randomised wholesale queries and returns
    a merged deal list — called once on app mount by useSpreadData.js.
    No query param needed; the backend picks the queries.
    """

    QUERY_POOL = [
        ("wholesale footwear closeout liquidation",    "US"),
        ("wholesale electronics closeout liquidation", "US"),
        ("wholesale textiles apparel liquidation",     "US"),
        ("wholesale clothing lots liquidation",        "US"),
        ("wholesale general merchandise closeout",     "US"),
    ]

    def get(self, request, *args, **kwargs):
        import random
        pipeline_start = time.time()

        # Pick 3 random queries each time so results vary across sessions
        selected = random.sample(self.QUERY_POOL, min(3, len(self.QUERY_POOL)))

        all_deals:       list[dict] = []
        scraped_sources: list[str]  = []
        scrape_errors:   list[str]  = []

        for query, country in selected:
            urls = discovery_agent(query, country)
            for url in urls:
                if url in scraped_sources + scrape_errors:
                    continue  # skip already-visited URLs across queries
                soup = fetch_arbitrage_target(url)
                if soup is None:
                    scrape_errors.append(url)
                    continue
                scraped_sources.append(url)
                deals = parsing_agent(soup, source_url=url)
                for deal in deals:
                    if not any(d["id"] == deal["id"] for d in all_deals):
                        all_deals.append(deal)

        summary = communication_agent(all_deals)

        return JsonResponse({
            "status":          "success" if all_deals else "partial_success",
            "parsed_deals":    all_deals,
            "summary":         summary,
            "scraped_sources": scraped_sources,
            "scrape_errors":   scrape_errors,
            "elapsed_ms":      int((time.time() - pipeline_start) * 1000),
        })
    
def home_view(request):
    return render(request, 'index.html')

