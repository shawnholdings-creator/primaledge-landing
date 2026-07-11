// Yahoo public options adapter with cookie+crumb auth.
// No account, API key, or PII required. Never throws.

let _cookie = null;
let _crumb = null;
let _sessionTs = 0;
const SESSION_TTL = 10 * 60 * 1000;

export const MAX_BATCH_MS = 25000;

export async function ensureSession(force = false) {
  if (!force && _cookie && _crumb && Date.now() - _sessionTs < SESSION_TTL) {
    return true;
  }
  try {
    // Step 1: obtain A3 cookie
    const initResp = await fetch('https://fc.yahoo.com', { redirect: 'manual' });
    const setCookie = initResp.headers.get('set-cookie') || '';
    const a3Match = setCookie.match(/A3=[^;]+/);
    if (a3Match) {
      _cookie = a3Match[0];
    } else {
      // Fallback: try finance page
      const finResp = await fetch('https://finance.yahoo.com', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow',
      });
      const finCookie = finResp.headers.get('set-cookie') || '';
      const finMatch = finCookie.match(/A3=[^;]+/);
      if (!finMatch) {
        _cookie = null; _crumb = null; _sessionTs = 0;
        return false;
      }
      _cookie = finMatch[0];
    }

    // Step 2: fetch crumb
    const crumbResp = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': 'Mozilla/5.0', Cookie: _cookie },
    });
    if (!crumbResp.ok) {
      _cookie = null; _crumb = null; _sessionTs = 0;
      return false;
    }
    const crumbText = await crumbResp.text();
    if (!crumbText || crumbText.length > 40 || crumbText.includes('<')) {
      _cookie = null; _crumb = null; _sessionTs = 0;
      return false;
    }
    _crumb = crumbText;
    _sessionTs = Date.now();
    return true;
  } catch (err) {
    console.error('Yahoo session error:', err.message);
    _cookie = null; _crumb = null; _sessionTs = 0;
    return false;
  }
}

export async function getOptionQuote(ticker, contractSymbol, expirationDate) {
  const retrieved_at = new Date().toISOString();

  // Ensure session — retry once with force on failure
  if (!await ensureSession()) {
    if (!await ensureSession(true)) {
      return { valid: false, reason: 'session_failed', retrieved_at };
    }
  }

  try {
    const epochExpiry = Math.floor(new Date(expirationDate + 'T00:00:00Z').getTime() / 1000);

    const buildUrl = () =>
      `https://query2.finance.yahoo.com/v7/finance/options/${ticker}?date=${epochExpiry}&crumb=${encodeURIComponent(_crumb)}`;

    const headers = () => ({ 'User-Agent': 'Mozilla/5.0', Cookie: _cookie });

    let resp = await fetch(buildUrl(), { headers: headers() });

    // Retry on 401/403 with forced session refresh
    if (resp.status === 401 || resp.status === 403) {
      const origStatus = resp.status;
      const refreshed = await ensureSession(true);
      if (!refreshed) {
        return { valid: false, reason: `yahoo_auth_${origStatus}_refresh_failed`, retrieved_at };
      }
      resp = await fetch(buildUrl(), { headers: headers() });
      if (resp.status === 401 || resp.status === 403) {
        return { valid: false, reason: `yahoo_auth_${resp.status}_refresh_failed`, retrieved_at };
      }
    }

    if (!resp.ok) {
      return { valid: false, reason: `yahoo_http_${resp.status}`, retrieved_at };
    }

    const data = await resp.json();
    const result = data?.optionChain?.result?.[0];
    if (!result) {
      return { valid: false, reason: 'no_option_chain_result', retrieved_at };
    }

    // Underlying price
    const quote = result.quote;
    const stockPrice = quote?.regularMarketPrice;
    const marketTime = quote?.regularMarketTime;

    if (!stockPrice || stockPrice <= 0) {
      return { valid: false, reason: 'no_underlying_price', retrieved_at };
    }

    // Search puts + calls for exact contract match
    const puts = result.options?.[0]?.puts || [];
    const calls = result.options?.[0]?.calls || [];
    const contract = [...puts, ...calls].find(c => c.contractSymbol === contractSymbol);

    if (!contract) {
      return { valid: false, reason: 'contract_not_found', retrieved_at };
    }

    const { bid, ask, lastPrice, strike, volume, openInterest, impliedVolatility } = contract;

    // Validation — reject clearly broken quotes
    if (bid === 0 && ask === 0) {
      return { valid: false, reason: 'zero_bid_and_ask', retrieved_at };
    }
    if (ask == null || ask <= 0) {
      return { valid: false, reason: 'invalid_ask', retrieved_at };
    }
    if (bid != null && bid > ask) {
      return { valid: false, reason: 'crossed_market', retrieved_at };
    }

    const providerTimestamp = marketTime
      ? new Date(marketTime * 1000).toISOString()
      : null;

    return {
      stock_price: stockPrice,
      option: {
        bid: bid ?? 0,
        ask,
        last: lastPrice ?? 0,
        strike,
        volume: volume || 0,
        oi: openInterest || 0,
        iv: impliedVolatility || 0,
      },
      source: 'yahoo_public',
      provider_timestamp: providerTimestamp,
      quote_timing: 'delayed_unverified',
      retrieved_at,
      valid: true,
    };
  } catch (err) {
    console.error('getOptionQuote error:', err.message);
    return { valid: false, reason: `fetch_error: ${err.message}`, retrieved_at };
  }
}
