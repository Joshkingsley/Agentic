import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_ENDPOINT = "/api/arbitrage/pipeline/";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_SPREADS = [
  {
    id: "fw-1", category: "Footwear", icon: "👟",
    name: "Industrial Utility Workboots",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80",
    profit: 250, expiry: "3/10/26", confidence: 94,
    prices: [210, 215, 230, 225, 240, 238, 250],
    usSpot: 45.00, keSpot: 295.00, volume: "1,200 units", moq: "100 units",
    freightCost: 15.50, tariffRate: 0.25, clearingFees: 9.75,
    route: "Newark → Mombasa → Nairobi Inland",
    news: [
      { source: "EAC Customs Gazette", headline: "Leather tariffs stabilized for FY26 fiscal alignment.", impact: "Positive" },
      { source: "EA Logistics Hub", headline: "Mombasa clearance times drop below 36 hours.", impact: "Positive" },
    ],
  },
  {
    id: "fw-2", category: "Footwear", icon: "👟",
    name: "Terrain Offroad Trail Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    profit: 180, expiry: "3/10/26", confidence: 89,
    prices: [140, 155, 150, 165, 170, 175, 180],
    usSpot: 35.00, keSpot: 215.00, volume: "850 units", moq: "50 units",
    freightCost: 12.00, tariffRate: 0.25, clearingFees: 8.00,
    route: "Houston → Mombasa → Eastleigh Hub",
    news: [
      { source: "Nairobi Retail Daily", headline: "Trail-wear demand spikes 18% in regional suburbs.", impact: "Positive" },
    ],
  },
  {
    id: "fl-1", category: "Flowers", icon: "🌹",
    name: "Premium Long-Stem Red Roses",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
    profit: 410, expiry: "3/10/26", confidence: 92,
    prices: [350, 370, 365, 390, 400, 395, 410],
    usSpot: 120.00, keSpot: 530.00, volume: "5,000 stems", moq: "1,000 stems",
    freightCost: 35.00, tariffRate: 0.15, clearingFees: 15.00,
    route: "JKIA → Amsterdam → JFK Air Cargo",
    news: [
      { source: "FloraNet Weekly", headline: "Direct cargo flights to US East Coast expanding.", impact: "Positive" },
    ],
  },
  {
    id: "cl-1", category: "Clothes", icon: "👕",
    name: "Double-Weave Cotton Hoodies",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
    profit: 320, expiry: "3/10/26", confidence: 95,
    prices: [280, 290, 305, 300, 310, 315, 320],
    usSpot: 60.00, keSpot: 380.00, volume: "2,500 units", moq: "250 units",
    freightCost: 18.00, tariffRate: 0.25, clearingFees: 12.00,
    route: "Savannah → Mombasa → Gikomba Terminal",
    news: [
      { source: "Apparel Sourcing Monitor", headline: "High-density knitwear imports clear cleanly.", impact: "Neutral" },
    ],
  },
  {
    id: "tx-1", category: "Textiles", icon: "🧵",
    name: "Raw Indigo Denim Rolls (14oz)",
    image: "https://images.unsplash.com/photo-1582485565167-75055e2e6b5a?auto=format&fit=crop&w=600&q=80",
    profit: 670, expiry: "3/10/26", confidence: 87,
    prices: [590, 610, 600, 630, 645, 660, 670],
    usSpot: 150.00, keSpot: 820.00, volume: "400 rolls", moq: "20 rolls",
    freightCost: 45.00, tariffRate: 0.22, clearingFees: 32.00,
    route: "Newark → Mombasa → Industrial Area Nairobi",
    news: [
      { source: "Textiles East Africa", headline: "Cotton valuations shift to flat regional tariffs.", impact: "Neutral" },
    ],
  },
  {
    id: "el-1", category: "Electronics", icon: "🔌",
    name: "Solid State Storage Blocks",
    image: "https://images.unsplash.com/photo-1597872200919-276ef3c67521?auto=format&fit=crop&w=600&q=80",
    profit: 520, expiry: "3/10/26", confidence: 93,
    prices: [480, 495, 500, 510, 505, 515, 520],
    usSpot: 110.00, keSpot: 630.00, volume: "600 units", moq: "30 units",
    freightCost: 15.00, tariffRate: 0.10, clearingFees: 12.00,
    route: "Silicon Valley → JKIA → Kilimani Warehouse",
    news: [
      { source: "Silicon Africa Review", headline: "Enterprise edge storage demand surges 20% this quarter.", impact: "Positive" },
    ],
  },
];

