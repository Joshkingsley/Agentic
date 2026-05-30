// community.jsx — COMAS Capital Pooling
// Mobile-first: list → bottom-sheet detail → full-screen checkout modal
// Data flows: POOL_DEFAULTS patched with live spread pricing from parent

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

// ─── POOL DATA ────────────────────────────────────────────────────────────────

export const POOL_DEFAULTS = [
  {
    id: "pool-fw1", itemId: "fw-1", itemName: "Industrial Utility Workboots",
    category: "Footwear", icon: "👟",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80",
    buyCountry: "US", sellCountry: "KE", buyFlag: "🇺🇸", sellFlag: "🇰🇪",
    target: 18000, raised: 13400, profitPerUnit: 250, unitCost: 45,
    moq: 100, status: "open", tariffRate: 0.25,
    route: "Newark → Mombasa → Nairobi", estimatedDelivery: "45–60 days",
    description: "Wholesale liquidation lot of steel-toe workboots. Strong demand in the construction sector across Nairobi and Mombasa. EAC tariff at 25% already factored into spread.",
    traders: [
      { name: "Amina K.", avatar: "AK", amount: 2500, joined: "2d ago", location: "Nairobi" },
      { name: "James O.", avatar: "JO", amount: 1800, joined: "3d ago", location: "Mombasa" },
      { name: "Fatuma H.", avatar: "FH", amount: 3200, joined: "5d ago", location: "Eldoret" },
      { name: "Moses N.", avatar: "MN", amount: 1900, joined: "6d ago", location: "Kisumu" },
      { name: "Sarah W.", avatar: "SW", amount: 4000, joined: "1w ago", location: "Nairobi" },
    ],
    news: [
      { source: "KRA Gazette", headline: "Footwear surcharge waived Q2 2026.", impact: "Positive", time: "1h" },
      { source: "EA Logistics Hub", headline: "Mombasa clearance under 36 hours.", impact: "Positive", time: "3h" },
    ],
  },
  {
    id: "pool-fl1", itemId: "fl-1", itemName: "Premium Long-Stem Roses",
    category: "Flowers", icon: "🌹",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
    buyCountry: "KE", sellCountry: "US", buyFlag: "🇰🇪", sellFlag: "🇺🇸",
    target: 28000, raised: 28000, profitPerUnit: 0.92, unitCost: 0.28,
    moq: 5000, status: "full", tariffRate: 0.065,
    route: "JKIA → Amsterdam → JFK Air Cargo", estimatedDelivery: "3–5 days (air)",
    description: "Highland-grown Grade A roses. KEPHIS-certified. Direct air cargo via Amsterdam. Pool closed — next cycle opens 3/11.",
    traders: [
      { name: "Green Valley Coop", avatar: "GV", amount: 8000, joined: "1d ago", location: "Kirinyaga" },
      { name: "Blossom Exports", avatar: "BE", amount: 12000, joined: "2d ago", location: "Naivasha" },
      { name: "Lena M.", avatar: "LM", amount: 5000, joined: "3d ago", location: "Nairobi" },
      { name: "Peter K.", avatar: "PK", amount: 3000, joined: "4d ago", location: "Thika" },
    ],
    news: [
      { source: "FloraNet Weekly", headline: "Direct cargo flights to US East Coast expanding.", impact: "Positive", time: "2h" },
      { source: "JKIA Authority", headline: "Cold room capacity expanded ahead of peak season.", impact: "Positive", time: "5h" },
    ],
  },
  {
    id: "pool-tx1", itemId: "tx-1", itemName: "Raw Indigo Denim Rolls 14oz",
    category: "Textiles", icon: "🧵",
    image: "https://images.unsplash.com/photo-1582485565167-75055e2e6b5a?auto=format&fit=crop&w=800&q=80",
    buyCountry: "US", sellCountry: "KE", buyFlag: "🇺🇸", sellFlag: "🇰🇪",
    target: 45000, raised: 22800, profitPerUnit: 593, unitCost: 150,
    moq: 20, status: "open", tariffRate: 0.22,
    route: "Newark → Mombasa → Industrial Area Nairobi", estimatedDelivery: "55–70 days",
    description: "14oz selvedge denim rolls from US liquidation inventory. Significant spread to Nairobi industrial buyers and fashion labels. 22% EAC tariff applies.",
    traders: [
      { name: "Textile Hub EA", avatar: "TH", amount: 9000, joined: "4h ago", location: "Nairobi" },
      { name: "David C.", avatar: "DC", amount: 6800, joined: "1d ago", location: "Kampala" },
      { name: "Halima I.", avatar: "HI", amount: 7000, joined: "2d ago", location: "Nairobi" },
    ],
    news: [
      { source: "Textile Sourcing Monitor", headline: "US denim surplus — prices falling 8%.", impact: "Positive", time: "2h" },
    ],
  },
  {
    id: "pool-el1", itemId: "el-1", itemName: "Solid State Storage Blocks",
    category: "Electronics", icon: "🔌",
    image: "https://images.unsplash.com/photo-1597872200919-276ef3c67521?auto=format&fit=crop&w=800&q=80",
    buyCountry: "US", sellCountry: "KE", buyFlag: "🇺🇸", sellFlag: "🇰🇪",
    target: 22000, raised: 16800, profitPerUnit: 395, unitCost: 110,
    moq: 30, status: "open", tariffRate: 0.10,
    route: "Silicon Valley → JKIA → Kilimani Warehouse", estimatedDelivery: "30–45 days",
    description: "Enterprise-grade SSD storage in demand across Nairobi tech sector. 10% tariff — lowest in portfolio. Excellent ROI at ~260%.",
    traders: [
      { name: "Nairobi Tech Hub", avatar: "NT", amount: 7200, joined: "6h ago", location: "Nairobi" },
      { name: "Edwin O.", avatar: "EO", amount: 4600, joined: "1d ago", location: "Nakuru" },
      { name: "Zawadi L.", avatar: "ZL", amount: 5000, joined: "2d ago", location: "Mombasa" },
    ],
    news: [
      { source: "Silicon Africa Review", headline: "Enterprise SSD demand surges 20% Q1 2026.", impact: "Positive", time: "6h" },
    ],
  },
];

