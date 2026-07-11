import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { loadAll, addItem, updateItem, deleteItem, saveGoals, saveAll, getMeta } from "../api/sheets";
import { todayYM } from "../utils/format";

const DEV = import.meta.env.DEV;

const DEFAULT_CATS_A = ["Bankovní účet","Akcie","ETF","Krypto","Nemovitost","Automobil","Dluhopisy","Zlato / kovy","Hotovost","Jiné investice","Ostatní"];
const DEFAULT_CATS_P = ["Hypotéka","Spotřební půjčka","Kreditní karta","Leasing","Studentská půjčka","Jiný dluh","Ostatní"];

// Nelikvidní kategorie — nepočítají se do "Likvidní krytí dluhů".
// Položku lze označit i ručně přes item.illiquid = true (má přednost).
const ILLIQUID_CATS = ["Nemovitost", "Automobil"];

function isIlliquid(item) {
  if (typeof item.illiquid === "boolean") return item.illiquid;
  return ILLIQUID_CATS.some(c => (item.cat || "").toLowerCase().includes(c.toLowerCase()));
}

const LS_KEY = "wealthos_v4";

function loadLS() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveLS(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}
function ensureHistory(items, type = "a") {
  return (items || []).map(item => {
    // Ensure history
    let updated = item;
    if (!item.history || !Array.isArray(item.history)) {
      updated = { ...item, history: item.date && item.value ? [{ date: item.date, value: Number(item.value) }] : [] };
    }
    
    // Ensure color (fallback pro staré položky)
    if (!updated.color) {
      updated = { ...updated, color: type === "a" ? "#34c759" : "#ff3b30" };
    }
    
    return updated;
  });
}

// Helper: Přidá MoM a YoY data k položkám
function enrichWithChanges(items, prevMonth, yoyMonth) {
  return items.map(item => {
    const currentValue = item.value || 0;
    
    // MoM
    const prevHistory = prevMonth ? (item.history || []).find(h => h.date === prevMonth) : null;
    const prevValue = prevHistory ? prevHistory.value : currentValue;
    const mom = currentValue - prevValue;
    const momPct = prevValue !== 0 ? ((mom / prevValue) * 100).toFixed(1) : "0.0";
    
    // YoY (stejný měsíc minulého roku)
    const yoyHistory = yoyMonth ? (item.history || []).find(h => h.date === yoyMonth) : null;
    const yoyValue = yoyHistory ? yoyHistory.value : currentValue;
    const yoy = currentValue - yoyValue;
    const yoyPct = yoyValue !== 0 ? ((yoy / yoyValue) * 100).toFixed(1) : "0.0";
    
    return {
      ...item,
      mom,
      momPct,
      yoy,
      yoyPct
    };
  });
}
function upsertHistory(item, date, value) {
  const history = item.history || [];
  const exists = history.find(h => h.date === date);
  const next = exists
    ? history.map(h => h.date === date ? { date, value: Number(value) } : h)
    : [...history, { date, value: Number(value) }];
  return next.sort((a, b) => a.date.localeCompare(b.date));
}

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

