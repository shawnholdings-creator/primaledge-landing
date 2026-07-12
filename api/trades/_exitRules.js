// Exit rule engine v1 — rule precedence (changed from v3):
// 1. DATA_FAILURE → data_review
// 2. PROFIT_TARGET (ask <= 50% entry)
// 3. PRE_ITM (DTE<=2, near-the-money)
// 4. STOP_LOSS (ask >= 2x entry, actual ask)
// 5. FORCED_TIME_EXIT (DTE<=1, mandatory close at actual ask)
// 6. EXPIRATION (DTE<=0, last resort when no tradable quote)

const VERSION = 'v1';

/**
 * Pure Intl.DateTimeFormat.formatToParts helper — no locale-string-to-Date
 * round trips.  Returns {year, month, day, hour, minute, second} as numbers.
 */
const _etFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

export function nowPartsET(date = new Date()) {
  const m = Object.fromEntries(
    _etFmt.formatToParts(date).map(p => [p.type, p.value])
  );
  return {
    year:   Number(m.year),
    month:  Number(m.month),
    day:    Number(m.day),
    hour:   Number(m.hour),
    minute: Number(m.minute),
    second: Number(m.second),
  };
}

/**
 * Server-side DTE: ET now via formatToParts, expiration at 4 PM ET.
 * Uses epoch arithmetic — never parses a locale string back through
 * the Date constructor.
 */
export function computeDTE(expirationDate) {
  const p = nowPartsET();
  // Epoch-ms for "now" in ET-wall-clock (same trick but numeric-only)
  const nowMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Epoch-ms for expiration at 4 PM ET (same offset basis)
  const [ey, em, ed] = expirationDate.split('-').map(Number);
  const expMs = Date.UTC(ey, em - 1, ed, 16, 0, 0);
  return Math.ceil((expMs - nowMs) / 86_400_000);
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
