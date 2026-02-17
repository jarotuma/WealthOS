import { useState, useEffect, useCallback } from "react";
import { loadAll, addItem, updateItem, deleteItem, saveGoals } from "../api/sheets";
import { todayYM } from "../utils/format";

const DEFAULT_CATS_A = ["Bankovní účet","Akcie","ETF","Krypto","Nemovitost","Automobil","Dluhopisy","Zlato / kovy","Hotovost","Jiné investice","Ostatní"];
const DEFAULT_CATS_P = ["Hypotéka","Spotřební půjčka","Kreditní karta","Leasing","Studentská půjčka","Jiný dluh","Ostatní"];

const LS_KEY = "wealthos_v4";

function loadLS() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveLS(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// Zajistí, že každá položka má history pole
function ensureHistory(items) {
  return items.map(item => {
    if (!item.history) {
      return { ...item, history: item.date && item.value ? [{ date: item.date, value: Number(item.value) }] : [] };
    }
    return item;
  });
}

// Přidá nebo aktualizuje záznam v historii položky
function upsertHistory(item, date, value) {
  const history = item.history || [];
  const exists = history.find(h => h.date === date);
  const newHistory = exists
    ? history.map(h => h.date === date ? { date, value: Number(value) } : h)
    : [...history, { date, value: Number(value) }];
  // Seřadit chronologicky
  return newHistory.sort((a, b) => a.date.localeCompare(b.date));
}

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
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await loadAll();
        if (data && (data.aktiva?.length || data.pasiva?.length)) {
          setAktiva(ensureHistory(data.aktiva || []));
          setPasiva(ensureHistory(data.pasiva || []));
          setGoals(data.goals || []);
          setSheetsOk(true);
        } else throw new Error("prázdná");
      } catch {
        const ls = loadLS();
        if (ls) {
          setAktiva(ensureHistory(ls.aktiva || []));
          setPasiva(ensureHistory(ls.pasiva || []));
          setGoals(ls.goals || []);
          setCatsA(ls.catsA || DEFAULT_CATS_A);
          setCatsP(ls.catsP || DEFAULT_CATS_P);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!loading) saveLS({ aktiva, pasiva, goals, catsA, catsP });
  }, [aktiva, pasiva, goals, catsA, catsP, loading]);

  // ── Sync helper ───────────────────────────────────────────
  const sync = useCallback(async (apiCall, localFn, msg) => {
    localFn();
    if (!sheetsOk) return;
    setSyncing(true);
    try { await apiCall(); showToast(msg); }
    catch (e) { showToast("Sheets: " + e.message, "error"); }
    finally { setSyncing(false); }
  }, [sheetsOk, showToast]);

  // ── AKTIVA ─────────────────────────────────────────────────
  const addAktivum = useCallback((item) => {
    const withHistory = { ...item, history: [{ date: item.date, value: Number(item.value) }] };
    sync(() => addItem("a", withHistory), () => setAktiva(p => [...p, withHistory]), "Aktivum přidáno");
  }, [sync]);

  const updateAktivum = useCallback((item) => {
    // Aktualizuje hodnotu + přidá/updatuje záznam v historii
    const newHistory = upsertHistory(item, item.date, item.value);
    const updated = { ...item, history: newHistory };
    sync(() => updateItem("a", updated), () => setAktiva(p => p.map(x => x.id === item.id ? updated : x)), "Aktivum aktualizováno");
  }, [sync]);

  // Editace záznamu přímo v historii (jen date + value záznamu)
  const updateAktivumHistory = useCallback((itemId, oldDate, newDate, newValue) => {
    setAktiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || [])
        .filter(h => h.date !== oldDate)
        .concat({ date: newDate, value: Number(newValue) })
        .sort((a, b) => a.date.localeCompare(b.date));
      // Aktualizuj i current value pokud jde o nejnovější záznam
      const latest = history[history.length - 1];
      return { ...item, history, value: latest.value, date: latest.date };
    }));
    showToast("Záznam aktualizován");
  }, [showToast]);

  const deleteAktivumHistory = useCallback((itemId, date) => {
    setAktiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || []).filter(h => h.date !== date);
      const latest = history[history.length - 1];
      return { ...item, history, value: latest?.value || item.value, date: latest?.date || item.date };
    }));
    showToast("Záznam smazán");
  }, [showToast]);

  const deleteAktivum = useCallback((id) => {
    sync(() => deleteItem("a", id), () => setAktiva(p => p.filter(x => x.id !== id)), "Aktivum smazáno");
  }, [sync]);

  // ── PASIVA ─────────────────────────────────────────────────
  const addPasivum = useCallback((item) => {
    const withHistory = { ...item, history: [{ date: item.date, value: Number(item.value) }] };
    sync(() => addItem("p", withHistory), () => setPasiva(p => [...p, withHistory]), "Pasivum přidáno");
  }, [sync]);

  const updatePasivum = useCallback((item) => {
    const newHistory = upsertHistory(item, item.date, item.value);
    const updated = { ...item, history: newHistory };
    sync(() => updateItem("p", updated), () => setPasiva(p => p.map(x => x.id === item.id ? updated : x)), "Pasivum aktualizováno");
  }, [sync]);

  const updatePasivumHistory = useCallback((itemId, oldDate, newDate, newValue) => {
    setPasiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || [])
        .filter(h => h.date !== oldDate)
        .concat({ date: newDate, value: Number(newValue) })
        .sort((a, b) => a.date.localeCompare(b.date));
      const latest = history[history.length - 1];
      return { ...item, history, value: latest.value, date: latest.date };
    }));
    showToast("Záznam aktualizován");
  }, [showToast]);

  const deletePasivumHistory = useCallback((itemId, date) => {
    setPasiva(p => p.map(item => {
      if (item.id !== itemId) return item;
      const history = (item.history || []).filter(h => h.date !== date);
      const latest = history[history.length - 1];
      return { ...item, history, value: latest?.value || item.value, date: latest?.date || item.date };
    }));
    showToast("Záznam smazán");
  }, [showToast]);

  const deletePasivum = useCallback((id) => {
    sync(() => deleteItem("p", id), () => setPasiva(p => p.filter(x => x.id !== id)), "Pasivum smazáno");
  }, [sync]);

  // ── GOALS ──────────────────────────────────────────────────
  const updateGoals = useCallback((newGoals) => {
    sync(() => saveGoals(newGoals), () => setGoals(newGoals), "Cíle uloženy");
  }, [sync]);

  // ── KATEGORIE ─────────────────────────────────────────────
  const addCat    = useCallback((type, name) => { if (type==="a") setCatsA(p=>[...p,name]); else setCatsP(p=>[...p,name]); }, []);
  const deleteCat = useCallback((type, name) => { if (type==="a") setCatsA(p=>p.filter(c=>c!==name)); else setCatsP(p=>p.filter(c=>c!==name)); }, []);

  // ── EXPORT / IMPORT ────────────────────────────────────────
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify({ aktiva, pasiva, goals, catsA, catsP }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "wealthos-backup.json"; a.click();
    showToast("Data exportována");
  }, [aktiva, pasiva, goals, catsA, catsP, showToast]);

  const importData = useCallback((file) => {
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.aktiva)  setAktiva(ensureHistory(d.aktiva));
        if (d.pasiva)  setPasiva(ensureHistory(d.pasiva));
        if (d.goals)   setGoals(d.goals);
        if (d.catsA)   setCatsA(d.catsA);
        if (d.catsP)   setCatsP(d.catsP);
        showToast("Data importována");
      } catch { showToast("Chyba při importu", "error"); }
    };
    r.readAsText(file);
  }, [showToast]);

  // ── Computed ──────────────────────────────────────────────
  const totalA   = aktiva.reduce((s, i) => s + Number(i.value), 0);
  const totalP   = pasiva.reduce((s, i) => s + Number(i.value), 0);
  const netWorth = totalA - totalP;

  // Zjisti předchozí čisté jmění (předposlední měsíc v historii)
  const allDates = [...new Set([
    ...aktiva.flatMap(i => (i.history||[]).map(h => h.date)),
    ...pasiva.flatMap(i => (i.history||[]).map(h => h.date)),
  ])].sort();
  const prevMonth = allDates.length >= 2 ? allDates[allDates.length - 2] : null;
  const prevNW = prevMonth
    ? aktiva.reduce((s,i) => { const h=(i.history||[]).find(x=>x.date===prevMonth); return s+(h?h.value:0); }, 0)
    - pasiva.reduce((s,i) => { const h=(i.history||[]).find(x=>x.date===prevMonth); return s+(h?h.value:0); }, 0)
    : netWorth;
  const diff    = netWorth - prevNW;
  const diffPct = prevNW !== 0 ? ((diff / prevNW) * 100).toFixed(1) : "0.0";

  // Všechny dostupné měsíce v historii (pro History stránku)
  const availableMonths = [...new Set([
    ...aktiva.flatMap(i => (i.history||[]).map(h => h.date)),
    ...pasiva.flatMap(i => (i.history||[]).map(h => h.date)),
  ])].sort().reverse(); // nejnovější první

  return {
    aktiva, pasiva, goals, catsA, catsP,
    loading, syncing, toast, sheetsOk,
    totalA, totalP, netWorth, diff, diffPct,
    availableMonths,
    addAktivum, updateAktivum, deleteAktivum,
    updateAktivumHistory, deleteAktivumHistory,
    addPasivum, updatePasivum, deletePasivum,
    updatePasivumHistory, deletePasivumHistory,
    updateGoals,
    addCat, deleteCat,
    exportData, importData,
  };
}
