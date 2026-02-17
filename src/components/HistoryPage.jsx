import React, { useState, useMemo } from "react";
import { fmtKc, fmtDate, MONTHS, YEARS, splitYM, joinYM } from "../utils/format";

// ── Inline editace záznamu ─────────────────────────────────────
function HistoryRowEdit({ entry, item, type, onSave, onCancel }) {
  const { year, month } = splitYM(entry.date);
  const [val,   setVal]  = useState(String(entry.value));
  const [selM,  setSelM] = useState(month);
  const [selY,  setSelY] = useState(year);
  const isA = type === "a";

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
      background: "var(--surface2)", padding: "10px 14px",
      borderTop: "1px solid var(--border)",
    }}>
      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>Hodnota (Kč):</label>
      <input
        className="inp mono" type="number" value={val}
        onChange={e => setVal(e.target.value)}
        style={{ maxWidth: 150 }} autoFocus
      />
      <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>Měsíc / rok:</label>
      <select className="inp" value={selM} onChange={e => setSelM(e.target.value)} style={{ maxWidth: 82 }}>
        {MONTHS.map((m, i) => <option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
      </select>
      <select className="inp" value={selY} onChange={e => setSelY(e.target.value)} style={{ maxWidth: 84 }}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button
        style={{ background: isA ? "var(--blue)" : "var(--red)", color: "#fff", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "7px 14px", borderRadius: 10, cursor: "pointer" }}
        onClick={() => { if (!val || isNaN(+val)) return; onSave(entry.date, joinYM(selY, selM), +val); }}
      >Uložit</button>
      <button
        style={{ background: "none", border: "1px solid var(--border)", color: "var(--text2)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 10, cursor: "pointer" }}
        onClick={onCancel}
      >Zrušit</button>
    </div>
  );
}

// ── Karta jedné položky s její historií ───────────────────────
function ItemHistoryCard({ item, type, onUpdateHistory, onDeleteHistory }) {
  const [editDate, setEditDate] = useState(null); // date klíč editovaného záznamu
  const isA     = type === "a";
  const color   = isA ? "var(--green)" : "var(--red)";
  const sign    = isA ? "" : "−";
  const history = [...(item.history || [])].sort((a, b) => b.date.localeCompare(a.date)); // nejnovější nahoře

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Item header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", background: (item.color || "#888") + "18", flexShrink: 0 }}>
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{item.cat}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono" style={{ fontSize: 14, fontWeight: 600, color }}>{sign}{fmtKc(item.value)}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>Aktuální hodnota</div>
        </div>
      </div>

      {/* History rows — pevné okno 4 řádky, scroll uvnitř */}
      {history.length === 0 && (
        <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--text3)", textAlign: "center" }}>
          Žádné záznamy
        </div>
      )}
      {history.length > 0 && (
        <div style={{
          maxHeight: 208,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        }}>
          {history.map((entry, i) => {
          const isLatest = i === 0;
          return (
            <div key={entry.date}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr auto auto auto",
                alignItems: "center", gap: 8,
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                background: isLatest ? (isA ? "rgba(52,199,89,0.04)" : "rgba(255,59,48,0.04)") : "transparent",
                transition: "background .1s",
              }}
                onMouseEnter={e => { if (!isLatest) e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isLatest ? (isA ? "rgba(52,199,89,0.04)" : "rgba(255,59,48,0.04)") : "transparent"; }}
              >
                {/* Datum */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {isLatest && (
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: isA ? "var(--green-bg)" : "var(--red-bg)", color: isA ? "var(--green)" : "var(--red)", padding: "2px 6px", borderRadius: 99 }}>
                      aktuální
                    </span>
                  )}
                  <span className="mono" style={{ fontSize: 12, color: isLatest ? "var(--text2)" : "var(--text3)", fontWeight: isLatest ? 600 : 500 }}>
                    {fmtDate(entry.date)}
                  </span>
                </div>

                {/* Změna vs předchozí */}
                <div>
                  {i < history.length - 1 && (() => {
                    const prev   = history[i + 1].value;
                    const change = entry.value - prev;
                    const pct    = prev !== 0 ? ((change / prev) * 100).toFixed(1) : null;
                    const pos    = change >= 0;
                    return (
                      <span className="mono" style={{ fontSize: 11, color: pos ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                        {pos ? "↑" : "↓"} {Math.abs(change).toLocaleString("cs-CZ")} Kč {pct ? `(${Math.abs(pct)} %)` : ""}
                      </span>
                    );
                  })()}
                </div>

                {/* Hodnota */}
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color, whiteSpace: "nowrap" }}>
                  {sign}{fmtKc(entry.value)}
                </div>

                {/* Editace */}
                <button
                  onClick={() => setEditDate(editDate === entry.date ? null : entry.date)}
                  style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: editDate === entry.date ? "var(--blue-bg)" : "var(--surface2)",
                    border: `1px solid ${editDate === entry.date ? "var(--blue)" : "var(--border)"}`,
                    color: editDate === entry.date ? "var(--blue)" : "var(--text3)",
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Upravit
                </button>

                {/* Smazání záznamu */}
                <button
                  onClick={() => { if (history.length <= 1) { alert("Nelze smazat jediný záznam. Smaž celou položku."); return; } if (window.confirm(`Smazat záznam ${fmtDate(entry.date)}?`)) onDeleteHistory(item.id, entry.date); }}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "var(--red-bg)", border: "none",
                    color: "var(--red)", fontSize: 18, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Smazat záznam"
                >×</button>
              </div>

              {/* Inline edit panel */}
              {editDate === entry.date && (
                <HistoryRowEdit
                  entry={entry}
                  item={item}
                  type={type}
                  onSave={(oldDate, newDate, newValue) => {
                    onUpdateHistory(item.id, oldDate, newDate, newValue);
                    setEditDate(null);
                }}
                onCancel={() => setEditDate(null)}
              />
            )}
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}

// ── Hlavní stránka Historie ────────────────────────────────────
export default function HistoryPage({
  aktiva, pasiva, availableMonths,
  onUpdateAHistory, onDeleteAHistory,
  onUpdatePHistory, onDeletePHistory,
}) {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || null);
  const [filterType, setFilterType]       = useState("all"); // all | a | p
  const [search, setSearch]               = useState("");

  // Položky filtrované na vybraný měsíc
  const filteredAktiva = useMemo(() => {
    if (!selectedMonth) return aktiva;
    return aktiva.filter(item => (item.history || []).some(h => h.date === selectedMonth));
  }, [aktiva, selectedMonth]);

  const filteredPasiva = useMemo(() => {
    if (!selectedMonth) return pasiva;
    return pasiva.filter(item => (item.history || []).some(h => h.date === selectedMonth));
  }, [pasiva, selectedMonth]);

  // Součty pro vybraný měsíc
  const monthTotalA = useMemo(() => filteredAktiva.reduce((s, item) => {
    const h = selectedMonth ? (item.history || []).find(x => x.date === selectedMonth) : null;
    return s + (h ? h.value : Number(item.value));
  }, 0), [filteredAktiva, selectedMonth]);

  const monthTotalP = useMemo(() => filteredPasiva.reduce((s, item) => {
    const h = selectedMonth ? (item.history || []).find(x => x.date === selectedMonth) : null;
    return s + (h ? h.value : Number(item.value));
  }, 0), [filteredPasiva, selectedMonth]);

  const monthNW = monthTotalA - monthTotalP;

  // Search filter
  const searchFilter = (item) => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.cat.toLowerCase().includes(search.toLowerCase());

  const showA = filterType !== "p";
  const showP = filterType !== "a";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>

      {/* Záhlaví stránky */}
      <div style={{ padding: "32px 0 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>Historie hodnot</h1>
        <p style={{ fontSize: 14, color: "var(--text2)" }}>Vývoj každé položky v čase — editovatelný přehled záznamu po záznamu</p>
      </div>

      {/* Měsíční selector — horizontální scroll */}
      {availableMonths.length > 0 ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text3)", marginBottom: 10 }}>
              Vyber měsíc
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 4, width: 48, background: "linear-gradient(to left, var(--bg), transparent)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 4, width: 16, background: "linear-gradient(to right, var(--bg), transparent)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
              <button
                onClick={() => setSelectedMonth(null)}
                style={{
                  padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700, flexShrink: 0,
                  background: !selectedMonth ? "var(--blue)" : "var(--surface)",
                  color: !selectedMonth ? "#fff" : "var(--text2)",
                  border: `1.5px solid ${!selectedMonth ? "var(--blue)" : "var(--border)"}`,
                  cursor: "pointer",
                }}
              >
                Vše
              </button>
              {availableMonths.map(ym => (
                <button
                  key={ym}
                  onClick={() => setSelectedMonth(ym)}
                  style={{
                    padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700, flexShrink: 0,
                    background: selectedMonth === ym ? "var(--blue)" : "var(--surface)",
                    color: selectedMonth === ym ? "#fff" : "var(--text2)",
                    border: `1.5px solid ${selectedMonth === ym ? "var(--blue)" : "var(--border)"}`,
                    cursor: "pointer",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {fmtDate(ym)}
                </button>
              ))}
              </div>
            </div>
          </div>

          {/* Součty pro vybraný měsíc */}
          {selectedMonth && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Aktiva", val: monthTotalA, color: "var(--green)", sign: "" },
                { label: "Pasiva", val: monthTotalP, color: "var(--red)",   sign: "−" },
                { label: "Čisté jmění", val: monthNW, color: monthNW >= 0 ? "var(--green)" : "var(--red)", sign: monthNW < 0 ? "−" : "" },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: "14px 18px", marginBottom: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text3)", marginBottom: 6 }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.sign}{fmtKc(Math.abs(s.val))}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filtry + search */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="inp"
              placeholder="Hledat položku…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 220 }}
            />
            {[
              { id: "all", label: "Vše" },
              { id: "a",   label: "Jen aktiva" },
              { id: "p",   label: "Jen pasiva" },
            ].map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id)} style={{
                padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: filterType === f.id ? "var(--blue)" : "var(--surface)",
                color: filterType === f.id ? "#fff" : "var(--text2)",
                border: `1.5px solid ${filterType === f.id ? "var(--blue)" : "var(--border)"}`,
                cursor: "pointer",
              }}>{f.label}</button>
            ))}
          </div>

          {/* AKTIVA */}
          {showA && (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: "var(--green)", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: "var(--green-bg)", color: "var(--green)", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>AKTIVA</span>
                {selectedMonth ? `${filteredAktiva.length} položek v ${fmtDate(selectedMonth)}` : `${aktiva.length} položek celkem`}
              </div>
              {filteredAktiva.filter(searchFilter).length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, padding: "20px 0" }}>
                  Žádná aktiva v tomto měsíci
                </div>
              )}
              {filteredAktiva.filter(searchFilter).map(item => (
                <ItemHistoryCard
                  key={item.id}
                  item={selectedMonth
                    ? { ...item, history: (item.history||[]).filter(h => h.date === selectedMonth) }
                    : item
                  }
                  type="a"
                  onUpdateHistory={onUpdateAHistory}
                  onDeleteHistory={onDeleteAHistory}
                />
              ))}
            </>
          )}

          {/* PASIVA */}
          {showP && (
            <div style={{ marginTop: showA ? 12 : 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: "var(--red)", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: "var(--red-bg)", color: "var(--red)", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>PASIVA</span>
                {selectedMonth ? `${filteredPasiva.length} položek v ${fmtDate(selectedMonth)}` : `${pasiva.length} položek celkem`}
              </div>
              {filteredPasiva.filter(searchFilter).length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, padding: "20px 0" }}>
                  Žádná pasiva v tomto měsíci
                </div>
              )}
              {filteredPasiva.filter(searchFilter).map(item => (
                <ItemHistoryCard
                  key={item.id}
                  item={selectedMonth
                    ? { ...item, history: (item.history||[]).filter(h => h.date === selectedMonth) }
                    : item
                  }
                  type="p"
                  onUpdateHistory={onUpdatePHistory}
                  onDeleteHistory={onDeletePHistory}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Zatím žádná historie</div>
          <div style={{ fontSize: 14, color: "var(--text2)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
            Historie se automaticky vytváří, když přidáš nebo aktualizuješ hodnoty aktiv a pasiv.
            Přidej první položku na hlavní stránce a pak ji aktualizuj.
          </div>
        </div>
      )}
    </div>
  );
}