const PROMOS = { COMAS20: 20, TRADE10: 10, POOL15: 15, LAUNCH5: 5 };

const AVATAR_COLORS = ["#4F46E5", "#0891B2", "#059669", "#D97706", "#DC2626", "#7C3AED"];

// ─── TINY UTILS ───────────────────────────────────────────────────────────────

const pct = (raised, target) => Math.min(100, Math.round((raised / target) * 100));

const fmt = (n) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  if (Math.abs(n) < 10) return "$" + n.toFixed(2);
  return "$" + Math.round(n).toLocaleString();
};

function Avatar({ label = "?", size = 34 }) {
  const bg = AVATAR_COLORS[label.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: "#fff",
      flexShrink: 0, letterSpacing: "0.02em",
    }}>{label}</div>
  );
}

function ImpactBadge({ impact }) {
  const map = {
    Positive: { bg: "rgba(5,150,105,.15)", color: "#34d399", label: "↑" },
    Negative: { bg: "rgba(220,38,38,.12)", color: "#f87171",  label: "↓" },
    Neutral:  { bg: "rgba(107,114,128,.12)", color: "#9ca3af", label: "—" },
  };
  const s = map[impact] || map.Neutral;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, background: s.bg, color: s.color,
      borderRadius: 4, padding: "2px 5px", fontFamily: "monospace",
      letterSpacing: "0.05em",
    }}>{s.label} {impact.toUpperCase()}</span>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function ProgressBar({ raised, target, full }) {
  const p = pct(raised, target);
  return (
    <div>
      <div style={{
        height: 5, background: "rgba(255,255,255,0.08)",
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${p}%`,
          background: full ? "linear-gradient(90deg,#C9A84C,#e8c96a)" : "linear-gradient(90deg,#4F46E5,#818cf8)",
          borderRadius: 3,
          transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginTop: 5, fontSize: 10, fontFamily: "monospace",
        color: "rgba(255,255,255,0.4)",
      }}>
        <span>{fmt(raised)} raised</span>
        <span style={{ color: full ? "#C9A84C" : "rgba(255,255,255,0.4)" }}>
          {p}% · {fmt(target)} goal
        </span>
      </div>
    </div>
  );
}

// ─── POOL CARD (list item) ────────────────────────────────────────────────────

function PoolCard({ pool, onPress }) {
  const full = pool.status === "full";
  const roi  = pool.unitCost > 0
    ? Math.round((pool.profitPerUnit / pool.unitCost) * 100)
    : 0;

  return (
    <button
      onClick={() => onPress(pool)}
      style={{
        display: "block", width: "100%", textAlign: "left",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, overflow: "hidden",
        cursor: full ? "default" : "pointer",
        padding: 0, margin: 0,
        WebkitTapHighlightColor: "transparent",
        transition: "border-color 0.15s, background 0.15s",
        opacity: full ? 0.65 : 1,
      }}
    >
      {/* Hero image strip */}
      <div style={{ position: "relative", height: 130, overflow: "hidden" }}>
        <img
          src={pool.image} alt={pool.itemName}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
        }} />
        {/* Status badge */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700,
            background: full ? "rgba(201,168,76,.2)" : "rgba(79,70,229,.25)",
            color: full ? "#C9A84C" : "#818cf8",
            border: `1px solid ${full ? "rgba(201,168,76,.4)" : "rgba(79,70,229,.4)"}`,
            borderRadius: 20, padding: "3px 9px", fontFamily: "monospace",
            backdropFilter: "blur(8px)",
          }}>
            {full ? "● POOL FULL" : "● OPEN"}
          </span>
        </div>
        {/* ROI badge */}
        {!full && (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800,
              background: "rgba(0,0,0,0.5)", color: "#4ade80",
              borderRadius: 20, padding: "3px 9px", fontFamily: "monospace",
              backdropFilter: "blur(8px)",
            }}>+{roi}% ROI</span>
          </div>
        )}
        {/* Route overlay */}
        <div style={{
          position: "absolute", bottom: 10, left: 12, right: 12,
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>
              {pool.icon} {pool.itemName}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
              {pool.buyFlag} → {pool.sellFlag} · {pool.traders.length} traders
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8, marginBottom: 12,
        }}>
          {[
            ["PROFIT/UNIT", fmt(pool.profitPerUnit)],
            ["COST/UNIT",   fmt(pool.unitCost)],
            ["ETA",         pool.estimatedDelivery.split("–")[0] + "d"],
          ].map(([label, val]) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8, padding: "7px 8px",
            }}>
              <p style={{ margin: "0 0 2px", fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Georgia,serif" }}>{val}</p>
            </div>
          ))}
        </div>
        <ProgressBar raised={pool.raised} target={pool.target} full={full} />
      </div>
    </button>
  );
}

// ─── BOTTOM SHEET (detail) ────────────────────────────────────────────────────

function BottomSheet({ pool, onClose, onBuyShare }) {
  const sheetRef  = useRef(null);
  const startYRef = useRef(null);
  const [translateY, setTranslateY] = useState(0);
  const [visible, setVisible]       = useState(false);
  const [tab, setTab]               = useState("overview"); // overview | traders | news

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  // Swipe-to-dismiss
  const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setTranslateY(dy);
  };
  const onTouchEnd   = () => {
    if (translateY > 80) dismiss();
    else setTranslateY(0);
  };

  const full = pool.status === "full";
  const roi  = pool.unitCost > 0 ? Math.round((pool.profitPerUnit / pool.unitCost) * 100) : 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: `rgba(0,0,0,${visible ? 0.72 : 0})`,
        transition: "background 0.28s",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        ref={sheetRef}
        style={{
          background: "#0f1220",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          maxHeight: "90dvh",
          display: "flex", flexDirection: "column",
          transform: `translateY(${visible ? translateY : "100%"}px)`,
          transition: translateY === 0 ? "transform 0.28s cubic-bezier(0.32,0.72,0,1)" : "none",
          willChange: "transform",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Hero image */}
        <div style={{ position: "relative", height: 180, overflow: "hidden", flexShrink: 0, margin: "10px 16px 0" , borderRadius: 14 }}>
          <img
            src={pool.image} alt={pool.itemName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(15,18,32,0.95) 100%)",
          }} />
          <button
            onClick={dismiss}
            style={{
              position: "absolute", top: 10, right: 10,
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "none",
              color: "#fff", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >×</button>
          <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
            <p style={{ margin: "0 0 3px", fontSize: 17, fontWeight: 800, color: "#fff" }}>
              {pool.icon} {pool.itemName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
              {pool.buyFlag} {pool.buyCountry} → {pool.sellFlag} {pool.sellCountry} · {pool.route.split("→")[0].trim()}
            </p>
          </div>
          {!full && (
            <div style={{ position: "absolute", top: 10, left: 10 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#4ade80",
                background: "rgba(0,0,0,0.5)", borderRadius: 20,
                padding: "3px 10px", fontFamily: "monospace",
                backdropFilter: "blur(8px)",
              }}>+{roi}% ROI</span>
            </div>
          )}
        </div>

        {/* Key metrics row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 8, padding: "14px 16px 0", flexShrink: 0,
        }}>
          {[
            ["PROFIT", fmt(pool.profitPerUnit), "#4ade80"],
            ["BUY @",  fmt(pool.unitCost),      "#fff"],
            ["MOQ",    pool.moq + " u",          "#fff"],
            ["ETA",    pool.estimatedDelivery.split("–")[0] + "d", "#fff"],
          ].map(([l, v, c]) => (
            <div key={l} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 6px", textAlign: "center",
            }}>
              <p style={{ margin: "0 0 2px", fontSize: 7.5, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.07em" }}>{l}</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c, fontFamily: "Georgia,serif" }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
          <ProgressBar raised={pool.raised} target={pool.target} full={full} />
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 4, padding: "12px 16px 0",
          flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          {["overview", "traders", "news"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "8px 4px",
                background: "none", border: "none",
                borderBottom: `2px solid ${tab === t ? "#4F46E5" : "transparent"}`,
                color: tab === t ? "#fff" : "rgba(255,255,255,0.38)",
                fontSize: 12, fontWeight: tab === t ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
                textTransform: "capitalize", transition: "color 0.15s",
                marginBottom: -1,
              }}
            >{t}</button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 16px 0", WebkitOverflowScrolling: "touch" }}>

          {tab === "overview" && (
            <div style={{ paddingBottom: 120 }}>
              {/* Description */}
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 16px" }}>
                {pool.description}
              </p>

              {/* Trade details */}
              {[
                ["Route",       pool.route],
                ["Delivery",    pool.estimatedDelivery],
                ["Tariff",      (pool.tariffRate * 100).toFixed(1) + "% EAC"],
                ["Min. order",  pool.moq + " units"],
              ].map(([l, v]) => (
                <div key={l} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: "0.02em" }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}

              {/* Trader avatars strip */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex" }}>
                  {pool.traders.slice(0, 4).map((t, i) => (
                    <div key={i} style={{ marginLeft: i > 0 ? -10 : 0, border: "2px solid #0f1220", borderRadius: "50%" }}>
                      <Avatar label={t.avatar} size={28} />
                    </div>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                  {pool.traders.length} traders · {fmt(pool.raised)} pooled
                </p>
              </div>
            </div>
          )}

          {tab === "traders" && (
            <div style={{ paddingBottom: 120 }}>
              {pool.traders.map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0", borderBottom: i < pool.traders.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <Avatar label={t.avatar} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.38)", fontFamily: "monospace" }}>
                      {t.location} · {t.joined}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#818cf8", fontFamily: "Georgia,serif", flexShrink: 0 }}>
                    {fmt(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "news" && (
            <div style={{ paddingBottom: 120 }}>
              {pool.news.map((n, i) => (
                <div key={i} style={{
                  padding: "12px 0",
                  borderBottom: i < pool.news.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{n.source}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{n.time} ago</span>
                      <ImpactBadge impact={n.impact} />
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.55 }}>{n.headline}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div style={{
          flexShrink: 0,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(to top, #0f1220 85%, transparent)",
          position: "sticky", bottom: 0,
        }}>
          {full ? (
            <div style={{
              padding: "14px", borderRadius: 14,
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)",
              textAlign: "center",
            }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#C9A84C" }}>🔒 This pool is full</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>Notify me for next cycle</p>
            </div>
          ) : (
            <button
              onClick={onBuyShare}
              style={{
                width: "100%", padding: "15px",
                background: "linear-gradient(135deg, #4F46E5, #6366f1)",
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(79,70,229,0.45)",
                letterSpacing: "0.01em",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Buy Share → {fmt(pool.profitPerUnit)}/unit profit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT MODAL ───────────────────────────────────────────────────────────

function CheckoutModal({ pool, onClose, onSuccess }) {
  const [step, setStep]         = useState(1); // 1 = amount, 2 = payment
  const [amount, setAmount]     = useState("");
  const [promo, setPromo]       = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");
  const [mpesaNum, setMpesaNum]   = useState("");
  const [cardNum, setCardNum]     = useState("");
  const [cardExp, setCardExp]     = useState("");
  const [cardCvv, setCardCvv]     = useState("");
  const [name, setName]           = useState("");
  const [agreed, setAgreed]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [visible, setVisible]     = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onClose, 260);
  };

  const num     = parseFloat(amount) || 0;
  const fee     = num > 0 ? +(num * 0.015 * (1 - discount / 100)).toFixed(2) : 0;
  const total   = +(num + fee).toFixed(2);
  const units   = num > 0 && pool.unitCost > 0 ? Math.floor(num / pool.unitCost) : 0;
  const profit  = +(units * pool.profitPerUnit).toFixed(2);

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (PROMOS[code]) {
      setDiscount(PROMOS[code]);
      setPromoMsg(`✓ ${PROMOS[code]}% off platform fee`);
    } else {
      setDiscount(0);
      setPromoMsg("Invalid code");
    }
  };

  const nextStep = () => {
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (num < 100)    { setError("Minimum contribution is $100."); return; }
    setStep(2);
  };

  const submit = () => {
    setError("");
    if (payMethod === "mpesa" && !mpesaNum.trim()) { setError("Enter your M-Pesa number."); return; }
    if (payMethod === "card"  && (!cardNum || !cardExp || !cardCvv)) { setError("Fill in all card fields."); return; }
    if (!agreed) { setError("Accept the terms to continue."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({ name, amount: num, total, method: payMethod, discount, units, profit });
    }, 1600);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: `rgba(0,0,0,${visible ? 0.85 : 0})`,
      transition: "background 0.26s",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        background: "#0a0d1a",
        flex: 1,
        display: "flex", flexDirection: "column",
        transform: `translateY(${visible ? 0 : "100%"})`,
        transition: "transform 0.26s cubic-bezier(0.32,0.72,0,1)",
        overflow: "hidden",
      }}>

        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
              STEP {step} OF 2 · {step === 1 ? "AMOUNT" : "PAYMENT"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {pool.icon} {pool.itemName}
            </p>
          </div>
          <button
            onClick={dismiss}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "none",
              color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", padding: "0 20px", gap: 6, flexShrink: 0 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2, marginTop: 12,
              background: step >= s ? "#4F46E5" : "rgba(255,255,255,0.1)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Scrollable form area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0", WebkitOverflowScrolling: "touch" }}>

          {step === 1 && (
            <div style={{ paddingBottom: 120 }}>
              {/* Live estimate card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(99,102,241,0.08))",
                border: "1px solid rgba(79,70,229,0.3)",
                borderRadius: 14, padding: "14px 16px", marginBottom: 20,
                display: "flex", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em" }}>UNITS FUNDED</p>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif" }}>
                    {units > 0 ? units : "—"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em" }}>EST. PROFIT</p>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#4ade80", fontFamily: "Georgia,serif" }}>
                    {profit > 0 ? "+" + fmt(profit) : "—"}
                  </p>
                </div>
              </div>

              <Field label="Your name" required>
                <Input placeholder="e.g. Amina Kinyua" value={name} onChange={setName} />
              </Field>

              <Field label="Amount (USD)" required hint="Min $100">
                <Input
                  type="number" inputMode="decimal"
                  placeholder="e.g. 500"
                  value={amount} onChange={setAmount}
                />
              </Field>

              <Field label="Promo code">
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      placeholder="e.g. COMAS20"
                      value={promo}
                      onChange={v => setPromo(v.toUpperCase())}
                    />
                  </div>
                  <button
                    onClick={applyPromo}
                    style={{
                      padding: "0 16px", borderRadius: 10,
                      background: "rgba(79,70,229,0.15)",
                      border: "1px solid rgba(79,70,229,0.3)",
                      color: "#818cf8", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >Apply</button>
                </div>
                {promoMsg && (
                  <p style={{
                    margin: "6px 0 0", fontSize: 11,
                    color: promoMsg.startsWith("✓") ? "#4ade80" : "#f87171",
                    fontFamily: "monospace",
                  }}>{promoMsg}</p>
                )}
              </Field>

              {/* Fee breakdown */}
              {num >= 100 && (
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, overflow: "hidden", marginTop: 4,
                }}>
                  {[
                    ["Contribution", `$${num.toFixed(2)}`],
                    [`Platform fee (1.5%${discount ? ` −${discount}%` : ""})`, `$${fee.toFixed(2)}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "Georgia,serif" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Total charged</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#818cf8", fontFamily: "Georgia,serif" }}>${total}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ paddingBottom: 140 }}>
              {/* Summary chip */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.25)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 20,
              }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>TOTAL</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif" }}>${total}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>EST. PROFIT</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#4ade80", fontFamily: "Georgia,serif" }}>+{fmt(profit)}</p>
                </div>
              </div>

              {/* Payment method tabs */}
              <Field label="Payment method">
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "mpesa", label: "M-Pesa", icon: "📱" },
                    { id: "card",  label: "Card",   icon: "💳" },
                    { id: "bank",  label: "Wire",   icon: "🏦" },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 10,
                        border: `1px solid ${payMethod === m.id ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"}`,
                        background: payMethod === m.id ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.04)",
                        color: payMethod === m.id ? "#fff" : "rgba(255,255,255,0.45)",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 4, transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </Field>

              {payMethod === "mpesa" && (
                <Field label="M-Pesa number" required>
                  <Input
                    type="tel" inputMode="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={mpesaNum} onChange={setMpesaNum}
                  />
                </Field>
              )}

              {payMethod === "card" && (
                <>
                  <Field label="Card number" required>
                    <Input
                      type="text" inputMode="numeric"
                      placeholder="•••• •••• •••• ••••"
                      maxLength={19} value={cardNum} onChange={setCardNum}
                    />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Expiry" required>
                      <Input placeholder="MM / YY" value={cardExp} onChange={setCardExp} />
                    </Field>
                    <Field label="CVV" required>
                      <Input type="password" inputMode="numeric" placeholder="•••" maxLength={4} value={cardCvv} onChange={setCardCvv} />
                    </Field>
                  </div>
                </>
              )}

              {payMethod === "bank" && (
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "14px 16px",
                  fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 2,
                }}>
                  <strong style={{ color: "#fff" }}>COMAS Trade Ltd</strong><br />
                  Account: 1234567890 · Equity Bank Kenya<br />
                  Swift: EQBLKENA<br />
                  Ref: <span style={{ fontFamily: "monospace", color: "#818cf8" }}>POOL-{pool.id.toUpperCase()}</span>
                </div>
              )}

              {/* Terms */}
              <div
                onClick={() => setAgreed(v => !v)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  marginTop: 16, cursor: "pointer",
                  padding: "12px 14px",
                  background: agreed ? "rgba(79,70,229,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${agreed ? "rgba(79,70,229,0.3)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 12, transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: agreed ? "#4F46E5" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${agreed ? "#4F46E5" : "rgba(255,255,255,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {agreed && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  I understand this is a pooled commercial trade. Returns are projected, not guaranteed. I accept the COMAS trading terms.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{
          flexShrink: 0, padding: "12px 20px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "#0a0d1a",
        }}>
          {error && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#f87171", fontFamily: "monospace", textAlign: "center" }}>
              ⚠ {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setError(""); }}
                style={{
                  padding: "14px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >←</button>
            )}
            <button
              onClick={step === 1 ? nextStep : submit}
              disabled={loading}
              style={{
                flex: 1, padding: "15px",
                background: loading
                  ? "rgba(79,70,229,0.5)"
                  : "linear-gradient(135deg,#4F46E5,#6366f1)",
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontWeight: 800,
                cursor: loading ? "default" : "pointer",
                fontFamily: "inherit",
                boxShadow: loading ? "none" : "0 4px 20px rgba(79,70,229,0.4)",
                transition: "all 0.15s",
                letterSpacing: "0.01em",
              }}
            >
              {loading
                ? "Processing…"
                : step === 1
                ? `Continue → $${total > 0 ? total : "—"}`
                : `Confirm ${fmt(total)} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────

function SuccessScreen({ contribution, pool, onDone }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "#0a0d1a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px",
      transform: `scale(${visible ? 1 : 0.94})`,
      opacity: visible ? 1 : 0,
      transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ fontSize: 56, marginBottom: 16, animation: "cp-pop 0.4s 0.1s both" }}>✓</div>
      <h2 style={{
        fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px",
        fontFamily: "Georgia,serif", textAlign: "center",
      }}>Contribution confirmed</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", margin: "0 0 28px", textAlign: "center" }}>
        {contribution.name} · ${contribution.total} via {contribution.method}
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        width: "100%", maxWidth: 340, marginBottom: 20,
      }}>
        {[
          ["UNITS FUNDED", contribution.units, "#fff"],
          ["EST. PROFIT", "+" + fmt(contribution.profit), "#4ade80"],
        ].map(([l, v, c]) => (
          <div key={l} style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "16px 14px", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 5px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.07em" }}>{l}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: c, fontFamily: "Georgia,serif" }}>{v}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", margin: "0 0 28px", textAlign: "center" }}>
        {pool.route}<br />ETA {pool.estimatedDelivery}
      </p>

      <button
        onClick={onDone}
        style={{
          width: "100%", maxWidth: 340, padding: "15px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          paddingBottom: "calc(15px + env(safe-area-inset-bottom,0px))",
        }}
      >Back to pools</button>

      <style>{`@keyframes cp-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── FIELD + INPUT HELPERS ────────────────────────────────────────────────────

function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <label style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
          {label}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", inputMode, maxLength, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "13px 14px",
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${focused ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10, color: "#fff", fontSize: 14,
        fontFamily: "inherit", outline: "none",
        transition: "border-color 0.15s",
        boxShadow: focused ? "0 0 0 3px rgba(79,70,229,0.12)" : "none",
        WebkitAppearance: "none",
      }}
      {...rest}
    />
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CapitalPooling({ spreads = [], onBack }) {
    const { id: preselectedItemId } = useParams();

  // Merge live spread pricing into pool defaults
  const pools = POOL_DEFAULTS.map(pool => {
    const live = spreads.find(s => s.id === pool.itemId);
    if (!live) return pool;
    return {
      ...pool,
      profitPerUnit: live.profit  ?? pool.profitPerUnit,
      unitCost:      live.usSpot  ?? pool.unitCost,
    };
  });

  const [activePool,      setActivePool]      = useState(null);
  const [checkoutPool,    setCheckoutPool]    = useState(null);
  const [contribution,    setContribution]    = useState(null);
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [myContributions, setMyContributions] = useState([]);

  // Open preselected pool on mount
  useEffect(() => {
    if (preselectedItemId) {
      const found = pools.find(p => p.itemId === preselectedItemId && p.status === "open");
      if (found) setActivePool(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedItemId]);

  const filtered = pools.filter(p =>
    filterStatus === "all" ? true : p.status === filterStatus
  );

  const openCount = pools.filter(p => p.status === "open").length;

  const handleBuyShare = () => {
    if (activePool && activePool.status !== "full") {
      setCheckoutPool(activePool);
    }
  };

  const handleSuccess = (contrib) => {
    setContribution({ ...contrib, pool: activePool });
    setCheckoutPool(null);
    setMyContributions(prev => [
      { ...contrib, poolName: activePool.itemName, time: "just now" },
      ...prev,
    ]);
  };

  const handleDone = () => {
    setContribution(null);
    setActivePool(null);
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0d1a",
      fontFamily: "'Sora', system-ui, sans-serif",
      color: "#fff",
    }}>
      <style>{CSS}</style>

      {/* ── Top nav ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,13,26,0.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 16px",
        paddingTop: "env(safe-area-inset-top, 0px)",
        height: "calc(52px + env(safe-area-inset-top, 0px))",
        display: "flex", alignItems: "flex-end", paddingBottom: "0",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", height: 52,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && (
              <button onClick={onBack} style={{
                background: "rgba(255,255,255,0.07)", border: "none",
                borderRadius: 8, padding: "7px 12px",
                color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>← Back</button>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Capital Pools</p>
              <p style={{ margin: 0, fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                COMAS NETWORK
              </p>
            </div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700,
            background: "rgba(74,222,128,0.1)", color: "#4ade80",
            border: "1px solid rgba(74,222,128,0.25)",
            borderRadius: 20, padding: "4px 10px", fontFamily: "monospace",
          }}>● {openCount} OPEN</span>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{
        display: "flex", gap: 6, padding: "14px 16px 10px",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {["all", "open", "full"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "7px 16px", borderRadius: 20, flexShrink: 0,
              border: `1px solid ${filterStatus === s ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"}`,
              background: filterStatus === s ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.04)",
              color: filterStatus === s ? "#fff" : "rgba(255,255,255,0.45)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", textTransform: "capitalize",
              transition: "all 0.15s",
            }}
          >{s === "all" ? `All (${pools.length})` : s === "open" ? `Open (${openCount})` : `Full (${pools.length - openCount})`}</button>
        ))}
      </div>

      {/* ── Pool list ── */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(pool => (
          <PoolCard key={pool.id} pool={pool} onPress={setActivePool} />
        ))}
      </div>

      {/* ── My contributions ── */}
      {myContributions.length > 0 && (
        <div style={{ padding: "24px 16px 16px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.07em" }}>
            MY CONTRIBUTIONS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myContributions.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "12px 14px",
              }}>
                <Avatar label={c.name.slice(0, 2).toUpperCase()} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.poolName}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{c.time} · via {c.method}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#818cf8", fontFamily: "Georgia,serif" }}>${c.total}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#4ade80", fontFamily: "monospace" }}>+{fmt(c.profit)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding for safe area */}
      <div style={{ height: "calc(32px + env(safe-area-inset-bottom, 0px))" }} />

      {/* ── Bottom sheet (detail) ── */}
      {activePool && !checkoutPool && !contribution && (
        <BottomSheet
          pool={activePool}
          onClose={() => setActivePool(null)}
          onBuyShare={handleBuyShare}
        />
      )}

      {/* ── Checkout modal ── */}
      {checkoutPool && !contribution && (
        <CheckoutModal
          pool={checkoutPool}
          onClose={() => setCheckoutPool(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* ── Success screen ── */}
      {contribution && (
        <SuccessScreen
          contribution={contribution}
          pool={contribution.pool}
          onDone={handleDone}
        />
      )}
    </div>
  );
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  ::placeholder { color: rgba(255,255,255,0.22); }
  button { -webkit-tap-highlight-color: transparent; }
`;