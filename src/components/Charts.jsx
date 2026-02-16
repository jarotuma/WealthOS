// src/components/Charts.jsx
import React from "react";
import { fmtKc } from "../utils/format";

// ── Bar Chart (History) ───────────────────────────────────────
export function HistoryChart({ history, dark }) {
  if (!history || history.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historie čistého jmění</span>
        </div>
        <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          Zatím žádné snapshoty. Klikni na "Uložit měsíční snapshot".
        </div>
      </div>
    );
  }

  const maxNW  = Math.max(...history.map(h => Number(h.netWorth)));
  const minNW  = Math.min(...history.map(h => Number(h.netWorth)));
  const range  = maxNW - minNW || 1;
  const MAX_H  = 100;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Vývoj čistého jmění</span>
        <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>
          {history.length} snapshotů
        </span>
      </div>
      <div style={{ padding: "18px 18px 10px" }}>
        {/* Y-axis labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{fmtKc(minNW)}</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{fmtKc(maxNW)}</span>
        </div>

        {/* Bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 140, paddingBottom: 24, position: "relative" }}>
          {/* Grid lines */}
          {[0.33, 0.66].map((f, i) => (
            <div key={i} style={{
              position: "absolute", left: 0, right: 0, zIndex: 0,
              bottom: `${f * (MAX_H + 18) + 24}px`,
              borderTop: "1px dashed var(--border)",
            }} />
          ))}

          {history.map((h, i) => {
            const barH   = 18 + ((Number(h.netWorth) - minNW) / range) * MAX_H;
            const isLast = i === history.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                <div
                  title={fmtKc(h.netWorth)}
                  style={{
                    width: "100%", height: barH,
                    borderRadius: "5px 5px 0 0",
                    background: isLast
                      ? "var(--blue)"
                      : dark ? "rgba(0,113,227,0.22)" : "rgba(0,113,227,0.14)",
                    transition: "opacity .2s",
                    cursor: "default",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                />
                <span style={{ position: "absolute", bottom: -18, fontSize: 9, color: "var(--text3)", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {h.label || h.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Pie helpers ───────────────────────────────────────────────
function PieSVG({ data, size = 120, centerLabel }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  let start = -Math.PI / 2;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {data.map((d, i) => {
        const pct = Number(d.pct) || 0;
        const angle = (pct / 100) * 2 * Math.PI;
        if (angle < 0.001) return null;
        const end  = start + angle;
        const x1   = cx + r * Math.cos(start + 0.02);
        const y1   = cy + r * Math.sin(start + 0.02);
        const x2   = cx + r * Math.cos(end - 0.02);
        const y2   = cy + r * Math.sin(end - 0.02);
        const large = angle > Math.PI ? 1 : 0;
        const path  = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        start = end;
        return <path key={i} d={path} fill={d.color} opacity={0.9} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.52} fill="var(--surface)" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="700" fontFamily="Nunito Sans">
        {centerLabel}
      </text>
    </svg>
  );
}

function PieSection({ title, total, data }) {
  return (
    <div style={{ padding: 20, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text3)", marginBottom: 14 }}>
        {title} · {fmtKc(total)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <PieSVG data={data} size={110} centerLabel={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
              {/* mini bar */}
              <div style={{ height: 4, width: 50, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${d.pct}%`, background: d.color + "99", borderRadius: 99 }} />
              </div>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)", minWidth: 36, textAlign: "right" }}>
                {d.pct} %
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dual pie chart card ───────────────────────────────────────
export function PieCharts({ aktiva, pasiva }) {
  const totalA = aktiva.reduce((s, i) => s + Number(i.value), 0);
  const totalP = pasiva.reduce((s, i) => s + Number(i.value), 0);

  const toPie = (items, total) =>
    items.map(i => ({
      label: i.name,
      pct:   total > 0 ? Math.round((Number(i.value) / total) * 100) : 0,
      color: i.color || "#888",
    })).filter(d => d.pct > 0);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Rozložení portfolia</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>Asset Allocation</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "none" }}>
        <PieSection title="Aktiva" total={totalA} data={toPie(aktiva, totalA)} />
        <div style={{ borderLeft: "1px solid var(--border)" }}>
          <PieSection title="Pasiva" total={totalP} data={toPie(pasiva, totalP)} />
        </div>
      </div>
    </div>
  );
}

// ── Goals ─────────────────────────────────────────────────────
const GRAD = {
  "":   ["#0071e3", "#5ac8fa"],
  "g2": ["#34c759", "#a8f0bb"],
  "g3": ["#af52de", "#e89fff"],
};
const BORDER_CLR = { "": "#0071e3", "g2": "#34c759", "g3": "#af52de" };

export function GoalsSection({ goals, netWorth, onUpdateGoals }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Finanční cíle</span>
      </div>
      <div style={{ padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
        {goals.map((g, i) => {
          const pct    = Math.min(100, Math.round((netWorth / Number(g.target)) * 100));
          const colors = GRAD[g.colorClass] || GRAD[""];
          const border = BORDER_CLR[g.colorClass] || BORDER_CLR[""];
          return (
            <div key={g.id || i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text3)" }}>
                  {netWorth.toLocaleString("cs-CZ")} / {Number(g.target).toLocaleString("cs-CZ")} Kč
                </span>
              </div>
              {/* Track */}
              <div style={{ height: 7, background: "var(--surface2)", borderRadius: 99, position: "relative", marginBottom: 6, overflow: "visible" }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
                  position: "relative", transition: "width .6s",
                }}>
                  {/* Dot */}
                  <div style={{
                    position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)",
                    width: 13, height: 13, borderRadius: "50%",
                    background: "var(--surface)", border: `2px solid ${border}`,
                    boxShadow: `0 1px 4px ${border}55`,
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
