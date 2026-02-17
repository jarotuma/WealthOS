// ── Diagnostická komponenta — modal ──
import { useState } from "react";

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

export default function Diagnostics({ onClose }) {
  const [log, setLog]     = useState([]);
  const [running, setRunning] = useState(false);

  const add = (msg, type = "info") => setLog(p => [...p, { msg, type, t: new Date().toLocaleTimeString() }]);

  const run = async () => {
    setLog([]);
    setRunning(true);

    // 1. Zkontroluj URL
    add("─── Test 1: URL ───");
    if (!SCRIPT_URL) {
      add("❌ VITE_APPS_SCRIPT_URL není nastavena! Zkontroluj Netlify env vars.", "error");
      setRunning(false);
      return;
    }
    add(`✅ URL nalezena: ${SCRIPT_URL.slice(0, 60)}...`);

    // 2. Prostý GET bez payload
    add("─── Test 2: GET bez payload (fetchAll) ───");
    try {
      const res = await fetch(SCRIPT_URL, { redirect: "follow" });
      add(`HTTP status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      add(`Odpověď (prvních 200 znaků): ${text.slice(0, 200)}`);
      try {
        const json = JSON.parse(text);
        if (json.ok) add("✅ fetchAll funguje! Data: aktiva=" + (json.data?.aktiva?.length || 0) + " pasiva=" + (json.data?.pasiva?.length || 0), "success");
        else add("❌ Server vrátil chybu: " + json.error, "error");
      } catch {
        add("❌ Odpověď není validní JSON — pravděpodobně HTML error page", "error");
      }
    } catch (err) {
      add("❌ Fetch selhal: " + err.message, "error");
    }

    // 3. GET s payload (addItem test)
    add("─── Test 3: GET s payload (test updateItem) ───");
    try {
      const testItem = { id: "__test__", icon: "🧪", name: "Test položka", cat: "Test", value: 1, color: "#ccc", date: "2026-02", history: [] };
      const payload = JSON.stringify({ action: "updateItem", type: "a", item: testItem });
      add(`Payload délka: ${payload.length} znaků`);
      if (payload.length > 2000) add("⚠️ Payload je dlouhý, může překročit URL limit", "warn");

      const url = SCRIPT_URL + "?payload=" + encodeURIComponent(payload);
      const res = await fetch(url, { redirect: "follow" });
      const text = await res.text();
      add(`HTTP status: ${res.status}`);
      add(`Odpověď: ${text.slice(0, 200)}`);
      try {
        const json = JSON.parse(text);
        if (json.ok) add("✅ updateItem funguje!", "success");
        else add("❌ Server chyba: " + json.error, "error");
      } catch {
        add("❌ Odpověď není validní JSON", "error");
      }

      // Smaž testovací položku
      const delUrl = SCRIPT_URL + "?payload=" + encodeURIComponent(JSON.stringify({ action: "deleteItem", type: "a", id: "__test__" }));
      await fetch(delUrl, { redirect: "follow" });
      add("🧹 Test položka smazána");
    } catch (err) {
      add("❌ Test selhal: " + err.message, "error");
    }

    setRunning(false);
    add("─── Diagnostika dokončena ───");
  };

  const colors = { info: "#8aafd4", error: "#ff6b6b", success: "#34c759", warn: "#ff9500" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 9999, width: "min(520px, 90vw)", maxHeight: "70vh", background: "#0d1b2e", border: "1px solid #1a3a5c", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.6)", overflow: "hidden", fontFamily: "monospace", fontSize: 12 }}>
        <div style={{ padding: "10px 16px", background: "#112240", borderBottom: "1px solid #1a3a5c", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#e8f1ff" }}>🔬 WealthOS Diagnostika</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={run} disabled={running}
              style={{ background: "#0071e3", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 12, opacity: running ? 0.5 : 1 }}>
              {running ? "Testuji..." : "▶ Spustit"}
            </button>
            <button onClick={onClose}
              style={{ background: "#1a3a5c", color: "#8aafd4", border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>
              ✕
            </button>
          </div>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "calc(70vh - 60px)", padding: "10px 16px" }}>
          {log.length === 0 && <div style={{ color: "#4a6a8a" }}>Klikni "Spustit" pro diagnostiku připojení ke Google Sheets</div>}
          {log.map((l, i) => (
            <div key={i} style={{ color: colors[l.type] || "#8aafd4", marginBottom: 3 }}>
              <span style={{ color: "#4a6a8a", marginRight: 8 }}>{l.t}</span>{l.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
