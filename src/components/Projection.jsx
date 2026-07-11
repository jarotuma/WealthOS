import React, { useState, useMemo } from "react";
import { fmtKc } from "../utils/format";

// Lineární regrese metodou nejmenších čtverců.
// Vrací { slope, intercept, r2 } — slope = průměrný růst za měsíc.
function linearRegression(values) {
  const n = values.length;
  if (n < 2) return null;

  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;

  const slope = num / den;
  const intercept = meanY - slope * meanX;

  // R² — jak dobře přímka sedí na data (0 = vůbec, 1 = perfektně)
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssRes += (values[i] - pred) ** 2;
    ssTot += (values[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// "2026-04" + 8 měsíců → "12/2026"
function addMonths(ym, count) {
  const [y, m] = ym.split("-").map(Number);
  const total = (y * 12 + (m - 1)) + count;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${nm}/${ny}`;
}

export function NetWorthProjection({ historyData, netWorth, goals = [] }) {
  const [horizon, setHorizon] = useState(12); // měsíců dopředu

  const model = useMemo(() => {
    if (!historyData || historyData.length < 3) return null;
    const values = historyData.map(h => h.netWorth);
    const reg = linearRegression(values);
    if (!reg) return null;
    return { ...reg, lastYm: historyData[historyData.length - 1].date, n: values.length };
  }, [historyData]);

  // Potřebujeme aspoň 3 měsíce dat, aby projekce dávala smysl
  if (!model) {
    return (
      <div className="card" style={{ padding: "18px 20px", marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", color: "var(--text3)", marginBottom: 8,
        }}>
          📈 Projekce čistého jmění
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.5 }}>
          Potřebuji aspoň 3 měsíce historie. Aktualizuj položky několik měsíců
          po sobě a projekce se objeví sama.
        </div>
      </div>
    );
  }

  const { slope, r2, lastYm, n } = model;
  const projected = netWorth + slope * horizon;
  const growing = slope >= 0;

  // Spolehlivost odhadu podle R²
  const reliability =
    r2 >= 0.9 ? { label: "Vysoká", color: "var(--green)" } :
    r2 >= 0.6 ? { label: "Střední", color: "var(--text2)" } :
                { label: "Nízká",  color: "var(--red)" };

  // Kdy dosáhnu jednotlivých cílů?
  const goalEta = goals
    .map(g => {
      const target = Number(g.target) || 0;
      if (target <= netWorth) return { ...g, reached: true };
      if (slope <= 0) return { ...g, reached: false, months: null };
      const months = Math.ceil((target - netWorth) / slope);
      if (months > 600) return { ...g, reached: false, months: null }; // >50 let = nesmysl
      return { ...g, reached: false, months, eta: addMonths(lastYm, months) };
    })
    .filter(g => !g.reached && g.months)
    .slice(0, 3);

  const HORIZONS = [6, 12, 36];

  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12, flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", color: "var(--text3)",
        }}>
          📈 Projekce čistého jmění
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {HORIZONS.map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                background: horizon === h ? "var(--blue)" : "var(--surface2)",
                color: horizon === h ? "#fff" : "var(--text3)",
                border: "none", padding: "4px 9px", borderRadius: 6,
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {h < 12 ? `${h} měs.` : `${h / 12} ${h === 12 ? "rok" : "roky"}`}
            </button>
          ))}
        </div>
      </div>

      {/* Hlavní odhad */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginBottom: 3 }}>
          Odhad na {addMonths(lastYm, horizon)}
        </div>
        <div className="mono" style={{
          fontSize: 24, fontWeight: 800,
          color: growing ? "var(--green)" : "var(--red)",
        }}>
          {fmtKc(Math.max(0, projected))}
        </div>
      </div>

      {/* Metriky */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        paddingTop: 10, borderTop: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 2 }}>
            PRŮMĚRNÝ RŮST / MĚSÍC
          </div>
          <div className="mono" style={{
            fontSize: 13, fontWeight: 700,
            color: growing ? "var(--green)" : "var(--red)",
          }}>
            {growing ? "+" : "−"}{fmtKc(Math.abs(slope))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 2 }}>
            SPOLEHLIVOST
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: reliability.color }}>
            {reliability.label}
            <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginLeft: 4 }}>
              R² {r2.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Kdy dosáhnu cílů */}
      {goalEta.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 6 }}>
            PŘI SOUČASNÉM TEMPU DOSÁHNEŠ
          </div>
          {goalEta.map(g => (
            <div key={g.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: 12, padding: "3px 0",
            }}>
              <span style={{ color: "var(--text2)", fontWeight: 600 }}>{g.name}</span>
              <span className="mono" style={{ color: "var(--blue)", fontWeight: 700 }}>
                {g.eta}
                <span style={{ color: "var(--text3)", fontWeight: 600, marginLeft: 5, fontSize: 10 }}>
                  ({g.months} měs.)
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 10, fontStyle: "italic", lineHeight: 1.4 }}>
        Lineární extrapolace z {n} měsíců historie. Není to předpověď — trh se mění
        a minulý růst nezaručuje budoucí.
      </div>
    </div>
  );
}
