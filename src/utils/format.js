export const MONTHS = ["led","úno","bře","dub","kvě","čvn","čvc","srp","zář","říj","lis","pro"];
export const YEARS  = ["2022","2023","2024","2025","2026","2027","2028"];

/** 1 752 000  →  "1,75 M Kč"  |  142 000  →  "142 000 Kč" */
export function fmtKc(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000)
    return (num / 1_000_000).toLocaleString("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " M Kč";
  return num.toLocaleString("cs-CZ") + " Kč";
}

/** Kompaktní pro grafy: 1 752 000 → "1,8 M"  |  842 000 → "842 K"  |  500 → "500" */
export function fmtM(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  if (abs >= 1_000_000)
    return (num / 1_000_000).toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " M";
  if (abs >= 10_000)
    return Math.round(num / 1_000).toLocaleString("cs-CZ") + " K";
  return num.toLocaleString("cs-CZ");
}

/** Čisté číslo pro hero nadpis: 1 752 000  →  "1,75 M"  |  142 000  →  "142 000" */
export function fmtShort(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000)
    return (num / 1_000_000).toLocaleString("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return num.toLocaleString("cs-CZ");
}

/** "2026-02" nebo Date objekt  →  "úno 2026" */
export function fmtDate(d) {
  if (!d) return "—";
  // Pokud je to Date objekt (Google Sheets ho vrací místo stringu)
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-indexed
    return `${MONTHS[m]} ${y}`;
  }
  const s = String(d);
  // Formát "YYYY-MM"
  if (/^\d{4}-\d{2}/.test(s)) {
    const [y, m] = s.split("-");
    const idx = parseInt(m, 10) - 1;
    if (idx >= 0 && idx <= 11) return `${MONTHS[idx]} ${y}`;
  }
  return s;
}

/** Dnešní datum jako "YYYY-MM" */
export function todayYM() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** "2026-02"  →  { year: "2026", month: "02" } */
export function splitYM(ym) {
  const [year = "2026", month = "02"] = String(ym || "").split("-");
  return { year, month: month.padStart(2, "0") };
}

/** { year, month }  →  "2026-02" */
export function joinYM(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
