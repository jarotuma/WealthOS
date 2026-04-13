import React, { useState } from "react";
import { fmtKc, fmtDate, MONTHS, YEARS, splitYM, joinYM, todayYM } from "../utils/format";

export const ALL_ICONS = [
  "💰","🏦","📈","₿","🏠","🚗","💎","🌳","📊","💵",
  "🏭","✈️","🥇","🪙","⚡","🏔️","🎯","📱","💻","🛥️",
  "🏗️","🌾","🍷","🎨","👑","🏅","🔑","📦","🌍","⭐",
];
export const ALL_ICONS_P = [
  "💸","🏦","💳","🚙","🏠","📉","⚠️","🔻","📋","🏗️",
  "🔧","📱","💊","🎓","🔌","🚨","🧾","⛽","🏥","📝",
];

// ── Edit panel ────────────────────────────────────────────────
function EditPanel({ item, type, onSave, onCancel }) {
  // Najdi nejnovější měsíc v historii a nastav default na další měsíc
  const latestDate = item.history && item.history.length > 0
    ? [...item.history].sort((a, b) => b.date.localeCompare(a.date))[0].date
    : item.date;
  
  // Vypočítej následující měsíc
  const [latestYear, latestMonth] = latestDate.split("-");
  let nextYear = parseInt(latestYear);
  let nextMonth = parseInt(latestMonth) + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  
  const defaultMonth = String(nextMonth).padStart(2, "0");
  const defaultYear = String(nextYear);

  const [value,   setValue]  = useState(String(item.value));
  const [color,   setColor]  = useState(item.color || (type === "a" ? "#34c759" : "#ff3b30"));
  const [selM,    setSelM]   = useState(defaultMonth);
  const [selY,    setSelY]   = useState(defaultYear);

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
      background: "var(--surface2)", borderTop: "1px solid var(--border)",
      padding: "12px 16px",
    }}>
      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>Nová hodnota (Kč):</label>
      <input className="inp mono" type="number" value={value} onChange={e => setValue(e.target.value)}
        style={{ maxWidth: 150 }} autoFocus />
      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>Měsíc aktualizace:</label>
      <select className="inp" value={selM} onChange={e => setSelM(e.target.value)} style={{ maxWidth: 82 }}>
        {MONTHS.map((m, i) => <option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
      </select>
      <select className="inp" value={selY} onChange={e => setSelY(e.target.value)} style={{ maxWidth: 84 }}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>Barva:</label>
      <input 
        type="color" 
        value={color} 
        onChange={e => setColor(e.target.value)}
        style={{
          width: 40,
          height: 32,
          border: "1.5px solid var(--border)",
          borderRadius: 8,
          cursor: "pointer"
        }}
      />
      <button className={`btn-primary${type==="p"?" red":""}`}
        onClick={() => { if (value && !isNaN(+value)) onSave({...item, value:+value, color, date:joinYM(selY,selM)}); }}>
        Uložit
      </button>
      <button className="btn-ghost" onClick={onCancel}>Zrušit</button>
    </div>
  );
}