// ─── NORMALISE API RESPONSE ──────────────────────────────────────────────────
function normaliseApiItem(raw, index) {
  const icons = { Footwear: "👟", Flowers: "🌹", Clothes: "👕", Textiles: "🧵", Electronics: "🔌" };
  const fallbackImages = [
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1597872200919-276ef3c67521?auto=format&fit=crop&w=600&q=80",
  ];
  const category = raw.category || "General";
  const usSpot = parseFloat(raw.price) || 0;
  const keSpot = usSpot * 3.5;
  const freightCost = usSpot * 0.12;
  const tariffRate = 0.25;
  const clearingFees = usSpot * 0.08;
  const profit = Math.round(keSpot - usSpot - freightCost - clearingFees - usSpot * tariffRate);
  const base = usSpot * 0.85;
  const prices = Array.from({ length: 7 }, (_, i) =>
    Math.round(base + (usSpot - base) * (i / 6) + Math.random() * usSpot * 0.03)
  );
  return {
    id: raw.id || `api-${index}`,
    category, icon: icons[category] || "📦",
    name: raw.name || "Unknown Item",
    image: raw.image_url || fallbackImages[index % fallbackImages.length],
    profit, expiry: raw.expiry || "N/A",
    confidence: raw.confidence || Math.round(85 + Math.random() * 12),
    prices, usSpot, keSpot,
    volume: raw.volume || "N/A", moq: raw.moq || "N/A",
    freightCost, tariffRate, clearingFees,
    route: raw.route || `Source → Mombasa → Nairobi`,
    news: raw.news || [
      { source: "Pipeline Feed", headline: raw.arbitrage_opportunity || "Signal detected.", impact: "Positive" },
    ],
  };
}