export function useData() {
  const [aktiva,   setAktiva]   = useState([]);
  const [pasiva,   setPasiva]   = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [catsA,    setCatsA]    = useState(DEFAULT_CATS_A);
  const [catsP,    setCatsP]    = useState(DEFAULT_CATS_P);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [toast,    setToast]    = useState(null);
  const [sheetsOk, setSheetsOk] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Timestamp poslední změny na serveru (pro detekci konfliktů)
  const serverLastModifiedRef = useRef(0);

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!SCRIPT_URL) {
        if (DEV) console.warn("WealthOS: VITE_APPS_SCRIPT_URL není nastaveno, offline mód");
        const ls = loadLS();
        if (ls) {
          setAktiva(ensureHistory(ls.aktiva || [], "a"));
          setPasiva(ensureHistory(ls.pasiva || [], "p"));
          setGoals(ls.goals || []);
          setCatsA(ls.catsA || DEFAULT_CATS_A);
          setCatsP(ls.catsP || DEFAULT_CATS_P);
        }
        setLoading(false);
        return;
      }

      try {
        const response = await loadAll();
        const data = response?.data;
        serverLastModifiedRef.current = response?.lastModified || 0;
        setSheetsOk(true);

        const hasSheets = data?.aktiva?.length || data?.pasiva?.length || data?.goals?.length;
        if (hasSheets) {
          setAktiva(ensureHistory(data.aktiva || [], "a"));
          setPasiva(ensureHistory(data.pasiva || [], "p"));
          setGoals(data.goals || []);
        } else {
          // Sheets prázdné — použij lokální data
          const ls = loadLS();
          if (ls) {
            setAktiva(ensureHistory(ls.aktiva || [], "a"));
            setPasiva(ensureHistory(ls.pasiva || [], "p"));
            setGoals(ls.goals || []);
            setCatsA(ls.catsA || DEFAULT_CATS_A);
            setCatsP(ls.catsP || DEFAULT_CATS_P);
          }
        }
      } catch (err) {
        console.error("WealthOS: Sheets nedostupné:", err.message);
        setSheetsOk(false);
        const ls = loadLS();
        if (ls) {
          setAktiva(ensureHistory(ls.aktiva || [], "a"));
          setPasiva(ensureHistory(ls.pasiva || [], "p"));
          setGoals(ls.goals || []);
          setCatsA(ls.catsA || DEFAULT_CATS_A);
          setCatsP(ls.catsP || DEFAULT_CATS_P);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persistuj do localStorage
  useEffect(() => {
    if (!loading) saveLS({ aktiva, pasiva, goals, catsA, catsP });
  }, [aktiva, pasiva, goals, catsA, catsP, loading]);

  // ── Sync helper — vždy zkusí Sheets, bez gate ────────────
  const sync = useCallback(async (apiCall, localFn, msg) => {
    // 1. Okamžitý lokální update
    localFn();

    // 2. Pokud není URL, přeskoč
    if (!SCRIPT_URL) return;

    setSyncing(true);
    try {
      const result = await apiCall();
      // Zaznamenej nový server timestamp (vrací ho každá mutace)
      if (result?.lastModified) serverLastModifiedRef.current = result.lastModified;
      setSheetsOk(true);
      showToast(msg);
    } catch (err) {
      console.error("WealthOS: Sheets chyba:", err.message);
      setSheetsOk(false);
      showToast("Sheets chyba: " + err.message, "error");
    } finally {
      setSyncing(false);
    }
  }, [showToast]); // ZÁMĚRNĚ bez sheetsOk — vždy zkusí

  // ── AKTIVA ─────────────────────────────────────────────────
  const addAktivum = useCallback((item) => {
    const withHistory = { ...item, history: [{ date: item.date, value: Number(item.value) }] };
    sync(
      () => addItem("a", withHistory),
      () => setAktiva(p => [...p, withHistory]),
      "Aktivum přidáno ✓"
    );
  }, [sync]);

  const updateAktivum = useCallback((item) => {
    const newHistory = upsertHistory(item, item.date, item.value);
    const updated = { ...item, history: newHistory };
    sync(
      () => updateItem("a", updated),
      () => setAktiva(p => p.map(x => x.id === item.id ? updated : x)),
      "Aktivum aktualizováno ✓"
    );
  }, [sync]);

  const updateAktivumHistory = useCallback((itemId, oldDate, newDate, newValue) => {
    setAktiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || [])
        .filter(h => h.date !== oldDate)
        .concat({ date: newDate, value: Number(newValue) })
        .sort((a, b) => a.date.localeCompare(b.date));
      const latest = history[history.length - 1];
      const updated = { ...item, history, value: latest.value, date: latest.date };
      // Sync do Sheets
      if (SCRIPT_URL) {
        updateItem("a", updated).catch(err =>
          console.error("WealthOS: History sync chyba:", err.message)
        );
      }
      return updated;
    }));
    showToast("Záznam aktualizován ✓");
  }, [showToast]);

  const deleteAktivumHistory = useCallback((itemId, date) => {
    setAktiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || []).filter(h => h.date !== date);
      const latest = history[history.length - 1];
      const updated = { ...item, history, value: latest?.value || item.value, date: latest?.date || item.date };
      if (SCRIPT_URL) {
        updateItem("a", updated).catch(err =>
          console.error("WealthOS: History delete sync chyba:", err.message)
        );
      }
      return updated;
    }));
    showToast("Záznam smazán ✓");
  }, [showToast]);

  const deleteAktivum = useCallback((id) => {
    sync(
      () => deleteItem("a", id),
      () => setAktiva(p => p.filter(x => x.id !== id)),
      "Aktivum smazáno ✓"
    );
  }, [sync]);

  // ── PASIVA ─────────────────────────────────────────────────
  const addPasivum = useCallback((item) => {
    const withHistory = { ...item, history: [{ date: item.date, value: Number(item.value) }] };
    sync(
      () => addItem("p", withHistory),
      () => setPasiva(p => [...p, withHistory]),
      "Pasivum přidáno ✓"
    );
  }, [sync]);

  const updatePasivum = useCallback((item) => {
    const newHistory = upsertHistory(item, item.date, item.value);
    const updated = { ...item, history: newHistory };
    sync(
      () => updateItem("p", updated),
      () => setPasiva(p => p.map(x => x.id === item.id ? updated : x)),
      "Pasivum aktualizováno ✓"
    );
  }, [sync]);

  const updatePasivumHistory = useCallback((itemId, oldDate, newDate, newValue) => {
    setPasiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || [])
        .filter(h => h.date !== oldDate)
        .concat({ date: newDate, value: Number(newValue) })
        .sort((a, b) => a.date.localeCompare(b.date));
      const latest = history[history.length - 1];
      const updated = { ...item, history, value: latest.value, date: latest.date };
      if (SCRIPT_URL) {
        updateItem("p", updated).catch(err =>
          console.error("WealthOS: History sync chyba:", err.message)
        );
      }
      return updated;
    }));
    showToast("Záznam aktualizován ✓");
  }, [showToast]);

  const deletePasivumHistory = useCallback((itemId, date) => {
    setPasiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || []).filter(h => h.date !== date);
      const latest = history[history.length - 1];
      const updated = { ...item, history, value: latest?.value || item.value, date: latest?.date || item.date };
      if (SCRIPT_URL) {
        updateItem("p", updated).catch(err =>
          console.error("WealthOS: History delete sync chyba:", err.message)
        );
      }
      return updated;
    }));
    showToast("Záznam smazán ✓");
  }, [showToast]);

  const deletePasivum = useCallback((id) => {
    sync(
      () => deleteItem("p", id),
      () => setPasiva(p => p.filter(x => x.id !== id)),
      "Pasivum smazáno ✓"
    );
  }, [sync]);

  // ── GOALS ──────────────────────────────────────────────────
  const updateGoals = useCallback((newGoals) => {
    sync(
      () => saveGoals(newGoals),
      () => setGoals(newGoals),
      "Cíle uloženy ✓"
    );
  }, [sync]);

  // ── KATEGORIE ─────────────────────────────────────────────
  const addCat    = useCallback((type, name) => {
    if (type === "a") setCatsA(p => [...p, name]);
    else setCatsP(p => [...p, name]);
  }, []);
  const deleteCat = useCallback((type, name) => {
    if (type === "a") setCatsA(p => p.filter(c => c !== name));
    else setCatsP(p => p.filter(c => c !== name));
  }, []);

  // ── EXPORT / IMPORT ────────────────────────────────────────
  const exportData = useCallback(() => {
    // CSV formát: type,id,icon,name,cat,value,color,date,history
    const header = "type,id,icon,name,cat,value,color,date,history";
    
    const aktivaRows = aktiva.map(item => {
      const historyJson = JSON.stringify(item.history || []).replace(/"/g, '""'); // Escape quotes
      return `a,"${item.id}","${item.icon}","${item.name}","${item.cat}",${item.value},"${item.color}","${item.date}","${historyJson}"`;
    });
    
    const pasivaRows = pasiva.map(item => {
      const historyJson = JSON.stringify(item.history || []).replace(/"/g, '""');
      return `p,"${item.id}","${item.icon}","${item.name}","${item.cat}",${item.value},"${item.color}","${item.date}","${historyJson}"`;
    });
    
    // Goals jako separate řádky s type="goal"
    const goalRows = goals.map(g => 
      `goal,"${g.id}","","${g.name}","",${g.target},"${g.colorClass}","",""`
    );
    
    // Kategorie jako separate řádky
    const catARows = catsA.map(c => `cat_a,"${c}","","","",0,"","",""`);
    const catPRows = catsP.map(c => `cat_p,"${c}","","","",0,"","",""`);
    
    const csv = [header, ...aktivaRows, ...pasivaRows, ...goalRows, ...catARows, ...catPRows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wealthos-backup-${todayYM()}.csv`;
    a.click();
    showToast("Data exportována do CSV ✓");
  }, [aktiva, pasiva, goals, catsA, catsP, showToast]);

  const importData = useCallback((file) => {
    const r = new FileReader();
    r.onload = async (ev) => {
      try {
        const content = ev.target.result;
        let imported = { aktiva: [], pasiva: [], goals: [], catsA: [], catsP: [] };
        
        // Detekuj formát podle obsahu
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          // JSON formát
          const d = JSON.parse(content);
          imported = {
            aktiva: ensureHistory(d.aktiva || [], "a"),
            pasiva: ensureHistory(d.pasiva || [], "p"),
            goals: d.goals || [],
            catsA: d.catsA || DEFAULT_CATS_A,
            catsP: d.catsP || DEFAULT_CATS_P
          };
          showToast("Data importována z JSON ✓");
        } else {
          // CSV formát
          const lines = content.split("\n").filter(l => l.trim());
          
          const newAktiva = [];
          const newPasiva = [];
          const newGoals = [];
          const newCatsA = [];
          const newCatsP = [];
          
          // Simple CSV parser that handles quoted fields
          const parseCSVLine = (line) => {
            const fields = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              const next = line[i + 1];
              
              if (char === '"' && !inQuotes) {
                inQuotes = true;
              } else if (char === '"' && inQuotes) {
                if (next === '"') {
                  current += '"';
                  i++; // Skip next quote
                } else {
                  inQuotes = false;
                }
              } else if (char === ',' && !inQuotes) {
                fields.push(current);
                current = '';
              } else {
                current += char;
              }
            }
            fields.push(current); // Last field
            return fields;
          };
          
          for (let i = 1; i < lines.length; i++) {
            const fields = parseCSVLine(lines[i]);
            const [type, id, icon, name, cat, value, color, date, historyStr] = fields;
            
            if (type === "a") {
              const history = historyStr ? JSON.parse(historyStr) : [];
              newAktiva.push({ id, icon, name, cat, value: Number(value), color, date, history });
            } else if (type === "p") {
              const history = historyStr ? JSON.parse(historyStr) : [];
              newPasiva.push({ id, icon, name, cat, value: Number(value), color, date, history });
            } else if (type === "goal") {
              newGoals.push({ id, name, target: Number(value), colorClass: color });
            } else if (type === "cat_a") {
              newCatsA.push(id);
            } else if (type === "cat_p") {
              newCatsP.push(id);
            }
          }
          
          imported = {
            aktiva: ensureHistory(newAktiva, "a"),
            pasiva: ensureHistory(newPasiva, "p"),
            goals: newGoals,
            catsA: newCatsA.length ? newCatsA : DEFAULT_CATS_A,
            catsP: newCatsP.length ? newCatsP : DEFAULT_CATS_P
          };
          showToast(`Import: ${newAktiva.length} aktiv, ${newPasiva.length} pasiv ✓`);
        }
        
        // Nastav state
        setAktiva(imported.aktiva);
        setPasiva(imported.pasiva);
        setGoals(imported.goals);
        setCatsA(imported.catsA);
        setCatsP(imported.catsP);
        
        // Synchronizuj do Sheets pokud je připojeno
        if (SCRIPT_URL) {
          try {
            // Detekce konfliktu: změnil někdo data v Sheets od našeho načtení?
            // (např. z jiného zařízení) — saveAll je přepíše, tak radši varuj.
            try {
              const meta = await getMeta();
              const serverTs = meta?.lastModified || 0;
              if (serverTs > serverLastModifiedRef.current) {
                const proceed = window.confirm(
                  "⚠️ Pozor: data v Google Sheets byla mezitím změněna " +
                  "(pravděpodobně z jiného zařízení).\n\n" +
                  "Import je PŘEPÍŠE. Pokračovat?\n\n" +
                  "(Zrušit = import zůstane jen lokálně, Sheets se nezmění)"
                );
                if (!proceed) {
                  showToast("Import uložen jen lokálně, Sheets nezměněny", "error");
                  return;
                }
              }
            } catch {
              // getMeta selhal (starý Apps Script bez getMeta) — pokračuj bez kontroly
            }

            const result = await saveAll(imported);
            if (result?.lastModified) serverLastModifiedRef.current = result.lastModified;
            setSheetsOk(true);
            showToast("✅ Data synchronizována do Google Sheets");
          } catch (err) {
            console.error("Sheets sync error:", err);
            showToast("⚠️ Import OK, ale Sheets sync selhal: " + err.message, "error");
          }
        }
      } catch (err) {
        console.error("Import error:", err);
        showToast("Chyba při importu: " + err.message, "error");
      }
    };
    r.readAsText(file);
  }, [showToast]);

  // ── Computed ──────────────────────────────────────────────
  // Vše odvozené z aktiv/pasiv se počítá jen když se aktiva/pasiva změní,
  // ne při každém renderu (toast, syncing, atd.).
  const computed = useMemo(() => {
    const totalA   = aktiva.reduce((s, i) => s + Number(i.value), 0);
    const totalP   = pasiva.reduce((s, i) => s + Number(i.value), 0);
    const netWorth = totalA - totalP;

    // Helper: součet hodnot položek pro daný měsíc
    const sumAt = (items, ym) => items.reduce((s, i) => {
      const h = (i.history || []).find(x => x.date === ym);
      return s + (h ? h.value : 0);
    }, 0);

    const allDates = [...new Set([
      ...aktiva.flatMap(i => (i.history || []).map(h => h.date)),
      ...pasiva.flatMap(i => (i.history || []).map(h => h.date)),
    ])].sort();

    const prevMonth = allDates.length >= 2 ? allDates[allDates.length - 2] : null;
    const prevNW = prevMonth ? sumAt(aktiva, prevMonth) - sumAt(pasiva, prevMonth) : netWorth;
    const diff    = netWorth - prevNW;
    const diffPct = prevNW !== 0 ? ((diff / prevNW) * 100).toFixed(1) : "0.0";

    // YTD (Year-to-date)
    const currentYear = new Date().getFullYear().toString();
    const ytdStartMonth = allDates.find(d => d.startsWith(currentYear + "-"));
    const ytdStartNW = ytdStartMonth
      ? sumAt(aktiva, ytdStartMonth) - sumAt(pasiva, ytdStartMonth)
      : netWorth;
    const ytdDiff = netWorth - ytdStartNW;
    const ytdDiffPct = ytdStartNW !== 0 ? ((ytdDiff / ytdStartNW) * 100).toFixed(1) : "0.0";

    // YoY (Year-over-Year) — stejný měsíc minulého roku
    const currentYM = todayYM();
    const [year, month] = currentYM.split("-");
    const lastYearSameMonth = `${parseInt(year) - 1}-${month}`;
    const yoyMonth = allDates.includes(lastYearSameMonth) ? lastYearSameMonth : null;

    // MoM a YoY pro aktiva a pasiva zvlášť
    const prevTotalA = prevMonth ? sumAt(aktiva, prevMonth) : totalA;
    const prevTotalP = prevMonth ? sumAt(pasiva, prevMonth) : totalP;
    const aktivaMoM = totalA - prevTotalA;
    const aktivaMoMPct = prevTotalA !== 0 ? ((aktivaMoM / prevTotalA) * 100).toFixed(1) : "0.0";
    const pasivaMoM = totalP - prevTotalP;
    const pasivaMoMPct = prevTotalP !== 0 ? ((pasivaMoM / prevTotalP) * 100).toFixed(1) : "0.0";

    const yoyTotalA = yoyMonth ? sumAt(aktiva, yoyMonth) : totalA;
    const yoyTotalP = yoyMonth ? sumAt(pasiva, yoyMonth) : totalP;
    const aktivaYoY = totalA - yoyTotalA;
    const aktivaYoYPct = yoyTotalA !== 0 ? ((aktivaYoY / yoyTotalA) * 100).toFixed(1) : "0.0";
    const pasivaYoY = totalP - yoyTotalP;
    const pasivaYoYPct = yoyTotalP !== 0 ? ((pasivaYoY / yoyTotalP) * 100).toFixed(1) : "0.0";

    // Finanční indikátory
    const assetLiabilityRatio = totalP > 0 ? (totalA / totalP).toFixed(2) : "∞";

    // Likvidní krytí dluhů — vyloučí nelikvidní položky (nemovitosti, auta…)
    const illiquidValue = aktiva
      .filter(isIlliquid)
      .reduce((s, i) => s + Number(i.value), 0);
    const liquidAssets = totalA - illiquidValue;
    const liquidityCoverageRatio = totalP > 0 ? (liquidAssets / totalP).toFixed(2) : "∞";

    // Obohať položky o MoM a YoY data
    const aktivaWithChanges = enrichWithChanges(aktiva, prevMonth, yoyMonth);
    const pasivaWithChanges = enrichWithChanges(pasiva, prevMonth, yoyMonth);

    const availableMonths = [...allDates].reverse();

    // Historie pro graf
    const historyData = availableMonths.map(date => {
      const monthTotalA = sumAt(aktiva, date);
      const monthTotalP = sumAt(pasiva, date);
      return { date, totalA: monthTotalA, totalP: monthTotalP, netWorth: monthTotalA - monthTotalP };
    }).reverse();

    return {
      totalA, totalP, netWorth, diff, diffPct,
      ytdDiff, ytdDiffPct,
      aktivaMoM, aktivaMoMPct, pasivaMoM, pasivaMoMPct,
      aktivaYoY, aktivaYoYPct, pasivaYoY, pasivaYoYPct,
      assetLiabilityRatio, liquidityCoverageRatio,
      aktivaWithChanges, pasivaWithChanges,
      availableMonths, historyData,
    };
  }, [aktiva, pasiva]);

  return {
    aktiva: computed.aktivaWithChanges,
    pasiva: computed.pasivaWithChanges,
    goals, catsA, catsP,
    loading, syncing, toast, sheetsOk,
    totalA: computed.totalA, totalP: computed.totalP, netWorth: computed.netWorth,
    diff: computed.diff, diffPct: computed.diffPct,
    ytdDiff: computed.ytdDiff, ytdDiffPct: computed.ytdDiffPct,
    aktivaMoM: computed.aktivaMoM, aktivaMoMPct: computed.aktivaMoMPct,
    pasivaMoM: computed.pasivaMoM, pasivaMoMPct: computed.pasivaMoMPct,
    aktivaYoY: computed.aktivaYoY, aktivaYoYPct: computed.aktivaYoYPct,
    pasivaYoY: computed.pasivaYoY, pasivaYoYPct: computed.pasivaYoYPct,
    assetLiabilityRatio: computed.assetLiabilityRatio,
    liquidityCoverageRatio: computed.liquidityCoverageRatio,
    availableMonths: computed.availableMonths,
    historyData: computed.historyData,
    addAktivum, updateAktivum, deleteAktivum,
    updateAktivumHistory, deleteAktivumHistory,
    addPasivum, updatePasivum, deletePasivum,
    updatePasivumHistory, deletePasivumHistory,
    updateGoals,
    addCat, deleteCat,
    exportData, importData,
  };
}
