import React, { useState, useEffect } from "react";

const CACHE_KEY = "wealthos-market-prices";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hodin

export function MarketPrices({ items }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Zjisti jestli má uživatel Bitcoin
  const hasBitcoin = items.some(i => 
    i.name.toLowerCase().includes("bitcoin") || 
    i.name.toLowerCase().includes("btc") ||
    i.icon === "₿"
  );
  
  // Debug logging
  console.log("📊 Market widget check:", { hasBitcoin, itemsCount: items.length });

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
            console.log(`📊 Market prices loaded from cache (${Math.round(age / 1000 / 60 / 60)}h old)`);
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
      console.log("🚀 Starting fetchPrices...");
      try {
        const results = {};

        // Bitcoin z CoinGecko
        if (hasBitcoin) {
          try {
            console.log("₿ Fetching Bitcoin prices...");
            const btcResponse = await fetch(
              "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=czk,usd",
              { signal: AbortSignal.timeout(5000) }
            );
            const btcData = await btcResponse.json();
            results.btc_czk = btcData?.bitcoin?.czk || null;
            results.btc_usd = btcData?.bitcoin?.usd || null;
            console.log("✅ Bitcoin fetched:", results.btc_czk, "CZK");
          } catch (err) {
            console.warn("❌ Bitcoin price fetch failed:", err);
          }
        } else {
          console.log("⏭️ Skipping Bitcoin (not in portfolio)");
        }

        // Zlato - vždy fetchovat
        try {
          console.log("🥇 Fetching gold prices...");
          const goldResponse = await fetch(
            "https://api.metals.dev/v1/latest?api_key=KIK51E4DDQVOLBKGAQWR820KGAQWR&currency=CZK&unit=gram",
            { signal: AbortSignal.timeout(5000) }
          );
          console.log("🥇 Gold API status:", goldResponse.status);
          const goldData = await goldResponse.json();
          console.log("🥇 Gold API response:", goldData);
          console.log("🥇 Metals object:", goldData?.metals);
          
          // Zkus všechny možné struktury odpovědi
          let goldPrice = null;
          
          // Možnost 1: metals.XAU
          if (goldData?.metals?.XAU) {
            goldPrice = goldData.metals.XAU;
            console.log("✅ Found gold at metals.XAU:", goldPrice);
          }
          // Možnost 2: metals.gold
          else if (goldData?.metals?.gold) {
            goldPrice = goldData.metals.gold;
            console.log("✅ Found gold at metals.gold:", goldPrice);
          }
          // Možnost 3: metals.GOLD
          else if (goldData?.metals?.GOLD) {
            goldPrice = goldData.metals.GOLD;
            console.log("✅ Found gold at metals.GOLD:", goldPrice);
          }
          // Možnost 4: rates.XAU
          else if (goldData?.rates?.XAU) {
            goldPrice = goldData.rates.XAU;
            console.log("✅ Found gold at rates.XAU:", goldPrice);
          }
          // Možnost 5: přímo XAU
          else if (goldData?.XAU) {
            goldPrice = goldData.XAU;
            console.log("✅ Found gold at XAU:", goldPrice);
          }
          // Možnost 6: Zkusíme najít jakýkoliv klíč s "gold" nebo "XAU" v názvu
          else if (goldData?.metals) {
            const keys = Object.keys(goldData.metals);
            console.log("🥇 Available keys in metals:", keys);
            const goldKey = keys.find(k => k.toLowerCase().includes('gold') || k.toLowerCase().includes('xau'));
            if (goldKey) {
              goldPrice = goldData.metals[goldKey];
              console.log(`✅ Found gold at metals.${goldKey}:`, goldPrice);
            }
          }
          
          if (goldPrice && typeof goldPrice === 'number') {
            // Validace ceny - reálná cena zlata je 1500-5000 Kč/g
            // Pokud je cena mimo tento rozsah, může být v jiných jednotkách
            
            console.log("🥇 Raw gold price from API:", goldPrice);
            
            let finalPrice = goldPrice;
            
            // Pokud je cena příliš vysoká (>10000), pravděpodobně je za oz nebo kg
            if (goldPrice > 10000) {
              // Pravděpodobně cena za trojskou unci (31.1g)
              finalPrice = goldPrice / 31.1035;
              console.log("🥇 Converted from oz to gram:", finalPrice);
            }
            // Pokud je cena příliš nízká (<100), může být za gram ale v USD
            else if (goldPrice < 100) {
              // Průměrný kurz CZK/USD ~ 23
              finalPrice = goldPrice * 23;
              console.log("🥇 Converted from USD to CZK:", finalPrice);
            }
            
            // Finální validace
            if (finalPrice >= 1500 && finalPrice <= 5000) {
              results.gold_czk_1g = finalPrice;
              results.gold_czk_117g = finalPrice * 117; // Změněno z 17g na 117g
              console.log("✅ Gold prices validated and set:", results.gold_czk_1g, "Kč/g");
            } else {
              console.warn("⚠️ Gold price validation failed:", finalPrice, "Kč/g (expected 1500-5000)");
              console.warn("💡 Using fallback: Skipping gold display or using manual rate");
              // Můžeš buď skrýt zlato, nebo použít fallback cenu
              results.gold_czk_1g = null;
              results.gold_czk_117g = null;
            }
          } else {
            console.warn("⚠️ Gold price not found or invalid in response");
            console.warn("Full API response:", JSON.stringify(goldData, null, 2));
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
          console.log("💾 Saved to cache");
        } catch (err) {
          console.warn("Cache write error:", err);
        }

        console.log("📊 Final results:", results);
        setPrices(results);
        setLastUpdate(new Date(timestamp));
        setLoading(false);
        console.log("✅ Market prices fetched from API - DONE");
      } catch (err) {
        console.error("💥 Market prices fetch error:", err);
        setLoading(false);
      }
    };

    fetchPrices();
  }, [hasBitcoin]);

  // VŽDY zobrazit widget - žádné skrývání
  // if (loading) return null;
  // if (!prices || (!prices.btc_czk && !prices.gold_czk_1g)) return null;

  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 20, border: "2px solid var(--blue)" }}>
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
        📊 Tržní ceny {loading && "(Loading...)"} {!prices && "(No prices)"}
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

      {/* Debug info */}
      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 12, fontFamily: "monospace" }}>
        Loading: {loading ? "YES" : "NO"} | 
        HasPrices: {prices ? "YES" : "NO"} | 
        BTC: {prices?.btc_czk ? "✓" : "✗"} | 
        Gold: {prices?.gold_czk_1g ? "✓" : "✗"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {hasBitcoin && prices?.btc_czk ? (
          <>
            <div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>
                ₿ Bitcoin (CZK)
              </div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                {Math.round(prices.btc_czk).toLocaleString("cs-CZ")} Kč
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>
                ₿ Bitcoin (USD)
              </div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                ${prices.btc_usd?.toLocaleString("en-US") || "—"}
              </div>
            </div>
          </>
        ) : hasBitcoin ? (
          <div style={{ fontSize: 11, color: "var(--red)" }}>
            ⚠️ Bitcoin: Načítání selhalo
          </div>
        ) : null}
        
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
        Zdroj: CoinGecko · Aktualizace 1× denně
      </div>
    </div>
  );
}
