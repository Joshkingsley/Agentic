import { useState, useEffect } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "footwear",    icon: "👟", name: "Footwear",                tracks: 2 },
  { id: "flowers",     icon: "🌹", name: "Flowers",                 tracks: 1 },
  { id: "clothes",     icon: "👕", name: "Clothes",                 tracks: 1 },
  { id: "textiles",    icon: "🧵", name: "Textiles",                tracks: 1 },
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

// ─── HOOK: VIEWPORT WIDTH ─────────────────────────────────────────────────────

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

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

  const gradId = `sg-${prices[0]}-${prices[prices.length - 1]}`;
  const areaPath = `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")} L ${w},${h} L 0,${h} Z`;
  const linePath  = `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={height}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
// FIX: Nav links now accept onNavigate prop and wire up correctly

function Nav({ onDashboardClick }) {
  const isMobile = useWindowWidth() < 640;
  const [menuOpen, setMenuOpen] = useState(false);

  // Map nav labels to their handlers
  const navActions = {
    Dashboard: onDashboardClick,
    Pipelines: onDashboardClick,   // routes to dashboard; swap for dedicated route when ready
    Analytics: onDashboardClick,   // same — placeholder until analytics route exists
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(252,251,248,0.96)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e5e2db",
      padding: isMobile ? "0 16px" : "0 32px",
      height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo — clicking navigates home (no-op on landing, useful when embedded) */}
      <div
        onClick={onDashboardClick}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #3b0764, #92400e)",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff",
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

      {/* Desktop nav links — FIX: each has an onClick */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {Object.entries(navActions).map(([label, handler]) => (
            <NavLink key={label} active={label === "Dashboard"} onClick={handler}>
              {label}
            </NavLink>
          ))}
          <div style={{
            padding: "4px 10px",
            background: "#faf5ff", border: "1px solid #e9d5ff",
            borderRadius: 20, fontSize: 9, fontFamily: "monospace",
            color: "#6d28d9", fontWeight: 700, letterSpacing: "0.06em",
          }}>
            ● LIVE
          </div>
        </div>
      )}

      {/* Mobile: LIVE badge + hamburger */}
      {isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            padding: "3px 8px",
            background: "#faf5ff", border: "1px solid #e9d5ff",
            borderRadius: 20, fontSize: 9, fontFamily: "monospace",
            color: "#6d28d9", fontWeight: 700,
          }}>
            ● LIVE
          </div>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            aria-label="Menu"
          >
            <div style={{ width: 20, height: 2, background: "#44403c", marginBottom: 4, borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: "#44403c", marginBottom: 4, borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: "#44403c", borderRadius: 1 }} />
          </button>
        </div>
      )}

      {/* Mobile dropdown — FIX: links are wired */}
      {isMobile && menuOpen && (
        <div style={{
          position: "absolute", top: 56, left: 0, right: 0,
          background: "#fff", borderBottom: "1px solid #e5e2db",
          padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14,
          zIndex: 100,
        }}>
          {Object.entries(navActions).map(([label, handler]) => (
            <span
              key={label}
              onClick={() => { setMenuOpen(false); handler?.(); }}
              style={{
                fontSize: 13, fontWeight: 600, color: "#1c1917",
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              }}
            >{label}</span>
          ))}
        </div>
      )}
    </nav>
  );
}

// FIX: NavLink now accepts and fires onClick
function NavLink({ children, active, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: active ? 700 : 500,
        color: active ? "#6d28d9" : "#78716c",
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      }}
    >{children}</span>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero({ onDashboardClick, onSearch }) {
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const isMobile = useWindowWidth() < 768;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    await onSearch(query.trim());
    setLoading(false);
  };

  return (
    <section style={{
      padding: isMobile ? "48px 16px 40px" : "80px 32px 64px",
      maxWidth: 1200, margin: "0 auto",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: isMobile ? 40 : 64,
      alignItems: "center",
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
            {isMobile ? "US ↔ KE ARBITRAGE" : "BIDIRECTIONAL SPOT-PRICE OPTIMIZATION · US ↔ KE"}
          </span>
        </div>

        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: isMobile ? 32 : "clamp(28px, 3.5vw, 44px)",
          fontWeight: 700,
          color: "#0c0a09",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          margin: "0 0 20px",
        }}>
          Exploit{" "}
          <span style={{ color: "#6d28d9" }}>Cross-Border</span>{" "}
          Spreads on Physical Assets.
        </h1>

        <p style={{
          fontSize: 13, lineHeight: 1.75, color: "#57534e",
          maxWidth: 400, margin: "0 0 28px",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Scan, isolate, and route regional spot-price discrepancies across verified US–Kenya freight corridors. Deterministic equations. No model variance.
        </p>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="e.g. wholesale workboots, denim rolls..."
            style={{
              flex: 1, padding: "11px 14px",
              border: "1px solid #d6d3d1", borderRadius: 8,
              fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              outline: "none", color: "#1c1917",
              minWidth: 0,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{
              padding: "11px 18px",
              background: loading ? "#7c3aed" : "#3b0764",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.8 : 1,
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {loading ? "Scanning…" : "Find Spreads →"}
          </button>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onDashboardClick} style={{
            padding: "11px 22px",
            background: "#3b0764", color: "#fff",
            border: "none", borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}>
            Explore Spot Spreads →
          </button>
          {/* FIX: "View Sandbox" now goes to dashboard (swap for /sandbox route when ready) */}
          <button onClick={onDashboardClick} style={{
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

      {/* Right: Stat Panel */}
      {!isMobile && <HeroStatPanel onItemClick={undefined} />}
    </section>
  );
}

// FIX: HeroStatPanel now accepts onItemClick and each row is clickable
function HeroStatPanel({ onItemClick }) {
  const topItems = [...SPREADS].sort((a, b) => b.profit - a.profit).slice(0, 3);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e2db",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    }}>
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
        <div
          key={item.id}
          // FIX: each row navigates to detail when onItemClick is provided
          onClick={() => onItemClick?.(item)}
          style={{
            padding: "16px 20px",
            borderBottom: i < topItems.length - 1 ? "1px solid #f5f4f0" : "none",
            display: "flex", alignItems: "center", gap: 14,
            cursor: onItemClick ? "pointer" : "default",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (onItemClick) e.currentTarget.style.background = "#fafaf9"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#a8a29e", fontWeight: 700, width: 16, flexShrink: 0 }}>
            0{i + 1}
          </span>
          <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "#1c1917",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
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
            <div style={{ fontSize: 9, color: "#a8a29e", fontFamily: "monospace" }}>per unit</div>
          </div>
          {/* FIX: small arrow indicator when clickable */}
          {onItemClick && (
            <span style={{ fontSize: 11, color: "#d6d3d1", flexShrink: 0 }}>→</span>
          )}
        </div>
      ))}

      <div style={{
        padding: "12px 20px",
        background: "#fafaf9", borderTop: "1px solid #f5f4f0",
        fontSize: 10, fontFamily: "monospace", color: "#a8a29e", textAlign: "center",
      }}>
        Python · Render Host · Bright Data Unlockers
      </div>
    </div>
  );
}

// ─── METRICS BAR ──────────────────────────────────────────────────────────────

function MetricsBar({ onDashboardClick }) {
  const width = useWindowWidth();
  const isMobile = width < 640;

  const metrics = [
    { label: "CORRIDORS",      value: "5",      sub: "US → KE" },
    { label: "AVG CONFIDENCE", value: "91.7%",  sub: "Last 7 days" },
    { label: "TOP SPREAD",     value: "$670",   sub: "Denim Rolls" },
    { label: "DATA LATENCY",   value: "182ms",  sub: "Bright Data" },
    { label: "PIPELINE",       value: "STABLE", sub: "Render Host" },
  ];

  const cols = isMobile ? 2 : width < 900 ? 3 : 5;

  return (
    <div style={{ borderTop: "1px solid #e5e2db", borderBottom: "1px solid #e5e2db", background: "#fff" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}>
        {metrics.slice(0, cols).map((m, i) => (
          // FIX: "TOP SPREAD" metric is clickable and drills into dashboard
          <div
            key={i}
            onClick={m.label === "TOP SPREAD" ? onDashboardClick : undefined}
            style={{
              padding: isMobile ? "16px 14px" : "20px 24px",
              borderRight: (i + 1) % cols !== 0 ? "1px solid #e5e2db" : "none",
              cursor: m.label === "TOP SPREAD" ? "pointer" : "default",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (m.label === "TOP SPREAD") e.currentTarget.style.background = "#fafaf9"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.08em", marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{
              fontSize: isMobile ? 16 : 20, fontWeight: 800, color: "#1c1917",
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
  const isMobile = useWindowWidth() < 640;

  return (
    <div style={{
      maxWidth: 1200, margin: "0 auto",
      padding: isMobile ? "28px 16px 0" : "40px 32px 0",
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      {!isMobile && (
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", letterSpacing: "0.06em", marginRight: 8 }}>
          SECTOR FILTER
        </span>
      )}
      {["All", ...CATEGORIES.map(c => c.name)].map(name => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          style={{
            padding: isMobile ? "7px 12px" : "6px 14px",
            borderRadius: 20,
            border: "1px solid",
            borderColor: active === name ? "#6d28d9" : "#e5e2db",
            background: active === name ? "#faf5ff" : "#fff",
            color: active === name ? "#6d28d9" : "#78716c",
            fontSize: isMobile ? 12 : 11,
            fontWeight: active === name ? 700 : 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

// ─── SPREAD CARD ──────────────────────────────────────────────────────────────
// FIX: entire card body is now clickable (not just the button),
//      "Formula Params" button removed (was a dead stub),
//      "Open Analysis" renamed to "View Details →" for clarity

function SpreadCard({ item, onItemClick }) {
  const [hovered, setHovered] = useState(false);
  const spread    = item.keSpot - item.usSpot;
  const spreadPct = ((spread / item.usSpot) * 100).toFixed(0);

  const handleClick = () => onItemClick?.(item);

  return (
    <div
      onClick={handleClick}
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
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(255,255,255,0.95)", border: "1px solid #e9d5ff",
          borderRadius: 20, padding: "3px 10px",
          fontSize: 10, fontFamily: "monospace", color: "#6d28d9", fontWeight: 700,
        }}>
          {item.confidence}% conf.
        </div>
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(12,10,9,0.75)", borderRadius: 6, padding: "3px 8px",
          fontSize: 9, fontFamily: "monospace", color: "#e7e5e4", letterSpacing: "0.06em",
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <PriceCell label="US SPOT" value={`$${item.usSpot.toFixed(0)}`} />
          <PriceCell label="KE SPOT" value={`$${item.keSpot.toFixed(0)}`} />
          <PriceCell label="SPREAD"  value={`+${spreadPct}%`} highlight />
        </div>

        <div style={{
          background: "#fefce8", border: "1px solid #fde68a",
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

        <div style={{ marginBottom: 14, opacity: 0.85 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e", marginBottom: 4 }}>
            30-DAY PRICE INDEX
          </div>
          <Sparkline prices={item.prices} />
        </div>
      </div>

      {/* Footer — FIX: single full-width CTA, no dead "Formula Params" stub */}
      <div style={{
        padding: "10px 18px", borderTop: "1px solid #f5f4f0",
        background: "#fafaf9",
      }}>
        <button
          onClick={e => { e.stopPropagation(); handleClick(); }}
          style={{
            width: "100%", padding: "9px 0", background: "#3b0764",
            border: "none", borderRadius: 7,
            fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#fff",
            cursor: "pointer", fontWeight: 700,
          }}
        >
          View Details →
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
  const isMobile = useWindowWidth() < 640;

  const filtered = activeFilter === "All"
    ? SPREADS
    : SPREADS.filter(s => s.category.toLowerCase().includes(activeFilter.toLowerCase().split(" ")[0]));

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px 60px" : "0 32px 80px" }}>
      <CategoryRow active={activeFilter} onSelect={setActiveFilter} />

      <div style={{
        display: "flex", alignItems: isMobile ? "flex-start" : "baseline",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        padding: isMobile ? "20px 0 16px" : "28px 0 20px",
        gap: isMobile ? 8 : 0,
      }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800,
            color: "#0c0a09", fontFamily: "Georgia, serif", letterSpacing: "-0.03em",
          }}>
            Active Spot Spreads
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#78716c", fontFamily: "monospace" }}>
            Showing {filtered.length} of {SPREADS.length} corridors
          </p>
        </div>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a8a29e", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
          Updated 6 min ago
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
        gap: isMobile ? 16 : 20,
      }}>
        {filtered.map(item => (
          <SpreadCard key={item.id} item={item} onItemClick={onItemClick} />
        ))}
      </div>
    </section>
  );
}

// ─── ARCHITECTURE STRIP ───────────────────────────────────────────────────────

function ArchitectureStrip() {
  const isMobile = useWindowWidth() < 768;

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
    <section style={{ background: "#0c0a09", padding: isMobile ? "48px 16px" : "64px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: isMobile ? 28 : 40 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#57534e", letterSpacing: "0.1em", marginBottom: 8 }}>
            PLATFORM ARCHITECTURE
          </div>
          <h2 style={{
            margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800,
            color: "#fafaf9", fontFamily: "Georgia, serif", letterSpacing: "-0.03em",
          }}>
            How the Pipeline Works
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 16 : 20,
        }}>
          {pillars.map((p, i) => (
            <div key={i} style={{
              border: "1px solid #292524", borderRadius: 14,
              padding: isMobile ? "22px 18px" : "28px 24px",
              borderTop: `2px solid ${p.accent}`,
            }}>
              <div style={{
                fontSize: 9, fontFamily: "monospace", color: p.accent,
                letterSpacing: "0.1em", fontWeight: 700, marginBottom: 10,
              }}>
                {String(i + 1).padStart(2, "0")} · {p.tag}
              </div>
              <h3 style={{
                margin: "0 0 10px", fontSize: 15, fontWeight: 700,
                color: "#f5f5f4", fontFamily: "'DM Sans', sans-serif",
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

function Footer({ onDashboardClick }) {
  const isMobile = useWindowWidth() < 640;

  return (
    <footer style={{
      background: "#0c0a09", borderTop: "1px solid #1c1917",
      padding: isMobile ? "24px 16px" : "28px 32px",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 12 : 0,
      }}>
        <span
          onClick={onDashboardClick}
          style={{
            fontSize: 12, fontWeight: 700, color: "#57534e",
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}
        >
          Arbitrage Intelligence Platform
        </span>
        {/* FIX: footer CTA link to dashboard */}
        <button
          onClick={onDashboardClick}
          style={{
            background: "transparent", border: "1px solid #292524",
            borderRadius: 8, padding: "6px 14px",
            fontSize: 11, fontWeight: 600, color: "#78716c",
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}
        >
          Open Dashboard →
        </button>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "#44403c", letterSpacing: "0.06em" }}>
          RENDER MANAGED · PYTHON CORE · BRIGHT DATA
        </span>
      </div>
    </footer>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
// FIX: All navigation props threaded through to every component that needs them.
// onItemClick is now passed all the way to HeroStatPanel and SpreadCard.

export default function Landing({ spreads, onItemClick, onDashboardClick, onSearch }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fcfbf8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f5f4f0; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
        button { touch-action: manipulation; }
        input { -webkit-appearance: none; }
      `}</style>

      {/* FIX: Nav gets onDashboardClick */}
      <Nav onDashboardClick={onDashboardClick} />

      {/* FIX: Hero gets both handlers */}
      <Hero onDashboardClick={onDashboardClick} onSearch={onSearch} />

      {/* FIX: MetricsBar gets onDashboardClick for the clickable TOP SPREAD metric */}
      <MetricsBar onDashboardClick={onDashboardClick} />

      {/* FIX: SpreadsGrid passes onItemClick down to each SpreadCard */}
      <SpreadsGrid onItemClick={onItemClick} />

      <ArchitectureStrip />

      {/* FIX: Footer gets onDashboardClick */}
      <Footer onDashboardClick={onDashboardClick} />
    </div>
  );
}