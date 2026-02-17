import React, { useState } from "react";
import { fmtKc } from "../utils/format";

// ── History Chart ─────────────────────────────────────────────
export function HistoryChart({ aktiva, pasiva, availableMonths }) {
  if (!availableMonths || availableMonths.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historie čistého jmění</span>
        </div>
        <div style={{ padding: "28px 20px" }}>
          <div style={{
            background: "var(--blue-bg)", border: "1px solid rgba(0,113,227,0.2)",
            borderRadius: 12, padding: "14px 16px", fontSize: 13,
          }}>
            <div style={{ fontWeight: 700, color: "var(--blue)", marginBottom: 4 }}>📊 Jak funguje história?</div>
            <div style={{ color: "var(--text2)", lineHeight: 1.6 }}>
              Každá položka si pamatuje historii svých hodnot. Přidej aktivum nebo pasivum a pak ho
              aktualizuj — každá aktualizace se zapíše jako nový záznam. Graf vzniká automaticky.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Spočítej čisté jmění pro každý měsíc z per-item history
  const months = [...availableMonths].reverse();
  const points = months.map(ym => {
    const tA = aktiva.reduce((s, item) => { const h = (item.history||[]).find(x => x.date === ym); return s + (h ? h.value : 0); }, 0);
    const tP = pasiva.reduce((s, item) => { const h = (item.history||[]).find(x => x.date === ym); return s + (h ? h.value : 0); }, 0);
    const [y, m] = ym.split("-");
    return { ym, nw: tA - tP, label: `${parseInt(m)}/${y.slice(2)}` };
  });

  const maxNW = Math.max(...points.map(p => p.nw));
  const minNW = Math.min(...points.map(p => p.nw));
  const range = maxNW - minNW || 1;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Vývoj čistého jmění</span>
        <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{points.length} měsíců</span>
      </div>
      <div style={{ padding: "18px 18px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{fmtKc(minNW)}</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{fmtKc(maxNW)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 130, paddingBottom: 22, position: "relative" }}>
          {[0.33, 0.66].map((f, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, zIndex: 0, bottom: `${f * 108 + 22}px`, borderTop: "1px dashed var(--border)" }} />
          ))}
          {points.map((p, i) => {
            const barH   = 18 + ((p.nw - minNW) / range) * 88;
            const isLast = i === points.length - 1;
            return (
              <div key={p.ym} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                <div title={fmtKc(p.nw)} style={{ width: "100%", height: barH, borderRadius: "5px 5px 0 0", background: isLast ? "var(--blue)" : "rgba(0,113,227,0.14)", cursor: "default" }} />
                <span style={{ position: "absolute", bottom: -18, fontSize: 9, color: "var(--text3)", fontWeight: 600, whiteSpace: "nowrap" }}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Pie ───────────────────────────────────────────────────────
function PieSVG({ data, size = 110, label }) {
  const cx = size/2, cy = size/2, r = size/2 - 8;
  let start = -Math.PI / 2;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {data.map((d, i) => {
        const angle = (d.pct / 100) * 2 * Math.PI;
        if (angle < 0.01) return null;
        const end = start + angle;
        const x1 = cx + r * Math.cos(start + 0.025), y1 = cy + r * Math.sin(start + 0.025);
        const x2 = cx + r * Math.cos(end - 0.025),   y2 = cy + r * Math.sin(end - 0.025);
        const lg = angle > Math.PI ? 1 : 0;
        start = end;
        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`} fill={d.color} opacity={0.9} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.5} fill="var(--surface)" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="700" fontFamily="Nunito Sans">{label}</text>
    </svg>
  );
}

export function PieCharts({ aktiva, pasiva }) {
  const totalA = aktiva.reduce((s, i) => s + Number(i.value), 0);
  const totalP = pasiva.reduce((s, i) => s + Number(i.value), 0);
  const toPie  = (items, total) =>
    items.map(i => ({ label: i.name, pct: total > 0 ? Math.round((Number(i.value)/total)*100) : 0, color: i.color||"#888" }))
         .filter(d => d.pct > 0);

  const renderSection = (title, total, data) => (
    <div style={{ padding: 18, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text3)", marginBottom: 12 }}>
        {title} · {fmtKc(total)}
      </div>
      {data.length === 0 ? (
        <div style={{ color: "var(--text3)", fontSize: 13 }}>Žádné položky</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PieSVG data={data} size={100} label={title} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
            {data.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
                <div style={{ height: 4, width: 40, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, background: d.color+"99", borderRadius: 99 }} />
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--text2)", minWidth: 34, textAlign: "right" }}>{d.pct} %</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Rozložení portfolia</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>Asset Allocation</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
        {renderSection("Aktiva", totalA, toPie(aktiva, totalA))}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {renderSection("Pasiva", totalP, toPie(pasiva, totalP))}
        </div>
      </div>
    </div>
  );
}

// ── Goals ─────────────────────────────────────────────────────
const GRAD_OPTS = [
  { id: "",   label: "Modrá",   colors: ["#0071e3","#5ac8fa"], border: "#0071e3" },
  { id: "g2", label: "Zelená",  colors: ["#34c759","#a8f0bb"], border: "#34c759" },
  { id: "g3", label: "Fialová", colors: ["#af52de","#e89fff"], border: "#af52de" },
  { id: "g4", label: "Oranžová",colors: ["#ff9500","#ffcc00"], border: "#ff9500" },
];

function GoalForm({ goal, onSave, onCancel }) {
  const [name,   setName]   = useState(goal?.name   || "");
  const [target, setTarget] = useState(goal?.target ? String(goal.target) : "");
  const [color,  setColor]  = useState(goal?.colorClass || "");

  return (
    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <input className="inp" placeholder="Název cíle (např. První milion)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="inp mono" placeholder="Cílová částka Kč" type="number" value={target} onChange={e=>setTarget(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {GRAD_OPTS.map(o => (
          <button key={o.id} onClick={() => setColor(o.id)} style={{
            padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: `linear-gradient(90deg, ${o.colors[0]}, ${o.colors[1]})`,
            color: "white", border: `2px solid ${color===o.id ? "var(--text)" : "transparent"}`,
            cursor: "pointer",
          }}>{o.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary"
          onClick={() => { if (!name.trim() || !target || isNaN(+target)) return; onSave({ id: goal?.id || String(Date.now()), name: name.trim(), target: +target, colorClass: color }); }}>
          {goal ? "Uložit změny" : "Přidat cíl"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>Zrušit</button>
      </div>
    </div>
  );
}

export function GoalsSection({ goals, netWorth, onUpdateGoals }) {
  const [editId,    setEditId]   = useState(null);
  const [showAdd,   setShowAdd]  = useState(false);

  const deleteGoal = (id) => {
    if (window.confirm("Smazat tento cíl?")) onUpdateGoals(goals.filter(g => g.id !== id));
  };
  const saveEdit = (updated) => {
    onUpdateGoals(goals.map(g => g.id === updated.id ? updated : g));
    setEditId(null);
  };
  const addGoal = (newGoal) => {
    onUpdateGoals([...goals, newGoal]);
    setShowAdd(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Finanční cíle</span>
        <button className="pill-btn" onClick={() => { setShowAdd(true); setEditId(null); }}>+ Přidat cíl</button>
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

        {goals.length === 0 && !showAdd && (
          <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, padding: "8px 0" }}>
            Žádné cíle. Přidej první kliknutím na "+ Přidat cíl".
          </div>
        )}

        {showAdd && (
          <GoalForm onSave={addGoal} onCancel={() => setShowAdd(false)} />
        )}

        {goals.map((g) => {
          const grad   = GRAD_OPTS.find(o => o.id === g.colorClass) || GRAD_OPTS[0];
          const pct    = Math.min(100, Math.round((netWorth / Number(g.target)) * 100));

          if (editId === g.id) return (
            <GoalForm key={g.id} goal={g} onSave={saveEdit} onCancel={() => setEditId(null)} />
          );

          return (
            <div key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text3)" }}>
                    {netWorth.toLocaleString("cs-CZ")} / {Number(g.target).toLocaleString("cs-CZ")} Kč
                  </span>
                  <button onClick={() => { setEditId(g.id); setShowAdd(false); }} style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    color: "var(--text3)", cursor: "pointer",
                  }}>Upravit</button>
                  <button onClick={() => deleteGoal(g.id)} style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--red-bg)", border: "none",
                    color: "var(--red)", fontSize: 16, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}>×</button>
                </div>
              </div>
              <div style={{ height: 7, background: "var(--surface2)", borderRadius: 99, position: "relative", marginBottom: 6 }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${grad.colors[0]}, ${grad.colors[1]})`,
                  position: "relative", transition: "width .6s",
                }}>
                  <div style={{
                    position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)",
                    width: 13, height: 13, borderRadius: "50%",
                    background: "var(--surface)", border: `2px solid ${grad.border}`,
                    boxShadow: `0 1px 4px ${grad.border}55`,
                  }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>{pct} % splněno</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text3)" }}>
                  zbývá {Math.max(0, Number(g.target) - netWorth).toLocaleString("cs-CZ")} Kč
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