// ── Add form ──────────────────────────────────────────────────
function AddForm({ type, cats, onAdd, onClose }) {
  const { year: initY, month: initM } = splitYM(todayYM());
  const [name,  setName]  = useState("");
  const [cat,   setCat]   = useState(cats[0] || "");
  const [value, setValue] = useState("");
  const [icon,  setIcon]  = useState(type==="a" ? "💰" : "💸");
  const [month, setMonth] = useState(initM);
  const [year,  setYear]  = useState(initY);
  const [color, setColor] = useState(type==="a" ? "#34c759" : "#ff3b30");
  const icons = type==="a" ? ALL_ICONS : ALL_ICONS_P;

  const handleAdd = () => {
    if (!name.trim() || !value || isNaN(+value)) return;
    onAdd({ id: String(Date.now()), icon, name: name.trim(), cat: cat||cats[0]||"Ostatní",
      value: +value, color, date: joinYM(year,month) });
    onClose();
  };

  return (
    <div style={{ background: "var(--surface2)", borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <input className="inp" placeholder="Název…" value={name} onChange={e=>setName(e.target.value)} />
        <input className="inp mono" placeholder="Hodnota Kč" type="number" value={value} onChange={e=>setValue(e.target.value)} />
        <select className="inp" value={cat} onChange={e=>setCat(e.target.value)}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="inp" value={month} onChange={e=>setMonth(e.target.value)}>
            {MONTHS.map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <select className="inp" value={year} onChange={e=>setYear(e.target.value)}>
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {/* Icon picker */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {icons.map(em => (
          <button key={em} onClick={()=>setIcon(em)} style={{
            width: 36, height: 36, borderRadius: 8, fontSize: 18,
            background: icon===em ? "var(--blue-bg)" : "var(--surface)",
            border: `1.5px solid ${icon===em ? "var(--blue)" : "var(--border)"}`,
            cursor: "pointer",
          }}>{em}</button>
        ))}
      </div>
      {/* Color picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Barva:</label>
        <input 
          type="color" 
          value={color} 
          onChange={e => setColor(e.target.value)}
          style={{
            width: 50,
            height: 32,
            border: "1.5px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            background: "var(--surface)"
          }}
        />
        <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>{color}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className={`btn-primary${type==="p"?" red":""}`} onClick={handleAdd}>Přidat</button>
        <button className="btn-ghost" onClick={onClose}>Zrušit</button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AssetList({ type, items, cats, onAdd, onUpdate, onDelete }) {
  const [editId,  setEditId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const isA    = type === "a";
  const total  = items.reduce((s, i) => s + Number(i.value), 0);
  const color  = isA ? "var(--green)" : "var(--red)";
  const sign   = isA ? "" : "−";

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <span className={`tag ${isA?"green":"red"}`}>{isA?"AKTIVA":"PASIVA"}</span>
          {isA ? "Majetek a investice" : "Závazky a dluhy"}
        </span>
        <span className="card-total" style={{ color }}>{sign}{fmtKc(total)}</span>
      </div>

      {items.length === 0 && (
        <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          Žádné položky. Přidej první {isA ? "aktivum" : "pasivum"} níže.
        </div>
      )}

      {items.map(item => (
        <div key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr auto auto 48px",
            alignItems: "center", gap: 8, padding: "12px 12px 12px 14px",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {/* Icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 10, fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: (item.color||"#888")+"18", flexShrink: 0,
            }}>{item.icon}</div>

            {/* Info + Changes */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{item.cat} · {fmtDate(item.date)}</div>
              {/* MoM and YoY badges */}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {item.mom !== 0 && (
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: (isA ? item.mom >= 0 : item.mom <= 0) 
                      ? "rgba(52, 199, 89, 0.15)" 
                      : "rgba(255, 59, 48, 0.15)",
                    color: (isA ? item.mom >= 0 : item.mom <= 0) 
                      ? "var(--green)" 
                      : "var(--red)"
                  }}>
                    MoM {item.mom >= 0 ? "+" : ""}{item.momPct}%
                  </div>
                )}
                {item.yoy !== 0 && (
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: (isA ? item.yoy >= 0 : item.yoy <= 0) 
                      ? "rgba(52, 199, 89, 0.15)" 
                      : "rgba(255, 59, 48, 0.15)",
                    color: (isA ? item.yoy >= 0 : item.yoy <= 0) 
                      ? "var(--green)" 
                      : "var(--red)"
                  }}>
                    YoY {item.yoy >= 0 ? "+" : ""}{item.yoyPct}%
                  </div>
                )}
              </div>
            </div>

            {/* Update btn */}
            <button onClick={() => { setEditId(editId===item.id?null:item.id); setShowAdd(false); }}
              style={{
                padding: "5px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: editId===item.id ? "var(--blue-bg)" : "var(--surface2)",
                border: `1px solid ${editId===item.id ? "var(--blue)" : "var(--border)"}`,
                color: editId===item.id ? "var(--blue)" : "var(--text3)",
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
              Aktualizovat
            </button>

            {/* Value with color indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: 3,
                background: item.color || "#888",
                flexShrink: 0
              }} />
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, color, whiteSpace: "nowrap" }}>
                {sign}{fmtKc(item.value)}
              </div>
            </div>

            {/* Delete — large touch target */}
            <button onClick={() => { if (window.confirm(`Smazat "${item.name}"?`)) onDelete(item.id); }}
              style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: "var(--red-bg)", border: "1px solid transparent",
                color: "var(--red)", fontSize: 20, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.border = "1px solid var(--red)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = "1px solid transparent"; }}
              title="Smazat"
            >
              ×
            </button>
          </div>

          {/* Inline edit */}
          {editId === item.id && (
            <EditPanel item={item} type={type}
              onSave={(u) => { onUpdate(u); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          )}
        </div>
      ))}

      {/* Add form or button */}
      {showAdd ? (
        <AddForm type={type} cats={cats} onAdd={onAdd} onClose={() => setShowAdd(false)} />
      ) : (
        <button onClick={() => { setShowAdd(true); setEditId(null); }}
          style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%",
            padding: "13px 18px", background: "none", border: "none",
            borderTop: "1px solid var(--border)",
            color: isA ? "var(--blue)" : "var(--red)",
            fontFamily: "inherit", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "background .12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = isA?"var(--blue-bg)":"var(--red-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          + Přidat {isA ? "aktivum" : "pasivum"}
        </button>
      )}
    </div>
  );
}
