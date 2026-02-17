import React, { useState } from "react";

function CatList({ title, cats, type, onAdd, onDelete }) {
  const [newCat, setNewCat] = useState("");

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
        color: type === "a" ? "var(--green)" : "var(--red)", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {cats.map(cat => (
          <div key={cat} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface2)", borderRadius: 8,
            padding: "8px 12px", border: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
            <button onClick={() => onDelete(type, cat)} style={{
              width: 26, height: 26, borderRadius: 6,
              background: "var(--red-bg)", border: "none",
              color: "var(--red)", fontSize: 16, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="inp" placeholder="Nová kategorie…" value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newCat.trim()) { onAdd(type, newCat.trim()); setNewCat(""); } }}
        />
        <button className={`btn-primary${type === "p" ? " red" : ""}`}
          onClick={() => { if (newCat.trim()) { onAdd(type, newCat.trim()); setNewCat(""); } }}>
          Přidat
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({ catsA, catsP, onAdd, onDelete, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 301, width: "min(560px, calc(100vw - 32px))",
        maxHeight: "80vh", overflowY: "auto",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, background: "var(--surface)", zIndex: 1,
        }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>⚙️ Správa kategorií</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 99,
            background: "var(--surface2)", border: "none",
            color: "var(--text2)", fontSize: 18, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>×</button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 28 }}>
          <CatList title="Kategorie aktiv"  cats={catsA} type="a" onAdd={onAdd} onDelete={onDelete} />
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
            <CatList title="Kategorie pasiv" cats={catsP} type="p" onAdd={onAdd} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </>
  );
}
