import { useState, useRef, useEffect } from "react";

import { useParams } from "react-router-dom";

// ─── ITEM DEFAULTS (rich detail data — merged with live spread pricing) ────────

export const ITEM_DEFAULTS = [
  {
    id: "fw-1", category: "Footwear", name: "Industrial Utility Workboots",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80",
    description: "Heavy-duty leather workboots with steel toe cap and oil-resistant sole. Widely used across construction, logistics, and industrial sectors.",
    hs_code: "6403.40.00",
    unit: "pair",
    countryData: {
      US: { spot: 45, retail: 129, currency: "USD", symbol: "$", trend: [38,40,41,43,44,43,45,46,45,47,46,45], label: "United States", flag: "🇺🇸", moq: 50 },
      KE: { spot: 295, retail: 380, currency: "KES", symbol: "$", trend: [240,250,255,265,270,278,282,288,290,292,294,295], label: "Kenya", flag: "🇰🇪", moq: 20 },
      NG: { spot: 210, retail: 290, currency: "NGN", symbol: "$", trend: [180,185,190,195,198,200,203,205,208,209,210,210], label: "Nigeria", flag: "🇳🇬", moq: 30 },
      ZA: { spot: 155, retail: 220, currency: "ZAR", symbol: "$", trend: [130,133,138,140,142,145,147,150,151,153,154,155], label: "South Africa", flag: "🇿🇦", moq: 40 },
      GB: { spot: 62, retail: 145, currency: "GBP", symbol: "$", trend: [54,55,57,58,59,60,60,61,61,62,62,62], label: "United Kingdom", flag: "🇬🇧", moq: 25 },
      CN: { spot: 22, retail: 55, currency: "CNY", symbol: "$", trend: [19,20,20,21,21,21,22,22,22,22,22,22], label: "China", flag: "🇨🇳", moq: 200 },
    },
    tradeReqs: {
      import: [
        { country: "KE", items: ["Import Declaration Form (IDF)", "KEBS Quality Mark Certificate (PVoC)", "KRA customs entry", "Certificate of Origin", "Packing list + commercial invoice"] },
        { country: "NG", items: ["SON conformity assessment", "Form M + Combined Certificate of Valuation", "SGD (Single Goods Declaration)"] },
        { country: "ZA", items: ["Bill of Entry (SAD500)", "SARS customs declaration", "SANS 20345 safety footwear standard compliance", "Letter of Credit or EFT proof"] },
      ],
      export: [
        { country: "US", items: ["EIN or US entity registration", "AES filing if >$2,500", "Certificate of Origin", "Commercial invoice with HS code 6403.40.00"] },
        { country: "CN", items: ["Chinese Export Customs Declaration", "Supplier factory audit (BSCI or equivalent)"] },
      ],
    },
    freight: 15.50,
    tariff: { KE: 0.25, NG: 0.20, ZA: 0.15, GB: 0.12 },
    clearance: { KE: 9.75, NG: 8.00, ZA: 7.00, GB: 5.00 },
    confidence: 94,
  },
  {
    id: "fl-1", category: "Flowers", name: "Premium Long-Stem Red Roses",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
    description: "Grade-A long-stem roses (60–70cm), grown in the Kenyan highlands. Renowned globally for superior vase life and colour intensity.",
    hs_code: "0603.11.00",
    unit: "stem",
    countryData: {
      KE: { spot: 0.28, retail: 0.55, currency: "USD", symbol: "$", trend: [0.22,0.23,0.24,0.25,0.25,0.26,0.26,0.27,0.27,0.28,0.28,0.28], label: "Kenya (Origin)", flag: "🇰🇪", moq: 1000 },
      US: { spot: 1.20, retail: 3.50, currency: "USD", symbol: "$", trend: [0.90,0.95,0.98,1.00,1.05,1.08,1.10,1.12,1.15,1.18,1.20,1.20], label: "United States", flag: "🇺🇸", moq: 500 },
      NL: { spot: 0.85, retail: 2.10, currency: "EUR", symbol: "$", trend: [0.70,0.72,0.74,0.76,0.78,0.79,0.80,0.82,0.83,0.84,0.85,0.85], label: "Netherlands", flag: "🇳🇱", moq: 2000 },
      DE: { spot: 0.95, retail: 2.40, currency: "EUR", symbol: "$", trend: [0.78,0.80,0.82,0.84,0.87,0.88,0.90,0.91,0.93,0.94,0.95,0.95], label: "Germany", flag: "🇩🇪", moq: 1000 },
      AE: { spot: 1.05, retail: 2.80, currency: "AED", symbol: "$", trend: [0.85,0.88,0.90,0.92,0.95,0.97,0.99,1.01,1.02,1.03,1.04,1.05], label: "UAE", flag: "🇦🇪", moq: 500 },
    },
    tradeReqs: {
      import: [
        { country: "US", items: ["USDA APHIS Phytosanitary Certificate", "CBP Entry Type 11 or Type 01", "Cold chain documentation (temp log)"] },
        { country: "NL", items: ["EU Phytosanitary Certificate", "FloraHolland auction registration optional", "Airway Bill + packing declaration"] },
        { country: "DE", items: ["EU plant health passport", "Customs declaration CN22/CN23", "MRL pesticide compliance"] },
      ],
      export: [
        { country: "KE", items: ["KEPHIS phytosanitary certificate", "HCDA export license", "Pre-clearance inspection at JKIA cold room", "Commercial invoice in USD"] },
      ],
    },
    freight: 0.35,
    tariff: { US: 0.065, NL: 0.085, DE: 0.085, AE: 0.05 },
    clearance: { US: 0.08, NL: 0.06, DE: 0.06, AE: 0.04 },
    confidence: 92,
  },
  {
    id: "tx-1", category: "Textiles", name: "Raw Indigo Denim Rolls (14oz)",
    image: "https://images.unsplash.com/photo-1582485565167-75055e2e6b5a?auto=format&fit=crop&w=800&q=80",
    description: "14oz selvedge-style raw indigo denim fabric in 30m rolls. Popular with premium apparel manufacturers and fashion labels.",
    hs_code: "5209.42.00",
    unit: "roll (30m)",
    countryData: {
      US: { spot: 150, retail: 210, currency: "USD", symbol: "$", trend: [130,133,136,138,140,143,144,146,147,148,149,150], label: "United States", flag: "🇺🇸", moq: 10 },
      KE: { spot: 820, retail: 1050, currency: "KES", symbol: "$", trend: [680,700,715,730,748,762,775,788,798,808,815,820], label: "Kenya", flag: "🇰🇪", moq: 5 },
      JP: { spot: 420, retail: 590, currency: "JPY", symbol: "$", trend: [380,385,390,395,400,405,408,412,415,417,419,420], label: "Japan", flag: "🇯🇵", moq: 20 },
      TR: { spot: 95, retail: 140, currency: "TRY", symbol: "$", trend: [78,80,82,84,86,88,89,90,91,92,94,95], label: "Turkey", flag: "🇹🇷", moq: 15 },
      IN: { spot: 68, retail: 98, currency: "INR", symbol: "$", trend: [55,57,58,60,61,62,63,64,65,66,67,68], label: "India", flag: "🇮🇳", moq: 25 },
    },
    tradeReqs: {
      import: [
        { country: "KE", items: ["Import Declaration Form (IDF)", "KEBS HS code verification 5209.42.00", "EAC Certificate of Origin", "Anti-dumping clearance for non-EAC origin", "KRA Single Customs Territory entry"] },
        { country: "JP", items: ["Japanese customs declaration", "MITI HS verification", "No quota restriction on denim rolls"] },
      ],
      export: [
        { country: "US", items: ["AES filing mandatory (value >$2,500)", "Commercial invoice + packing list", "Certificate of Origin"] },
        { country: "TR", items: ["Turkish Customs Form (Gümrük Beyannamesi)", "Certificate of conformity (TSE standards)", "EUR.1 movement certificate if EU origin"] },
      ],
    },
    freight: 45,
    tariff: { KE: 0.22, JP: 0.09, TR: 0.12 },
    clearance: { KE: 32, JP: 18, TR: 14 },
    confidence: 87,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmt(v) {
  if (typeof v !== "number") return v;
  return v < 10 ? v.toFixed(2) : v.toLocaleString();
}

function trendDelta(trend) {
  if (!trend || trend.length < 2) return 0;
  return ((trend[trend.length - 1] - trend[0]) / trend[0]) * 100;
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 52 }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 200;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: height - 6 - ((v - min) / range) * (height - 12),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  const gId = `g${color.replace(/[^a-z0-9]/gi, "")}${data[0]}`;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
    </svg>
  );
}

