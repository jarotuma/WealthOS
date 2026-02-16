import { useState, useEffect, useCallback } from "react";
import { loadAll, addItem, updateItem, deleteItem, addSnapshot, saveGoals } from "../api/sheets";
import { todayYM } from "../utils/format";

// ── Výchozí demo data ─────────────────────────────────────────
const DEFAULT_AKTIVA = [
  { id:"1", icon:"🏦", name:"Běžný účet",       cat:"Bankovní účet", value:142000,  color:"#34c759", date:"2026-02" },
  { id:"2", icon:"📈", name:"Akciové portfolio", cat:"Akcie",         value:380000,  color:"#5ac8fa", date:"2026-02" },
  { id:"3", icon:"₿",  name:"Bitcoin",           cat:"Krypto",        value:210000,  color:"#ff9500", date:"2026-01" },
  { id:"4", icon:"🏠", name:"Byt Praha 3",       cat:"Nemovitost",    value:4200000, color:"#0071e3", date:"2026-02" },
  { id:"5", icon:"🚗", name:"Škoda Octavia",     cat:"Automobil",     value:320000,  color:"#af52de", date:"2025-12" },
];
const DEFAULT_PASIVA = [
  { id:"6", icon:"🏦", name:"Hypotéka — byt", cat:"Hypotéka",       value:2800000, color:"#ff3b30", date:"2026-02" },
  { id:"7", icon:"💳", name:"Kreditní karta", cat:"Kreditní karta", value:18000,   color:"#ff6b6b", date:"2026-02" },
  { id:"8", icon:"🚙", name:"Leasing auto",   cat:"Leasing",        value:95000,   color:"#ff9f43", date:"2026-01" },
];
const DEFAULT_HISTORY = [
  { date:"2025-03", netWorth:1340000, totalA:4620000, totalP:3280000, label:"3/25" },
  { date:"2025-04", netWorth:1390000, totalA:4700000, totalP:3310000, label:"4/25" },
  { date:"2025-05", netWorth:1420000, totalA:4740000, totalP:3320000, label:"5/25" },
  { date:"2025-06", netWorth:1380000, totalA:4690000, totalP:3310000, label:"6/25" },
  { date:"2025-07", netWorth:1450000, totalA:4780000, totalP:3330000, label:"7/25" },
  { date:"2025-08", netWorth:1510000, totalA:4850000, totalP:3340000, label:"8/25" },
  { date:"2025-09", netWorth:1560000, totalA:4900000, totalP:3340000, label:"9/25" },
  { date:"2025-10", netWorth:1590000, totalA:4940000, totalP:3350000, label:"10/25" },
  { date:"2025-11", netWorth:1620000, totalA:4960000, totalP:3340000, label:"11/25" },
  { date:"2025-12", netWorth:1640000, totalA:4970000, totalP:3330000, label:"12/25" },
  { date:"2026-01", netWorth:1680000, totalA:5010000, totalP:3330000, label:"1/26" },
];
const DEFAULT_GOALS = [
  { id:"g1", name:"První milion",       target:1000000,  colorClass:"g2" },
  { id:"g2", name:"Finanční svoboda",   target:10000000, colorClass:""   },
  { id:"g3", name:"Cestovní fond",      target:500000,   colorClass:"g3" },
];

const LS_KEY = "wealthos_v2";

function loadLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveLS(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// ── Hook ──────────────────────────────────────────────────────
export function useData() {
  const [aktiva,  setAktivaRaw]  = useState([]);
  const [pasiva,  setPasivaRaw]  = useState([]);
  const [history, setHistory]    = useState([]);
  const [goals,   setGoalsRaw]   = useState([]);
  const [loading, setLoading]    = useState(true);
  const [syncing, setSyncing]    = useState(false);
  const [toast,   setToast]      = useState(null);   // { msg, type }
  const [sheetsOk, setSheetsOk]  = useState(false);

  // ── Toast helper ──────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Init: zkus Sheets, pak localStorage, pak defaults ─────
  useEffect(() => {
    (async () => {
      try {
        const data = await loadAll();
        if (data && (data.aktiva?.length || data.pasiva?.length)) {
          setAktivaRaw(data.aktiva  || DEFAULT_AKTIVA);
          setPasivaRaw(data.pasiva  || DEFAULT_PASIVA);
          setHistory(data.history || DEFAULT_HISTORY);
          setGoalsRaw(data.goals  || DEFAULT_GOALS);
          setSheetsOk(true);
        } else {
          throw new Error("prázdná data");
        }
      } catch {
        // fallback na localStorage
        const ls = loadLS();
        if (ls) {
          setAktivaRaw(ls.aktiva  || DEFAULT_AKTIVA);
          setPasivaRaw(ls.pasiva  || DEFAULT_PASIVA);
          setHistory(ls.history   || DEFAULT_HISTORY);
          setGoalsRaw(ls.goals    || DEFAULT_GOALS);
        } else {
          setAktivaRaw(DEFAULT_AKTIVA);
          setPasivaRaw(DEFAULT_PASIVA);
          setHistory(DEFAULT_HISTORY);
          setGoalsRaw(DEFAULT_GOALS);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Ulož do localStorage při každé změně ──────────────────
  useEffect(() => {
    if (!loading) {
      saveLS({ aktiva, pasiva, history, goals });
    }
  }, [aktiva, pasiva, history, goals, loading]);

  // ── Wrapped settery se Sheets sync ───────────────────────

  const syncAction = useCallback(async (apiCall, localUpdate, successMsg) => {
    localUpdate(); // okamžitá lokální změna (optimistic update)
    if (!sheetsOk) return;
    setSyncing(true);
    try {
      await apiCall();
      showToast(successMsg);
    } catch (e) {
      showToast("Sheets: " + e.message, "error");
    } finally {
      setSyncing(false);
    }
  }, [sheetsOk, showToast]);

  // ── AKTIVA ─────────────────────────────────────────────────

  const addAktivum = useCallback((item) => {
    syncAction(
      () => addItem("a", item),
      () => setAktivaRaw(prev => [...prev, item]),
      "Aktivum přidáno"
    );
  }, [syncAction]);

  const updateAktivum = useCallback((item) => {
    syncAction(
      () => updateItem("a", item),
      () => setAktivaRaw(prev => prev.map(x => x.id === item.id ? item : x)),
      "Aktivum aktualizováno"
    );
  }, [syncAction]);

  const deleteAktivum = useCallback((id) => {
    syncAction(
      () => deleteItem("a", id),
      () => setAktivaRaw(prev => prev.filter(x => x.id !== id)),
      "Aktivum smazáno"
    );
  }, [syncAction]);

  // ── PASIVA ─────────────────────────────────────────────────

  const addPasivum = useCallback((item) => {
    syncAction(
      () => addItem("p", item),
      () => setPasivaRaw(prev => [...prev, item]),
      "Pasivum přidáno"
    );
  }, [syncAction]);

  const updatePasivum = useCallback((item) => {
    syncAction(
      () => updateItem("p", item),
      () => setPasivaRaw(prev => prev.map(x => x.id === item.id ? item : x)),
      "Pasivum aktualizováno"
    );
  }, [syncAction]);

  const deletePasivum = useCallback((id) => {
    syncAction(
      () => deleteItem("p", id),
      () => setPasivaRaw(prev => prev.filter(x => x.id !== id)),
      "Pasivum smazáno"
    );
  }, [syncAction]);

  // ── SNAPSHOT ───────────────────────────────────────────────

  const saveSnapshot = useCallback((totalA, totalP) => {
    const ym  = todayYM();
    const [y, m] = ym.split("-");
    const label = `${parseInt(m)}/${y.slice(2)}`;
    const snapshot = {
      date:     ym,
      netWorth: totalA - totalP,
      totalA,
      totalP,
      label,
    };
    // Přidej jen pokud ještě neexistuje stejný měsíc
    if (history.some(h => h.date === ym)) {
      showToast("Snapshot pro tento měsíc již existuje", "error");
      return;
    }
    syncAction(
      () => addSnapshot(snapshot),
      () => setHistory(prev => [...prev, snapshot]),
      "Snapshot uložen"
    );
  }, [history, syncAction, showToast]);

  // ── GOALS ──────────────────────────────────────────────────

  const updateGoals = useCallback((newGoals) => {
    syncAction(
      () => saveGoals(newGoals),
      () => setGoalsRaw(newGoals),
      "Cíle uloženy"
    );
  }, [syncAction]);

  // ── Export / Import ────────────────────────────────────────

  const exportData = useCallback(() => {
    const data = { aktiva, pasiva, history, goals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wealthos-backup.json";
    a.click();
    showToast("Data exportována");
  }, [aktiva, pasiva, history, goals, showToast]);

  const importData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.aktiva)  setAktivaRaw(d.aktiva);
        if (d.pasiva)  setPasivaRaw(d.pasiva);
        if (d.history) setHistory(d.history);
        if (d.goals)   setGoalsRaw(d.goals);
        showToast("Data importována");
      } catch {
        showToast("Chyba při importu souboru", "error");
      }
    };
    reader.readAsText(file);
  }, [showToast]);

  // ── Computed values ────────────────────────────────────────
  const totalA  = aktiva.reduce((s, i) => s + Number(i.value), 0);
  const totalP  = pasiva.reduce((s, i) => s + Number(i.value), 0);
  const netWorth = totalA - totalP;

  const prevNW  = history.length > 0 ? history[history.length - 1].netWorth : netWorth;
  const diff    = netWorth - prevNW;
  const diffPct = prevNW !== 0 ? ((diff / prevNW) * 100).toFixed(1) : "0.0";

  return {
    // state
    aktiva, pasiva, history, goals,
    loading, syncing, toast, sheetsOk,
    // computed
    totalA, totalP, netWorth, diff, diffPct, prevNW,
    // actions — aktiva
    addAktivum, updateAktivum, deleteAktivum,
    // actions — pasiva
    addPasivum, updatePasivum, deletePasivum,
    // actions — other
    saveSnapshot, updateGoals,
    // import/export
    exportData, importData,
  };
}
