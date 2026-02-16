import React, { useRef } from "react";

export default function NavBar({ dark, onToggleDark, onExport, onImport, syncing, sheetsOk }) {
  const fileRef = useRef();

  return (
    <nav
      style={{
        position: "sticky", top: 0, zIndex: 200,
        background: dark ? "rgba(12,12,14,0.90)" : "rgba(249,249,251,0.90)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52,
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>
        Wealth<span style={{ color: "var(--blue)" }}>OS</span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

        {/* Sheets status indicator */}
        <div
          title={sheetsOk ? "Připojeno ke Google Sheets" : "Offline – data uložena lokálně"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, color: sheetsOk ? "var(--green)" : "var(--text3)",
            background: sheetsOk ? "var(--green-bg)" : "var(--surface2)",
            padding: "4px 10px", borderRadius: 99,
            border: `1px solid ${sheetsOk ? "rgba(52,199,89,0.25)" : "var(--border)"}`,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sheetsOk ? "var(--green)" : "var(--text3)", display: "inline-block" }} />
          {syncing ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : null}
          {sheetsOk ? "Sheets" : "Offline"}
        </div>

        {/* Dark mode toggle */}
        <button className="pill-btn" onClick={onToggleDark}>
          {dark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          {dark ? "Světlý" : "Tmavý"}
        </button>

        {/* Export */}
        <button className="pill-btn" onClick={onExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>

        {/* Import */}
        <label className="pill-btn" style={{ cursor: "pointer" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
          <input
            ref={fileRef} type="file" accept=".json"
            style={{ display: "none" }}
            onChange={e => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = ""; } }}
          />
        </label>
      </div>
    </nav>
  );
}
