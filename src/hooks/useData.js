import { useState, useEffect, useCallback } from "react";
import { loadAll, addItem, updateItem, deleteItem, saveGoals, saveAll } from "../api/sheets";
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
function ensureHistory(items) {
  return (items || []).map(item => {
    if (!item.history || !Array.isArray(item.history)) {
      return { ...item, history: item.date && item.value ? [{ date: item.date, value: Number(item.value) }] : [] };
    }
    return item;
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

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!SCRIPT_URL) {
        console.warn("WealthOS: VITE_APPS_SCRIPT_URL není nastaveno, offline mód");
        const ls = loadLS();
        if (ls) {
          setAktiva(ensureHistory(ls.aktiva || []));
          setPasiva(ensureHistory(ls.pasiva || []));
          setGoals(ls.goals || []);
          setCatsA(ls.catsA || DEFAULT_CATS_A);
          setCatsP(ls.catsP || DEFAULT_CATS_P);
        }
        setLoading(false);
        return;
      }

      try {
        console.log("WealthOS: Načítám data ze Sheets...");
        const data = await loadAll();
        console.log("WealthOS: Sheets odpověděl:", data);
        setSheetsOk(true);

        const hasSheets = data?.aktiva?.length || data?.pasiva?.length || data?.goals?.length;
        if (hasSheets) {
          setAktiva(ensureHistory(data.aktiva || []));
          setPasiva(ensureHistory(data.pasiva || []));
          setGoals(data.goals || []);
          console.log("WealthOS: Data načtena ze Sheets");
        } else {
          // Sheets prázdné — použij lokální data
          const ls = loadLS();
          if (ls) {
            setAktiva(ensureHistory(ls.aktiva || []));
            setPasiva(ensureHistory(ls.pasiva || []));
            setGoals(ls.goals || []);
            setCatsA(ls.catsA || DEFAULT_CATS_A);
            setCatsP(ls.catsP || DEFAULT_CATS_P);
            console.log("WealthOS: Sheets prázdné, používám lokální data");
          }
        }
      } catch (err) {
        console.error("WealthOS: Sheets nedostupné:", err.message);
        setSheetsOk(false);
        const ls = loadLS();
        if (ls) {
          setAktiva(ensureHistory(ls.aktiva || []));
          setPasiva(ensureHistory(ls.pasiva || []));
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
    if (!SCRIPT_URL) {
      console.log("WealthOS: Bez Sheets URL, uloženo jen lokálně");
      return;
    }

    setSyncing(true);
    try {
      console.log("WealthOS: Ukládám do Sheets...");
      await apiCall();
      setSheetsOk(true);
      showToast(msg);
      console.log("WealthOS: Uloženo do Sheets ✓", msg);
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
    console.log("🔄 updateAktivum called with:", item);
    console.log("  Current history:", item.history);
    
    const newHistory = upsertHistory(item, item.date, item.value);
    console.log("  New history after upsert:", newHistory);
    
    const updated = { ...item, history: newHistory };
    console.log("  Final updated object:", updated);
    
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
            aktiva: ensureHistory(d.aktiva || []),
            pasiva: ensureHistory(d.pasiva || []),
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
            aktiva: ensureHistory(newAktiva),
            pasiva: ensureHistory(newPasiva),
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
            console.log("🔄 Synchronizuji importovaná data do Sheets...");
            await saveAll(imported);
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
  const totalA   = aktiva.reduce((s, i) => s + Number(i.value), 0);
  const totalP   = pasiva.reduce((s, i) => s + Number(i.value), 0);
  const netWorth = totalA - totalP;

  const allDates = [...new Set([
    ...aktiva.flatMap(i => (i.history || []).map(h => h.date)),
    ...pasiva.flatMap(i => (i.history || []).map(h => h.date)),
  ])].sort();
  const prevMonth = allDates.length >= 2 ? allDates[allDates.length - 2] : null;
  const prevNW = prevMonth
    ? aktiva.reduce((s, i) => { const h = (i.history || []).find(x => x.date === prevMonth); return s + (h ? h.value : 0); }, 0)
    - pasiva.reduce((s, i) => { const h = (i.history || []).find(x => x.date === prevMonth); return s + (h ? h.value : 0); }, 0)
    : netWorth;
  const diff    = netWorth - prevNW;
  const diffPct = prevNW !== 0 ? ((diff / prevNW) * 100).toFixed(1) : "0.0";

  const availableMonths = [...new Set([
    ...aktiva.flatMap(i => (i.history || []).map(h => h.date)),
    ...pasiva.flatMap(i => (i.history || []).map(h => h.date)),
  ])].sort().reverse();

  // Historie pro graf - pro každý měsíc spočítej totalA, totalP, netWorth
  const historyData = availableMonths.map(date => {
    const monthTotalA = aktiva.reduce((sum, item) => {
      const h = (item.history || []).find(x => x.date === date);
      return sum + (h ? h.value : 0);
    }, 0);
    const monthTotalP = pasiva.reduce((sum, item) => {
      const h = (item.history || []).find(x => x.date === date);
      return sum + (h ? h.value : 0);
    }, 0);
    return {
      date,
      totalA: monthTotalA,
      totalP: monthTotalP,
      netWorth: monthTotalA - monthTotalP,
    };
  }).reverse(); // reverse aby byl chronologický (nejstarší první)

  return {
    aktiva, pasiva, goals, catsA, catsP,
    loading, syncing, toast, sheetsOk,
    totalA, totalP, netWorth, diff, diffPct,
    availableMonths,
    historyData,
    addAktivum, updateAktivum, deleteAktivum,
    updateAktivumHistory, deleteAktivumHistory,
    addPasivum, updatePasivum, deletePasivum,
    updatePasivumHistory, deletePasivumHistory,
    updateGoals,
    addCat, deleteCat,
    exportData, importData,
  };
}
