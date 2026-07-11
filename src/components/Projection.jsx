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

// 17 → "17 měs."  |  110 → "9,2 roku"  |  298 → "24,8 roku"
function fmtHorizon(months) {
  if (months < 24) return `${months} měs.`;
  const years = months / 12;
  return `${years.toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} roku`;
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
  const growing = slope >= 0;

  // Spolehlivost odhadu podle R²
  const reliability =
    r2 >= 0.9 ? { label: "Vysoká", color: "var(--green)" } :
    r2 >= 0.6 ? { label: "Střední", color: "var(--text2)" } :
                { label: "Nízká",  color: "var(--red)" };

  // ── Horizont důvěryhodnosti ────────────────────────────────
  // Nemá smysl extrapolovat 25 let z pár měsíců dat. Strop odvozuji
  // z délky historie (max ~3× tolik, co mám dat) a z kvality fitu (R²).
  // Za tímto horizontem se místo konkrétního data zobrazí "> X let".
  const HORIZON_CAP = 120; // absolutní strop: 10 let
  const qualityFactor = r2 >= 0.9 ? 4 : r2 >= 0.6 ? 3 : 2;
  const maxMonths = Math.min(HORIZON_CAP, Math.max(12, n * qualityFactor));
  const maxYears = Math.round(maxMonths / 12);

  // Vybraný horizont nikdy nepřekročí strop spolehlivosti
  const effHorizon = Math.min(horizon, maxMonths);
  const projected = netWorth + slope * effHorizon;

  // Kulaté milníky — kdy překročím 5 / 10 / 15 / 20 M Kč
  const MILESTONES = [5_000_000, 10_000_000, 15_000_000, 20_000_000];
  const milestoneEta = MILESTONES
    .filter(target => target > netWorth)
    .map(target => {
      if (slope <= 0) return null;
      const months = Math.ceil((target - netWorth) / slope);
      const beyond = months > maxMonths;
      return {
        target,
        months,
        beyond,
        eta: beyond ? null : addMonths(lastYm, months),
        label: `${target / 1_000_000} M Kč`,
      };
    })
    .filter(Boolean);

  // Kdy dosáhnu vlastních cílů? (bez těch, které duplikují milníky výše)
  const goalEta = goals
    .map(g => {
      const target = Number(g.target) || 0;
      if (target <= netWorth) return null;
      if (slope <= 0) return null;
      if (MILESTONES.includes(target)) return null; // už je mezi milníky
      const months = Math.ceil((target - netWorth) / slope);
      const beyond = months > maxMonths;
      return { ...g, months, beyond, eta: beyond ? null : addMonths(lastYm, months) };
    })
    .filter(Boolean)
    .slice(0, 3);

  const HORIZONS = [6, 12, 36, 60];

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
          {HORIZONS.map(h => {
            const disabled = h > maxMonths;
            return (
              <button
                key={h}
                onClick={() => !disabled && setHorizon(h)}
                disabled={disabled}
                title={disabled ? `Nad rámec spolehlivého odhadu (max ${maxYears} let)` : undefined}
                style={{
                  background: horizon === h ? "var(--blue)" : "var(--surface2)",
                  color: horizon === h ? "#fff" : disabled ? "var(--border)" : "var(--text3)",
                  border: "none", padding: "4px 9px", borderRadius: 6,
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.45 : 1,
                }}
              >
                {h < 12 ? `${h} měs.` : `${h / 12} ${h === 12 ? "rok" : h / 12 < 5 ? "roky" : "let"}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hlavní odhad */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginBottom: 3 }}>
          Odhad na {addMonths(lastYm, effHorizon)}
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
            {growing ? "+" : "−"}{fmtKc(Math.round(Math.abs(slope)))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 2 }}>
            SPOLEHLIVOST
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: reliability.color }}>
            {reliability.label}
            <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginLeft: 4 }}>
              R² {r2.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Kulaté milníky */}
      {milestoneEta.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 6 }}>
            MILNÍKY
          </div>
          {milestoneEta.map(m => (
            <div key={m.target} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: 12, padding: "4px 0",
              opacity: m.beyond ? 0.5 : 1,
            }}>
              <span className="mono" style={{ color: "var(--text2)", fontWeight: 700 }}>
                {m.label}
              </span>
              {m.beyond ? (
                <span style={{ color: "var(--text3)", fontWeight: 600, fontSize: 11 }}>
                  za {maxYears}+ let · mimo odhad
                </span>
              ) : (
                <span className="mono" style={{ color: "var(--blue)", fontWeight: 700 }}>
                  {m.eta}
                  <span style={{ color: "var(--text3)", fontWeight: 600, marginLeft: 5, fontSize: 10 }}>
                    ({fmtHorizon(m.months)})
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kdy dosáhnu cílů */}
      {goalEta.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 6 }}>
            PŘI SOUČASNÉM TEMPU DOSÁHNEŠ
          </div>
          {goalEta.map(g => (
            <div key={g.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: 12, padding: "4px 0",
              opacity: g.beyond ? 0.5 : 1,
            }}>
              <span style={{ color: "var(--text2)", fontWeight: 600 }}>{g.name}</span>
              {g.beyond ? (
                <span style={{ color: "var(--text3)", fontWeight: 600, fontSize: 11 }}>
                  za {maxYears}+ let · mimo odhad
                </span>
              ) : (
                <span className="mono" style={{ color: "var(--blue)", fontWeight: 700 }}>
                  {g.eta}
                  <span style={{ color: "var(--text3)", fontWeight: 600, marginLeft: 5, fontSize: 10 }}>
                    ({fmtHorizon(g.months)})
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 10, fontStyle: "italic", lineHeight: 1.4 }}>
        Lineární extrapolace z {n} měsíců historie, spolehlivý horizont ~{maxYears} let.
        Model počítá jen s dosavadním tempem — neúročí výnosy a nezná budoucnost trhu.
      </div>
    </div>
  );
}
