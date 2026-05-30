# COMAS — Cross-Border Arbitrage Intelligence Platform

> **A deterministic, multi-agent pipeline that identifies exploitable price spreads between US wholesale markets and Kenyan retail demand — treating physical commodities as tradable arbitrage assets.**

---

## What It Does

COMAS (Commodity Arbitrage Market System) runs a three-agent backend pipeline that:

1. **Discovers** wholesale and liquidation listings across US platforms using Bright Data's SERP and a curated source library
2. **Scrapes and validates** each page — gating out bot-blocked pages, CAPTCHAs, and non-product content before any LLM call is made
3. **Parses** all validated pages in a single batched Groq call, extracting structured deal data
4. **Enriches** each deal with Kenya-specific landed costs (tariff, freight, clearing) computed from EAC CET schedule lookup tables — not LLM estimates
5. **Summarises** the top opportunities into an investor-facing briefing

It serves two market segments:

- **Micro-importers** — sourcing US wholesale closeouts for resale in Nairobi
- **Enterprise cooperatives** — routing local agricultural and retail assets to optimal export storefronts

---

## Architecture

```
Frontend (React + Vite + Tailwind)
        │
        ▼
Django REST API
        │
        ├── Agent 1: Discovery
        │     ├── Curated platform list (per category, primary)
        │     └── Bright Data SERP (targeted query variants, supplement)
        │
        ├── Page Validation Gate
        │     ├── Text length check
        │     ├── Bot-block / CAPTCHA detection
        │     ├── Price signal regex
        │     └── Product keyword check
        │
        ├── Agent 2: Batched Parsing (single Groq call for all pages)
        │     └── llama-3.3-70b-versatile via Groq API
        │
        ├── Enrichment Layer
        │     ├── Kenya spot price (category multiplier table)
        │     ├── Freight, tariff, clearing (EAC CET schedule ratios)
        │     └── Fuzzy ID matching against known catalogue
        │
        └── Agent 3: Communication (one summary call, optional)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Django, Python 3.11+ |
| LLM | Groq API (`llama-3.3-70b-versatile`) |
| Scraping | Bright Data Web Unlocker + SDK |
| Voice Briefs | ElevenLabs API |
| Deployment | Render |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/arbitrage/feed/` | Initial feed — runs pipeline across 3 random category queries on app mount |
| `POST` | `/api/arbitrage/pipeline/` | Run pipeline for a specific query and optional category |
| `GET` | `/api/arbitrage/pipeline/` | Health check + endpoint map |
| `GET` | `/api/arbitrage/categories/` | Canonical category list for frontend filter chips |
| `GET` | `/api/arbitrage/deals/<item_id>/` | Static rich detail payload for a known catalogue item |

### Pipeline request body

```json
{
  "query": "industrial workboots",
  "country": "US",
  "category": "Footwear"
}
```

### Pipeline response shape

```json
{
  "status": "success",
  "query": "industrial workboots",
  "discovered_urls": ["..."],
  "scraped_sources": ["..."],
  "scrape_errors": ["..."],
  "parsed_deals": [
    {
      "id": "fw-1",
      "name": "Industrial Utility Workboots",
      "category": "Footwear",
      "usSpot": 45.00,
      "keSpot": 216.00,
      "profit": 117.75,
      "freightCost": 6.30,
      "tariffRate": 0.25,
      "clearingFees": 3.60,
      "confidence": 94,
      "route": "Newark → Mombasa → Nairobi",
      "moq": "100 units",
      "expiry": "3/10/26",
      "arbitrage_opportunity": "...",
      "news": []
    }
  ],
  "deal_count": 12,
  "summary": "Investor briefing narrative...",
  "elapsed_ms": 4200
}
```

---

## The Arbitrage Equation

All cost components are computed from EAC CET schedule lookup tables — not LLM estimation.

```
Net Margin = Kenya Spot Price − US Wholesale Price − Freight − Tariff − Clearing Fees

Kenya Spot  = US Wholesale × Category Multiplier
Freight     = US Wholesale × Category Freight Ratio
Tariff      = US Wholesale × EAC CET Rate
Clearing    = US Wholesale × Category Clearing Ratio
```

**Example — Footwear:**
```
Multiplier : 4.8×     Tariff : 25%
Freight    : 14%      Clearing: 8%
```

This ensures institutional-grade margin accuracy regardless of what the LLM extracts.

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- Groq API key
- Bright Data account (optional — pipeline falls back to direct fetch in dev mode)

### Setup

```bash
# Clone
git clone https://github.com/Joshkingsley/Agentic.git
cd Agentic

# Backend
pip install -r requirements.txt

# Environment variables
# Add GROQ_API_KEY and BRIGHTDATA_API_TOKEN to .env

# Run Django
python manage.py migrate
python manage.py runserver

# Frontend (separate terminal)
cd ScrapingApp
npm install
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for LLM calls |
| `BRIGHTDATA_API_TOKEN` | No | Bright Data token — falls back to direct fetch without it |

---

## Project Structure

```
Agentic/
├── ScrapingApp/          # React frontend (Vite)
│   └── models.py         # Should you want to store data
│   ├── views.py          # All three agents + enrichment layer
│   └── urls.py           # API route definitions
├── ScrapingProject/      # Django project settings and root URLs
│   ├── settings.py
│   └── urls.py
├── staticfiles/      
├── requirements.txt
└── manage.py
```

---

## Key Design Decisions

**Batched LLM calls** — all scraped pages are sent to Groq in a single request per pipeline run, not one call per URL. This is the primary rate-limit mitigation.

**Validation gate** — pages are checked for price signals, product keywords, and bot-block signatures before touching the LLM. Garbage in, nothing out.

**Lookup tables over LLM math** — Kenya spot prices and cost components are computed deterministically from EAC tariff schedules. The LLM only extracts raw data; the backend does all financial computation.

**Curated sources first** — per-category platform lists are tried before SERP, ensuring relevant results even when Bright Data returns blocked domains.

**In-process caching** — parsed deals are cached by URL hash for 1 hour, so repeat pipeline runs skip Groq for already-visited pages.

**Fuzzy ID matching** — scraped product names are matched against the known catalogue using sequence similarity (threshold 0.55), with a stable hash-based fallback for unknown items.
