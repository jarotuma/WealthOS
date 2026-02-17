import React, { useRef, useState } from "react";

export default function NavBar({ dark, onToggleDark, onExport, onImport, onOpenAdmin, syncing, sheetsOk, page, onChangePage }) {
  const fileRef = useRef();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: dark ? "Světlý mód" : "Tmavý mód", icon: dark ? "☀️" : "🌙", action: onToggleDark },
    { label: "Export dat",       icon: "⬇️", action: onExport },
    { label: "Import dat",       icon: "⬆️", action: () => fileRef.current?.click() },
    { label: "Správa kategorií", icon: "⚙️", action: onOpenAdmin },
  ];

  return (
    <>
      <style>{`
        @media(min-width:480px){.wo-tab-label{display:inline !important;}.wo-status-label{display:inline !important;}}
        @media(max-width:479px){.wo-tab-label{display:none !important;}.wo-status-label{display:none !important;}}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: dark ? "rgba(13,27,46,0.93)" : "rgba(249,249,251,0.93)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 52, gap: 10,
      }}>
        {/* Logo */}
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, flexShrink: 0 }}>
          Wealth<span style={{ color: "var(--blue)" }}>OS</span>
        </div>

        {/* Záložky — ikony vždy, text jen na širším displeji */}
        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 10, padding: 3, flexShrink: 0 }}>
          {[
            { id: "dashboard", icon: "📊", label: "Přehled" },
            { id: "history",   icon: "📅", label: "Historie" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onChangePage(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 8, border: "none",
                background: page === tab.id ? "var(--surface)" : "transparent",
                color: page === tab.id ? "var(--text)" : "var(--text3)",
                fontFamily: "inherit", fontSize: 13,
                fontWeight: page === tab.id ? 700 : 600,
                cursor: "pointer",
                boxShadow: page === tab.id ? "var(--shadow)" : "none",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span className="wo-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Vpravo: Sheets status + Hamburger */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div
            title={sheetsOk ? "Připojeno ke Google Sheets" : "Offline – data uložena lokálně"}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 700,
              color: sheetsOk ? "var(--green)" : "var(--text3)",
              background: sheetsOk ? "var(--green-bg)" : "var(--surface2)",
              padding: "4px 8px", borderRadius: 99,
              border: `1px solid ${sheetsOk ? "rgba(52,199,89,0.25)" : "var(--border)"}`,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: sheetsOk ? "var(--green)" : "var(--text3)", display: "inline-block", flexShrink: 0 }} />
            {syncing && <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--border)", borderTopColor: "var(--blue)", animation: "spin .7s linear infinite", display: "inline-block" }} />}
            <span className="wo-status-label">{sheetsOk ? "Sheets" : "Offline"}</span>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: menuOpen ? "var(--blue-bg)" : "var(--surface2)",
              border: `1px solid ${menuOpen ? "var(--blue)" : "var(--border)"}`,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
            }}
            aria-label="Menu"
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "block", width: 16, height: 2, borderRadius: 99,
                background: menuOpen ? "var(--blue)" : "var(--text2)",
                transition: "all .2s",
                transform: menuOpen
                  ? i === 0 ? "translateY(6px) rotate(45deg)"
                  : i === 2 ? "translateY(-6px) rotate(-45deg)"
                  : "scaleX(0)"
                  : "none",
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Dropdown */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 198 }} />
          <div style={{
            position: "fixed", top: 60, right: 16, zIndex: 199,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            minWidth: 210, overflow: "hidden",
          }}>
            {menuItems.map((item, i) => (
              <button key={i} onClick={() => { item.action(); setMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "13px 18px", background: "none", border: "none",
                borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none",
                color: "var(--text)", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
                cursor: "pointer", textAlign: "left", transition: "background .12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = ""; } }}
      />
    </>
  );
}
