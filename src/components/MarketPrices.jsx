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
      try {
        const results = {};

        // Bitcoin z CoinGecko
        if (hasBitcoin) {
          try {
            const btcResponse = await fetch(
              "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=czk,usd",
              { signal: AbortSignal.timeout(5000) }
            );
            const btcData = await btcResponse.json();
            results.btc_czk = btcData?.bitcoin?.czk || null;
            results.btc_usd = btcData?.bitcoin?.usd || null;
          } catch (err) {
            console.warn("Bitcoin price fetch failed:", err);
          }
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
          
          results.gold_czk_1g = goldData?.metals?.XAU || null;
          // Vypočítej cenu za 17g
          if (results.gold_czk_1g) {
            results.gold_czk_17g = results.gold_czk_1g * 17;
            console.log("✅ Gold prices:", results.gold_czk_1g, "Kč/g");
          } else {
            console.warn("⚠️ Gold price not found in response");
          }
        } catch (err) {
          console.error("❌ Gold API error:", err);
          results.gold_czk_1g = null;
          results.gold_czk_17g = null;
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
        console.log("📊 Market prices fetched from API");
      } catch (err) {
        console.error("Market prices fetch error:", err);
        setLoading(false);
      }
    };

    fetchPrices();
  }, [hasBitcoin]);

  // Skryj pokud nemá ani Bitcoin ani zlato nenačteno
  if (loading) return null;
  
  // Zobraz pokud máme jakékoliv ceny
  if (!prices || (!prices.btc_czk && !prices.gold_czk_1g)) return null;

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
        📊 Tržní ceny
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
        {hasBitcoin && prices?.btc_czk && (
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
        )}
        
        {prices?.gold_czk_1g && (
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
                🥇 Zlato za 17g (CZK)
              </div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                {Math.round(prices.gold_czk_17g).toLocaleString("cs-CZ")} Kč
              </div>
            </div>
          </>
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
