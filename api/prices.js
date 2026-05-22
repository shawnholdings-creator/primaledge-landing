// Vercel Serverless API Route: /api/prices
// Fetches real-time quotes from Yahoo Finance (no API key needed).
// Proxied server-side to avoid CORS and keep the client clean.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tickers } = req.query;
  if (!tickers || typeof tickers !== "string") {
    return res.status(400).json({ error: "tickers query param required" });
  }

  // Sanitize — only allow A-Z, digits, commas, dots, hyphens
  const clean = tickers.replace(/[^A-Za-z0-9,.\-]/g, "");
  if (!clean) {
    return res.status(400).json({ error: "Invalid tickers" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${clean}&fields=regularMarketPrice,regularMarketChangePercent,symbol`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!resp.ok) {
      // Fallback: try v8 chart API per-ticker
      return await fallbackChartApi(clean, res);
    }

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

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json({ prices, updated: new Date().toISOString() });
  } catch (err) {
    // Try fallback on any error
    try {
      return await fallbackChartApi(clean, res);
    } catch {
      console.error("Prices API error:", err);
      return res.status(500).json({ error: "Failed to fetch prices" });
    }
  }
}

// Fallback: use Yahoo v8 chart API (one call per ticker, slower but reliable)
async function fallbackChartApi(tickers, res) {
  const symbols = tickers.split(",").slice(0, 20); // cap at 20
  const prices = {};

  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) return null;
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (meta) {
        prices[meta.symbol] = {
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice && meta.previousClose
            ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
            : 0,
        };
      }
    })
  );

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  return res.status(200).json({ prices, updated: new Date().toISOString() });
}
