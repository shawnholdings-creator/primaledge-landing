// Vercel Serverless API Route: /api/prices
// Primary: Finnhub (free, reliable, 60 calls/min)
// Fallback: Yahoo Finance v7 quote → v8 chart
// API key stored in Vercel env var: FINNHUB_API_KEY

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tickers } = req.query;
  if (!tickers || typeof tickers !== "string") {
    return res.status(400).json({ error: "tickers query param required" });
  }

  const clean = tickers.replace(/[^A-Za-z0-9,.\-]/g, "");
  if (!clean) {
    return res.status(400).json({ error: "Invalid tickers" });
  }

  const symbols = clean.split(",").slice(0, 20);
  const apiKey = process.env.FINNHUB_API_KEY;

  let prices = {};

  // 1. Try Finnhub (primary)
  if (apiKey) {
    try {
      prices = await fetchFinnhub(symbols, apiKey);
      if (Object.keys(prices).length >= symbols.length * 0.5) {
        res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
        return res.status(200).json({ prices, source: "finnhub", updated: new Date().toISOString() });
      }
    } catch (err) {
      console.error("Finnhub error:", err.message);
    }
  }

  // 2. Fallback: Yahoo Finance v7
  try {
    prices = await fetchYahooV7(clean);
    if (Object.keys(prices).length > 0) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
      return res.status(200).json({ prices, source: "yahoo-v7", updated: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Yahoo v7 error:", err.message);
  }

  // 3. Fallback: Yahoo Finance v8 (per-ticker)
  try {
    prices = await fetchYahooV8(symbols);
    if (Object.keys(prices).length > 0) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
      return res.status(200).json({ prices, source: "yahoo-v8", updated: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Yahoo v8 error:", err.message);
  }

  return res.status(502).json({ error: "All price sources failed", prices: {} });
}

// ── Finnhub: batch quote (one call per ticker) ────────────────
async function fetchFinnhub(symbols, apiKey) {
  const prices = {};
  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const url = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`;
      const r = await fetch(url);
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.c > 0) {
        prices[sym] = {
          price: d.c,                                       // current price
          change: d.pc > 0 ? ((d.c - d.pc) / d.pc) * 100 : 0, // % change from prev close
        };
      }
    })
  );
  return prices;
}

// ── Yahoo Finance v7 (batch) ──────────────────────────────────
async function fetchYahooV7(tickerString) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickerString}&fields=regularMarketPrice,regularMarketChangePercent,symbol`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!resp.ok) throw new Error(`Yahoo v7 status ${resp.status}`);

  const data = await resp.json();
  const quotes = data?.quoteResponse?.result || [];
  const prices = {};
  for (const q of quotes) {
    if (q.symbol && q.regularMarketPrice != null) {
      prices[q.symbol] = {
        price: q.regularMarketPrice,
        change: q.regularMarketChangePercent ?? 0,
      };
    }
  }
  return prices;
}

// ── Yahoo Finance v8 (per-ticker fallback) ────────────────────
async function fetchYahooV8(symbols) {
  const prices = {};
  await Promise.allSettled(
    symbols.map(async (sym) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) return;
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        prices[meta.symbol || sym] = {
          price: meta.regularMarketPrice,
          change: meta.previousClose
            ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
            : 0,
        };
      }
    })
  );
  return prices;
}
