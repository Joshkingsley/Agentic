import os
import json
import time
import hashlib
import logging
import re
import random
from urllib.parse import urlparse
from difflib import SequenceMatcher

import requests
from bs4 import BeautifulSoup
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from groq import Groq

logger = logging.getLogger(__name__)


# ─── CONSTANTS ────────────────────────────────────────────────────────────────

GROQ_MODEL             = "llama-3.3-70b-versatile"
MAX_SCRAPE_TEXT_CHARS  = 12000   # increased — more context = better extraction
MAX_DISCOVERED_URLS    = 15      # cast a wide net before filtering
MAX_USABLE_URLS        = 4       # how many we actually scrape per query
MIN_PAGE_TEXT_LENGTH   = 400     # gate: discard pages shorter than this
MIN_PRICE_SIGNALS      = 1       # gate: page must contain at least 1 price pattern
GROQ_MAX_RETRIES       = 4
GROQ_BACKOFF_BASE      = 2.0     # seconds; doubles each retry

CATEGORY_ICONS = {
    "Footwear":            "👟",
    "Flowers":             "🌹",
    "Clothes":             "👕",
    "Textiles":            "🧵",
    "Electronics":         "🔌",
    "General Merchandise": "📦",
}

# Per-category landed-cost multipliers (US wholesale → Kenya retail)
# Derived from EAC tariff schedules + typical freight + clearing margins
CATEGORY_MULTIPLIERS = {
    "Footwear":            4.8,
    "Flowers":             3.2,   # perishable — lower margin, higher velocity
    "Clothes":             5.0,
    "Textiles":            4.2,
    "Electronics":         3.8,   # lower tariff but high competition
    "General Merchandise": 4.5,
}

# Per-category default tariff rates (EAC CET schedules)
CATEGORY_TARIFF_RATES = {
    "Footwear":            0.25,
    "Flowers":             0.065,
    "Clothes":             0.25,
    "Textiles":            0.22,
    "Electronics":         0.10,
    "General Merchandise": 0.25,
}

# Per-category freight cost as fraction of US wholesale price
CATEGORY_FREIGHT_RATIOS = {
    "Footwear":            0.14,
    "Flowers":             0.45,   # air cargo, perishable
    "Clothes":             0.12,
    "Textiles":            0.15,
    "Electronics":         0.10,
    "General Merchandise": 0.13,
}

# Per-category clearing fees as fraction of US wholesale price
CATEGORY_CLEARING_RATIOS = {
    "Footwear":            0.08,
    "Flowers":             0.06,
    "Clothes":             0.08,
    "Textiles":            0.09,
    "Electronics":         0.07,
    "General Merchandise": 0.08,
}

# Per-category default freight routes
CATEGORY_ROUTES = {
    "Footwear":            "Newark → Mombasa → Nairobi",
    "Flowers":             "JKIA → Amsterdam → JFK Air Cargo",
    "Clothes":             "Newark → Mombasa → Nairobi",
    "Textiles":            "Newark → Mombasa → Industrial Area Nairobi",
    "Electronics":         "Silicon Valley → JKIA → Kilimani Warehouse",
    "General Merchandise": "Newark → Mombasa → Nairobi",
}

# Known catalogue for fuzzy ID matching
ITEM_CATALOGUE = {
    "Industrial Utility Workboots": "fw-1",
    "Terrain Offroad Trail Shoes":  "fw-2",
    "Premium Long-Stem Red Roses":  "fl-1",
    "Double-Weave Cotton Hoodies":  "cl-1",
    "Raw Indigo Denim Rolls":       "tx-1",
    "Solid State Storage Blocks":   "el-1",
}

# Category-specific query library — targeted, not generic
CATEGORY_QUERY_LIBRARY = {
    "Footwear": [
        "pallet lot workboots closeout wholesale",
        "liquidation athletic shoes bulk lot",
        "wholesale footwear overstock clearance",
    ],
    "Electronics": [
        "wholesale electronics liquidation pallet",
        "overstock storage devices bulk lot",
        "closeout consumer electronics wholesale",
    ],
    "Textiles": [
        "wholesale denim fabric rolls liquidation",
        "bulk textile closeout apparel fabric",
        "overstock fabric rolls wholesale lot",
    ],
    "Clothes": [
        "wholesale clothing lot liquidation overstock",
        "bulk apparel closeout hoodies jackets",
        "wholesale garments pallet clearance",
    ],
    "Flowers": [
        "wholesale cut flowers bulk export",
        "roses bulk lot wholesale florist",
        "wholesale floral stems closeout",
    ],
    "General Merchandise": [
        "wholesale general merchandise liquidation pallet",
        "bulk closeout mixed goods lot",
        "overstock merchandise wholesale clearance",
    ],
}