// ─── COUNTRY PRICE CARD ───────────────────────────────────────────────────────

function CountryCard({ code, data, selected, onToggle, isTop }) {
  const delta = trendDelta(data.trend);
  const up = delta >= 0;
  return (
    <button
      onClick={() => onToggle(code)}
      style={{
        all: "unset",
        display: "block",
        cursor: "pointer",
        background: selected ? "#0f0e1a" : "#f8f7fc",
        border: `1.5px solid ${selected ? "#6c5ce7" : "#ece9f8"}`,
        borderRadius: 14,
        padding: "16px",
        transition: "all .18s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at top left, rgba(108,92,231,.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{data.flag}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#e8e4ff" : "#1a1730", fontFamily: "var(--ff-sans)" }}>{data.label}</div>
            <div style={{ fontSize: 10, color: selected ? "#8b7fd4" : "#9993be", fontFamily: "monospace" }}>{data.currency}</div>
          </div>
        </div>
        {isTop && (
          <span style={{ fontSize: 9, fontWeight: 800, background: "#fdf0d5", color: "#92400e", padding: "3px 8px", borderRadius: 20, fontFamily: "monospace", letterSpacing: ".04em" }}>PEAK</span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: selected ? "#7b6fd0" : "#b5b0d8", letterSpacing: ".06em", marginBottom: 2 }}>WHOLESALE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: selected ? "#fff" : "#1a1730", fontFamily: "var(--ff-serif)", letterSpacing: "-.02em", lineHeight: 1 }}>
            ${fmt(data.spot)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: selected ? "#7b6fd0" : "#b5b0d8" }}>RETAIL</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: selected ? "#c5beff" : "#5e5899", fontFamily: "var(--ff-serif)" }}>
            ${fmt(data.retail)}
          </div>
        </div>
      </div>

      <Sparkline data={data.trend} color={selected ? "#a78bfa" : "#c4bef5"} height={40} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, fontFamily: "monospace" }}>
        <span style={{ color: up ? "#34d399" : "#f87171" }}>{up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span>
        <span style={{ color: selected ? "#7b6fd0" : "#b5b0d8" }}>MOQ {data.moq.toLocaleString()}</span>
      </div>
    </button>
  );
}

