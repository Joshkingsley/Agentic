import { useState } from "react";

// ─── POOL DEFAULTS ────────────────────────────────────────────────────────────
// Rich fields (traders, route, description) live here.
// Live spread data patches: profitPerUnit, unitCost from spreads prop.

export const POOL_DEFAULTS = [
  {
    id: "pool-fw1", itemId: "fw-1", itemName: "Industrial Utility Workboots",
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80",
    buyCountry: "US", sellCountry: "KE", buyFlag: "🇺🇸", sellFlag: "🇰🇪",
    target: 18000, raised: 13400, profitPerUnit: 250, unitCost: 45,
    moq: 100, status: "open",
    route: "Newark → Mombasa → Nairobi", estimatedDelivery: "45–60 days",
    description: "Wholesale liquidation lot of steel-toe workboots. Strong demand in construction sector across Nairobi and Mombasa. EAC tariff at 25% already factored into spread.",
    traders: [
      { name: "Amina K.", avatar: "AK", amount: 2500, joined: "2 days ago", location: "Nairobi" },
      { name: "James O.", avatar: "JO", amount: 1800, joined: "3 days ago", location: "Mombasa" },
      { name: "Fatuma H.", avatar: "FH", amount: 3200, joined: "5 days ago", location: "Eldoret" },
      { name: "Moses N.", avatar: "MN", amount: 1900, joined: "6 days ago", location: "Kisumu" },
      { name: "Sarah W.", avatar: "SW", amount: 4000, joined: "1 week ago", location: "Nairobi" },
    ],
  },
  {
    id: "pool-fl1", itemId: "fl-1", itemName: "Premium Long-Stem Roses",
    category: "Flowers",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80",
    buyCountry: "KE", sellCountry: "US", buyFlag: "🇰🇪", sellFlag: "🇺🇸",
    target: 28000, raised: 28000, profitPerUnit: 0.92, unitCost: 0.28,
    moq: 5000, status: "full",
    route: "JKIA → Amsterdam → JFK Air Cargo", estimatedDelivery: "3–5 days (air)",
    description: "Highland-grown Grade A roses. KEPHIS-certified. Direct air cargo via Amsterdam. Pool closed — next cycle opens 3/11.",
    traders: [
      { name: "Green Valley Coop", avatar: "GV", amount: 8000, joined: "1 day ago", location: "Kirinyaga" },
      { name: "Blossom Exports Ltd", avatar: "BE", amount: 12000, joined: "2 days ago", location: "Naivasha" },
      { name: "Lena M.", avatar: "LM", amount: 5000, joined: "3 days ago", location: "Nairobi" },
      { name: "Peter K.", avatar: "PK", amount: 3000, joined: "4 days ago", location: "Thika" },
    ],
  },
  {
    id: "pool-tx1", itemId: "tx-1", itemName: "Raw Indigo Denim Rolls 14oz",
    category: "Textiles",
    image: "https://images.unsplash.com/photo-1582485565167-75055e2e6b5a?auto=format&fit=crop&w=400&q=80",
    buyCountry: "US", sellCountry: "KE", buyFlag: "🇺🇸", sellFlag: "🇰🇪",
    target: 45000, raised: 22800, profitPerUnit: 593, unitCost: 150,
    moq: 20, status: "open",
    route: "Newark → Mombasa → Industrial Area Nairobi", estimatedDelivery: "55–70 days",
    description: "14oz selvedge denim rolls from US liquidation inventory. Significant spread to Nairobi industrial buyers and fashion labels. 22% EAC tariff applies.",
    traders: [
      { name: "Textile Hub EA", avatar: "TH", amount: 9000, joined: "4 hours ago", location: "Nairobi" },
      { name: "David C.", avatar: "DC", amount: 6800, joined: "1 day ago", location: "Kampala" },
      { name: "Halima I.", avatar: "HI", amount: 7000, joined: "2 days ago", location: "Nairobi" },
    ],
  },
  {
    id: "pool-el1", itemId: "el-1", itemName: "Solid State Storage Blocks",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1597872200919-276ef3c67521?auto=format&fit=crop&w=400&q=80",
    buyCountry: "US", sellCountry: "KE", buyFlag: "🇺🇸", sellFlag: "🇰🇪",
    target: 22000, raised: 16800, profitPerUnit: 395, unitCost: 110,
    moq: 30, status: "open",
    route: "Silicon Valley → JKIA → Kilimani Warehouse", estimatedDelivery: "30–45 days",
    description: "Enterprise-grade SSD storage in demand across Nairobi tech sector. 10% tariff — lowest in portfolio. Excellent ROI at ~260%.",
    traders: [
      { name: "Nairobi Tech Hub", avatar: "NT", amount: 7200, joined: "6 hours ago", location: "Nairobi" },
      { name: "Edwin O.", avatar: "EO", amount: 4600, joined: "1 day ago", location: "Nakuru" },
      { name: "Zawadi L.", avatar: "ZL", amount: 5000, joined: "2 days ago", location: "Mombasa" },
    ],
  },
];