# Curated reliable wholesale platforms per category (primary sources)
CURATED_SOURCES = {
    "Footwear": [
        "https://www.liquidation.com/c/shoes",
        "https://www.bulq.com/search?q=shoes",
        "https://www.directliquidation.com/search/?search=footwear",
    ],
    "Electronics": [
        "https://www.liquidation.com/c/electronics",
        "https://www.bulq.com/search?q=electronics",
        "https://www.directliquidation.com/search/?search=electronics",
    ],
    "Textiles": [
        "https://www.liquidation.com/c/clothing-accessories",
        "https://www.bulq.com/search?q=fabric",
        "https://www.directliquidation.com/search/?search=textiles",
    ],
    "Clothes": [
        "https://www.liquidation.com/c/clothing-accessories",
        "https://www.bulq.com/search?q=clothing",
        "https://www.directliquidation.com/search/?search=clothing",
    ],
    "General Merchandise": [
        "https://www.liquidation.com/c/general-merchandise",
        "https://www.bulq.com/search?q=general+merchandise",
        "https://www.directliquidation.com/search/?search=general+merchandise",
    ],
}

BLOCKED_DOMAINS = {
    "merkandi.us", "merkandi.com",
    "alibaba.com", "aliexpress.com", "amazon.com",
    "ebay.com",    "walmart.com",
}

