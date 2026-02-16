// ─────────────────────────────────────────────────────────────
//  sheets.js  —  komunikace s Google Apps Script endpointem
//
//  Nastav svou URL po nasazení Apps Scriptu:
//  Apps Script → Deploy → Manage deployments → zkopíruj Web app URL
// ─────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

// ── Základní fetch helper ─────────────────────────────────────
async function apiFetch(body) {
  if (!SCRIPT_URL) {
    throw new Error(
      "Chybí VITE_APPS_SCRIPT_URL. Přidej ho do souboru .env"
    );
  }

  const res = await fetch(SCRIPT_URL, {
    method:  "POST",
    headers: { "Content-Type": "text/plain" }, // Apps Script vyžaduje text/plain (ne application/json) kvůli CORS pre-flightu
    body:    JSON.stringify(body),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Neznámá chyba serveru");
  return json;
}

// ── GET — načti všechna data ──────────────────────────────────
export async function fetchAll() {
  if (!SCRIPT_URL) return null; // tichý návrat pro dev bez URL
  const json = await apiFetch({ action: "fetchAll" });
  return json.data; // { aktiva, pasiva, history, goals }
}

// ── Přidej položku ────────────────────────────────────────────
export async function addItem(type, item) {
  return apiFetch({ action: "addItem", type, item });
}

// ── Aktualizuj položku ────────────────────────────────────────
export async function updateItem(type, item) {
  return apiFetch({ action: "updateItem", type, item });
}

// ── Smaž položku ──────────────────────────────────────────────
export async function deleteItem(type, id) {
  return apiFetch({ action: "deleteItem", type, id });
}

// ── Přidej snapshot do historie ───────────────────────────────
export async function addSnapshot(snapshot) {
  return apiFetch({ action: "addSnapshot", snapshot });
}

// ── Ulož cíle ─────────────────────────────────────────────────
export async function saveGoals(goals) {
  return apiFetch({ action: "saveGoals", goals });
}

// ── Ulož vše najednou (bulk) ──────────────────────────────────
export async function saveAll(data) {
  return apiFetch({ action: "saveAll", ...data });
}

// ── GET pro Apps Script (musí být GET, ne POST) ───────────────
export async function loadAll() {
  if (!SCRIPT_URL) return null;
  const res = await fetch(SCRIPT_URL, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Chyba načítání");
  return json.data;
}
