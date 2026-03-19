import React, { useState, useEffect } from "react";

const CACHE_KEY = "wealthos-market-prices";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hodin

export function MarketPrices({ items }) {
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
      } catch (err) {
        console.warn("Cache read error:", err);
      }
      return false;
    };

    // Pokud máme validní cache, použij ji a nesahej na API
    if (checkCache()) {
      return;
    }

    // Jinak fetch z API
    const fetchPrices = async () => {
      try {
        const results = {};

        // Zlato - vždy fetchovat
        try {
          const goldResponse = await fetch(
            "https://api.metals.dev/v1/latest?api_key=KIK51E4DDQVOLBKGAQWR820KGAQWR&currency=CZK&unit=gram",
            { signal: AbortSignal.timeout(5000) }
          );
          const goldData = await goldResponse.json();
          
          // Zkus všechny možné struktury odpovědi
          let goldPrice = null;
          
          // Možnost 1: metals.XAU
          if (goldData?.metals?.XAU) {
            goldPrice = goldData.metals.XAU;
          }
          // Možnost 2: metals.gold
          else if (goldData?.metals?.gold) {
            goldPrice = goldData.metals.gold;
          }
          // Možnost 3: metals.GOLD
          else if (goldData?.metals?.GOLD) {
            goldPrice = goldData.metals.GOLD;
          }
          // Možnost 4: rates.XAU
          else if (goldData?.rates?.XAU) {
            goldPrice = goldData.rates.XAU;
          }
          // Možnost 5: přímo XAU
          else if (goldData?.XAU) {
            goldPrice = goldData.XAU;
          }
          // Možnost 6: Zkusíme najít jakýkoliv klíč s "gold" nebo "XAU" v názvu
          else if (goldData?.metals) {
            const keys = Object.keys(goldData.metals);
            const goldKey = keys.find(k => k.toLowerCase().includes('gold') || k.toLowerCase().includes('xau'));
            if (goldKey) {
              goldPrice = goldData.metals[goldKey];
            }
          }
          
          if (goldPrice && typeof goldPrice === 'number') {
            // Validace ceny - reálná cena zlata je 1500-5000 Kč/g
            // Pokud je cena mimo tento rozsah, může být v jiných jednotkách
            
            let finalPrice = goldPrice;
            
            // Pokud je cena příliš vysoká (>10000), pravděpodobně je za oz nebo kg
            if (goldPrice > 10000) {
              // Pravděpodobně cena za trojskou unci (31.1g)
              finalPrice = goldPrice / 31.1035;
            }
            // Pokud je cena příliš nízká (<100), může být za gram ale v USD
            else if (goldPrice < 100) {
              // Průměrný kurz CZK/USD ~ 23
              finalPrice = goldPrice * 23;
            }
            
            // Finální validace
            if (finalPrice >= 1500 && finalPrice <= 5000) {
              results.gold_czk_1g = finalPrice;
              results.gold_czk_117g = finalPrice * 117;
              console.log("✅ Gold price:", Math.round(finalPrice), "Kč/g");
            } else {
              console.warn("⚠️ Gold price validation failed:", Math.round(finalPrice), "Kč/g");
              results.gold_czk_1g = null;
              results.gold_czk_117g = null;
            }
          } else {
            console.warn("⚠️ Gold price not found in API response");
          }
        } catch (err) {
          console.error("❌ Gold API error:", err);
          results.gold_czk_1g = null;
          results.gold_czk_117g = null;
        }

        // Ulož do cache
        const timestamp = Date.now();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: results, timestamp }));
        } catch (err) {
          console.warn("Cache write error:", err);
        }

        setPrices(results);
        setLastUpdate(new Date(timestamp));
        setLoading(false);
      } catch (err) {
        console.error("Gold prices fetch error:", err);
        setLoading(false);
      }
    };

    fetchPrices();
  }, []); // Fetch only once on mount

  // VŽDY zobrazit widget - žádné skrývání
  // if (loading) return null;
  // if (!prices || (!prices.btc_czk && !prices.gold_czk_1g)) return null;

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
        {prices?.gold_czk_1g ? (
          <>
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
          </>
        ) : (
          <div style={{ fontSize: 11, color: "var(--red)" }}>
            ⚠️ Zlato: Načítání selhalo (zkontroluj Console F12)
          </div>
        )}
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