const NEWS = [
  { headline: "Mombasa clearance times drop below 36 hours — fastest in 3 years.", source: "EA Logistics Hub", impact: "Positive", time: "12m" },
  { headline: "KRA waives surcharge on footwear imports for Q2 2026.", source: "KRA Gazette", impact: "Positive", time: "1h" },
  { headline: "US denim surplus widens — liquidation prices falling another 8%.", source: "Textile Sourcing Monitor", impact: "Positive", time: "2h" },
  { headline: "JKIA cold room capacity expanded ahead of peak export season.", source: "KAA Airport Authority", impact: "Positive", time: "3h" },
  { headline: "Fuel surcharge on sea freight routes up 4% this week.", source: "Freightos Index", impact: "Neutral", time: "4h" },
  { headline: "Enterprise SSD demand in Nairobi surges 20% Q1 2026.", source: "Silicon Africa Review", impact: "Positive", time: "6h" },
];

const PROMOS = { COMAS20: 20, TRADE10: 10, POOL15: 15, LAUNCH5: 5 };

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function pct(raised, target) { return Math.min(100, Math.round((raised / target) * 100)); }

const AVATAR_COLORS = ["#534AB7", "#1D9E75", "#D85A30", "#378ADD", "#D4537E", "#BA7517"];

function Avatar({ label, size = 32 }) {
  const bg = AVATAR_COLORS[label.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: "#fff", fontFamily: "var(--cp-sans)",
    }}>{label}</div>
  );
}

function ImpactTag({ impact }) {
  const s = impact === "Positive" ? { bg: "#f0fdf4", color: "#16a34a" }
    : impact === "Negative" ? { bg: "#fff5f5", color: "#dc2626" }
    : { bg: "#fffbeb", color: "#92400e" };
  return (
    <span style={{ fontSize: 9, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 10, fontFamily: "monospace", fontWeight: 700 }}>
      {impact.toUpperCase()}
    </span>
  );
}

// ─── POOL CARD ────────────────────────────────────────────────────────────────

