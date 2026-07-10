import React, { useState, useEffect } from "react";

const CACHE_KEY = "wealthos-market-prices";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hodin

// Sanity check: cena zlata v CZK/g. Široký rozsah, aby vydržel
// dlouhodobý růst ceny i případný pokles. Chytá jen zjevné chyby
// jednotek (cena za unci ~90 000, cena v USD ~90).
const GOLD_MIN = 500;
const GOLD_MAX = 20000;

export function MarketPrices() {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Zkontroluj cache v localStorage
    const checkCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Pokud cache není starší než 24h, použij ji
          if (age < CACHE_DURATION) {
            setPrices(data);
            setLastUpdate(new Date(timestamp));
            setLoading(false);
            return true;
          }
        }
      } catch {
        // Poškozená cache — ignoruj, fetchne se z API
      }
      return false;
    };

    if (checkCache()) return;

    const fetchPrices = async () => {
      try {
        const results = {};

        try {
          const goldResponse = await fetch(
            `https://api.metals.dev/v1/latest?api_key=${import.meta.env.VITE_METALS_API_KEY || "KIK51E4DDQVOLBKGAQWR820KGAQWR"}&currency=CZK&unit=gram`,
            { signal: AbortSignal.timeout(5000) }
          );
          const goldData = await goldResponse.json();

          // Zkus všechny možné struktury odpovědi
          let goldPrice =
            goldData?.metals?.XAU ??
            goldData?.metals?.gold ??
            goldData?.metals?.GOLD ??
            goldData?.rates?.XAU ??
            goldData?.XAU ??
            null;

          // Fallback: najdi jakýkoliv klíč s "gold"/"xau" v názvu
          if (!goldPrice && goldData?.metals) {
            const goldKey = Object.keys(goldData.metals)
              .find(k => k.toLowerCase().includes("gold") || k.toLowerCase().includes("xau"));
            if (goldKey) goldPrice = goldData.metals[goldKey];
          }

          if (goldPrice && typeof goldPrice === "number") {
            let finalPrice = goldPrice;

            // Autodetekce jednotek: cena za trojskou unci → přepočet na gram
            if (goldPrice > GOLD_MAX) {
              finalPrice = goldPrice / 31.1035;
            }
            // Cena pravděpodobně v USD → hrubý přepočet na CZK
            else if (goldPrice < GOLD_MIN) {
              finalPrice = goldPrice * 23;
            }

            if (finalPrice >= GOLD_MIN && finalPrice <= GOLD_MAX) {
              results.gold_czk_1g = finalPrice;
              results.gold_czk_117g = finalPrice * 117;
            } else {
              console.warn("MarketPrices: cena zlata mimo očekávaný rozsah:", finalPrice);
            }
          }
        } catch (err) {
          console.error("MarketPrices: chyba při načítání ceny zlata:", err);
        }

        // Ulož do cache
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
        console.error("MarketPrices: fetch selhal:", err);
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  if (loading) return null;
  if (!prices?.gold_czk_1g) return null;

  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 20 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "var(--text3)",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 6
      }}>
        📊 Tržní ceny zlata
        {lastUpdate && (
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            background: "var(--surface2)",
            color: "var(--text3)",
            padding: "2px 6px",
            borderRadius: 4
          }}>
            {lastUpdate.toLocaleDateString("cs-CZ")}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>
            🥇 Zlato za 1g (CZK)
          </div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            {Math.round(prices.gold_czk_1g).toLocaleString("cs-CZ")} Kč
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>
            🥇 Zlato za 117g (CZK)
          </div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            {Math.round(prices.gold_czk_117g).toLocaleString("cs-CZ")} Kč
          </div>
        </div>
      </div>

      <div style={{
        fontSize: 9,
        color: "var(--text3)",
        marginTop: 10,
        fontStyle: "italic"
      }}>
        Zdroj: Metals.dev · Aktualizace 1× denně
      </div>
    </div>
  );
}
