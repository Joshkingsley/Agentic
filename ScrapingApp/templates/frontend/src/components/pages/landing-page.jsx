import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "footwear",    icon: "👟", name: "Footwear",              tracks: 2 },
  { id: "flowers",     icon: "🌹", name: "Flowers",               tracks: 1 },
  { id: "clothes",     icon: "👕", name: "Clothes",              tracks: 1 },
  { id: "textiles",    icon: "🧵", name: "Textiles",              tracks: 1 },
  { id: "electronics", icon: "🔌", name: "Electronics Accessories", tracks: 1 },
];

const SPREADS = [
  {
    id: "fw-1", category: "Footwear",
    name: "Industrial Utility Workboots",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80",
    profit: 250, expiry: "3/10/26", confidence: 94,
    prices: [210, 215, 230, 225, 240, 238, 250],
    usSpot: 45.00, keSpot: 295.00,
  },
  {
    id: "fw-2", category: "Footwear",
    name: "Terrain Offroad Trail Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    profit: 180, expiry: "3/10/26", confidence: 89,
    prices: [140, 155, 150, 165, 170, 175, 180],
    usSpot: 35.00, keSpot: 215.00,
  },
  {
    id: "fl-1", category: "Flowers",
    name: "Premium Long-Stem Red Roses",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
    profit: 410, expiry: "3/10/26", confidence: 92,
    prices: [350, 370, 365, 390, 400, 395, 410],
    usSpot: 120.00, keSpot: 530.00,
  },
  {
    id: "cl-1", category: "Clothes",
    name: "Double-Weave Cotton Hoodies",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
    profit: 320, expiry: "3/10/26", confidence: 95,
    prices: [280, 290, 305, 300, 310, 315, 320],
    usSpot: 60.00, keSpot: 380.00,
  },
  {
    id: "tx-1", category: "Textiles",
    name: "Raw Indigo Denim Rolls (14oz)",
    image: "https://images.unsplash.com/photo-1582485565167-75055e2e6b5a?auto=format&fit=crop&w=600&q=80",
    profit: 670, expiry: "3/10/26", confidence: 87,
    prices: [590, 610, 600, 630, 645, 660, 670],
    usSpot: 150.00, keSpot: 820.00,
  },
  {
    id: "el-1", category: "Electronics",
    name: "Solid State Storage Blocks",
    image: "https://images.unsplash.com/photo-1597872200919-276ef3c67521?auto=format&fit=crop&w=600&q=80",
    profit: 520, expiry: "3/10/26", confidence: 93,
    prices: [480, 495, 500, 510, 505, 515, 520],
    usSpot: 110.00, keSpot: 630.00,
  },
];

// ─── SPARKLINE ────────────────────────────────────────────────────────────────

