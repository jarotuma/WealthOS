// ─────────────────────────────────────────────────────────────
//  sheets.js — v2: POST s text/plain
//  - Data v těle requestu → žádný limit délky URL
//  - text/plain → žádný CORS preflight (Apps Script ho neumí)
//  - Každá odpověď obsahuje lastModified pro detekci konfliktů
// ─────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

async function apiFetch(params) {
  if (!SCRIPT_URL) throw new Error("Chybí VITE_APPS_SCRIPT_URL");

  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(params),
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error("Neplatná odpověď ze serveru: " + text.slice(0, 100)); }

  if (!json.ok) throw new Error(json.error || "Neznámá chyba");
  return json;
}

// Vrací { data, lastModified }
export async function loadAll() {
  if (!SCRIPT_URL) return null;
  return apiFetch({ action: "fetchAll" });
}

// Lehký dotaz jen na timestamp poslední změny (pro detekci konfliktů)
export async function getMeta() {
  return apiFetch({ action: "getMeta" });
}

export async function addItem(type, item) {
  return apiFetch({ action: "addItem", type, item });
}

export async function updateItem(type, item) {
  return apiFetch({ action: "updateItem", type, item });
}

export async function deleteItem(type, id) {
  return apiFetch({ action: "deleteItem", type, id });
}

export async function saveGoals(goals) {
  return apiFetch({ action: "saveGoals", goals });
}

export async function saveAll(data) {
  return apiFetch({ action: "saveAll", ...data });
}