// ─── ARBITRAGE PANEL ─────────────────────────────────────────────────────────

function ArbitragePanel({ item, buyCode, sellCode }) {
  const buy = item.countryData[buyCode];
  const sell = item.countryData[sellCode];
  if (!buy || !sell || buyCode === sellCode) return (
    <div style={{ padding: "40px 24px", textAlign: "center", color: "#9993be", fontFamily: "monospace", fontSize: 12 }}>
      Select different buy and sell markets above.
    </div>
  );

  const freight = item.freight || 0;
  const tariffRate = item.tariff?.[sellCode] || 0;
  const clearance = item.clearance?.[sellCode] || 0;
  const tariff = buy.spot * tariffRate;
  const landed = buy.spot + freight + tariff + clearance;
  const gross = sell.spot - landed;
  const roi = ((gross / landed) * 100).toFixed(1);
  const feasible = gross > 0;
  const moqTarget = feasible ? Math.ceil(500 / gross) : null;
  const moqMin = feasible ? Math.max(buy.moq, sell.moq, moqTarget) : 0;

  const rows = [
    { label: `Purchase price (${buyCode})`, val: `$${fmt(buy.spot)}` },
    { label: `Import duty (${(tariffRate * 100).toFixed(0)}%)`, val: `$${tariff.toFixed(2)}` },
    { label: "Freight", val: `$${freight.toFixed(2)}` },
    { label: "Clearance & handling", val: `$${clearance.toFixed(2)}` },
    { label: "Total landed cost", val: `$${landed.toFixed(2)}`, bold: true },
    { label: `Sell price (${sellCode})`, val: `$${fmt(sell.spot)}` },
  ];

  return (
    <div>
      {/* Result header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto",
        gap: 16, alignItems: "center",
        padding: "20px 24px",
        background: feasible ? "linear-gradient(135deg, #052e16 0%, #0a1628 100%)" : "linear-gradient(135deg, #1f0707 0%, #1a0e1f 100%)",
        borderRadius: 16, marginBottom: 16,
        border: `1px solid ${feasible ? "#166534" : "#7f1d1d"}`,
      }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 800, letterSpacing: ".08em", color: feasible ? "#34d399" : "#f87171", marginBottom: 4 }}>
            {feasible ? "✓ SPREAD CONFIRMED" : "✗ NO PROFITABLE SPREAD"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f0eeff", fontFamily: "var(--ff-sans)" }}>
            {buy.flag} {buyCode} → {sell.flag} {sellCode}
          </div>
          <div style={{ fontSize: 11, color: "#7b6fd0", fontFamily: "monospace", marginTop: 4 }}>
            {item.name} · per {item.unit}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: feasible ? "#34d399" : "#f87171", fontFamily: "var(--ff-serif)", lineHeight: 1, letterSpacing: "-.03em" }}>
            {feasible ? "+" : ""}${gross.toFixed(2)}
          </div>
          <div style={{ fontSize: 10, color: "#7b6fd0", fontFamily: "monospace", marginTop: 2 }}>per {item.unit}</div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div style={{ background: "#f8f7fc", border: "1px solid #ece9f8", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
        {rows.map(({ label, val, bold }, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "11px 16px",
            borderBottom: i < rows.length - 1 ? "1px solid #ece9f8" : "none",
            background: bold ? "#eeeaf8" : "transparent",
          }}>
            <span style={{ fontSize: 12, color: bold ? "#1a1730" : "#6b668f", fontFamily: "var(--ff-sans)", fontWeight: bold ? 600 : 400 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: "#1a1730", fontFamily: "var(--ff-serif)" }}>{val}</span>
          </div>
        ))}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px",
          background: feasible ? "#f0fdf4" : "#fef2f2",
          borderTop: `1px solid ${feasible ? "#bbf7d0" : "#fecaca"}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: feasible ? "#166534" : "#991b1b", fontFamily: "var(--ff-sans)" }}>
            Gross profit / {item.unit}
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: feasible ? "#16a34a" : "#dc2626", fontFamily: "var(--ff-serif)" }}>
            ${gross.toFixed(2)}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#f8f7fc", border: "1px solid #ece9f8", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", letterSpacing: ".06em", marginBottom: 6 }}>RETURN ON CAPITAL</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: feasible ? "#6c5ce7" : "#dc2626", fontFamily: "var(--ff-serif)", letterSpacing: "-.02em" }}>
            {roi}%
          </div>
        </div>
        <div style={{ background: "#f8f7fc", border: "1px solid #ece9f8", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", letterSpacing: ".06em", marginBottom: 6 }}>MOQ (target $500 profit)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1730", fontFamily: "var(--ff-serif)", letterSpacing: "-.02em" }}>
            {feasible ? moqMin.toLocaleString() : "—"}
          </div>
          {feasible && <div style={{ fontSize: 10, color: "#9993be", fontFamily: "monospace" }}>{item.unit}s</div>}
        </div>
      </div>

      {/* Capital summary */}
      {feasible && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "16px" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#92400e", fontWeight: 700, letterSpacing: ".06em", marginBottom: 12 }}>
            CAPITAL AT MOQ ({moqMin.toLocaleString()} {item.unit}s)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#b45309", fontFamily: "monospace" }}>Capital required</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#92400e", fontFamily: "var(--ff-serif)" }}>
                ${(landed * moqMin).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#b45309", fontFamily: "monospace" }}>Expected return</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", fontFamily: "var(--ff-serif)" }}>
                ${(gross * moqMin).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRADE REQUIREMENTS ───────────────────────────────────────────────────────

function TradeReqs({ item, buyCode, sellCode }) {
  const [tab, setTab] = useState("import");
  const reqs = item.tradeReqs?.[tab] || [];
  const relevantCodes = [buyCode, sellCode].filter(Boolean);
  const display = reqs.filter(r => relevantCodes.includes(r.country)).length > 0
    ? reqs.filter(r => relevantCodes.includes(r.country))
    : reqs;

  const flagFor = (countryCode) => {
    for (const cd of Object.values(item.countryData)) {
      if (cd.label.slice(0, 2).toUpperCase() === countryCode || cd.label.includes(countryCode)) return cd.flag;
    }
    const map = { US: "🇺🇸", KE: "🇰🇪", NG: "🇳🇬", ZA: "🇿🇦", GB: "🇬🇧", CN: "🇨🇳", NL: "🇳🇱", DE: "🇩🇪", AE: "🇦🇪", JP: "🇯🇵", TR: "🇹🇷", IN: "🇮🇳" };
    return map[countryCode] || "🌐";
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["import", "export"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: 24,
            border: "none",
            background: tab === t ? "#6c5ce7" : "#f0eeff",
            color: tab === t ? "#fff" : "#6c5ce7",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--ff-sans)", textTransform: "capitalize", letterSpacing: ".02em",
            transition: "all .15s",
          }}>{t} docs</button>
        ))}
      </div>

      {display.length === 0 ? (
        <p style={{ fontSize: 12, color: "#9993be", fontFamily: "monospace", textAlign: "center", padding: "24px 0" }}>
          No requirements data for selected corridor.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {display.map((r, i) => (
            <div key={i} style={{ background: "#f8f7fc", border: "1px solid #ece9f8", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: "#eeeaf8", borderBottom: "1px solid #ece9f8" }}>
                <span style={{ fontSize: 16 }}>{flagFor(r.country)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1730", fontFamily: "var(--ff-sans)" }}>
                  {r.country} — {tab === "import" ? "Importing into" : "Exporting from"} {r.country}
                </span>
              </div>
              <ul style={{ margin: 0, padding: "12px 16px 12px 34px", display: "flex", flexDirection: "column", gap: 4 }}>
                {r.items.map((req, j) => (
                  <li key={j} style={{ fontSize: 12, color: "#4e4a7a", lineHeight: 1.7, fontFamily: "var(--ff-sans)" }}>{req}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMPARISON CHART ─────────────────────────────────────────────────────────

function ComparisonChart({ item, selectedCodes }) {
  if (selectedCodes.length < 2) return null;
  const COLORS = ["#6c5ce7", "#00b894", "#e17055", "#0984e3", "#fd79a8"];

  return (
    <div style={{ background: "#f8f7fc", border: "1px solid #ece9f8", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#9993be", letterSpacing: ".06em", marginBottom: 20 }}>
        12-WEEK TREND — {selectedCodes.map(c => item.countryData[c]?.label).join(" · ")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(selectedCodes.length, 3)}, 1fr)`, gap: 20 }}>
        {selectedCodes.map((code, i) => {
          const cd = item.countryData[code];
          if (!cd) return null;
          const color = COLORS[i % COLORS.length];
          const delta = trendDelta(cd.trend);
          const up = delta >= 0;
          return (
            <div key={code}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1730", fontFamily: "var(--ff-sans)" }}>{cd.flag} {cd.label}</div>
                  <div style={{ fontSize: 10, color: up ? "#16a34a" : "#dc2626", fontFamily: "monospace", marginTop: 2 }}>
                    {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs W1
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "var(--ff-serif)" }}>${fmt(cd.spot)}</div>
              </div>
              <Sparkline data={cd.trend} color={color} height={64} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, fontFamily: "monospace", color: "#9993be" }}>
                <span>W1: ${fmt(cd.trend[0])}</span>
                <span>W12: ${fmt(cd.trend[11])}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────


export default function ItemDetail({ spreads = [], onBack, onPoolClick }) {
  const { id: itemId } = useParams();
  // Merge: live spread pricing is overlaid onto rich ITEM_DEFAULTS
  const defaults = ITEM_DEFAULTS.find(i => i.id === itemId) || ITEM_DEFAULTS[0];
  const live = spreads.find(s => s.id === itemId);
  const item = live
    ? {
        ...defaults,
        ...live,
        // preserve rich fields that the API doesn't return
        countryData: defaults.countryData,
        tradeReqs: defaults.tradeReqs,
        tariff: defaults.tariff,
        clearance: defaults.clearance,
        freight: defaults.freight,
        hs_code: defaults.hs_code,
        unit: defaults.unit,
        // override pricing if live data has it
        ...(live.usSpot && defaults.countryData.US ? {
          countryData: {
            ...defaults.countryData,
            US: { ...defaults.countryData.US, spot: live.usSpot },
            ...(defaults.countryData.KE && live.keSpot ? {
              KE: { ...defaults.countryData.KE, spot: live.keSpot },
            } : {}),
          },
        } : {}),
      }
    : defaults;

  const availableCodes = Object.keys(item.countryData);
  const spotValues = availableCodes.map(c => item.countryData[c].spot);
  const maxSpotCode = availableCodes[spotValues.indexOf(Math.max(...spotValues))];

  const [activeTab, setActiveTab] = useState("analysis");
  const [selectedCodes, setSelectedCodes] = useState(availableCodes.slice(0, 2));
  const [buyCode, setBuyCode] = useState(availableCodes[0]);
  const [sellCode, setSellCode] = useState(availableCodes[1]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const headerRef = useRef(null);

  const toggleCode = (code) => {
    setSelectedCodes(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : [...prev, code]
    );
  };

  const tabs = [
    { id: "analysis", label: "Price analysis" },
    { id: "arbitrage", label: "Arbitrage" },
    { id: "requirements", label: "Trade docs" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0c1a", fontFamily: "var(--ff-sans)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Syne:wght@400;500;600;700;800&display=swap');
        :root {
          --ff-sans: 'Syne', sans-serif;
          --ff-serif: 'Fraunces', Georgia, serif;
          --ff-mono: 'DM Mono', monospace;
          --purple: #6c5ce7;
          --purple-light: #a78bfa;
          --bg: #0d0c1a;
          --surface: #161428;
          --border: rgba(108,92,231,.18);
          --text: #f0eeff;
          --muted: #7b6fd0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #0d0c1a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0c1a; }
        ::-webkit-scrollbar-thumb { background: #2d2850; border-radius: 2px; }
        button { cursor: pointer; }
      `}</style>

      {/* ── STICKY TOPBAR ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,12,26,.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(108,92,231,.1)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "5px 12px",
              fontSize: 12, color: "#a78bfa", fontFamily: "var(--ff-sans)",
              fontWeight: 600, transition: "all .15s",
            }}
          >
            ← Back
          </button>
          <div style={{ width: 1, height: 18, background: "var(--border)" }} />
          <code style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--ff-mono)", background: "rgba(108,92,231,.08)", padding: "3px 8px", borderRadius: 6 }}>
            HS {item.hs_code}
          </code>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#c5beff", fontFamily: "var(--ff-sans)" }}>{item.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
            background: item.confidence >= 90 ? "rgba(52,211,153,.1)" : "rgba(251,191,36,.1)",
            color: item.confidence >= 90 ? "#34d399" : "#fbbf24",
            border: `1px solid ${item.confidence >= 90 ? "rgba(52,211,153,.25)" : "rgba(251,191,36,.25)"}`,
            borderRadius: 20, padding: "3px 10px", fontFamily: "var(--ff-mono)",
          }}>
            {item.confidence}% CONF
          </span>
          <button
            onClick={() => onPoolClick?.(item)}
            style={{
              background: "var(--purple)", color: "#fff", border: "none",
              borderRadius: 8, padding: "7px 18px",
              fontSize: 12, fontWeight: 700, fontFamily: "var(--ff-sans)",
              letterSpacing: ".02em", transition: "opacity .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Pool &amp; Order →
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
        <img
          src={item.image} alt={item.name}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: imgLoaded ? 1 : 0, transition: "opacity .6s ease",
            filter: "brightness(.45) saturate(.8)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(13,12,26,0) 0%, rgba(13,12,26,.6) 60%, rgba(13,12,26,1) 100%)",
        }} />
        <div style={{ position: "absolute", bottom: 32, left: 36, right: 36 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: ".1em",
              background: "rgba(108,92,231,.25)", color: "#a78bfa",
              border: "1px solid rgba(108,92,231,.4)", borderRadius: 20, padding: "3px 12px",
              fontFamily: "var(--ff-mono)", backdropFilter: "blur(10px)",
            }}>
              {item.category.toUpperCase()}
            </span>
            <span style={{
              fontSize: 9, letterSpacing: ".08em",
              background: "rgba(255,255,255,.08)", color: "#a8a3c9",
              border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: "3px 12px",
              fontFamily: "var(--ff-mono)",
            }}>
              per {item.unit}
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--ff-serif)", fontSize: "clamp(24px, 3.5vw, 40px)",
            fontWeight: 700, color: "#fff", letterSpacing: "-.02em", lineHeight: 1.15,
            marginBottom: 10, maxWidth: 640,
          }}>
            {item.name}
          </h1>
          <p style={{ fontSize: 13, color: "#a8a3c9", lineHeight: 1.7, maxWidth: 560, fontFamily: "var(--ff-sans)", fontWeight: 400 }}>
            {item.description}
          </p>
        </div>
        {/* Stat pills */}
        <div style={{ position: "absolute", top: 20, right: 36, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {[
            { label: "Markets", value: availableCodes.length },
            { label: "Range", value: `$${fmt(Math.min(...spotValues))} – $${fmt(Math.max(...spotValues))}` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "rgba(13,12,26,.7)", backdropFilter: "blur(12px)",
              border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", textAlign: "right",
            }}>
              <div style={{ fontSize: 9, fontFamily: "var(--ff-mono)", color: "var(--muted)", letterSpacing: ".06em" }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#e8e4ff", fontFamily: "var(--ff-serif)" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 100px" }}>

        {/* Tab nav */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 32,
          borderBottom: "1px solid var(--border)",
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "14px 22px", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === t.id ? "var(--purple)" : "transparent"}`,
              color: activeTab === t.id ? "#a78bfa" : "var(--muted)",
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
              fontFamily: "var(--ff-sans)", marginBottom: -1,
              transition: "all .15s", letterSpacing: ".01em",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─ ANALYSIS TAB ─ */}
        {activeTab === "analysis" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "var(--ff-serif)", fontSize: 22, fontWeight: 700, color: "#f0eeff", letterSpacing: "-.02em", marginBottom: 4 }}>
                  Market prices
                </h2>
                <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--ff-mono)" }}>
                  Click to compare · {selectedCodes.length} selected
                </p>
              </div>
              {selectedCodes.length > 1 && (
                <button
                  onClick={() => setSelectedCodes(availableCodes.slice(0, 2))}
                  style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", fontFamily: "var(--ff-mono)", textDecoration: "underline" }}
                >
                  reset
                </button>
              )}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}>
              {availableCodes.map(code => (
                <CountryCard
                  key={code}
                  code={code}
                  data={item.countryData[code]}
                  selected={selectedCodes.includes(code)}
                  onToggle={toggleCode}
                  isTop={code === maxSpotCode}
                />
              ))}
            </div>

            <ComparisonChart item={item} selectedCodes={selectedCodes} />
          </div>
        )}

        {/* ─ ARBITRAGE TAB ─ */}
        {activeTab === "arbitrage" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              {[
                { label: "BUY FROM", value: buyCode, set: setBuyCode, color: "#6c5ce7", exclude: null },
                { label: "SELL INTO", value: sellCode, set: setSellCode, color: "#00b894", exclude: buyCode },
              ].map(({ label, value, set, color, exclude }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontFamily: "var(--ff-mono)", color: "var(--muted)", letterSpacing: ".08em", marginBottom: 10 }}>
                    {label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableCodes.filter(c => c !== exclude).map(code => (
                      <button key={code} onClick={() => set(code)} style={{
                        padding: "7px 14px", borderRadius: 22,
                        border: `1.5px solid ${value === code ? color : "var(--border)"}`,
                        background: value === code ? `${color}22` : "transparent",
                        color: value === code ? (label === "BUY FROM" ? "#a78bfa" : "#00b894") : "var(--muted)",
                        fontSize: 12, fontWeight: 700, fontFamily: "var(--ff-sans)",
                        transition: "all .15s",
                      }}>
                        {item.countryData[code].flag} {code}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ArbitragePanel item={item} buyCode={buyCode} sellCode={sellCode} />
          </div>
        )}

        {/* ─ REQUIREMENTS TAB ─ */}
        {activeTab === "requirements" && (
          <TradeReqs item={item} buyCode={buyCode} sellCode={sellCode} />
        )}
      </div>

      {/* ── STICKY BOTTOM CTA ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(13,12,26,.96)", backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        padding: "14px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--ff-mono)" }}>
          Pool capital with other traders on this corridor
        </span>
        <button
          onClick={() => onPoolClick?.(item)}
          style={{
            background: "var(--purple)", color: "#fff", border: "none",
            borderRadius: 10, padding: "11px 28px",
            fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-sans)",
            letterSpacing: ".02em", transition: "opacity .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Join or start a pool →
        </button>
      </div>
    </div>
  );
}