// ─────────────────────────────────────────────────────────────
//  sheets.js — vše přes GET parametry (Apps Script redirect fix)
//  POST → GET redirect je známý Apps Script bug, proto GET everywhere
// ─────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

async function apiFetch(params) {
  if (!SCRIPT_URL) throw new Error("Chybí VITE_APPS_SCRIPT_URL");

  // Serializuj data jako URL parametr — obejde POST→GET redirect problém
  const url = SCRIPT_URL + "?payload=" + encodeURIComponent(JSON.stringify(params));

  const res = await fetch(url, {
    method: "GET",
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

export async function loadAll() {
  if (!SCRIPT_URL) return null;
  return apiFetch({ action: "fetchAll" }).then(r => r.data);
}

export async function addItem(type, item) {
  return apiFetch({ action: "addItem", type, item });
}

export async function updateItem(type, item) {
  console.log("📤 API updateItem called:", { type, item });
  console.log("  item.history:", item.history);
  const result = await apiFetch({ action: "updateItem", type, item });
  console.log("📥 API updateItem response:", result);
  return result;
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
