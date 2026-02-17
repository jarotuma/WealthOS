import React from "react";
import { fmtShort, fmtKc, todayYM, fmtDate } from "../utils/format";

export function HeroSection({ netWorth, diff, diffPct }) {
  const isPos = diff >= 0;
  const today = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ textAlign: "center", padding: "40px 0 32px", position: "relative" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
      }} />
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 10 }}>
        Čisté jmění · {fmtDate(todayYM())}
      </div>
      <div style={{ fontSize: "clamp(52px,10vw,80px)", fontWeight: 800, letterSpacing: -2, lineHeight: 1, marginBottom: 12 }}>
        <span style={{ fontSize: "0.45em", fontWeight: 600, verticalAlign: "super", marginRight: 4, color: "var(--text2)" }}>Kč</span>
        {fmtShort(netWorth)}
      </div>
      {diff !== 0 && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: isPos ? "var(--green-bg)" : "var(--red-bg)",
          color: isPos ? "var(--green)" : "var(--red)",
          fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 99, marginBottom: 8,
        }}>
          {isPos ? "↑" : "↓"} {fmtKc(Math.abs(diff))} ({Math.abs(diffPct)} %) vs. posledni snapshot
        </div>
      )}
      <div style={{ fontSize: 13, color: "var(--text3)" }}>{today}</div>
    </div>
  );
}

export function StatCards({ totalA, totalP, aktiva, pasiva }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      <div className="card" style={{ padding: "18px 20px", marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>
          Celková aktiva
        </div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--green)" }}>
          {totalA.toLocaleString("cs-CZ")} Kč
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{aktiva.length} položek</div>
      </div>
      <div className="card" style={{ padding: "18px 20px", marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>
          Celková pasiva
        </div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--red)" }}>
          −{totalP.toLocaleString("cs-CZ")} Kč
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{pasiva.length} položek</div>
      </div>
    </div>
  );
}