function PoolCard({ pool, active, onClick }) {
  const p = pct(pool.raised, pool.target);
  const full = pool.status === "full";
  return (
    <div
      onClick={() => !full && onClick(pool)}
      style={{
        background: "#fff",
        border: `1.5px solid ${active ? "#534AB7" : "#e8e5f4"}`,
        borderRadius: 14, overflow: "hidden",
        cursor: full ? "default" : "pointer",
        transition: "border-color .18s, box-shadow .18s",
        boxShadow: active ? "0 0 0 3px rgba(83,74,183,.1)" : "0 1px 4px rgba(83,74,183,.06)",
        opacity: full ? 0.72 : 1,
      }}
    >
      <div style={{ position: "relative", height: 108, overflow: "hidden" }}>
        <img src={pool.image} alt={pool.itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700,
            background: full ? "#fffbeb" : "#f0fdf4",
            color: full ? "#92400e" : "#16a34a",
            border: `1px solid ${full ? "#fde68a" : "#86efac"}`,
            borderRadius: 20, padding: "3px 8px", fontFamily: "monospace",
          }}>
            {full ? "POOL FULL" : "OPEN"}
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(255,255,255,.93)", borderRadius: 20, padding: "3px 10px", fontSize: 9, fontFamily: "monospace", color: "#534AB7", fontWeight: 700 }}>
          {pool.buyFlag} {pool.buyCountry} → {pool.sellFlag} {pool.sellCountry}
        </div>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#1a1730", margin: "0 0 2px", fontFamily: "var(--cp-sans)", lineHeight: 1.3 }}>{pool.itemName}</p>
        <p style={{ fontSize: 10, color: "#9993be", margin: "0 0 10px", fontFamily: "monospace" }}>{pool.category} · {pool.traders.length} traders</p>
        <div style={{ height: 5, background: "#ede9f8", borderRadius: 3, marginBottom: 7, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${p}%`, background: full ? "#BA7517" : "#534AB7", borderRadius: 3, transition: "width .4s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "monospace", color: "#9993be" }}>
          <span>${pool.raised.toLocaleString()} raised</span>
          <span>{p}% · ${pool.target.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── CONTRIBUTE FORM ──────────────────────────────────────────────────────────

const S = {
  lbl: { fontSize: 10, fontFamily: "monospace", color: "#9993be", display: "block", marginBottom: 5, letterSpacing: ".05em" },
  inp: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e8e5f4", fontSize: 13, fontFamily: "var(--cp-sans)", outline: "none", background: "#fff", color: "#1a1730" },
};

function ContributeForm({ pool, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");
  const [payDetail, setPayDetail] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const num = parseFloat(amount) || 0;
  const fee = num * 0.015 * (1 - discount / 100);
  const total = num + fee;
  const units = num ? Math.floor(num / pool.unitCost) : 0;
  const profit = units * pool.profitPerUnit;

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (PROMOS[code]) { setDiscount(PROMOS[code]); setPromoMsg(`✓ ${PROMOS[code]}% off platform fee.`); }
    else { setDiscount(0); setPromoMsg("Invalid code."); }
  };

  const submit = () => {
    if (!name) { setMsg("Please enter your name."); return; }
    if (num < 100) { setMsg("Minimum contribution is $100."); return; }
    if (!agreed) { setMsg("Please accept the terms."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess?.({ name, amount: num, total: total.toFixed(2), method: payMethod, discount, units, profit });
    }, 1400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Pool summary */}
      <div style={{ background: "#f8f7fc", border: "1px solid #e8e5f4", borderRadius: 12, padding: "12px 14px" }}>
        <p style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", marginBottom: 4 }}>CONTRIBUTING TO</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1730", margin: "0 0 2px", fontFamily: "var(--cp-sans)" }}>{pool.itemName}</p>
        <p style={{ fontSize: 11, color: "#9993be", fontFamily: "monospace", margin: 0 }}>
          {pool.buyFlag} {pool.buyCountry} → {pool.sellFlag} {pool.sellCountry} · ${pool.profitPerUnit}/unit profit
        </p>
      </div>

      <div><label style={S.lbl}>Your name</label><input type="text" placeholder="e.g. Amina Kinyua" value={name} onChange={e => setName(e.target.value)} style={S.inp} /></div>

      <div>
        <label style={S.lbl}>Amount (USD)</label>
        <input type="number" placeholder="Min $100" min="100" value={amount} onChange={e => setAmount(e.target.value)} style={S.inp} />
        {num >= 100 && (
          <div style={{ marginTop: 8, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 20 }}>
            <div><p style={{ fontSize: 9, fontFamily: "monospace", color: "#16a34a", margin: "0 0 2px" }}>UNITS</p><p style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", margin: 0, fontFamily: "Georgia, serif" }}>{units}</p></div>
            <div><p style={{ fontSize: 9, fontFamily: "monospace", color: "#16a34a", margin: "0 0 2px" }}>EST. PROFIT</p><p style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", margin: 0, fontFamily: "Georgia, serif" }}>+${profit.toLocaleString()}</p></div>
          </div>
        )}
      </div>

      <div>
        <label style={S.lbl}>Promo code</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" placeholder="e.g. COMAS20" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} style={{ ...S.inp, flex: 1 }} />
          <button onClick={applyPromo} style={{ padding: "0 14px", background: "#fff", border: "1.5px solid #e8e5f4", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#534AB7", fontFamily: "var(--cp-sans)", whiteSpace: "nowrap" }}>Apply</button>
        </div>
        {promoMsg && <p style={{ fontSize: 11, color: promoMsg.startsWith("✓") ? "#16a34a" : "#dc2626", margin: "5px 0 0", fontFamily: "monospace" }}>{promoMsg}</p>}
      </div>

      <div>
        <label style={S.lbl}>Payment method</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {["mpesa", "card", "bank"].map(m => (
            <button key={m} onClick={() => setPayMethod(m)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8,
              border: `1.5px solid ${payMethod === m ? "#534AB7" : "#e8e5f4"}`,
              background: payMethod === m ? "#534AB7" : "#fff",
              color: payMethod === m ? "#fff" : "#534AB7",
              fontSize: 11, fontWeight: 600, fontFamily: "var(--cp-sans)",
            }}>{m === "mpesa" ? "M-Pesa" : m === "card" ? "Card" : "Bank wire"}</button>
          ))}
        </div>
        {payMethod === "mpesa" && (
          <div><label style={S.lbl}>M-Pesa number</label><input type="tel" placeholder="+254 7XX XXX XXX" value={payDetail} onChange={e => setPayDetail(e.target.value)} style={S.inp} /></div>
        )}
        {payMethod === "card" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div><label style={S.lbl}>Card number</label><input type="text" placeholder="•••• •••• •••• ••••" maxLength={19} value={cardNum} onChange={e => setCardNum(e.target.value)} style={S.inp} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={S.lbl}>Expiry</label><input type="text" placeholder="MM / YY" value={cardExp} onChange={e => setCardExp(e.target.value)} style={S.inp} /></div>
              <div><label style={S.lbl}>CVV</label><input type="text" placeholder="•••" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value)} style={S.inp} /></div>
            </div>
          </div>
        )}
        {payMethod === "bank" && (
          <div style={{ background: "#f8f7fc", border: "1px solid #e8e5f4", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#4e4a7a", lineHeight: 1.9 }}>
            <strong>COMAS Trade Ltd</strong><br />
            Account: 1234567890 · Equity Bank Kenya<br />
            Swift: EQBLKENA<br />
            Ref: <span style={{ fontFamily: "monospace", color: "#534AB7" }}>POOL-{pool.id.toUpperCase()}</span>
          </div>
        )}
      </div>

      {num >= 100 && (
        <div style={{ background: "#f8f7fc", border: "1px solid #e8e5f4", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", marginBottom: 8 }}>PAYMENT SUMMARY</p>
          {[["Contribution", `$${num.toFixed(2)}`], [`Platform fee (1.5%${discount ? ` −${discount}%` : ""})`, `$${fee.toFixed(2)}`]].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #ede9f8", fontSize: 12 }}>
              <span style={{ color: "#6b668f" }}>{l}</span>
              <span style={{ fontWeight: 600, color: "#1a1730", fontFamily: "Georgia, serif" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: "#1a1730" }}>Total charged</span>
            <span style={{ fontWeight: 700, color: "#534AB7", fontFamily: "Georgia, serif" }}>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <input type="checkbox" id="cp-terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, flexShrink: 0, accentColor: "#534AB7" }} />
        <label htmlFor="cp-terms" style={{ fontSize: 11, color: "#9993be", lineHeight: 1.6, cursor: "pointer" }}>
          I understand this is a pooled commercial trade. Returns are projected, not guaranteed.
        </label>
      </div>

      {msg && <p style={{ fontSize: 12, color: "#dc2626", fontFamily: "monospace", margin: 0 }}>{msg}</p>}

      <button onClick={submit} disabled={loading} style={{
        width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
        background: loading ? "#c4bef5" : "#534AB7", color: "#fff",
        fontSize: 14, fontWeight: 700, fontFamily: "var(--cp-sans)", cursor: loading ? "default" : "pointer",
      }}>
        {loading ? "Processing..." : `Confirm — $${total.toFixed(2)} →`}
      </button>
    </div>
  );
}

// ─── SUCCESS BANNER ───────────────────────────────────────────────────────────

function SuccessBanner({ contribution, pool, onClose }) {
  return (
    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "24px", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#15803d", margin: "0 0 6px" }}>Contribution confirmed</h3>
      <p style={{ fontSize: 12, color: "#16a34a", margin: "0 0 16px", fontFamily: "monospace" }}>{contribution.name} · ${contribution.total} via {contribution.method}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["UNITS FUNDED", contribution.units], ["EST. PROFIT", `+$${contribution.profit.toLocaleString()}`]].map(([l, v]) => (
          <div key={l} style={{ background: "#fff", border: "1px solid #86efac", borderRadius: 10, padding: "12px" }}>
            <p style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", margin: "0 0 4px" }}>{l}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#15803d", margin: 0, fontFamily: "Georgia, serif" }}>{v}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#9993be", fontFamily: "monospace", margin: "0 0 16px" }}>{pool.route} · ETA {pool.estimatedDelivery}</p>
      <button onClick={onClose} style={{ padding: "10px 24px", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "var(--cp-sans)", cursor: "pointer" }}>
        Back to pools
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CapitalPooling({ preselectedItemId, spreads = [], onBack }) {
  // Merge live spread pricing into pool defaults
  const pools = POOL_DEFAULTS.map(pool => {
    const live = spreads.find(s => s.id === pool.itemId);
    if (!live) return pool;
    return {
      ...pool,
      profitPerUnit: live.profit ?? pool.profitPerUnit,
      unitCost: live.usSpot ?? pool.unitCost,
      // optionally bump target/raised proportionally if live pricing drifts >10%
    };
  });

  const defaultPool = pools.find(p => p.itemId === preselectedItemId && p.status === "open")
    || pools.find(p => p.status === "open");

  const [activePool, setActivePool] = useState(defaultPool);
  const [contribution, setContribution] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [myContributions, setMyContributions] = useState([]);

  const filtered = pools.filter(p =>
    filterStatus === "all" ? true : p.status === filterStatus
  );

  const handleSuccess = (contrib) => {
    setContribution(contrib);
    setMyContributions(prev => [{ ...contrib, pool: activePool.itemName, time: "just now" }, ...prev]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--cp-sans)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        :root { --cp-sans: 'DM Sans', sans-serif; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus { outline: none; border-color: #534AB7 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f8f7fc; }
        ::-webkit-scrollbar-thumb { background: #c4bef5; border-radius: 2px; }
      `}</style>

      {/* Topbar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8e5f4", padding: "0 32px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <>
              <button onClick={onBack} style={{ background: "none", border: "1px solid #e8e5f4", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#534AB7", fontFamily: "var(--cp-sans)", fontWeight: 600, cursor: "pointer" }}>
                ← Back
              </button>
              <div style={{ width: 1, height: 18, background: "#e8e5f4" }} />
            </>
          )}
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg, #3b0764, #534AB7)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>CM</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#1a1730", margin: 0 }}>COMAS</p>
            <p style={{ fontSize: 9, color: "#9993be", fontFamily: "monospace", margin: 0, letterSpacing: ".04em" }}>CAPITAL POOLING NETWORK</p>
          </div>
        </div>
        <span style={{ fontSize: 9, background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 20, padding: "3px 10px", fontFamily: "monospace", fontWeight: 700 }}>
          ● {pools.filter(p => p.status === "open").length} POOLS OPEN
        </span>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px 300px", gap: 24, alignItems: "flex-start" }}>

          {/* LEFT — Pool list + my contributions */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1a1730", margin: "0 0 3px" }}>Active trade pools</h2>
                <p style={{ fontSize: 11, color: "#9993be", fontFamily: "monospace", margin: 0 }}>Select a pool to contribute capital</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "open", "full"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: "5px 12px", borderRadius: 20,
                    border: `1px solid ${filterStatus === s ? "#534AB7" : "#e8e5f4"}`,
                    background: filterStatus === s ? "#534AB7" : "#fff",
                    color: filterStatus === s ? "#fff" : "#534AB7",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--cp-sans)", textTransform: "capitalize",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {filtered.map(pool => (
                <PoolCard key={pool.id} pool={pool} active={activePool?.id === pool.id} onClick={setActivePool} />
              ))}
            </div>

            {myContributions.length > 0 && (
              <div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#1a1730", margin: "0 0 12px" }}>My contributions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {myContributions.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f7fc", border: "1px solid #e8e5f4", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar label={c.name.slice(0, 2).toUpperCase()} size={32} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1730", margin: 0 }}>{c.pool}</p>
                          <p style={{ fontSize: 10, color: "#9993be", fontFamily: "monospace", margin: 0 }}>{c.time} · via {c.method}{c.discount ? ` · ${c.discount}% promo` : ""}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#534AB7", margin: 0, fontFamily: "Georgia, serif" }}>${c.total}</p>
                        <p style={{ fontSize: 10, color: "#16a34a", fontFamily: "monospace", margin: 0 }}>+${c.profit.toLocaleString()} est.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTRE — Detail + form */}
          <div style={{ position: "sticky", top: 62 }}>
            {activePool ? (
              <div style={{ background: "#fff", border: "1.5px solid #e8e5f4", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(83,74,183,.07)" }}>
                {/* Pool header */}
                <div style={{ padding: "16px 18px", borderBottom: "1px solid #e8e5f4" }}>
                  <p style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", marginBottom: 4 }}>POOL DETAIL</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1730", margin: "0 0 3px" }}>{activePool.itemName}</p>
                  <p style={{ fontSize: 11, color: "#9993be", fontFamily: "monospace", margin: "0 0 10px" }}>{activePool.route}</p>
                  <p style={{ fontSize: 12, color: "#4e4a7a", lineHeight: 1.65, margin: "0 0 12px" }}>{activePool.description}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[["Profit/unit", `$${activePool.profitPerUnit}`], ["MOQ", `${activePool.moq}`], ["ETA", activePool.estimatedDelivery.split(" ")[0]]].map(([l, v]) => (
                      <div key={l} style={{ background: "#f8f7fc", border: "1px solid #e8e5f4", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                        <p style={{ fontSize: 9, fontFamily: "monospace", color: "#9993be", margin: "0 0 3px" }}>{l}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1730", margin: 0, fontFamily: "Georgia, serif" }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {/* Progress */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 10, fontFamily: "monospace", color: "#9993be" }}>
                      <span>{pct(activePool.raised, activePool.target)}% funded</span>
                      <span>${activePool.raised.toLocaleString()} of ${activePool.target.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: "#ede9f8", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct(activePool.raised, activePool.target)}%`, background: "#534AB7", borderRadius: 3 }} />
                    </div>
                  </div>
                  {/* Trader avatars */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {activePool.traders.slice(0, 5).map((t, i) => (
                      <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, border: "2px solid #fff", borderRadius: "50%" }}>
                        <Avatar label={t.avatar} size={26} />
                      </div>
                    ))}
                    <span style={{ fontSize: 11, color: "#9993be", marginLeft: 10, fontFamily: "monospace" }}>
                      {activePool.traders.length} traders
                    </span>
                  </div>
                </div>

                <div style={{ padding: "16px 18px" }}>
                  {contribution ? (
                    <SuccessBanner contribution={contribution} pool={activePool} onClose={() => setContribution(null)} />
                  ) : activePool.status === "full" ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <p style={{ fontSize: 22 }}>🔒</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1730", fontFamily: "Georgia, serif" }}>This pool is full</p>
                      <p style={{ fontSize: 12, color: "#9993be", fontFamily: "monospace" }}>Next cycle opens {activePool.expiry || "soon"}</p>
                    </div>
                  ) : (
                    <ContributeForm pool={activePool} onSuccess={handleSuccess} />
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9993be", fontFamily: "monospace", fontSize: 12 }}>
                Select a pool to contribute
              </div>
            )}
          </div>

          {/* RIGHT — Traders + news */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activePool && (
              <div style={{ background: "#fff", border: "1px solid #e8e5f4", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "11px 14px", borderBottom: "1px solid #f0eef8" }}>
                  <p style={{ fontSize: 10, fontFamily: "monospace", color: "#9993be", margin: 0, letterSpacing: ".05em" }}>TRADERS IN THIS POOL</p>
                </div>
                <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {activePool.traders.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar label={t.avatar} size={32} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1730", margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: 10, color: "#9993be", fontFamily: "monospace", margin: 0 }}>{t.location} · {t.joined}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#534AB7", margin: 0, fontFamily: "Georgia, serif" }}>${t.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#fff", border: "1px solid #e8e5f4", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid #f0eef8", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                <p style={{ fontSize: 10, fontFamily: "monospace", color: "#9993be", margin: 0, letterSpacing: ".05em" }}>LIVE MARKET SIGNALS</p>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 340, overflowY: "auto" }}>
                {NEWS.map((n, i) => (
                  <div key={i} style={{ paddingBottom: 12, borderBottom: i < NEWS.length - 1 ? "1px solid #f0eef8" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#9993be", fontFamily: "monospace" }}>{n.source}</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 9, color: "#c4bef5", fontFamily: "monospace" }}>{n.time} ago</span>
                        <ImpactTag impact={n.impact} />
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#4e4a7a", lineHeight: 1.55 }}>{n.headline}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}