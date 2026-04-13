import React, { useState, useEffect } from "react";
import { fmtKc } from "../utils/format";

// ── History Chart ─────────────────────────────────────────────
export function HistoryChart({ aktiva, pasiva, availableMonths }) {
  // Zjisti aktuální a minulý rok
  const currentYear = new Date().getFullYear().toString();
  const lastYear = (new Date().getFullYear() - 1).toString();
  
  // Zjisti které roky máme v datech
  const yearsInData = availableMonths 
    ? [...new Set(availableMonths.map(ym => ym.split("-")[0]))]
    : [];
  
  // Default: aktuální rok pokud existuje, jinak minulý, jinak all
  const getDefaultFilter = () => {
    if (yearsInData.includes(currentYear)) return "currentYear";
    if (yearsInData.includes(lastYear)) return "lastYear";
    return "all";
  };
  
  const [filter, setFilter] = useState(getDefaultFilter());
  const [selectedMonth, setSelectedMonth] = useState(null); // Vybraný měsíc pro detail
  
  // Reset výběru při změně filtru
  useEffect(() => {
    setSelectedMonth(null);
  }, [filter]);
  
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
  const allPoints = months.map(ym => {
    const tA = aktiva.reduce((s, item) => { const h = (item.history||[]).find(x => x.date === ym); return s + (h ? h.value : 0); }, 0);
    const tP = pasiva.reduce((s, item) => { const h = (item.history||[]).find(x => x.date === ym); return s + (h ? h.value : 0); }, 0);
    const [y, m] = ym.split("-");
    return { ym, nw: tA - tP, label: `${parseInt(m)}/${y.slice(2)}`, year: y };
  });
  
  // Filtruj podle výběru
  const points = filter === "all" 
    ? allPoints
    : filter === "lastYear"
    ? allPoints.filter(p => p.year === lastYear)
    : allPoints.filter(p => p.year === currentYear);

  if (points.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historie čistého jmění</span>
        </div>
        <div style={{ padding: "20px", color: "var(--text3)", fontSize: 13 }}>
          Žádná data pro vybraný rok
        </div>
      </div>
    );
  }

  const maxNW = Math.max(...points.map(p => p.nw));
  const minNW = Math.min(...points.map(p => p.nw));
  const range = maxNW - minNW || 1;
  
  // Check which years have data
  const hasCurrentYear = yearsInData.includes(currentYear);
  const hasLastYear = yearsInData.includes(lastYear);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Vývoj čistého jmění</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button 
            onClick={() => hasCurrentYear && setFilter("currentYear")}
            disabled={!hasCurrentYear}
            style={{
              background: filter === "currentYear" ? "var(--blue)" : "var(--surface2)",
              color: filter === "currentYear" ? "#fff" : hasCurrentYear ? "var(--text3)" : "var(--border)",
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: hasCurrentYear ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              opacity: hasCurrentYear ? 1 : 0.5
            }}>
            Aktuální rok
          </button>
          <button 
            onClick={() => hasLastYear && setFilter("lastYear")}
            disabled={!hasLastYear}
            style={{
              background: filter === "lastYear" ? "var(--blue)" : "var(--surface2)",
              color: filter === "lastYear" ? "#fff" : hasLastYear ? "var(--text3)" : "var(--border)",
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: hasLastYear ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              opacity: hasLastYear ? 1 : 0.5
            }}>
            Minulý rok
          </button>
          <button 
            onClick={() => setFilter("all")}
            style={{
              background: filter === "all" ? "var(--blue)" : "var(--surface2)",
              color: filter === "all" ? "#fff" : "var(--text3)",
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit"
            }}>
            Vše
          </button>
        </div>
      </div>
      <div style={{ padding: "18px 18px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{fmtKc(minNW)}</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{points.length} měsíců</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{fmtKc(maxNW)}</span>
        </div>
        {/* Scrollable wrapper for mobile */}
        <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
          <svg 
            viewBox="0 0 700 160" 
            style={{ 
              width: "100%", 
              minWidth: points.length > 6 ? `${points.length * 60}px` : "100%",
              height: "160px"
            }}
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <line
                key={i}
                x1="0"
                y1={130 - f * 110}
                x2="700"
                y2={130 - f * 110}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
            ))}
            
            {(() => {
              // Calculate points for the line
              const width = 700;
              const height = 130;
              const padding = 20;
              const stepX = (width - 2 * padding) / (points.length - 1 || 1);
              
              const coords = points.map((p, i) => {
                const x = padding + i * stepX;
                const y = height - padding - ((p.nw - minNW) / range) * (height - 2 * padding - 10);
                return { x, y, ...p };
              });
              
              // Create path for area fill
              const areaPath = coords.length > 0
                ? `M ${coords[0].x} ${height - padding} ` +
                  coords.map(c => `L ${c.x} ${c.y}`).join(" ") +
                  ` L ${coords[coords.length - 1].x} ${height - padding} Z`
                : "";
              
              // Create path for line
              const linePath = coords.length > 0
                ? `M ${coords.map(c => `${c.x} ${c.y}`).join(" L ")}`
                : "";
              
              return (
                <>
                  {/* Area fill */}
                  <path
                    d={areaPath}
                    fill="rgba(0, 113, 227, 0.1)"
                    stroke="none"
                  />
                  
                  {/* Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Points */}
                  {coords.map((c, i) => {
                    const isLast = i === points.length - 1;
                    const isSelected = selectedMonth === c.ym;
                    const isActive = isSelected || isLast;
                    
                    return (
                      <g key={c.ym}>
                        {/* Larger invisible hitbox for easier clicking */}
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r="15"
                          fill="transparent"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedMonth(isSelected ? null : c.ym)}
                          onMouseEnter={(e) => {
                            const point = e.currentTarget.nextSibling;
                            if (point && !isActive) point.setAttribute("r", "5");
                          }}
                          onMouseLeave={(e) => {
                            const point = e.currentTarget.nextSibling;
                            if (point && !isActive) point.setAttribute("r", "4");
                          }}
                        />
                        
                        {/* Visible point */}
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isActive ? "6" : "4"}
                          fill="var(--blue)"
                          stroke="var(--bg)"
                          strokeWidth="2.5"
                          style={{ 
                            cursor: "pointer",
                            transition: "r 0.2s ease"
                          }}
                        />
                        
                        {/* Value tooltip on selected */}
                        {isSelected && (
                          <>
                            <rect
                              x={c.x - 38}
                              y={c.y - 32}
                              width="76"
                              height="22"
                              rx="6"
                              fill="var(--blue)"
                            />
                            <text
                              x={c.x}
                              y={c.y - 17}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize="11"
                              fontWeight="700"
                              fontFamily="Nunito Sans, system-ui, sans-serif"
                            >
                              {fmtKc(c.nw)}
                            </text>
                          </>
                        )}
                        
                        {/* X-axis labels */}
                        <text
                          x={c.x}
                          y={height + 8}
                          textAnchor="middle"
                          fill={isActive ? "var(--blue)" : "var(--text3)"}
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="Nunito Sans, system-ui, sans-serif"
                        >
                          {c.label}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
          </div>
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
  // Barevná paleta pro aktiva (různé odstíny zelené/modré/žluté)
  const AKTIVA_COLORS = [
    "#34c759", // zelená
    "#30d158", // světle zelená
    "#32ade6", // modrá
    "#64d2ff", // světle modrá
    "#ffd60a", // žlutá
    "#ff9f0a", // oranžová
    "#bf5af2", // fialová
    "#ac8e68", // zlatá
    "#5e5ce6", // indigo
    "#00c7be", // tyrkysová
  ];

  // Barevná paleta pro pasiva (různé odstíny červené/oranžové)
  const PASIVA_COLORS = [
    "#ff3b30", // červená
    "#ff453a", // světle červená
    "#ff6961", // lososová
    "#ff9500", // oranžová
    "#ffb340", // světle oranžová
    "#ff2d55", // růžová
    "#d13838", // tmavě červená
  ];

  const totalA = aktiva.reduce((s, i) => s + Number(i.value), 0);
  const totalP = pasiva.reduce((s, i) => s + Number(i.value), 0);
  
  const toPie = (items, total, colors) => {
    // Seřaď položky podle hodnoty (od největší po nejmenší)
    const sorted = [...items].sort((a, b) => Number(b.value) - Number(a.value));
    
    return sorted.map((i, idx) => ({ 
      label: i.name, 
      pct: total > 0 ? Math.round((Number(i.value)/total)*100) : 0, 
      color: i.color || colors[idx % colors.length] // Použij vlastní barvu položky, nebo fallback na paletu
    }))
    .filter(d => d.pct > 0);
  };

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
        {renderSection("Aktiva", totalA, toPie(aktiva, totalA, AKTIVA_COLORS))}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {renderSection("Pasiva", totalP, toPie(pasiva, totalP, PASIVA_COLORS))}
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
