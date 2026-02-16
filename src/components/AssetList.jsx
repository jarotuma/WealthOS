import React, { useState } from "react";
import { fmtKc, fmtDate, MONTHS, YEARS, splitYM, joinYM, todayYM } from "../utils/format";

const ICON_A = ["💰","🏦","📈","₿","🏠","🚗","💎","🌳","📊","💵","🏭","✈️"];
const ICON_P = ["💸","🏦","💳","🚙","🏠","📉","⚠️","🔻","📋","🏗️"];

const CAT_A = ["Bankovní účet","Akcie","ETF","Krypto","Nemovitost","Automobil","Dluhopisy","Jiné investice","Hotovost","Ostatní"];
const CAT_P = ["Hypotéka","Spotřební půjčka","Kreditní karta","Leasing","Studentská půjčka","Jiný dluh","Ostatní"];

// ── Inline edit panel ─────────────────────────────────────────
function EditPanel({ item, type, onSave, onCancel }) {
  const { year, month } = splitYM(item.date);
  const [value,    setValue]    = useState(String(item.value));
  const [selMonth, setMonth]    = useState(month);
  const [selYear,  setYear]     = useState(year);

  const handleSave = () => {
    if (!value || isNaN(Number(value))) return;
    onSave({ ...item, value: Number(value), date: joinYM(selYear, selMonth) });
  };

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
      background: "var(--surface2)", borderTop: "1px solid var(--border)",
      padding: "12px 18px",
    }}>
      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>
        Nová hodnota (Kč):
      </label>
      <input
        className="inp mono"
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{ maxWidth: 160 }}
        autoFocus
      />

      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>
        Měsíc a rok aktualizace:
      </label>
      <select
        className="inp"
        value={selMonth}
        onChange={e => setMonth(e.target.value)}
        style={{ maxWidth: 90 }}
      >
        {MONTHS.map((m, i) => (
          <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
        ))}
      </select>
      <select
        className="inp"
        value={selYear}
        onChange={e => setYear(e.target.value)}
        style={{ maxWidth: 88 }}
      >
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <button
        className={`btn-primary${type === "p" ? " red" : ""}`}
        onClick={handleSave}
      >
        Uložit
      </button>
      <button className="btn-ghost" onClick={onCancel}>Zrušit</button>
    </div>
  );
}

// ── Add form ──────────────────────────────────────────────────
function AddForm({ type, onAdd, onClose }) {
  const ym = todayYM();
  const { year: initYear, month: initMonth } = splitYM(ym);
  const [name,   setName]   = useState("");
  const [cat,    setCat]    = useState("");
  const [value,  setValue]  = useState("");
  const [icon,   setIcon]   = useState(type === "a" ? "💰" : "💸");
  const [month,  setMonth]  = useState(initMonth);
  const [year,   setYear]   = useState(initYear);

  const icons = type === "a" ? ICON_A : ICON_P;
  const cats  = type === "a" ? CAT_A  : CAT_P;

  const handleAdd = () => {
    if (!name.trim() || !value || isNaN(Number(value))) return;
    onAdd({
      id:    String(Date.now()),
      icon, name: name.trim(),
      cat:   cat || cats[0],
      value: Number(value),
      color: type === "a" ? "#34c759" : "#ff3b30",
      date:  joinYM(year, month),
    });
    onClose();
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 120px 1fr 80px 80px 44px auto",
      gap: 8, padding: "12px 18px",
      background: "var(--surface2)",
      borderTop: "1px solid var(--border)",
      alignItems: "center",
    }}>
      <input
        className="inp" placeholder="Název…"
        value={name} onChange={e => setName(e.target.value)}
      />
      <input
        className="inp mono" placeholder="Hodnota Kč"
        type="number" value={value}
        onChange={e => setValue(e.target.value)}
      />
      <select className="inp" value={cat} onChange={e => setCat(e.target.value)}>
        <option value="">— Kategorie —</option>
        {cats.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {/* Měsíc */}
      <select className="inp" value={month} onChange={e => setMonth(e.target.value)}>
        {MONTHS.map((m, i) => (
          <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
        ))}
      </select>
      {/* Rok */}
      <select className="inp" value={year} onChange={e => setYear(e.target.value)}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {/* Ikona */}
      <select className="inp" value={icon} onChange={e => setIcon(e.target.value)}>
        {icons.map(em => <option key={em} value={em}>{em}</option>)}
      </select>
      <button
        className={`btn-primary${type === "p" ? " red" : ""}`}
        onClick={handleAdd}
      >
        Přidat
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function AssetList({ type, items, onAdd, onUpdate, onDelete }) {
  const [editId,  setEditId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const isA     = type === "a";
  const total   = items.reduce((s, i) => s + Number(i.value), 0);
  const label   = isA ? "AKTIVA" : "PASIVA";
  const tagCls  = isA ? "green" : "red";
  const sign    = isA ? "" : "−";
  const color   = isA ? "var(--green)" : "var(--red)";

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <span className="card-title">
          <span className={`tag ${tagCls}`}>{label}</span>
          {isA ? "Majetek a investice" : "Závazky a dluhy"}
        </span>
        <span className="card-total" style={{ color }}>
          {sign}{fmtKc(total)}
        </span>
      </div>

      {/* Items */}
      {items.map(item => (
        <div key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
          {/* Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "38px 1fr auto auto auto 28px",
              alignItems: "center", gap: 10,
              padding: "11px 18px",
              transition: "background .12s",
            }}
            className="item-hover-row"
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, background: (item.color || "#888") + "18", flexShrink: 0,
            }}>
              {item.icon}
            </div>

            {/* Info */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{item.cat}</div>
            </div>

            {/* Edit btn — shown on hover via inline JS */}
            <button
              onClick={() => { setEditId(editId === item.id ? null : item.id); setShowAdd(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "var(--surface2)", border: "1px solid var(--border)",
                color: "var(--text3)", fontFamily: "inherit",
                fontSize: 11, fontWeight: 700,
                padding: "4px 9px", borderRadius: 99, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--blue-bg)"; e.currentTarget.style.color = "var(--blue)"; e.currentTarget.style.borderColor = "var(--blue)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              Aktualizovat
            </button>

            {/* Date */}
            <div style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", textAlign: "right" }}>
              {fmtDate(item.date)}
            </div>

            {/* Value */}
            <div
              className="mono"
              style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", color }}
            >
              {sign}{fmtKc(item.value)}
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(item.id)}
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text3)", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--red-bg)"; e.currentTarget.style.color = "var(--red)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text3)"; }}
              title="Smazat"
            >
              ×
            </button>
          </div>

          {/* Inline edit panel */}
          {editId === item.id && (
            <EditPanel
              item={item}
              type={type}
              onSave={(updated) => { onUpdate(updated); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          )}
        </div>
      ))}

      {/* Add form or button */}
      {showAdd ? (
        <AddForm type={type} onAdd={onAdd} onClose={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%",
            padding: "12px 18px", background: "none", border: "none",
            borderTop: "1px solid var(--border)",
            color: isA ? "var(--blue)" : "var(--red)",
            fontFamily: "inherit", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "background .12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = isA ? "var(--blue-bg)" : "var(--red-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          + Přidat {isA ? "aktivum" : "pasivum"}
        </button>
      )}
    </div>
  );
}
