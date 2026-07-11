// Exit rule engine v1 — rule precedence (changed from v3):
// 1. DATA_FAILURE → data_review
// 2. PROFIT_TARGET (ask <= 50% entry)
// 3. PRE_ITM (DTE<=2, near-the-money)
// 4. STOP_LOSS (ask >= 2x entry, actual ask)
// 5. FORCED_TIME_EXIT (DTE<=1, mandatory close at actual ask)
// 6. EXPIRATION (DTE<=0, last resort when no tradable quote)

const VERSION = 'v1';

/**
 * Server-side DTE: ET now via Intl, expiration at 4PM ET.
 */
export function computeDTE(expirationDate) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map(p => [p.type, p.value])
  );
  // Build current ET time as a Date (approximate but consistent)
  const nowET = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour.padStart(2, '0')}:${parts.minute.padStart(2, '0')}:${parts.second.padStart(2, '0')}`);
  const expET = new Date(`${expirationDate}T16:00:00`);
  return Math.ceil((expET.getTime() - nowET.getTime()) / 86400000);
}

export function evaluateExitRules(trade, quote) {
  const dte = computeDTE(trade.expiration);
  const spot = quote.valid ? quote.stock_price : null;
  const ask = quote.valid ? quote.option?.ask : null;
  const askValid = ask != null && isFinite(ask) && ask > 0;
  const strike = Number(trade.strike);
  const entryCredit = Number(trade.entry_credit);
  const side = trade.side?.toUpperCase();

  // ── 1. DATA_FAILURE ──────────────────────────────────────────
  if (!quote.valid) {
    return {
      triggered: false,
      reason: null,
      exit_debit: null,
      data_review: true,
      details: { rule: 'DATA_FAILURE', version: VERSION, reason: quote.reason },
    };
  }

  // ── 2. PROFIT_TARGET ─────────────────────────────────────────
  if (askValid && ask <= entryCredit * 0.50) {
    return {
      triggered: true,
      reason: 'PROFIT_TARGET',
      exit_debit: ask,
      details: { rule: 'PROFIT_TARGET', version: VERSION, ask, threshold: entryCredit * 0.50 },
    };
  }

  // ── 3. PRE_ITM (DTE <= 2) ────────────────────────────────────
  if (dte <= 2) {
    const preItm =
      (side === 'PUT' && spot <= strike * 1.01) ||
      (side === 'CALL' && spot >= strike * 0.99);
    if (preItm && askValid) {
      return {
        triggered: true,
        reason: 'PRE_ITM',
        exit_debit: ask,
        details: { rule: 'PRE_ITM', version: VERSION, dte, spot, strike, side, ask },
      };
    }
  }

  // ── 4. STOP_LOSS (actual ask, never capped) ──────────────────
  if (askValid && ask >= entryCredit * 2) {
    return {
      triggered: true,
      reason: 'STOP_LOSS',
      exit_debit: ask,
      details: { rule: 'STOP_LOSS', version: VERSION, ask, trigger_level: entryCredit * 2, entryCredit },
    };
  }

  // ── 5. FORCED_TIME_EXIT (DTE <= 1) ───────────────────────────
  // Mandatory close regardless of P&L direction. Not optional.
  if (dte <= 1) {
    if (askValid) {
      return {
        triggered: true,
        reason: 'FORCED_TIME_EXIT',
        exit_debit: ask,
        details: { rule: 'FORCED_TIME_EXIT', version: VERSION, dte, ask, entryCredit },
      };
    }
    // ask invalid at DTE=1 → data_review (retry next cycle)
    // ask invalid at DTE<=0 → fall through to EXPIRATION
    if (dte > 0) {
      return {
        triggered: false,
        reason: null,
        exit_debit: null,
        data_review: true,
        details: { rule: 'FORCED_TIME_EXIT', version: VERSION, dte, ask, note: 'invalid_ask_at_dte1' },
      };
    }
  }

  // ── 6. EXPIRATION (DTE <= 0, last resort) ────────────────────
  // OTM at expiration: option expires worthless → exit_debit = 0
  // exit_quote_source = 'expiration_settlement' (no market quote used)
  if (dte <= 0) {
    if (side === 'PUT' && spot >= strike) {
      return {
        triggered: true,
        reason: 'EXPIRATION',
        exit_debit: 0,
        exit_quote_source: 'expiration_settlement',
        details: { rule: 'EXPIRATION', version: VERSION, outcome: 'WIN', side, spot, strike,
          note: 'OTM PUT expired worthless; exit_debit=0 is verified settlement, not estimated' },
      };
    }
    if (side === 'CALL' && spot <= strike) {
      return {
        triggered: true,
        reason: 'EXPIRATION',
        exit_debit: 0,
        exit_quote_source: 'expiration_settlement',
        details: { rule: 'EXPIRATION', version: VERSION, outcome: 'WIN', side, spot, strike,
          note: 'OTM CALL expired worthless; exit_debit=0 is verified settlement, not estimated' },
      };
    }
    // ITM at expiration with no valid ask — cannot model settlement
    return {
      triggered: false,
      reason: null,
      exit_debit: null,
      data_review: true,
      details: { rule: 'EXPIRATION', version: VERSION, outcome: 'ITM_NO_QUOTE', side, spot, strike, ask },
    };
  }

  // ── No rule triggered ────────────────────────────────────────
  return {
    triggered: false,
    reason: null,
    exit_debit: null,
    details: { rule: 'NONE', version: VERSION, dte, ask, entryCredit, spot, strike },
  };
}

export { VERSION };
