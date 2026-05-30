import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import Landing        from "./components/pages/landing-page";
import Dashboard      from "./components/pages/dashboard";
import ItemDetail     from "./components/pages/item-list";
import CapitalPooling from "./components/pages/community";
import { useSpreadData } from "./assets/shared_data_pool";

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function GlobalSearchBar({ onSearch, loading, dataSource }) {
  const [query, setQuery]     = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef              = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const statusLabel =
    dataSource === "loading"  ? "searching…"
    : dataSource === "live"   ? "live"
    : dataSource === "fallback"? "demo data"
    : "";

  return (
    <form onSubmit={handleSubmit} style={styles.searchForm}>
      <div style={{ ...styles.searchWrap, ...(focused ? styles.searchWrapFocused : {}) }}>
        <span style={styles.searchIcon}>{loading ? <Spinner size={14} /> : "⌕"}</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder='Search deals — e.g. "workboots", "roses bulk"'
          style={styles.searchInput}
          disabled={loading}
          aria-label="Search arbitrage deals"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} style={styles.clearBtn}>×</button>
        )}
        <button
          type="submit"
          style={{ ...styles.searchSubmit, ...(loading ? styles.searchSubmitDisabled : {}) }}
          disabled={loading || !query.trim()}
        >Search</button>
      </div>
      {statusLabel && (
        <span style={{
          ...styles.statusPill,
          background: dataSource === "live" ? "#00c37420" : "#ffb30020",
          color:      dataSource === "live" ? "#00c374"   : "#ffb300",
        }}>● {statusLabel}</span>
      )}
      <kbd style={styles.shortcut}>⌘K</kbd>
    </form>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ animation: "comas-spin 0.8s linear infinite", display: "block" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
        fill="none" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

// ─── DATA NORMALIZER ──────────────────────────────────────────────────────────
export function normalizeDeal(raw = {}) {
  const usSpot       = Number(raw.usSpot  ?? raw.price ?? 0);
  const keSpot       = Number(raw.keSpot  ?? usSpot * 4.5);
  const freightCost  = Number(raw.freightCost  ?? usSpot * 0.13);
  const tariffRate   = Number(raw.tariffRate   ?? 0.25);
  const clearingFees = Number(raw.clearingFees ?? usSpot * 0.08);
  const profit       = Number(raw.profit ?? keSpot - usSpot - freightCost - (usSpot * tariffRate) - clearingFees);

  return {
    id:          raw.id    ?? `deal-${Math.random().toString(36).slice(2)}`,
    name:        raw.name  ?? "Unknown Item",
    category:    raw.category ?? "General Merchandise",
    icon:        raw.icon  ?? "📦",
    usSpot, keSpot, profit, price: usSpot,
    prices: Array.isArray(raw.prices) && raw.prices.length === 7
      ? raw.prices.map(Number)
      : Array.from({ length: 7 }, (_, i) => {
          const base = Math.max(profit * 0.85, 0);
          return Math.round((base + (profit - base) * (i / 6)) * 100) / 100;
        }),
    freightCost, tariffRate, clearingFees,
    confidence:  Number(raw.confidence ?? 75),
    expiry:      raw.expiry  ?? "N/A",
    volume:      raw.volume  ?? "N/A",
    moq:         raw.moq     ?? "N/A",
    route:       raw.route   ?? "Newark → Mombasa → Nairobi",
    change_in_price_from_last_month: raw.change_in_price_from_last_month ?? "N/A",
    arbitrage_opportunity: raw.arbitrage_opportunity ?? "",
    news:        Array.isArray(raw.news) ? raw.news : [],
    source_url:  raw.source_url ?? null,
  };
}

