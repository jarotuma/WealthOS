import React, { useState, useEffect, useCallback } from "react";

const CACHE_KEY = "wealthos-market-prices";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hodin

// Sanity check ceny zlata v CZK/g. Široký rozsah, aby vydržel roky.
// Chytá jen zjevné chyby jednotek (cena za unci ~90 000, cena v USD ~90).
const GOLD_MIN = 500;
const GOLD_MAX = 20000;

const GOLD_GRAMS = 117; // kolik gramů zlata sleduju

const API_KEY = import.meta.env.VITE_METALS_API_KEY || "KIK51E4DDQVOLBKGAQWR820KGAQWR";

export function MarketPrices() {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.metals.dev/v1/latest?api_key=${API_KEY}&currency=CZK&unit=gram`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();

      // Najdi cenu zlata — API může vracet různé struktury
      let goldPrice =
        data?.metals?.gold ??
        data?.metals?.XAU ??
        data?.metals?.GOLD ??
        data?.rates?.XAU ??
        data?.XAU ??
        null;

      // Fallback: jakýkoliv klíč obsahující "gold" nebo "xau"
      if (goldPrice == null && data?.metals) {
        const key = Object.keys(data.metals)
          .find(k => k.toLowerCase().includes("gold") || k.toLowerCase().includes("xau"));
        if (key) goldPrice = data.metals[key];
      }

      if (typeof goldPrice !== "number" || !isFinite(goldPrice)) {
        throw new Error("API nevrátilo cenu zlata");
      }

      // Autodetekce jednotek
      let perGram = goldPrice;
      if (goldPrice > GOLD_MAX) {
        perGram = goldPrice / 31.1035; // cena za trojskou unci → gram
      } else if (goldPrice < GOLD_MIN) {
        perGram = goldPrice * 23; // pravděpodobně USD → hrubý přepočet na CZK
      }

      if (perGram < GOLD_MIN || perGram > GOLD_MAX) {
        throw new Error(`Cena mimo očekávaný rozsah (${Math.round(perGram)} Kč/g)`);
      }

      const results = {
        gold_czk_1g: perGram,
        gold_czk_117g: perGram * GOLD_GRAMS,
      };

      const timestamp = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: results, timestamp }));
      } catch {
        // localStorage plný/nedostupný — není kritické
      }

      setPrices(results);
      setLastUpdate(new Date(timestamp));
      setLoading(false);
    } catch (err) {
      console.error("MarketPrices:", err);
      setError(err.message || "Nepodařilo se načíst cenu zlata");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Použij cache jen když v ní SKUTEČNĚ je platná cena.
    // (Stará cache mohla obsahovat null z dřívějšího neúspěšného načtení.)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        const isValid = typeof data?.gold_czk_1g === "number" && data.gold_czk_1g > 0;

        if (isValid && age < CACHE_DURATION) {
          setPrices(data);
          setLastUpdate(new Date(timestamp));
          setLoading(false);
          return;
        }
        // Neplatná nebo prošlá cache → zahoď a načti znovu
        localStorage.removeItem(CACHE_KEY);
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }

    fetchPrices();
  }, [fetchPrices]);

  // Ruční refresh (obejde cache)
  const handleRefresh = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchPrices();
  };

  const labelStyle = { fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 };
  const valueStyle = { fontSize: 15, fontWeight: 700, color: "var(--text)" };

  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
        textTransform: "uppercase", color: "var(--text3)", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>🥇 Cena zlata</span>
        {lastUpdate && !loading && (
          <span style={{
            fontSize: 9, fontWeight: 600, background: "var(--surface2)",
            color: "var(--text3)", padding: "2px 6px", borderRadius: 4,
          }}>
            {lastUpdate.toLocaleDateString("cs-CZ")}
          </span>
        )}
        <button
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Načíst aktuální cenu zlata"
          title="Načíst znovu"
          style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "var(--text3)", cursor: loading ? "default" : "pointer",
            fontSize: 13, padding: "2px 6px", borderRadius: 6,
            opacity: loading ? 0.4 : 1,
          }}
        >
          ↻
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: "var(--text3)" }}>Načítám cenu zlata…</div>
      )}

      {!loading && error && (
        <div style={{ fontSize: 12, color: "var(--red)" }}>
          ⚠️ {error}
          <button
            onClick={handleRefresh}
            style={{
              marginLeft: 8, background: "none", border: "none",
              color: "var(--blue)", cursor: "pointer", fontSize: 12,
              fontWeight: 700, textDecoration: "underline", padding: 0,
            }}
          >
            Zkusit znovu
          </button>
        </div>
      )}

      {!loading && !error && prices && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div>
              <div style={labelStyle}>Zlato za 1 g (CZK)</div>
              <div className="mono" style={valueStyle}>
                {Math.round(prices.gold_czk_1g).toLocaleString("cs-CZ")} Kč
              </div>
            </div>
            <div>
              <div style={labelStyle}>Zlato za {GOLD_GRAMS} g (CZK)</div>
              <div className="mono" style={valueStyle}>
                {Math.round(prices.gold_czk_117g).toLocaleString("cs-CZ")} Kč
              </div>
            </div>
          </div>

          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 10, fontStyle: "italic" }}>
            Zdroj: Metals.dev · Aktualizace 1× denně
          </div>
        </>
      )}
    </div>
  );
}
