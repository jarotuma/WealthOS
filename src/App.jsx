import React, { useState } from "react";
import { useData } from "./hooks/useData";
import NavBar from "./components/NavBar";
import { HeroSection, StatCards } from "./components/Widgets";
import AssetList from "./components/AssetList";
import { HistoryChart, PieCharts, GoalsSection } from "./components/Charts";
import { fmtKc } from "./utils/format";

export default function App() {
  const [dark, setDark] = useState(false);

  const {
    aktiva, pasiva, history, goals,
    loading, syncing, toast, sheetsOk,
    totalA, totalP, netWorth, diff, diffPct,
    addAktivum, updateAktivum, deleteAktivum,
    addPasivum, updatePasivum, deletePasivum,
    saveSnapshot, updateGoals,
    exportData, importData,
  } = useData();

  if (loading) {
    return (
      <div className={dark ? "dark" : ""} style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg)", gap: 16,
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <div style={{ fontSize: 14, color: "var(--text3)", fontWeight: 600 }}>Načítám data…</div>
      </div>
    );
  }

  return (
    <div className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* NAV */}
      <NavBar
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        onExport={exportData}
        onImport={importData}
        syncing={syncing}
        sheetsOk={sheetsOk}
      />

      <div className="page">

        {/* HERO */}
        <HeroSection
          netWorth={netWorth}
          diff={diff}
          diffPct={diffPct}
          onSnapshot={() => saveSnapshot(totalA, totalP)}
        />

        {/* STAT CARDS */}
        <StatCards totalA={totalA} totalP={totalP} aktiva={aktiva} pasiva={pasiva} />

        {/* AKTIVA */}
        <div className="section-label">
          Aktiva
          <small>{fmtKc(totalA)}</small>
        </div>
        <AssetList
          type="a"
          items={aktiva}
          onAdd={addAktivum}
          onUpdate={updateAktivum}
          onDelete={deleteAktivum}
        />

        {/* PASIVA */}
        <div className="section-label">
          Pasiva
          <small>−{fmtKc(totalP)}</small>
        </div>
        <AssetList
          type="p"
          items={pasiva}
          onAdd={addPasivum}
          onUpdate={updatePasivum}
          onDelete={deletePasivum}
        />

        {/* HISTORY CHART */}
        <div className="section-label">
          Historie čistého jmění
          <small>{history.length} snapshotů</small>
        </div>
        <HistoryChart history={history} dark={dark} />

        {/* PIE CHARTS */}
        <div className="section-label">
          Rozložení portfolia
          <small>Asset Allocation</small>
        </div>
        <PieCharts aktiva={aktiva} pasiva={pasiva} />

        {/* GOALS */}
        <div className="section-label">
          Finanční cíle
        </div>
        <GoalsSection goals={goals} netWorth={netWorth} onUpdateGoals={updateGoals} />

      </div>

      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

    </div>
  );
}
