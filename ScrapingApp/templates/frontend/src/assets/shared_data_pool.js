// useSpreadData.js
import { useState, useEffect, useCallback } from "react";

const FEED_ENDPOINT     = "/api/arbitrage/feed/";
const PIPELINE_ENDPOINT = "/api/arbitrage/pipeline/";


const FALLBACK_DEALS = [
  {
    id: "fw-1", name: "Industrial Utility Workboots",
    category: "Footwear", icon: "👟",
    usSpot: 45.00, keSpot: 295.00, profit: 250, price: 45.00,
    prices: [195, 205, 215, 225, 235, 242, 250],
    confidence: 94, freightCost: 15.50, tariffRate: 0.25, clearingFees: 9.75,
    route: "Newark → Mombasa → Nairobi Inland",
    moq: "100 units", volume: "1,200 units", expiry: "3/10/26",
    arbitrage_opportunity: "High. EAC tariff factored. Strong construction sector demand.",
    news: [
      { source: "KRA Gazette", headline: "Footwear surcharge waived Q2 2026.", impact: "Positive" },
      { source: "EA Logistics Hub", headline: "Mombasa clearance under 36 hours.", impact: "Positive" },
    ],
  },
  {
    id: "fw-2", name: "Terrain Offroad Trail Shoes",
    category: "Footwear", icon: "👟",
    usSpot: 35.00, keSpot: 215.00, profit: 180, price: 35.00,
    prices: [140, 150, 158, 165, 170, 175, 180],
    confidence: 89, freightCost: 12.00, tariffRate: 0.25, clearingFees: 8.00,
    route: "Houston → Mombasa → Eastleigh Hub",
    moq: "50 units", volume: "850 units", expiry: "3/10/26",
    arbitrage_opportunity: "Solid. Trail-wear demand spiking in Nairobi suburbs.",
    news: [
      { source: "Nairobi Retail Daily", headline: "Trail-wear demand spikes 18% in regional suburbs.", impact: "Positive" },
    ],
  },
  {
    id: "fl-1", name: "Premium Long-Stem Red Roses",
    category: "Flowers", icon: "🌹",
    usSpot: 0.28, keSpot: 1.20, profit: 0.64, price: 0.28,
    prices: [0.22, 0.24, 0.25, 0.26, 0.27, 0.27, 0.28],
    confidence: 92, freightCost: 0.35, tariffRate: 0.065, clearingFees: 0.08,
    route: "JKIA → Amsterdam → JFK Air Cargo",
    moq: "1,000 stems", volume: "5,000 stems", expiry: "3/10/26",
    arbitrage_opportunity: "Strong. Air cargo to US East Coast expanding.",
    news: [
      { source: "FloraNet Weekly", headline: "Direct cargo flights to US East Coast expanding.", impact: "Positive" },
    ],
  },
  {
    id: "cl-1", name: "Double-Weave Cotton Hoodies",
    category: "Clothes", icon: "👕",
    usSpot: 60.00, keSpot: 380.00, profit: 320, price: 60.00,
    prices: [280, 290, 300, 305, 310, 315, 320],
    confidence: 95, freightCost: 18.00, tariffRate: 0.25, clearingFees: 12.00,
    route: "Savannah → Mombasa → Gikomba Terminal",
    moq: "250 units", volume: "2,500 units", expiry: "3/10/26",
    arbitrage_opportunity: "Highest confidence in portfolio. Consistent Gikomba demand.",
    news: [
      { source: "Apparel Sourcing Monitor", headline: "High-density knitwear clearing cleanly.", impact: "Neutral" },
    ],
  },
  {
    id: "tx-1", name: "Raw Indigo Denim Rolls (14oz)",
    category: "Textiles", icon: "🧵",
    usSpot: 150.00, keSpot: 820.00, profit: 593, price: 150.00,
    prices: [590, 610, 630, 645, 655, 663, 670],
    confidence: 87, freightCost: 45.00, tariffRate: 0.22, clearingFees: 32.00,
    route: "Newark → Mombasa → Industrial Area Nairobi",
    moq: "20 rolls", volume: "400 rolls", expiry: "3/10/26",
    arbitrage_opportunity: "Significant. US liquidation surplus widening margins.",
    news: [
      { source: "Textile Sourcing Monitor", headline: "US denim surplus — prices falling 8%.", impact: "Positive" },
    ],
  },
  {
    id: "el-1", name: "Solid State Storage Blocks",
    category: "Electronics", icon: "🔌",
    usSpot: 110.00, keSpot: 630.00, profit: 395, price: 110.00,
    prices: [480, 495, 500, 510, 505, 515, 520],
    confidence: 93, freightCost: 15.00, tariffRate: 0.10, clearingFees: 12.00,
    route: "Silicon Valley → JKIA → Kilimani Warehouse",
    moq: "30 units", volume: "600 units", expiry: "3/10/26",
    arbitrage_opportunity: "Excellent ROI ~260%. Lowest tariff in portfolio.",
    news: [
      { source: "Silicon Africa Review", headline: "Enterprise SSD demand surges 20% Q1 2026.", impact: "Positive" },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Live deals take priority; fallback fills any IDs not returned by the API
function mergeDeals(liveDeals, fallback) {
  const seen   = new Set();
  const merged = [];
  for (const deal of [...liveDeals, ...fallback]) {
    if (!seen.has(deal.id)) {
      seen.add(deal.id);
      merged.push(deal);
    }
  }
  return merged;
}

async function fetchInitialFeed() {
  const resp = await fetch(FEED_ENDPOINT);   // GET — no body needed
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return {
    deals:   data.parsed_deals || [],
    summary: data.summary      || "",
  };
}

async function fetchQuery(query, country = "US") {
  const resp = await fetch(PIPELINE_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ query, country }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return {
    deals:   data.parsed_deals || [],
    summary: data.summary      || "",
  };
}

export function useSpreadData() {
  const [spreads,    setSpreads]    = useState(FALLBACK_DEALS);
  const [dataSource, setDataSource] = useState("fallback");
  const [loading,    setLoading]    = useState(true);
  const [summary,    setSummary]    = useState("");
  const [error,      setError]      = useState(null);

  // Initial load — randomised feed, no query needed from frontend
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDataSource("loading");
    try {
      const { deals, summary: s } = await fetchInitialFeed();
      setSpreads(mergeDeals(deals, FALLBACK_DEALS));
      setSummary(s);
      setDataSource("live");
    } catch (err) {
      console.error("[useSpreadData] Feed failed — using fallback.", err);
      setSpreads(FALLBACK_DEALS);
      setDataSource("fallback");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // User-triggered search from the landing search bar
  const search = useCallback(async (query, country = "US") => {
    if (!query?.trim()) return;
    setLoading(true);
    setError(null);
    setDataSource("loading");
    try {
      const { deals, summary: s } = await fetchQuery(query.trim(), country);
      if (!deals.length) {
        setError(`No deals found for "${query}". Try a broader term.`);
        setDataSource("fallback");
        return;
      }
      setSpreads(mergeDeals(deals, FALLBACK_DEALS));
      setSummary(s);
      setDataSource("live");
    } catch (err) {
      console.error("[useSpreadData] Search failed.", err);
      setError(err.message);
      setDataSource("fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { spreads, dataSource, loading, summary, error, reload, search };
}