// ─── ERROR BANNER ─────────────────────────────────────────────────────────────
function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div style={styles.errorBanner} role="alert">
      <span>⚠ {error}</span>
      <button onClick={onDismiss} style={styles.errorDismiss}>×</button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { spreads: rawSpreads = [], dataSource, loading, summary, error, reload, search } = useSpreadData();
  const spreads = (rawSpreads ?? []).map(normalizeDeal);

  const navigate  = useNavigate();
  const location  = useLocation();

  const [dismissedError, setDismissedError] = useState(null);
  const visibleError = error && error !== dismissedError ? error : null;

  // Navigation helpers
  const goToDashboard = () => navigate("/dashboard");
  const goToLanding   = () => navigate("/");
  const goToDetail    = (item) => navigate(`/detail/${item?.id ?? item}`);
  const goToPool      = (item) => {
    const id = item?.id ?? item?.itemId ?? null;
    navigate(id ? `/pool/${id}` : "/pool");
  };

  // Search navigates to dashboard to show results
  const handleSearch = useCallback(async (query) => {
    await search(query);
    if (location.pathname !== "/dashboard") navigate("/dashboard");
  }, [search, location.pathname, navigate]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const sharedProps    = { spreads, dataSource, loading, summary };
  const searchBarProps = { onSearch: handleSearch, loading, dataSource };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <ErrorBanner error={visibleError} onDismiss={() => setDismissedError(error)} />

      <Routes>
        <Route path="/" element={
          <Landing
            {...sharedProps}
            onItemClick={goToDetail}
            onDashboardClick={goToDashboard}
            onSearch={handleSearch}
            searchBar={<GlobalSearchBar {...searchBarProps} />}
          />
        } />

        <Route path="/dashboard" element={
          <Dashboard
            {...sharedProps}
            onRefresh={reload}
            onItemClick={goToDetail}
            onBack={goToLanding}
            searchBar={<GlobalSearchBar {...searchBarProps} />}
          />
        } />

        <Route path="/detail/:id" element={
          <ItemDetail
            spreads={spreads}
            loading={loading}
            onBack={() => navigate(-1)}
            onPoolClick={goToPool}
            onDashboardClick={goToDashboard}
          />
        } />

        <Route path="/pool/:id" element={
          <CapitalPooling
            spreads={spreads}
            loading={loading}
            onBack={() => navigate(-1)}
          />
        } />

        {/* Catch-all */}
        <Route path="*" element={<Landing {...sharedProps} onItemClick={goToDetail} onDashboardClick={goToDashboard} onSearch={handleSearch} />} />
      </Routes>
    </>
  );
}

const GLOBAL_STYLES = `
  @keyframes comas-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes comas-slidein {
    from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #0a0e17;
    color: #e8edf5;
    font-family: 'DM Sans', 'Sora', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  ::placeholder { color: rgba(255,255,255,0.28); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
`;

const styles = {
  searchForm: {
    display: "flex", alignItems: "center", gap: "8px",
    width: "100%", maxWidth: "640px", position: "relative",
  },
  searchWrap: {
    display: "flex", alignItems: "center", flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", padding: "0 4px 0 12px",
    gap: "8px", transition: "border-color 0.15s, box-shadow 0.15s",
  },
  searchWrapFocused: {
    borderColor: "rgba(0,195,116,0.6)",
    boxShadow: "0 0 0 3px rgba(0,195,116,0.12)",
  },
  searchIcon: {
    fontSize: "18px", color: "rgba(255,255,255,0.4)",
    flexShrink: 0, lineHeight: 1, userSelect: "none",
  },
  searchInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#fff", fontSize: "14px", fontFamily: "inherit",
    padding: "11px 0", minWidth: 0, letterSpacing: "0.01em",
  },
  clearBtn: {
    background: "transparent", border: "none",
    color: "rgba(255,255,255,0.4)", cursor: "pointer",
    fontSize: "18px", lineHeight: 1, padding: "4px", flexShrink: 0,
  },
  searchSubmit: {
    background: "#00c374", border: "none", borderRadius: "7px",
    color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: "700",
    letterSpacing: "0.02em", padding: "8px 16px", flexShrink: 0,
    transition: "opacity 0.15s, transform 0.1s", fontFamily: "inherit",
  },
  searchSubmitDisabled: { opacity: 0.4, cursor: "not-allowed" },
  statusPill: {
    fontSize: "11px", fontWeight: "600", letterSpacing: "0.04em",
    padding: "3px 8px", borderRadius: "20px", whiteSpace: "nowrap",
    flexShrink: 0, fontFamily: "monospace",
  },
  shortcut: {
    fontSize: "11px", color: "rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px", padding: "2px 5px",
    flexShrink: 0, fontFamily: "monospace", userSelect: "none",
  },
  errorBanner: {
    position: "fixed", top: "12px", left: "50%",
    transform: "translateX(-50%)", zIndex: 9999,
    background: "#1a0a00", border: "1px solid #ff6b2b",
    borderRadius: "10px", color: "#ff9c6e", fontSize: "13px",
    fontWeight: "500", padding: "10px 16px",
    display: "flex", alignItems: "center", gap: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    maxWidth: "480px", width: "calc(100vw - 32px)",
    animation: "comas-slidein 0.2s ease",
  },
  errorDismiss: {
    background: "transparent", border: "none", color: "#ff6b2b",
    cursor: "pointer", fontSize: "18px", lineHeight: 1,
    padding: 0, marginLeft: "auto", flexShrink: 0,
  },
};