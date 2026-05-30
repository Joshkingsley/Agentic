// App.jsx
import { useState } from "react";
import Landing from "./components/pages/landing-page";        // renamed from your App.jsx (doc 2)
import Dashboard from "./components/pages/dashboard";    // your doc 3 App export
import ItemDetail from "./components/pages/item-list";  // doc 1
import CapitalPooling from "./components/pages/community"; // doc 5
import { useSpreadData } from "./assets/shared_data_pool"; // shared hook (see below)

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "dashboard" | "detail" | "pool"
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [poolItemId, setPoolItemId] = useState(null);

  const spreadData = useSpreadData(); // { spreads, dataSource, reload }

  const goToDetail = (itemId) => {
    setSelectedItemId(itemId);
    setView("detail");
  };

  const goToPool = (item) => {
    setPoolItemId(item?.id || item?.itemId || null);
    setView("pool");
  };

  if (view === "detail") {
    return (
      <ItemDetail
        itemId={selectedItemId}
        spreads={spreadData.spreads}          // ← pass live data down
        onBack={() => setView("landing")}
        onPoolClick={goToPool}
      />
    );
  }

  if (view === "pool") {
    return (
      <CapitalPooling
        preselectedItemId={poolItemId}
        spreads={spreadData.spreads}          // ← pass live data down
        onBack={() => setView(selectedItemId ? "detail" : "landing")}
      />
    );
  }

  if (view === "dashboard") {
    return (
      <Dashboard
        spreads={spreadData.spreads}
        dataSource={spreadData.dataSource}
        onRefresh={spreadData.reload}
        onItemClick={goToDetail}
        onBack={() => setView("landing")}
      />
    );
  }

  // default: landing
  return (
    <Landing
      spreads={spreadData.spreads}
      onItemClick={(item) => goToDetail(item.id)}
      onDashboardClick={() => setView("dashboard")}
      onSearch={spreadData.search}        // ← pass down
    />
  );
}