function Sparkline({ prices, color = "#6d28d9", height = 32 }) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 100, h = height;

  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  const areaPath = `M ${pts[0]} ` +
    pts.slice(1).map(p => `L ${p}`).join(" ") +
    ` L ${w},${h} L 0,${h} Z`;

  const linePath = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={height}>
      <defs>
        <linearGradient id={`sg-${prices[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${prices[0]})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(252,251,248,0.96)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e5e2db",
      padding: "0 32px",
      height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #3b0764, #92400e)",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px",
          fontFamily: "Georgia, serif",
        }}>CM</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "-0.3px", fontFamily: "'DM Sans', sans-serif" }}>
          COMAS 
          </div>
          <div style={{ fontSize: 9, color: "#78716c", fontFamily: "monospace", letterSpacing: "0.05em" }}>
            AUTONOMOUS PIPELINE
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <NavLink active>Dashboard</NavLink>
        <NavLink>Pipelines</NavLink>
        <NavLink>Analytics</NavLink>
        <div style={{
          padding: "4px 10px",
          background: "#faf5ff",
          border: "1px solid #e9d5ff",
          borderRadius: 20,
          fontSize: 9, fontFamily: "monospace",
          color: "#6d28d9", fontWeight: 700, letterSpacing: "0.06em",
        }}>
          ● LIVE
        </div>
      </div>
    </nav>
  );
}

function NavLink({ children, active }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: active ? 700 : 500,
      color: active ? "#6d28d9" : "#78716c",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      letterSpacing: "-0.1px",
    }}>{children}</span>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ onDashboardClick, onSearch }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    await onSearch(query.trim());
    setLoading(false);
  };

  return (
    <section style={{
      padding: "80px 32px 64px",
      maxWidth: 1200, margin: "0 auto",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 64, alignItems: "center", height: 659
    }}>
      {/* Left: Copy */}
      <div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: "#fefce8", border: "1px solid #fde68a",
          marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d97706", display: "inline-block" }} />
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#92400e", fontWeight: 700, letterSpacing: "0.08em" }}>
            BIDIRECTIONAL SPOT-PRICE OPTIMIZATION · US ↔ KE
          </span>
        </div>

        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(28px, 3.5vw, 44px)",
          fontWeight: 700,
          color: "#0c0a09",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          margin: "0 0 20px",
        }}>
          Exploit<br />
          <span style={{ color: "#6d28d9" }}>Cross-Border</span><br />
          Spreads on<br />
          Physical Assets.
        </h1>

        <p style={{
          fontSize: 13, lineHeight: 1.75, color: "#57534e",
          maxWidth: 400, margin: "0 0 32px",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
        }}>
          Scan, isolate, and route regional spot-price discrepancies across verified US–Kenya freight corridors. Deterministic equations. No model variance.
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSearch()}
        placeholder="e.g. wholesale workboots, denim rolls..."
        style={{
          flex: 1, padding: "11px 16px",
          border: "1px solid #d6d3d1", borderRadius: 8,
          fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          outline: "none", color: "#1c1917",
        }}
      />
      <button
        onClick={handleSearch}
        disabled={loading || !query.trim()}
        style={{
          padding: "11px 22px", background: loading ? "#7c3aed" : "#3b0764",
          color: "#fff", border: "none", borderRadius: 8,
          fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          cursor: loading ? "default" : "pointer", opacity: loading ? 0.8 : 1,
        }}
      >
        {loading ? "Scanning..." : "Find Spreads →"}
      </button>
    </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onDashboardClick} style={{
            padding: "11px 22px",
            background: "#3b0764", color: "#fff",
            border: "none", borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", letterSpacing: "-0.1px",
          }}>
            Explore Spot Spreads →
          </button>
          <button style={{
            padding: "11px 22px",
            background: "transparent", color: "#44403c",
            border: "1px solid #d6d3d1", borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}>
            View Sandbox
          </button>
        </div>
      </div>

      {/* Right: Live Stats Panel */}
      <HeroStatPanel />
    </section>
  );
}

function HeroStatPanel() {
  const topItems = [...SPREADS].sort((a, b) => b.profit - a.profit).slice(0, 3);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e2db",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    }}>
      {/* Panel Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid #f5f4f0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "#78716c", letterSpacing: "0.08em", fontWeight: 700 }}>
          TOP MARGIN OPPORTUNITIES
        </span>
        <span style={{
          fontSize: 9, fontFamily: "monospace", color: "#6d28d9",
          background: "#faf5ff", padding: "2px 8px", borderRadius: 10,
          border: "1px solid #e9d5ff",
        }}>
          6H REFRESH
        </span>
      </div>

      {topItems.map((item, i) => (
        <div key={item.id} style={{
          padding: "16px 20px",
          borderBottom: i < topItems.length - 1 ? "1px solid #f5f4f0" : "none",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{
            fontSize: 11, fontFamily: "monospace", color: "#a8a29e", fontWeight: 700,
            width: 16, flexShrink: 0,
          }}>0{i + 1}</span>
          <img src={item.image} alt="" style={{
            width: 40, height: 40, borderRadius: 8,
            objectFit: "cover", flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1c1917", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.name}
            </div>
            <div style={{ fontSize: 10, color: "#a8a29e", fontFamily: "monospace", marginTop: 2 }}>
              {item.category}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", fontFamily: "'DM Sans', sans-serif" }}>
              +${item.profit}
            </div>
            <div style={{ fontSize: 9, color: "#a8a29e", fontFamily: "monospace" }}>
              per unit
            </div>
          </div>
        </div>
      ))}

      <div style={{
        padding: "12px 20px",
        background: "#fafaf9",
        borderTop: "1px solid #f5f4f0",
        fontSize: 10, fontFamily: "monospace", color: "#a8a29e",
        textAlign: "center",
      }}>
        Python · Render Host · Bright Data Unlockers
      </div>
    </div>
  );
}

// ─── METRICS BAR ──────────────────────────────────────────────────────────────

function MetricsBar() {
  const metrics = [
    { label: "ACTIVE CORRIDORS", value: "5", sub: "US → KE" },
    { label: "AVG CONFIDENCE", value: "91.7%", sub: "Last 7 days" },
    { label: "TOP SPREAD", value: "$670", sub: "Denim Rolls" },
    { label: "DATA LATENCY", value: "182ms", sub: "Bright Data API" },
    { label: "PIPELINE STATUS", value: "STABLE", sub: "Render Host" },
  ];

  return (
    <div style={{
      borderTop: "1px solid #e5e2db", borderBottom: "1px solid #e5e2db",
      background: "#fff",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
      }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            padding: "20px 24px",
            borderRight: i < metrics.length - 1 ? "1px solid #e5e2db" : "none",
          }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.08em", marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: "#1c1917",
              fontFamily: "Georgia, serif", letterSpacing: "-0.03em",
            }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: "#a8a29e", fontFamily: "monospace", marginTop: 2 }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORY CHIPS ───────────────────────────────────────────────────────────

function CategoryRow({ active, onSelect }) {
  return (
    <div style={{
      maxWidth: 1200, margin: "0 auto",
      padding: "40px 32px 0",
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginRight: 8 }}>
        SECTOR FILTER
      </span>
      {["All", ...CATEGORIES.map(c => c.name)].map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid",
            borderColor: active === name ? "#6d28d9" : "#e5e2db",
            background: active === name ? "#faf5ff" : "#fff",
            color: active === name ? "#6d28d9" : "#78716c",
            fontSize: 11, fontWeight: active === name ? 700 : 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

// ─── SPREAD CARD ──────────────────────────────────────────────────────────────

function SpreadCard({  item, onItemClick }) {
  const [hovered, setHovered] = useState(false);
  const spread = item.keSpot - item.usSpot;
  const spreadPct = ((spread / item.usSpot) * 100).toFixed(0);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? "#c4b5fd" : "#e5e2db"}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 32px rgba(109,40,217,0.1)" : "0 1px 6px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column",
        cursor: "pointer",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 180, overflow: "hidden", background: "#f5f4f0" }}>
        <img
          src={item.image} alt={item.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
        {/* Confidence Badge */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #e9d5ff",
          borderRadius: 20, padding: "3px 10px",
          fontSize: 10, fontFamily: "monospace",
          color: "#6d28d9", fontWeight: 700,
        }}>
          {item.confidence}% conf.
        </div>
        {/* Category Tag */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(12,10,9,0.75)",
          borderRadius: 6, padding: "3px 8px",
          fontSize: 9, fontFamily: "monospace",
          color: "#e7e5e4", letterSpacing: "0.06em",
        }}>
          {item.category.toUpperCase()}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          margin: "0 0 10px", fontSize: 13, fontWeight: 700,
          color: "#1c1917", fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.35, letterSpacing: "-0.2px",
        }}>
          {item.name}
        </h3>

        {/* Price Row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8, marginBottom: 14,
        }}>
          <PriceCell label="US SPOT" value={`$${item.usSpot.toFixed(0)}`} />
          <PriceCell label="KE SPOT" value={`$${item.keSpot.toFixed(0)}`} />
          <PriceCell
            label="SPREAD"
            value={`+${spreadPct}%`}
            highlight
          />
        </div>

        {/* Profit Tag */}
        <div style={{
          background: "#fefce8",
          border: "1px solid #fde68a",
          borderRadius: 8, padding: "8px 12px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#92400e", fontWeight: 600 }}>
            PROFIT POTENTIAL
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#92400e", fontFamily: "Georgia, serif" }}>
            ${item.profit}
            <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 3 }}>/ unit</span>
          </span>
        </div>

        {/* Sparkline */}
        <div style={{ marginBottom: 14, opacity: 0.85 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", marginBottom: 4 }}>
            30-DAY PRICE INDEX
          </div>
          <Sparkline prices={item.prices} />
        </div>
      </div>

      {/* Footer Actions */}
      // SpreadCard — replace the footer section
      <div style={{ padding: "10px 18px", borderTop: "1px solid #f5f4f0", display: "flex", gap: 8, background: "#fafaf9" }}>
        <button style={{
          flex: 1, padding: "8px 0", background: "#fff", border: "1px solid #e5e2db",
          borderRadius: 7, fontSize: 10, fontFamily: "monospace", color: "#78716c",
          cursor: "pointer", fontWeight: 600,
        }}>
          Formula Params
        </button>
        <button
          onClick={() => onItemClick?.(item)}   // ← ADD THIS
          style={{
            flex: 1, padding: "8px 0", background: "#3b0764", border: "none",
            borderRadius: 7, fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: "#fff",
            cursor: "pointer", fontWeight: 700, letterSpacing: "-0.1px",
          }}>
          Open Analysis
        </button>
      </div>
    </div>
  );
}

function PriceCell({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? "#faf5ff" : "#fafaf9",
      border: `1px solid ${highlight ? "#e9d5ff" : "#f0ede8"}`,
      borderRadius: 7, padding: "7px 8px", textAlign: "center",
    }}>
      <div style={{ fontSize: 8, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{
        fontSize: 12, fontWeight: 800,
        color: highlight ? "#6d28d9" : "#1c1917",
        fontFamily: "Georgia, serif", marginTop: 2,
      }}>
        {value}
      </div>
    </div>
  );
}

// ─── SPREADS GRID ─────────────────────────────────────────────────────────────

function SpreadsGrid({ onItemClick }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? SPREADS
    : SPREADS.filter(s => s.category.toLowerCase().includes(activeFilter.toLowerCase().split(" ")[0]));

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 80px" }}>
      <CategoryRow active={activeFilter} onSelect={setActiveFilter} />

      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: "28px 0 20px",
      }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            color: "#0c0a09", fontFamily: "Georgia, serif",
            letterSpacing: "-0.03em",
          }}>
            Active Spot Spreads
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#78716c", fontFamily: "monospace" }}>
            Showing {filtered.length} of {SPREADS.length} corridors
          </p>
        </div>
        <div style={{
          fontSize: 10, fontFamily: "monospace", color: "#a8a29e",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
          Updated 6 min ago
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20,
      }}>
        {filtered.map(item => <SpreadCard key={item.id} item={item} onItemClick={onItemClick} />)}
      </div>
    </section>
  );
}

// ─── ARCHITECTURE STRIP ───────────────────────────────────────────────────────

function ArchitectureStrip() {
  const pillars = [
    {
      tag: "DETERMINISTIC",
      title: "Python-Backed Equations",
      body: "All margin calculations run directly on our Render host. No model variance — just pure arithmetic on live price feeds.",
      accent: "#6d28d9",
    },
    {
      tag: "EXTRACTION",
      title: "Bright Data Scraping Layer",
      body: "Web Unlockers and Scraping Browsers target supplier portals to surface real-time inventory pricing every 6 hours.",
      accent: "#92400e",
    },
    {
      tag: "SYNTHESIS",
      title: "ElevenLabs Audio Pipeline",
      body: "Trade parameters undergo transcription processing to issue high-fidelity spoken logistics briefs for corridor operators.",
      accent: "#0369a1",
    },
  ];

  return (
    <section style={{
      background: "#0c0a09",
      padding: "64px 32px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#57534e", letterSpacing: "0.1em", marginBottom: 8 }}>
            PLATFORM ARCHITECTURE
          </div>
          <h2 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            color: "#fafaf9", fontFamily: "Georgia, serif",
            letterSpacing: "-0.03em",
          }}>
            How the Pipeline Works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {pillars.map((p, i) => (
            <div key={i} style={{
              border: "1px solid #292524",
              borderRadius: 14, padding: "28px 24px",
              borderTop: `2px solid ${p.accent}`,
            }}>
              <div style={{
                fontSize: 9, fontFamily: "monospace",
                color: p.accent, letterSpacing: "0.1em",
                fontWeight: 700, marginBottom: 10,
              }}>
                {String(i + 1).padStart(2, "0")} · {p.tag}
              </div>
              <h3 style={{
                margin: "0 0 10px", fontSize: 15, fontWeight: 700,
                color: "#f5f5f4", fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "-0.2px",
              }}>
                {p.title}
              </h3>
              <p style={{
                margin: 0, fontSize: 12, lineHeight: 1.7,
                color: "#78716c", fontFamily: "'DM Sans', sans-serif",
              }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{
      background: "#0c0a09",
      borderTop: "1px solid #1c1917",
      padding: "28px 32px",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#57534e", fontFamily: "'DM Sans', sans-serif" }}>
          Arbitrage Intelligence Platform
        </span>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "#44403c", letterSpacing: "0.06em" }}>
          RENDER MANAGED · PYTHON CORE · BRIGHT DATA SCRAPING API
        </span>
      </div>
    </footer>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function Landing({ spreads, onItemClick, onDashboardClick, onSearch }){
  return (
    <div style={{ minHeight: "100vh", background: "#fcfbf8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f5f4f0; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
      `}</style>

      <Nav />
      <Hero onDashboardClick={onDashboardClick} onSearch={onSearch} />       
      <MetricsBar />
      <SpreadsGrid onItemClick={onItemClick} /> 
      <ArchitectureStrip />
      <Footer />
    </div>
  );
}