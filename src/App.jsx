import React, { useState } from "react";
import { useData } from "./hooks/useData";
import NavBar from "./components/NavBar";
import { HeroSection, StatCards } from "./components/Widgets";
import AssetList from "./components/AssetList";
import { HistoryChart, PieCharts, GoalsSection } from "./components/Charts";
import AdminPanel from "./components/AdminPanel";
import HistoryPage from "./components/HistoryPage";
import Diagnostics from "./components/Diagnostics";
import { fmtKc } from "./utils/format";

export default function App() {
  const [dark,      setDark]      = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [page,      setPage]      = useState("dashboard"); // dashboard | history

  const {
    aktiva, pasiva, goals, catsA, catsP,
    loading, syncing, toast, sheetsOk,
    totalA, totalP, netWorth, diff, diffPct,
    availableMonths,
    addAktivum, updateAktivum, deleteAktivum,
    updateAktivumHistory, deleteAktivumHistory,
    addPasivum, updatePasivum, deletePasivum,
    updatePasivumHistory, deletePasivumHistory,
    updateGoals,
    addCat, deleteCat,
    exportData, importData,
  } = useData();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 16 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <div style={{ fontSize: 14, color: "var(--text3)", fontWeight: 600 }}>Načítám data…</div>
    </div>
  );

  return (
    <div className={dark ? "dark" : ""} style={{
      minHeight: "100vh",
      background: dark ? "linear-gradient(135deg,#0d1b2e 0%,#0a1628 50%,#0d1f3c 100%)" : "var(--bg)",
      color: "var(--text)",
    }}>
      <NavBar
        dark={dark} onToggleDark={() => setDark(d => !d)}
        onExport={exportData} onImport={importData}
        onOpenAdmin={() => setAdminOpen(true)}
        syncing={syncing} sheetsOk={sheetsOk}
        page={page} onChangePage={setPage}
      />

      {page === "history" ? (
        <HistoryPage
          aktiva={aktiva} pasiva={pasiva}
          availableMonths={availableMonths}
          onUpdateAHistory={updateAktivumHistory} onDeleteAHistory={deleteAktivumHistory}
          onUpdatePHistory={updatePasivumHistory} onDeletePHistory={deletePasivumHistory}
        />
      ) : (
        <div className="page">
          <HeroSection netWorth={netWorth} diff={diff} diffPct={diffPct} />
          <StatCards totalA={totalA} totalP={totalP} aktiva={aktiva} pasiva={pasiva} />

          <div className="section-label">Aktiva <small>{fmtKc(totalA)}</small></div>
          <AssetList type="a" items={aktiva} cats={catsA} onAdd={addAktivum} onUpdate={updateAktivum} onDelete={deleteAktivum} />

          <div className="section-label">Pasiva <small>−{fmtKc(totalP)}</small></div>
          <AssetList type="p" items={pasiva} cats={catsP} onAdd={addPasivum} onUpdate={updatePasivum} onDelete={deletePasivum} />

          <div className="section-label">Historie čistého jmění</div>
          <HistoryChart history={[]} dark={dark} onSnapshot={() => {}} totalA={totalA} totalP={totalP} />

          <div className="section-label">Rozložení portfolia <small>Asset Allocation</small></div>
          <PieCharts aktiva={aktiva} pasiva={pasiva} />

          <div className="section-label">Finanční cíle</div>
          <GoalsSection goals={goals} netWorth={netWorth} onUpdateGoals={updateGoals} />
        </div>
      )}

      {adminOpen && (
        <AdminPanel catsA={catsA} catsP={catsP} onAdd={addCat} onDelete={deleteCat} onClose={() => setAdminOpen(false)} />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      <Diagnostics />
    </div>
  );
}
