import React from "react";
import { fmtShort, fmtKc, todayYM, fmtDate } from "../utils/format";

export function HeroSection({ netWorth, diff, diffPct, ytdDiff, ytdDiffPct }) {
  const isPos = diff >= 0;
  const isYtdPos = ytdDiff >= 0;
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
        {Number(netWorth).toLocaleString("cs-CZ")}
      </div>
      
      {/* Měsíční změna */}
      {diff !== 0 && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: isPos ? "var(--green-bg)" : "var(--red-bg)",
          color: isPos ? "var(--green)" : "var(--red)",
          fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 99, marginBottom: 6,
        }}>
          {isPos ? "↑" : "↓"} {fmtKc(Math.abs(diff))} ({Math.abs(diffPct)} %) vs. poslední snapshot
        </div>
      )}
      
      {/* YTD změna */}
      {ytdDiff !== 0 && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: isYtdPos ? "rgba(52, 199, 89, 0.08)" : "rgba(255, 59, 48, 0.08)",
          color: isYtdPos ? "var(--green)" : "var(--red)",
          fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, marginBottom: 8,
          border: `1px solid ${isYtdPos ? "rgba(52, 199, 89, 0.2)" : "rgba(255, 59, 48, 0.2)"}`,
        }}>
          {isYtdPos ? "↑" : "↓"} {fmtKc(Math.abs(ytdDiff))} ({Math.abs(ytdDiffPct)} %) od začátku roku
        </div>
      )}
      
      <div style={{ fontSize: 13, color: "var(--text3)" }}>{today}</div>
    </div>
  );
}

export function StatCards({ totalA, totalP, aktiva, pasiva, aktivaMoM, aktivaMoMPct, aktivaYoY, aktivaYoYPct, pasivaMoM, pasivaMoMPct, pasivaYoY, pasivaYoYPct }) {
  const isAMoMPos = aktivaMoM >= 0;
  const isAYoYPos = aktivaYoY >= 0;
  const isPMoMPos = pasivaMoM >= 0;
  const isPYoYPos = pasivaYoY >= 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      <div className="card" style={{ padding: "18px 20px", marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>
          Celková aktiva
        </div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--green)" }}>
          {totalA.toLocaleString("cs-CZ")} Kč
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, marginBottom: 8 }}>{aktiva.length} položek</div>
        
        {/* MoM */}
        {aktivaMoM !== 0 && (
          <div style={{ 
            fontSize: 11, 
            color: isAMoMPos ? "var(--green)" : "var(--red)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <span style={{ fontWeight: 600 }}>MoM:</span>
            <span>{isAMoMPos ? "↑" : "↓"} {Math.abs(aktivaMoM).toLocaleString("cs-CZ")} Kč ({Math.abs(aktivaMoMPct)}%)</span>
          </div>
        )}
        
        {/* YoY */}
        {aktivaYoY !== 0 && (
          <div style={{ 
            fontSize: 11, 
            color: isAYoYPos ? "var(--green)" : "var(--red)",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <span style={{ fontWeight: 600 }}>YoY:</span>
            <span>{isAYoYPos ? "↑" : "↓"} {Math.abs(aktivaYoY).toLocaleString("cs-CZ")} Kč ({Math.abs(aktivaYoYPct)}%)</span>
          </div>
        )}
      </div>
      
      <div className="card" style={{ padding: "18px 20px", marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>
          Celková pasiva
        </div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--red)" }}>
          −{totalP.toLocaleString("cs-CZ")} Kč
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, marginBottom: 8 }}>{pasiva.length} položek</div>
        
        {/* MoM */}
        {pasivaMoM !== 0 && (
          <div style={{ 
            fontSize: 11, 
            color: isPMoMPos ? "var(--red)" : "var(--green)", // Obrácené - růst pasiv je špatně
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <span style={{ fontWeight: 600 }}>MoM:</span>
            <span>{isPMoMPos ? "↑" : "↓"} {Math.abs(pasivaMoM).toLocaleString("cs-CZ")} Kč ({Math.abs(pasivaMoMPct)}%)</span>
          </div>
        )}
        
        {/* YoY */}
        {pasivaYoY !== 0 && (
          <div style={{ 
            fontSize: 11, 
            color: isPYoYPos ? "var(--red)" : "var(--green)", // Obrácené - růst pasiv je špatně
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <span style={{ fontWeight: 600 }}>YoY:</span>
            <span>{isPYoYPos ? "↑" : "↓"} {Math.abs(pasivaYoY).toLocaleString("cs-CZ")} Kč ({Math.abs(pasivaYoYPct)}%)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function FinancialRatios({ assetLiabilityRatio, liquidityCoverageRatio }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      <div className="card" style={{ padding: "16px 20px", marginBottom: 0, background: "var(--surface)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Celkový poměr A/P
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
          {assetLiabilityRatio}×
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          na každou 1 Kč dluhu
        </div>
      </div>
      
      <div className="card" style={{ padding: "16px 20px", marginBottom: 0, background: "var(--surface)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Likvidní krytí dluhů
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
          {liquidityCoverageRatio}×
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          bez nemovitostí
        </div>
      </div>
    </div>
  );
}