# Simple in-process cache: url_hash → (timestamp, parsed_deals)
_RESPONSE_CACHE: dict[str, tuple[float, list[dict]]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _url_hash(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


def _cache_get(url: str) -> list[dict] | None:
    key = _url_hash(url)
    if key in _RESPONSE_CACHE:
        ts, data = _RESPONSE_CACHE[key]
        if time.time() - ts < CACHE_TTL_SECONDS:
            logger.info("Cache HIT for %s", url)
            return data
        del _RESPONSE_CACHE[key]
    return None


def _cache_set(url: str, deals: list[dict]) -> None:
    _RESPONSE_CACHE[_url_hash(url)] = (time.time(), deals)


def _fuzzy_match_id(name: str) -> str | None:
    """Fuzzy match scraped product name against known catalogue."""
    name_lower = name.lower()
    best_ratio  = 0.0
    best_id     = None
    for catalogue_name, item_id in ITEM_CATALOGUE.items():
        ratio = SequenceMatcher(None, name_lower, catalogue_name.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_id    = item_id
    return best_id if best_ratio >= 0.55 else None


def _stable_id(category: str, name: str, idx: int) -> str:
    """Generate a stable, unique ID from category + name hash."""
    slug = hashlib.md5(name.encode()).hexdigest()[:6]
    prefix = category[:2].lower()
    return f"{prefix}-{slug}"


def _validate_page(soup: BeautifulSoup) -> tuple[bool, str]:
    """
    Pre-validation gate — checks page quality before sending to Groq.
    Returns (is_valid, reason).
    """
    text = soup.get_text(separator=" ", strip=True)

    # Too short — likely an error page or redirect
    if len(text) < MIN_PAGE_TEXT_LENGTH:
        return False, f"Page text too short ({len(text)} chars)"

    # CAPTCHA / bot-block signals
    block_signals = [
        "captcha", "access denied", "verify you are human",
        "cloudflare", "enable javascript", "please wait",
        "robot check", "security check",
    ]
    text_lower = text.lower()
    for signal in block_signals:
        if signal in text_lower:
            return False, f"Bot-block detected: '{signal}'"

    # Must contain at least one price pattern ($X or USD X)
    price_pattern = re.compile(r'(\$\s?\d+[\.,]?\d*|\d+[\.,]?\d*\s?USD)', re.IGNORECASE)
    if len(price_pattern.findall(text)) < MIN_PRICE_SIGNALS:
        return False, "No price signals found — not a product listing page"

    # Must contain product-type keywords
    product_keywords = [
        "unit", "lot", "pallet", "case", "bulk", "wholesale",
        "price", "stock", "quantity", "moq", "order",
    ]
    if not any(kw in text_lower for kw in product_keywords):
        return False, "No product/wholesale keywords found"

    return True, "ok"


# ─── GROQ CLIENT ─────────────────────────────────────────────────────────────

def _get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY is not set.")
    return Groq(api_key=api_key)


def _groq_call_with_backoff(messages: list[dict], temperature: float = 0.1,
                             max_tokens: int = 2048, response_format: dict | None = None) -> str:
    """
    Wraps a Groq chat completion with exponential backoff + jitter on rate limit errors.
    Returns the raw content string or raises after all retries are exhausted.
    """
    client = _get_groq_client()
    kwargs = dict(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if response_format:
        kwargs["response_format"] = response_format

    for attempt in range(GROQ_MAX_RETRIES):
        try:
            completion = client.chat.completions.create(**kwargs)
            return completion.choices[0].message.content
        except Exception as exc:
            err_str = str(exc).lower()
            is_rate_limit = "rate limit" in err_str or "429" in err_str or "too many" in err_str
            if is_rate_limit and attempt < GROQ_MAX_RETRIES - 1:
                wait = (GROQ_BACKOFF_BASE ** attempt) + random.uniform(0, 1)
                logger.warning("Groq rate limit — retrying in %.1fs (attempt %d/%d)",
                               wait, attempt + 1, GROQ_MAX_RETRIES)
                time.sleep(wait)
            else:
                raise


# ─── BRIGHT DATA ─────────────────────────────────────────────────────────────

def _get_brightdata_client():
    try:
        from brightdata import SyncBrightDataClient
        token = os.getenv("BRIGHTDATA_API_TOKEN", "")
        if not token:
            raise EnvironmentError("BRIGHTDATA_API_TOKEN not set.")
        return SyncBrightDataClient(token=token)
    except ImportError:
        raise EnvironmentError("brightdata package not installed.")


# ─── AGENT 1 — DISCOVERY ─────────────────────────────────────────────────────

def discovery_agent(niche_query: str, country_code: str = "US",
                    category: str | None = None) -> list[str]:
    """
    Discovers target URLs via two strategies:
      1. Curated source list per category (primary, most reliable)
      2. Bright Data SERP using targeted query variants (supplement)

    Filters blocked domains, deduplicates by domain, and returns up to
    MAX_USABLE_URLS high-quality unique URLs.
    """
    candidate_urls: list[str] = []

    # Strategy 1: Curated sources per category (always tried first)
    if category and category in CURATED_SOURCES:
        candidate_urls.extend(CURATED_SOURCES[category])
        logger.info("Added %d curated sources for category '%s'",
                    len(CURATED_SOURCES[category]), category)

    # Strategy 2: Bright Data SERP with multiple targeted query variants
    query_variants = _build_query_variants(niche_query, category)

    try:
        client = _get_brightdata_client()
        with client:
            for variant in query_variants:
                if len(candidate_urls) >= MAX_DISCOVERED_URLS:
                    break
                try:
                    results = client.search.google(
                        query=variant,
                        location=country_code,
                        language="en",
                        num_results=20,
                    )
                    if results and results.data:
                        for r in results.data:
                            link = r.get("url") or r.get("link")
                            if link:
                                candidate_urls.append(link)
                except Exception as exc:
                    logger.warning("SERP query failed for variant '%s': %s", variant, exc)

    except EnvironmentError as exc:
        logger.warning("Bright Data unavailable — using curated sources only: %s", exc)
    except Exception as exc:
        logger.error("Discovery SERP phase failed: %s", exc)

    # Filter and deduplicate
    return _filter_urls(candidate_urls)


def _build_query_variants(base_query: str, category: str | None) -> list[str]:
    """Returns 2-3 targeted query variants — specific beats generic."""
    variants = [base_query]
    if category and category in CATEGORY_QUERY_LIBRARY:
        variants.extend(CATEGORY_QUERY_LIBRARY[category][:2])
    else:
        variants.append(f"{base_query} bulk lot pallet")
        variants.append(f"{base_query} overstock clearance wholesale")
    return variants


def _filter_urls(urls: list[str]) -> list[str]:
    """Deduplicate by domain, block known bad actors, return up to MAX_USABLE_URLS."""
    seen_domains: set[str] = set()
    filtered: list[str]   = []

    for url in urls:
        if not url or not url.startswith("http"):
            continue
        domain = urlparse(url).netloc.replace("www.", "")
        if domain in BLOCKED_DOMAINS:
            logger.info("Blocked domain skipped: %s", domain)
            continue
        if domain in seen_domains:
            continue
        seen_domains.add(domain)
        filtered.append(url)
        if len(filtered) >= MAX_USABLE_URLS:
            break

    logger.info("Discovery filtered to %d usable URLs", len(filtered))
    return filtered


# ─── SCRAPER ─────────────────────────────────────────────────────────────────

def fetch_arbitrage_target(url: str) -> BeautifulSoup | None:
    """
    Fetches page HTML via Bright Data SDK, falls back to direct request.
    Returns None if the page fails validation.
    """
    try:
        client = _get_brightdata_client()
        with client:
            result = client.scrape_url(url)
            if result and result.data:
                soup = BeautifulSoup(result.data, "html.parser")
                valid, reason = _validate_page(soup)
                if not valid:
                    logger.warning("Page validation FAILED for %s — %s", url, reason)
                    return None
                logger.info("Scraped %s via Bright Data SDK.", url)
                return soup
    except EnvironmentError:
        logger.warning("Bright Data unavailable — falling back to direct fetch for %s", url)
    except Exception as exc:
        logger.error("Bright Data scrape failed for %s: %s — trying direct fetch", url, exc)

    return _direct_fetch(url)


def _direct_fetch(url: str) -> BeautifulSoup | None:
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
        soup = BeautifulSoup(resp.text, "html.parser")
        valid, reason = _validate_page(soup)
        if not valid:
            logger.warning("Direct fetch page validation FAILED for %s — %s", url, reason)
            return None
        return soup
    except Exception as exc:
        logger.error("Direct fallback fetch failed for %s: %s", url, exc)
        return None


# ─── AGENT 2 — PARSING (batched) ─────────────────────────────────────────────

def parsing_agent_batched(pages: list[tuple[str, BeautifulSoup]]) -> list[dict]:
    """
    Batches ALL scraped pages into a SINGLE Groq call instead of one per URL.
    This is the primary Groq cost reduction — N pages → 1 API call, not N calls.

    pages: list of (source_url, soup) tuples.
    """
    if not pages:
        return []

    # Check cache for each page first
    all_deals:    list[dict] = []
    pages_to_llm: list[tuple[str, str]] = []   # (url, clean_text)

    for url, soup in pages:
        cached = _cache_get(url)
        if cached is not None:
            all_deals.extend(cached)
            continue
        clean_text = soup.get_text(separator="\n", strip=True)[:MAX_SCRAPE_TEXT_CHARS]
        pages_to_llm.append((url, clean_text))

    if not pages_to_llm:
        logger.info("All pages served from cache — skipping Groq call.")
        return all_deals

    # Build a single combined prompt
    combined_pages = ""
    for i, (url, text) in enumerate(pages_to_llm):
        combined_pages += f"\n\n--- PAGE {i+1} (source: {url}) ---\n{text}"

    prompt = f"""
You are a trade intelligence extraction engine for COMAS, a US-to-Kenya arbitrage platform.

Below are {len(pages_to_llm)} wholesale/liquidation pages concatenated together.
Extract every distinct product, lot, or inventory package from ALL pages combined.

For EACH item return a JSON object with EXACTLY these fields:

- "name"           : string — product or lot title
- "category"       : one of ["Footwear","Flowers","Clothes","Textiles","Electronics","General Merchandise"]
- "price"          : float — listed wholesale USD price per unit
- "confidence"     : integer 0-100 — confidence this is a real arbitrage opportunity
- "expiry"         : string — deal expiry date if visible, else "N/A"
- "volume"         : string — total available stock e.g. "1,200 units"
- "moq"            : string — minimum order quantity e.g. "50 units"
- "change_in_price_from_last_month" : string — any visible price change, or "N/A"
- "arbitrage_opportunity"           : string — brief plain-English explanation of the margin
- "source_url"     : string — copy the PAGE source URL for this item exactly as shown above
- "news"           : array of up to 2 objects each with:
    - "source"  : string
    - "headline": string — relevant market or logistics signal
    - "impact"  : "Positive" | "Negative" | "Neutral"

Do NOT estimate ke_spot_price, freight, tariff, or clearing — the backend computes those
from per-category lookup tables. Focus on extracting accurate raw data from the page.

Return ONLY a valid JSON array. No markdown fences, no wrapper keys, no commentary.

Pages:
{combined_pages}
"""

    try:
        raw = _groq_call_with_backoff(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        parsed = json.loads(raw)
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

        # Group by source_url so we can cache per page
        by_url: dict[str, list[dict]] = {}
        for idx, item in enumerate(items):
            src = item.get("source_url", pages_to_llm[0][0])
            enriched = _enrich_item(item, idx, src)
            by_url.setdefault(src, []).append(enriched)

        for url, deals in by_url.items():
            _cache_set(url, deals)
            all_deals.extend(deals)

        logger.info("Batched parsing extracted %d items from %d pages (1 Groq call)",
                    len(all_deals), len(pages_to_llm))
        return all_deals

    except json.JSONDecodeError as exc:
        logger.error("Batched parsing — JSON decode error: %s", exc)
        return all_deals
    except Exception as exc:
        logger.error("Batched parsing failed: %s", exc)
        return all_deals


# ─── ITEM ENRICHMENT ─────────────────────────────────────────────────────────

def _enrich_item(item: dict, idx: int, source_url: str) -> dict:
    """
    Computes all derived financial fields from per-category lookup tables
    instead of relying on LLM guesses. Assigns stable IDs via fuzzy matching.
    """
    name     = item.get("name", "Unknown Item")
    category = item.get("category", "General Merchandise")
    if category not in CATEGORY_ICONS:
        category = "General Merchandise"

    us_spot = float(item.get("price", 0) or 0)

    # Kenya spot price from category multiplier (lookup table, not LLM guess)
    multiplier = CATEGORY_MULTIPLIERS.get(category, 4.5)
    ke_spot    = round(us_spot * multiplier, 2)

    # Cost components from category ratios (lookup table)
    freight_ratio  = CATEGORY_FREIGHT_RATIOS.get(category, 0.13)
    clearing_ratio = CATEGORY_CLEARING_RATIOS.get(category, 0.08)
    tariff_rate    = CATEGORY_TARIFF_RATES.get(category, 0.25)

    freight  = round(us_spot * freight_ratio, 2)
    clearing = round(us_spot * clearing_ratio, 2)
    tariff_cost = round(us_spot * tariff_rate, 2)

    profit = round(ke_spot - us_spot - freight - tariff_cost - clearing, 2)

    # Sanity bounds — flag suspiciously perfect numbers
    confidence = int(item.get("confidence", 75) or 75)
    confidence = max(0, min(100, confidence))
    if us_spot == 0:
        confidence = max(0, confidence - 30)   # penalise missing price

    # Synthetic 7-point price history for sparkline
    base   = us_spot * 0.85
    prices = [
        round(base + (us_spot - base) * (i / 6) + random.uniform(-us_spot * 0.02, us_spot * 0.02), 2)
        for i in range(7)
    ] if us_spot > 0 else [0] * 7

    # Stable ID: fuzzy match first, then hash-based fallback
    item_id = _fuzzy_match_id(name) or _stable_id(category, name, idx)

    return {
        "id":       item_id,
        "name":     name,
        "category": category,
        "icon":     CATEGORY_ICONS.get(category, "📦"),

        # Pricing
        "price":   us_spot,
        "usSpot":  us_spot,
        "keSpot":  ke_spot,
        "profit":  profit,
        "prices":  prices,

        # Costs (from lookup tables, not LLM)
        "freightCost":  freight,
        "tariffRate":   tariff_rate,
        "clearingFees": clearing,

        # Trade metadata
        "confidence": confidence,
        "expiry":     item.get("expiry", "N/A"),
        "volume":     item.get("volume", "N/A"),
        "moq":        item.get("moq",    "N/A"),
        "route":      CATEGORY_ROUTES.get(category, "Newark → Mombasa → Nairobi"),

        # Market signals
        "change_in_price_from_last_month": item.get("change_in_price_from_last_month", "N/A"),
        "arbitrage_opportunity":           item.get("arbitrage_opportunity", ""),
        "news":                            item.get("news", []),

        "source_url": source_url,
    }


# ─── AGENT 3 — COMMUNICATION (optional, deferred) ────────────────────────────

def communication_agent(trade_signals: list[dict]) -> str:
    """
    Generates an investor narrative summary.
    Called ONCE per pipeline run, not per URL.
    Only fires if there are deals to summarise.
    """
    if not trade_signals:
        return (
            "No notable arbitrage targets detected in this search cycle. "
            "Consider broadening the niche query or refreshing the pipeline."
        )

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
        for d in trade_signals[:10]   # cap input to avoid bloating context
    ]

    prompt = (
        "You are a senior trade analyst for COMAS, a US-to-Kenya arbitrage platform. "
        "Summarise the following real-time wholesale deals into a concise, professional "
        "investor briefing (3-5 sentences). Highlight the top 2 opportunities by profit "
        "margin, explain why they are strong plays, and flag any confidence concerns.\n\n"
        f"Deals:\n{json.dumps(summary_input, indent=2)}"
    )

    try:
        return _groq_call_with_backoff(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=300,
        ).strip()
    except Exception as exc:
        logger.error("Communication agent failed: %s", exc)
        return "Summary unavailable. Please review the parsed deals directly."


# ─── DJANGO VIEWS ─────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class ArbitragePipelineView(View):
    """
    POST /api/arbitrage/pipeline/
    Body: { "query": "industrial workboots", "country": "US", "category": "Footwear" }

    Optimized pipeline:
      1. Discovery  — curated sources first, SERP supplement, domain dedup
      2. Validation — page gating before Groq (no wasted API calls)
      3. Parsing    — single batched Groq call for all pages
      4. Communication — one summary call, optional
    """

    def post(self, request, *args, **kwargs):
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Request body must be valid JSON."}, status=400)

        niche_query  = body.get("query", "").strip()
        country_code = body.get("country", "US").upper().strip()
        category     = body.get("category", None)

        if not niche_query:
            return JsonResponse(
                {"error": "'query' field is required and must not be empty."},
                status=400,
            )

        pipeline_start = time.time()

        # Agent 1: Discovery
        discovered_urls = discovery_agent(niche_query, country_code, category)

        if not discovered_urls:
            return JsonResponse({
                "status":          "partial_success",
                "message":         "No usable URLs discovered. Try a broader search term.",
                "query":           niche_query,
                "discovered_urls": [],
                "scraped_sources": [],
                "parsed_deals":    [],
                "summary":         "",
                "elapsed_ms":      int((time.time() - pipeline_start) * 1000),
            }, status=200)

        # Scrape + validate all pages
        scraped_pages:   list[tuple[str, BeautifulSoup]] = []
        scraped_sources: list[str] = []
        scrape_errors:   list[str] = []

        for url in discovered_urls:
            soup = fetch_arbitrage_target(url)
            if soup is None:
                scrape_errors.append(url)
            else:
                scraped_pages.append((url, soup))
                scraped_sources.append(url)

        # Agent 2: Single batched Groq parse
        all_deals = parsing_agent_batched(scraped_pages)

        # Agent 3: One summary call
        summary = communication_agent(all_deals)

        elapsed_ms  = int((time.time() - pipeline_start) * 1000)
        status_code = "success" if all_deals else "partial_success"

        return JsonResponse({
            "status":          status_code,
            "query":           niche_query,
            "country":         country_code,
            "discovered_urls": discovered_urls,
            "scraped_sources": scraped_sources,
            "scrape_errors":   scrape_errors,
            "parsed_deals":    all_deals,
            "deal_count":      len(all_deals),
            "summary":         summary,
            "elapsed_ms":      elapsed_ms,
        }, status=200)

    def get(self, request, *args, **kwargs):
        return JsonResponse({
            "status":  "ok",
            "service": "COMAS Arbitrage Pipeline",
            "version": "2.0.0",
            "endpoints": {
                "pipeline":   "POST /api/arbitrage/pipeline/",
                "health":     "GET  /api/arbitrage/pipeline/",
                "categories": "GET  /api/arbitrage/categories/",
                "deals":      "GET  /api/arbitrage/deals/<item_id>/",
                "feed":       "GET  /api/arbitrage/feed/",
            },
        })


@method_decorator(csrf_exempt, name="dispatch")
class CategoryListView(View):
    """GET /api/arbitrage/categories/"""

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
    """GET /api/arbitrage/deals/<item_id>/"""

    CATALOGUE = {
        "fw-1": {
            "id": "fw-1", "category": "Footwear", "name": "Industrial Utility Workboots",
            "hs_code": "6403.40.00", "unit": "pair",
            "usSpot": 45.00, "keSpot": 216.00, "profit": 117.75,
            "confidence": 94, "freightCost": 6.30, "tariffRate": 0.25, "clearingFees": 3.60,
            "route": CATEGORY_ROUTES["Footwear"],
            "moq": "100 units", "expiry": "3/10/26",
        },
        "fl-1": {
            "id": "fl-1", "category": "Flowers", "name": "Premium Long-Stem Red Roses",
            "hs_code": "0603.11.00", "unit": "stem",
            "usSpot": 0.28, "keSpot": 0.90, "profit": 0.48,
            "confidence": 92, "freightCost": 0.13, "tariffRate": 0.065, "clearingFees": 0.02,
            "route": CATEGORY_ROUTES["Flowers"],
            "moq": "1,000 stems", "expiry": "3/10/26",
        },
        "tx-1": {
            "id": "tx-1", "category": "Textiles", "name": "Raw Indigo Denim Rolls (14oz)",
            "hs_code": "5209.42.00", "unit": "roll (30m)",
            "usSpot": 150.00, "keSpot": 630.00, "profit": 391.50,
            "confidence": 87, "freightCost": 22.50, "tariffRate": 0.22, "clearingFees": 13.50,
            "route": CATEGORY_ROUTES["Textiles"],
            "moq": "20 rolls", "expiry": "3/10/26",
        },
        "el-1": {
            "id": "el-1", "category": "Electronics", "name": "Solid State Storage Blocks",
            "hs_code": "8471.70.00", "unit": "unit",
            "usSpot": 110.00, "keSpot": 418.00, "profit": 264.00,
            "confidence": 93, "freightCost": 11.00, "tariffRate": 0.10, "clearingFees": 7.70,
            "route": CATEGORY_ROUTES["Electronics"],
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
    Runs the pipeline across a balanced set of category queries.
    Uses batched parsing — all scraped pages → single Groq call per category group.
    """

    QUERY_POOL = [
        ("wholesale footwear closeout liquidation",    "US", "Footwear"),
        ("wholesale electronics closeout liquidation", "US", "Electronics"),
        ("wholesale textiles apparel liquidation",     "US", "Textiles"),
        ("wholesale clothing lots liquidation",        "US", "Clothes"),
        ("wholesale general merchandise closeout",     "US", "General Merchandise"),
    ]

    def get(self, request, *args, **kwargs):
        pipeline_start = time.time()

        selected = random.sample(self.QUERY_POOL, min(3, len(self.QUERY_POOL)))

        all_deals:       list[dict] = []
        scraped_sources: list[str]  = []
        scrape_errors:   list[str]  = []
        visited_urls:    set[str]   = set()

        # Collect all pages across queries, then batch-parse once per group
        for query, country, category in selected:
            urls = discovery_agent(query, country, category)
            pages_for_group: list[tuple[str, BeautifulSoup]] = []

            for url in urls:
                if url in visited_urls:
                    continue
                visited_urls.add(url)

                soup = fetch_arbitrage_target(url)
                if soup is None:
                    scrape_errors.append(url)
                else:
                    scraped_sources.append(url)
                    pages_for_group.append((url, soup))

            # One Groq call per category group (not per URL)
            if pages_for_group:
                deals = parsing_agent_batched(pages_for_group)
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
    return render(request, "index.html")