async function fetchSpreads(query = "wholesale closeout") {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const deals = data.parsed_deals || [];
  if (!deals.length) throw new Error("Empty payload");
  return deals.map(normaliseApiItem);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function landed(item) {
  return item.usSpot + item.freightCost + item.clearingFees + item.usSpot * item.tariffRate;
}

function confColor(v) {
  return v >= 92 ? "#059669" : v >= 88 ? "#d97706" : "#dc2626";
}
function confBg(v) {
  return v >= 92 ? "#f0fdf4" : v >= 88 ? "#fffbeb" : "#fef2f2";
}
function confBorder(v) {
  return v >= 92 ? "#bbf7d0" : v >= 88 ? "#fde68a" : "#fecaca";
}
function impactColor(impact) {
  return impact === "Positive" ? "#059669" : impact === "Negative" ? "#dc2626" : "#d97706";
}
function impactBg(impact) {
  return impact === "Positive" ? "#f0fdf4" : impact === "Negative" ? "#fef2f2" : "#fffbeb";
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ prices, color = "#6d28d9", height = 40 }) {
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
  const W = 100, H = height;
  const pts = prices.map((p, i) => ({
    x: (i / (prices.length - 1)) * W,
    y: H - 2 - ((p - min) / range) * (H - 6),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = line + ` L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
      <defs>
        <linearGradient id={`grad-${prices[0]}-${prices[prices.length-1]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${prices[0]}-${prices[prices.length-1]})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── DETAIL PANEL (DRAWER) ────────────────────────────────────────────────────
function DetailDrawer({ item, onClose }) {
  if (!item) return null;
  const lnd = landed(item);
  const net = item.keSpot - lnd;
  const roi = ((net / lnd) * 100).toFixed(1);
  const spread = item.keSpot - item.usSpot;
  const spreadPct = ((spread / item.usSpot) * 100).toFixed(0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(12,10,9,0.35)", backdropFilter: "blur(2px)" }}
      />
      {/* Panel */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "min(520px, 100vw)", height: "100vh",
        background: "#fcfbf8",
        borderLeft: "1px solid #e5e2db",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.10)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #e5e2db",
          background: "#fff",
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.07em", marginBottom: 4 }}>
              {item.id.toUpperCase()} · {item.category.toUpperCase()}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0c0a09", fontFamily: "Georgia, serif", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
              {item.name}
            </h2>
            <div style={{ fontSize: 11, color: "#a8a29e", fontFamily: "monospace", marginTop: 4 }}>{item.route}</div>
          </div>
          <button onClick={onClose} style={{
            background: "#f5f4f0", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", fontSize: 16,
            color: "#78716c", flexShrink: 0, marginLeft: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Image */}
        <div style={{ height: 200, overflow: "hidden", flexShrink: 0 }}>
          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderBottom: "1px solid #e5e2db" }}>
          {[
            { label: "Buy Price (US)", value: `$${item.usSpot.toFixed(2)}`, color: "#1c1917" },
            { label: "Sell Price (KE)", value: `$${item.keSpot.toFixed(2)}`, color: "#1c1917" },
            { label: "Your Profit", value: `$${net.toFixed(0)}`, color: "#059669" },
          ].map((k, i) => (
            <div key={i} style={{
              padding: "16px 18px",
              borderRight: i < 2 ? "1px solid #e5e2db" : "none",
              background: i === 2 ? "#f0fdf4" : "#fff",
            }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "Georgia, serif", letterSpacing: "-0.03em" }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Confidence + ROI badges */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              flex: 1, background: confBg(item.confidence), border: `1px solid ${confBorder(item.confidence)}`,
              borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: confColor(item.confidence), letterSpacing: "0.06em", fontWeight: 700 }}>CONFIDENCE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: confColor(item.confidence), fontFamily: "Georgia, serif", marginTop: 2 }}>{item.confidence}%</div>
            </div>
            <div style={{
              flex: 1, background: "#faf5ff", border: "1px solid #e9d5ff",
              borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#6d28d9", letterSpacing: "0.06em", fontWeight: 700 }}>RETURN ON INVEST</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#6d28d9", fontFamily: "Georgia, serif", marginTop: 2 }}>{roi}%</div>
            </div>
            <div style={{
              flex: 1, background: "#fefce8", border: "1px solid #fde68a",
              borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#92400e", letterSpacing: "0.06em", fontWeight: 700 }}>SPREAD</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#92400e", fontFamily: "Georgia, serif", marginTop: 2 }}>+{spreadPct}%</div>
            </div>
          </div>

          {/* Price chart */}
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginBottom: 8 }}>30-DAY PRICE INDEX</div>
            <div style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 10, padding: "12px 16px" }}>
              <Sparkline prices={item.prices} color="#6d28d9" height={56} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                {["W1","W2","W3","W4","W5","W6","W7"].map(l => (
                  <span key={l} style={{ fontSize: 9, color: "#d6d3d1", fontFamily: "monospace" }}>{l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginBottom: 10 }}>WHAT YOU ACTUALLY PAY</div>
            <div style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 10, overflow: "hidden" }}>
              {[
                ["Purchase price (US)", `$${item.usSpot.toFixed(2)}`],
                [`Import tax (${(item.tariffRate * 100).toFixed(0)}%)`, `$${(item.usSpot * item.tariffRate).toFixed(2)}`],
                ["Shipping cost", `$${item.freightCost.toFixed(2)}`],
                ["Clearing & handling", `$${item.clearingFees.toFixed(2)}`],
              ].map(([label, val], i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderBottom: "1px solid #f5f4f0",
                }}>
                  <span style={{ fontSize: 12, color: "#57534e", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", fontFamily: "Georgia, serif" }}>{val}</span>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", background: "#fafaf9",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", fontFamily: "'DM Sans', sans-serif" }}>Total cost to land</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#92400e", fontFamily: "Georgia, serif" }}>${lnd.toFixed(2)}</span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#065f46", fontFamily: "'DM Sans', sans-serif" }}>Your profit per unit</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#059669", fontFamily: "Georgia, serif" }}>${net.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginBottom: 10 }}>LOGISTICS</div>
            <div style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 10, overflow: "hidden" }}>
              {[["Min. order quantity", item.moq], ["Total available", item.volume], ["Deal expires", item.expiry]].map(([l, v], i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderBottom: i < 2 ? "1px solid #f5f4f0" : "none",
                }}>
                  <span style={{ fontSize: 12, color: "#57534e", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", fontFamily: "'DM Sans', sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* News */}
          {item.news && item.news.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginBottom: 10 }}>MARKET SIGNALS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.news.map((n, i) => (
                  <div key={i} style={{
                    background: "#fff", border: "1px solid #e5e2db",
                    borderLeft: `3px solid ${impactColor(n.impact)}`,
                    borderRadius: 10, padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e" }}>{n.source}</span>
                      <span style={{
                        fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                        padding: "2px 8px", borderRadius: 10,
                        background: impactBg(n.impact), color: impactColor(n.impact),
                      }}>{n.impact.toUpperCase()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#57534e", lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{n.headline}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <button style={{
            width: "100%", padding: "14px 0",
            background: "#3b0764", color: "#fff",
            border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", letterSpacing: "-0.2px",
            marginBottom: 8,
          }}>
            Request This Deal →
          </button>
          <button onClick={onClose} style={{
            width: "100%", padding: "12px 0",
            background: "transparent", color: "#78716c",
            border: "1px solid #e5e2db", borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SPREAD CARD ──────────────────────────────────────────────────────────────
function SpreadCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  const spread = item.keSpot - item.usSpot;
  const spreadPct = ((spread / item.usSpot) * 100).toFixed(0);

  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? "#c4b5fd" : "#e5e2db"}`,
        borderRadius: 14, overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 32px rgba(109,40,217,0.10)" : "0 1px 6px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 170, overflow: "hidden", background: "#f5f4f0", flexShrink: 0 }}>
        <img src={item.image} alt={item.name} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.4s ease",
        }} />
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: confBg(item.confidence), border: `1px solid ${confBorder(item.confidence)}`,
          borderRadius: 20, padding: "3px 10px",
          fontSize: 10, fontFamily: "monospace",
          color: confColor(item.confidence), fontWeight: 700,
        }}>{item.confidence}% conf.</div>
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(12,10,9,0.72)", borderRadius: 6, padding: "3px 8px",
          fontSize: 9, fontFamily: "monospace", color: "#e7e5e4", letterSpacing: "0.05em",
        }}>{item.category.toUpperCase()}</div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 10px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1c1917", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.35 }}>
          {item.name}
        </h3>

        {/* Price trio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[
            { l: "Buy (US)", v: `$${item.usSpot.toFixed(0)}` },
            { l: "Sell (KE)", v: `$${item.keSpot.toFixed(0)}` },
            { l: "Spread", v: `+${spreadPct}%`, hi: true },
          ].map(({ l, v, hi }) => (
            <div key={l} style={{
              background: hi ? "#faf5ff" : "#fafaf9",
              border: `1px solid ${hi ? "#e9d5ff" : "#f0ede8"}`,
              borderRadius: 7, padding: "6px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 8, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.04em" }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: hi ? "#6d28d9" : "#1c1917", fontFamily: "Georgia, serif", marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Profit pill */}
        <div style={{
          background: "#fefce8", border: "1px solid #fde68a",
          borderRadius: 8, padding: "8px 12px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#92400e", fontWeight: 600 }}>PROFIT / UNIT</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#92400e", fontFamily: "Georgia, serif" }}>${item.profit}</span>
        </div>

        {/* Sparkline */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 8, fontFamily: "monospace", color: "#d6d3d1", marginBottom: 2 }}>30-DAY INDEX</div>
          <Sparkline prices={item.prices} color="#6d28d9" height={32} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid #f5f4f0",
        background: "#fafaf9",
        display: "flex", gap: 8,
      }}>
        <button
          onClick={e => { e.stopPropagation(); onClick(item); }}
          style={{
            flex: 1, padding: "8px 0",
            background: "#3b0764", color: "#fff",
            border: "none", borderRadius: 7,
            fontSize: 11, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}>
          View Details →
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ spreads, activeId, onSelect, catFilter, onCatFilter }) {
  const cats = ["All", ...Array.from(new Set(spreads.map(s => s.category)))];
  const totalSpread = spreads.reduce((s, d) => s + d.profit, 0);
  const avgConf = spreads.length
    ? (spreads.reduce((s, d) => s + d.confidence, 0) / spreads.length).toFixed(1)
    : "—";
  const top = spreads.length ? spreads.reduce((a, b) => a.profit > b.profit ? a : b) : null;

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #e5e2db",
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 56px)",
      position: "sticky", top: 56,
      overflowY: "auto",
    }}>
      {/* Summary */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f5f4f0" }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.07em", marginBottom: 12 }}>PIPELINE SUMMARY</div>
        {[
          { label: "Active corridors", value: spreads.length, color: "#1c1917" },
          { label: "Avg. confidence", value: `${avgConf}%`, color: "#059669" },
          { label: "Total spread index", value: `$${totalSpread.toLocaleString()}`, color: "#6d28d9" },
          { label: "Top opportunity", value: top ? `$${top.profit}` : "—", color: "#92400e" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f4f0" }}>
            <span style={{ fontSize: 11, color: "#78716c", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "Georgia, serif" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f4f0" }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.07em", marginBottom: 10 }}>SECTOR</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {cats.map(c => (
            <button key={c} onClick={() => onCatFilter(c)} style={{
              textAlign: "left", padding: "8px 12px",
              background: catFilter === c ? "#faf5ff" : "transparent",
              border: `1px solid ${catFilter === c ? "#e9d5ff" : "transparent"}`,
              borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: catFilter === c ? 700 : 500,
              color: catFilter === c ? "#6d28d9" : "#78716c",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Watchlist */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.07em", marginBottom: 10 }}>WATCHLIST</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {spreads.map(item => {
            const pct = (((item.prices[6] - item.prices[0]) / item.prices[0]) * 100).toFixed(1);
            const up = Number(pct) >= 0;
            return (
              <div key={item.id} onClick={() => onSelect(item)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, cursor: "pointer",
                background: activeId === item.id ? "#faf5ff" : "transparent",
                border: `1px solid ${activeId === item.id ? "#e9d5ff" : "transparent"}`,
                transition: "all 0.15s",
              }}>
                <img src={item.image} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#1c1917", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name.split(" ").slice(0, 3).join(" ")}
                  </div>
                  <div style={{ fontSize: 9, color: "#a8a29e", fontFamily: "monospace" }}>{item.category}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", fontFamily: "Georgia, serif" }}>+${item.profit}</div>
                  <div style={{ fontSize: 9, color: up ? "#059669" : "#dc2626", fontFamily: "monospace" }}>{up ? "▲" : "▼"}{Math.abs(pct)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ dataSource, onRefresh }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50, height: 56,
      background: "rgba(252,251,248,0.97)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e5e2db",
      padding: "0 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      
    

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "1px solid #e5e2db", borderRadius: 8,
            padding: "5px 12px", fontSize: 12, color: "#6d28d9",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer",
          }}>← Back</button>
        )}

        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #3b0764, #92400e)",
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif",
        }}>CM</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", fontFamily: "'DM Sans', sans-serif" }}>COMAS</div>
          <div style={{ fontSize: 9, color: "#a8a29e", fontFamily: "monospace", letterSpacing: "0.04em" }}>TRADE INTELLIGENCE</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Data source badge */}
        <div style={{
          padding: "4px 10px", borderRadius: 20, border: "1px solid",
          borderColor: dataSource === "api" ? "#bbf7d0" : "#fde68a",
          background: dataSource === "api" ? "#f0fdf4" : "#fffbeb",
          fontSize: 9, fontFamily: "monospace", fontWeight: 700,
          color: dataSource === "api" ? "#059669" : "#92400e",
          letterSpacing: "0.06em",
        }}>
          {dataSource === "api" ? "● LIVE API" : dataSource === "mock" ? "● DEMO DATA" : "● LOADING"}
        </div>

        <button onClick={onRefresh} style={{
          padding: "6px 14px", borderRadius: 20,
          background: "#fff", border: "1px solid #e5e2db",
          fontSize: 11, fontWeight: 600, color: "#78716c",
          fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
        }}>↺ Refresh</button>

        <div style={{
          padding: "4px 10px", background: "#faf5ff",
          border: "1px solid #e9d5ff", borderRadius: 20,
          fontSize: 9, fontFamily: "monospace", color: "#6d28d9", fontWeight: 700,
        }}>● LIVE</div>
      </div>


    </nav>
  );
}

// ─── METRICS BAR ─────────────────────────────────────────────────────────────
function MetricsBar({ spreads }) {
  const avgConf = spreads.length
    ? (spreads.reduce((s, d) => s + d.confidence, 0) / spreads.length).toFixed(1) : "—";
  const top = spreads.length ? spreads.reduce((a, b) => a.profit > b.profit ? a : b) : null;
  const metrics = [
    { label: "Active corridors", value: `${spreads.length}`, sub: "US → KE" },
    { label: "Avg. confidence", value: `${avgConf}%`, sub: "Last 7 days" },
    { label: "Top opportunity", value: top ? `$${top.profit}` : "—", sub: top ? top.name.split(" ").slice(0, 2).join(" ") : "" },
    { label: "Data latency", value: "182ms", sub: "Bright Data API" },
    { label: "Pipeline status", value: "Stable", sub: "Render host" },
  ];
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e2db" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            padding: "16px 20px",
            borderRight: i < metrics.length - 1 ? "1px solid #e5e2db" : "none",
          }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.07em", marginBottom: 4 }}>{m.label.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1c1917", fontFamily: "Georgia, serif", letterSpacing: "-0.03em" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#a8a29e", fontFamily: "monospace", marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
// Root App export — rename and add props
export default function Dashboard({ spreads: propSpreads, dataSource: propDataSource, onRefresh: propRefresh, onItemClick, onBack }) {

  // Replace the local useState/useEffect/loadData with prop data when provided:
  const [localSpreads, setLocalSpreads] = useState([]);
  const [localDataSource, setLocalDataSource] = useState("loading");

  const spreads = propSpreads?.length ? propSpreads : localSpreads;
  const dataSource = propSpreads?.length ? (propDataSource || "mock") : localDataSource;

  const loadData = useCallback(async () => {
    if (propSpreads?.length) { propRefresh?.(); return; }
    setLocalDataSource("loading");
    try {
      const data = await fetchSpreads();
      setLocalSpreads(data);
      setLocalDataSource("api");
    } catch {
      setLocalSpreads(MOCK_SPREADS);
      setLocalDataSource("mock");
    }
  }, [propSpreads, propRefresh]);

  useEffect(() => { if (!propSpreads?.length) loadData(); }, []);

  // Replace handleSelect to route out instead of opening drawer:
  const handleSelect = (item) => {
    if (onItemClick) {
      onItemClick(item.id);        // ← navigate to ItemDetail
    } else {
      setSelectedItem(item);       // ← fallback: keep drawer for standalone use
      setActiveId(item.id);
    }
  };

  const filtered = catFilter === "All"
    ? spreads
    : spreads.filter(s => s.category === catFilter);

  if (dataSource === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#fcfbf8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "2px solid #e5e2db", borderTop: "2px solid #6d28d9", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 12, color: "#a8a29e", fontFamily: "monospace", letterSpacing: "0.08em" }}>LOADING PIPELINE DATA...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fcfbf8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f5f4f0; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Nav dataSource={dataSource} onRefresh={loadData} onBack={onBack} />

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <Sidebar
          spreads={spreads}
          activeId={activeId}
          onSelect={handleSelect}
          catFilter={catFilter}
          onCatFilter={setCatFilter}
        />

        <main style={{ flex: 1, minWidth: 0 }}>
          <MetricsBar spreads={spreads} />

          <div style={{ padding: "28px 28px 60px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0c0a09", fontFamily: "Georgia, serif", letterSpacing: "-0.03em" }}>
                  Active Spot Spreads
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#a8a29e", fontFamily: "monospace" }}>
                  Showing {filtered.length} of {spreads.length} corridors
                  {dataSource === "mock" && " · Demo data (API unavailable)"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "monospace", color: "#a8a29e" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                Updated 6 min ago
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
              {filtered.map(item => (
                <SpreadCard key={item.id} item={item} onClick={handleSelect} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Detail drawer */}
      {selectedItem && (
        <DetailDrawer item={selectedItem} onClose={() => { setSelectedItem(null); setActiveId(null); }} />
      )}
    </div>
  );
}