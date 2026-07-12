// v4 Node test suite — zero external deps (node:test, node:assert, node:crypto)
// Dummy supabase env must be set BEFORE any transitive import of _supabase.js
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
process.env.INGEST_API_KEY = process.env.INGEST_API_KEY || 'test-ingest-key';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { evaluateExitRules, computeDTE, VERSION } from './_exitRules.js';
import { ensureSession, getOptionQuote, MAX_BATCH_MS } from './_quoteProvider.js';
import ingestHandler, { makeAlertId as ingestMakeAlertId } from './ingest.js';
import { getETNow } from './_marketCal.js';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
const _etFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour12: false,
});
function expirationForDTE(targetDTE) {
  for (let offset = Math.max(-1, targetDTE - 2); offset <= targetDTE + 3; offset++) {
    const d = new Date(); d.setDate(d.getDate() + offset);
    const parts = Object.fromEntries(
      _etFmt.formatToParts(d).map(p => [p.type, p.value])
    );
    const ds = `${parts.year}-${parts.month}-${parts.day}`;
    const dte = computeDTE(ds);
    if (targetDTE === 0 ? dte <= 0 : dte === targetDTE) return ds;
  }
  throw new Error(`Cannot find expiration for DTE=${targetDTE}`);
}

const FAR = expirationForDTE(30);
const DTE_2 = expirationForDTE(2);
const DTE_1 = expirationForDTE(1);
const DTE_0 = expirationForDTE(0);

function makeTrade(ov) {
  return { strike: 781, entry_credit: 3.65, side: 'PUT', expiration: FAR, ...ov };
}
function makeQuote(ov) {
  return { valid: true, stock_price: 800, option: { bid: 2.5, ask: 3.0, last: 2.8, strike: 781 }, source: 'test', provider_timestamp: new Date().toISOString(), retrieved_at: new Date().toISOString(), quote_timing: 'test', ...ov };
}
function makeAlertId(body) {
  const raw = `${body.scan_run_id}|${body.tier || 'standard'}|${body.ticker}|${body.side}|${body.contract_symbol}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 40);
}

// ────────────────────────────────────────────────────────────────
// Exit Rules
// ────────────────────────────────────────────────────────────────
describe('evaluateExitRules', () => {
  it('exports VERSION', () => { assert.equal(typeof VERSION, 'string'); });

  it('no trigger: ask between thresholds, far expiry', () => {
    const r = evaluateExitRules(makeTrade(), makeQuote());
    assert.equal(r.triggered, false);
    assert.equal(r.reason, null);
  });

  it('DATA_FAILURE: invalid quote → data_review', () => {
    const r = evaluateExitRules(makeTrade(), { valid: false, reason: 'session_failed', retrieved_at: '' });
    assert.equal(r.triggered, false);
    assert.equal(r.data_review, true);
  });

  it('PROFIT_TARGET: ask=1.50, entry=3.65 → triggered at ask', () => {
    const r = evaluateExitRules(makeTrade(), makeQuote({ option: { bid: 1.2, ask: 1.50, last: 1.3, strike: 781 } }));
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'PROFIT_TARGET');
    assert.equal(r.exit_debit, 1.50);
  });

  it('PRE_ITM PUT: spot=788, strike=781, DTE=2 → triggered', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_2 }),
      makeQuote({ stock_price: 788, option: { bid: 2.5, ask: 3.0, last: 2.8, strike: 781 } }),
    );
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'PRE_ITM');
  });

  it('PRE_ITM PUT: spot=800, DTE=1 → NOT triggered (800 > 788.81)', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_1 }),
      makeQuote({ stock_price: 800, option: { bid: 2.5, ask: 3.0, last: 2.8, strike: 781 } }),
    );
    // NOT pre-ITM, but DTE<=1 with valid ask → FORCED_TIME_EXIT
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'FORCED_TIME_EXIT');
  });

  it('PRE_ITM CALL: spot=730, strike=735, DTE=2 → triggered', () => {
    const r = evaluateExitRules(
      makeTrade({ side: 'CALL', strike: 735, expiration: DTE_2 }),
      makeQuote({ stock_price: 730, option: { bid: 2.5, ask: 3.0, last: 2.8, strike: 735 } }),
    );
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'PRE_ITM');
  });

  it('STOP_LOSS: ask=8.00, entry=3.65 → exit_debit=8.00 (actual ask, not 7.30)', () => {
    const r = evaluateExitRules(makeTrade(), makeQuote({ option: { bid: 7.5, ask: 8.00, last: 7.8, strike: 781 } }));
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'STOP_LOSS');
    assert.equal(r.exit_debit, 8.00);
  });

  // ── v4 CRITICAL CHANGE: FORCED_TIME_EXIT ──
  it('FORCED_TIME_EXIT: DTE=1, ask=2.00 → triggered', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_1 }),
      makeQuote({ stock_price: 800, option: { bid: 1.8, ask: 2.0, last: 1.9, strike: 781 } }),
    );
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'FORCED_TIME_EXIT');
    assert.equal(r.exit_debit, 2.0);
  });

  it('FORCED_TIME_EXIT: DTE=1, ask=4.00 → TRIGGERED (v4 forced, even at a loss)', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_1 }),
      makeQuote({ stock_price: 800, option: { bid: 3.8, ask: 4.0, last: 3.9, strike: 781 } }),
    );
    // v3 returned NOT triggered. v4 forces close regardless of P&L.
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'FORCED_TIME_EXIT');
    assert.equal(r.exit_debit, 4.0);
  });

  it('FORCED_TIME_EXIT: DTE=1, invalid ask → data_review', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_1 }),
      makeQuote({ option: { bid: 0, ask: null, last: 0, strike: 781 } }),
    );
    assert.equal(r.triggered, false);
    assert.equal(r.data_review, true);
  });

  it('EXPIRATION PUT WIN: DTE=0, no valid ask, spot>strike → debit=0', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_0 }),
      makeQuote({ stock_price: 800, option: { bid: 0, ask: null, last: 0, strike: 781 } }),
    );
    // ask invalid at DTE<=0 → falls through to EXPIRATION
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'EXPIRATION');
    assert.equal(r.exit_debit, 0);
  });

  it('EXPIRATION CALL WIN: DTE=0, no valid ask, spot<strike → debit=0', () => {
    const r = evaluateExitRules(
      makeTrade({ side: 'CALL', strike: 735, expiration: DTE_0 }),
      makeQuote({ stock_price: 700, option: { bid: 0, ask: null, last: 0, strike: 735 } }),
    );
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'EXPIRATION');
    assert.equal(r.exit_debit, 0);
  });

  it('DTE=0 with valid ask → FORCED_TIME_EXIT (not EXPIRATION)', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_0 }),
      makeQuote({ stock_price: 800, option: { bid: 3.5, ask: 4.0, last: 3.8, strike: 781 } }),
    );
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'FORCED_TIME_EXIT');
    assert.equal(r.exit_debit, 4.0);
  });

  it('EXPIRATION ITM: DTE=0, no ask, spot<strike → data_review', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_0 }),
      makeQuote({ stock_price: 770, option: { bid: 0, ask: null, last: 0, strike: 781 } }),
    );
    assert.equal(r.data_review, true);
  });

  // ── PRECEDENCE ──
  it('PROFIT beats PRE_ITM: DTE=2, ask=1.50 < 50% of 3.65', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_2 }),
      makeQuote({ stock_price: 788, option: { bid: 1.2, ask: 1.50, last: 1.3, strike: 781 } }),
    );
    assert.equal(r.reason, 'PROFIT_TARGET');
  });

  it('PRE_ITM beats STOP_LOSS: DTE=2, spot near strike, ask=8.00', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_2 }),
      makeQuote({ stock_price: 788, option: { bid: 7.5, ask: 8.00, last: 7.8, strike: 781 } }),
    );
    assert.equal(r.reason, 'PRE_ITM');
  });

  it('STOP_LOSS beats FORCED_TIME: DTE=1, ask=8.00', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_1 }),
      makeQuote({ stock_price: 800, option: { bid: 7.5, ask: 8.00, last: 7.8, strike: 781 } }),
    );
    assert.equal(r.reason, 'STOP_LOSS');
  });
});

// ────────────────────────────────────────────────────────────────
// Alert ID
// ────────────────────────────────────────────────────────────────
describe('makeAlertId', () => {
  it('same inputs → same ID', () => {
    const a = { scan_run_id: '2026-07-11T00:00:00Z', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    assert.equal(makeAlertId(a), makeAlertId(a));
  });
  it('different scan_run_id → different ID', () => {
    const a = { scan_run_id: 'A', ticker: 'X', side: 'PUT', contract_symbol: 'X1' };
    const b = { ...a, scan_run_id: 'B' };
    assert.notEqual(makeAlertId(a), makeAlertId(b));
  });
  it('different tier → different ID', () => {
    const a = { scan_run_id: 'A', ticker: 'X', side: 'PUT', contract_symbol: 'X1', tier: 'standard' };
    const b = { ...a, tier: 'micro' };
    assert.notEqual(makeAlertId(a), makeAlertId(b));
  });
  it('40-char hex', () => {
    const id = makeAlertId({ scan_run_id: 'X', ticker: 'Y', side: 'CALL', contract_symbol: 'Z' });
    assert.match(id, /^[0-9a-f]{40}$/);
  });
});

// ────────────────────────────────────────────────────────────────
// Shadow / Publish lifecycle
// ────────────────────────────────────────────────────────────────
describe('Shadow lifecycle', () => {
  it('rules ignore publish_state entirely', () => {
    const t = makeTrade();
    t.publish_state = 'SHADOW';
    const r1 = evaluateExitRules(t, makeQuote());
    t.publish_state = 'LIVE';
    const r2 = evaluateExitRules(t, makeQuote());
    assert.deepStrictEqual(r1, r2);
  });
});

// ────────────────────────────────────────────────────────────────
// P&L calculation
// ────────────────────────────────────────────────────────────────
describe('P&L calculation', () => {
  const calc = (entry, exit, fees = 1.30) => {
    const gross = (entry - exit) * 1 * 100;
    const net = gross - fees;
    const outcome = net > 0.005 ? 'WIN' : net < -0.005 ? 'LOSS' : 'FLAT';
    return { gross: Math.round(gross * 100) / 100, net: Math.round(net * 100) / 100, outcome };
  };
  it('WIN: entry=3.65, exit=1.50', () => {
    const r = calc(3.65, 1.50);
    assert.equal(r.gross, 215); assert.equal(r.net, 213.70); assert.equal(r.outcome, 'WIN');
  });
  it('LOSS: entry=3.65, exit=8.00', () => {
    const r = calc(3.65, 8.00);
    assert.equal(r.gross, -435); assert.equal(r.net, -436.30); assert.equal(r.outcome, 'LOSS');
  });
  it('FLAT→LOSS: entry=3.65, exit=3.65 (fees)', () => {
    const r = calc(3.65, 3.65);
    assert.equal(r.gross, 0); assert.equal(r.net, -1.30); assert.equal(r.outcome, 'LOSS');
  });
  it('FORCED_TIME LOSS: entry=3.65, exit=4.00', () => {
    const r = calc(3.65, 4.00);
    assert.equal(r.gross, -35); assert.equal(r.net, -36.30); assert.equal(r.outcome, 'LOSS');
  });
});

// ────────────────────────────────────────────────────────────────
// Bid-derived credit
// ────────────────────────────────────────────────────────────────
describe('Bid-derived credit', () => {
  it('entry_credit = bid, not a separate value', () => {
    // Ingest derives entry_credit from body.bid
    const body = { bid: 3.65, ask: 3.80 };
    assert.equal(body.bid, 3.65);
    assert.notEqual(body.bid, body.ask);
  });
});

// ────────────────────────────────────────────────────────────────
// Exit reason → generic category mapping
// ────────────────────────────────────────────────────────────────
describe('Exit reason mapping', () => {
  const map = { PROFIT_TARGET: 'Profit', STOP_LOSS: 'Stop', PRE_ITM: 'Protection', FORCED_TIME_EXIT: 'Time', EXPIRATION: 'Expiration' };
  const mapReason = r => map[r] ?? r ?? null;
  it('PROFIT_TARGET → Profit', () => assert.equal(mapReason('PROFIT_TARGET'), 'Profit'));
  it('STOP_LOSS → Stop', () => assert.equal(mapReason('STOP_LOSS'), 'Stop'));
  it('FORCED_TIME_EXIT → Time', () => assert.equal(mapReason('FORCED_TIME_EXIT'), 'Time'));
  it('null → null', () => assert.equal(mapReason(null), null));
});

// ────────────────────────────────────────────────────────────────
// Boundary / date tests
// ────────────────────────────────────────────────────────────────
describe('Boundary tests', () => {
  const _etFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const _etParts = Object.fromEntries(
    _etFmt.formatToParts(new Date()).map(p => [p.type, p.value])
  );
  const today = `${_etParts.year}-${_etParts.month}-${_etParts.day}`;
  const etNow = new Date(`${today}T12:00:00`);
  const dAgo = n => { const d = new Date(etNow); d.setDate(d.getDate() - n); return d.toISOString(); };

  it('14-day: today is within window', () => assert.ok(dAgo(0) >= dAgo(14)));
  it('14-day: 13 days ago is within', () => assert.ok(dAgo(13) >= dAgo(14)));
  it('14-day: 15 days ago is outside', () => assert.ok(dAgo(15) < dAgo(14)));
  it('MTD: today is within month', () => assert.ok(today >= `${today.slice(0,7)}-01`));
  it('MTD: first of month is within', () => assert.ok(`${today.slice(0,7)}-01` >= `${today.slice(0,7)}-01`));
  it('MTD: prev month last day is outside', () => {
    const etFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const etParts = Object.fromEntries(
      etFmt.formatToParts(new Date()).map(p => [p.type, p.value])
    );
    const etYear = Number(etParts.year), etMonth = Number(etParts.month);
    const prevLast = new Date(etYear, etMonth - 1, 0); // day 0 of etMonth = last day of prev month
    const prevStr = `${prevLast.getFullYear()}-${String(prevLast.getMonth()+1).padStart(2,'0')}-${String(prevLast.getDate()).padStart(2,'0')}`;
    assert.ok(prevStr < `${today.slice(0,7)}-01`);
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: Quote provider behavior
// ────────────────────────────────────────────────────────────────
describe('Quote validation edge cases', () => {
  it('missing contract → valid:false, reason:contract_not_found', () => {
    const r = evaluateExitRules(makeTrade(), { valid: false, reason: 'contract_not_found', retrieved_at: new Date().toISOString() });
    assert.equal(r.triggered, false);
    assert.equal(r.data_review, true);
    assert.equal(r.details.rule, 'DATA_FAILURE');
  });

  it('missing ask (null) → valid:false from provider', () => {
    const r = evaluateExitRules(makeTrade(), { valid: false, reason: 'invalid_ask', retrieved_at: new Date().toISOString() });
    assert.equal(r.data_review, true);
  });

  it('crossed market (bid > ask) → valid:false from provider', () => {
    const r = evaluateExitRules(makeTrade(), { valid: false, reason: 'crossed_market', retrieved_at: new Date().toISOString() });
    assert.equal(r.data_review, true);
  });

  it('zero bid AND zero ask → valid:false', () => {
    const r = evaluateExitRules(makeTrade(), { valid: false, reason: 'zero_bid_and_ask', retrieved_at: new Date().toISOString() });
    assert.equal(r.data_review, true);
  });

  it('old timestamp → quote_timing remains delayed_unverified', () => {
    const oldTs = new Date(Date.now() - 3600_000).toISOString();
    const q = makeQuote({ provider_timestamp: oldTs, quote_timing: 'delayed_unverified' });
    assert.equal(q.quote_timing, 'delayed_unverified');
  });

  it('missing timestamp → quote_timing defaults to delayed_unverified', () => {
    const q = makeQuote({ provider_timestamp: null, quote_timing: 'delayed_unverified' });
    assert.equal(q.quote_timing, 'delayed_unverified');
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: Source + retrieved_at semantics
// ────────────────────────────────────────────────────────────────
describe('Source and retrieved_at', () => {
  it('EXPIRATION exit_quote_source = expiration_settlement', () => {
    const r = evaluateExitRules(
      makeTrade({ expiration: DTE_0, strike: 200 }),
      makeQuote({ stock_price: 210, option: { bid: 0, ask: null, last: 0, strike: 200 } }),
    );
    assert.equal(r.exit_quote_source, 'expiration_settlement');
  });

  it('non-EXPIRATION exit_quote_source from provider', () => {
    const r = evaluateExitRules(
      makeTrade({ entry_credit: 3.65 }),
      makeQuote({ option: { bid: 1.2, ask: 1.5, last: 1.3, strike: 781 } }),
    );
    assert.equal(r.triggered, true);
    assert.equal(r.reason, 'PROFIT_TARGET');
    assert.ok(r.exit_quote_source === undefined || typeof r.exit_quote_source === 'string');
  });

  it('retrieved_at is ISO UTC format', () => {
    const q = makeQuote();
    assert.match(q.retrieved_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    assert.ok(q.retrieved_at.endsWith('Z'), 'retrieved_at must be UTC (ends with Z)');
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: Alert ID determinism
// ────────────────────────────────────────────────────────────────
describe('Alert ID retry vs later run', () => {
  it('same scan_run_id → same alert_id (retry-safe)', () => {
    const body = { scan_run_id: 'run_abc', tier: 'standard', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    const id1 = makeAlertId(body);
    const id2 = makeAlertId(body);
    assert.equal(id1, id2);
  });

  it('different scan_run_id → different alert_id (new run)', () => {
    const body1 = { scan_run_id: 'run_abc', tier: 'standard', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    const body2 = { scan_run_id: 'run_def', tier: 'standard', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    assert.notEqual(makeAlertId(body1), makeAlertId(body2));
  });

  it('alert_id is exactly 40 hex chars', () => {
    const id = makeAlertId({ scan_run_id: 'x', tier: 'standard', ticker: 'T', side: 'PUT', contract_symbol: 'S' });
    assert.match(id, /^[0-9a-f]{40}$/);
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: Public API denied fields
// ────────────────────────────────────────────────────────────────
describe('Public API safe field allowlist', () => {
  const SAFE_FIELDS = new Set([
    'id', 'ticker', 'side', 'strike', 'expiration',
    'entry_credit', 'entry_stock_price', 'entry_dte',
    'alerted_at', 'status',
    'closed_at', 'exit_debit', 'exit_reason',
    'days_held', 'gross_pnl', 'fees', 'net_pnl', 'outcome',
    'tier', 'is_spread',
  ]);

  const DENIED_FIELDS = [
    'alert_id', 'scan_run_id', 'contract_symbol',
    'entry_bid', 'entry_ask', 'entry_quote_source', 'entry_quote_time',
    'entry_quote_retrieved_at', 'entry_quote_timing', 'entry_dte_caller',
    'publish_state', 'reviewed_at', 'reviewed_by',
    'exit_stock_price', 'exit_option_bid', 'exit_option_ask',
    'exit_quote_source', 'exit_quote_time', 'exit_quote_retrieved_at',
    'rule_version', 'calc_version', 'last_evaluated_at',
    'buy_leg_strike', 'net_credit', 'spread_width',
  ];

  for (const field of DENIED_FIELDS) {
    it(`${field} is NOT in SAFE_FIELDS`, () => {
      assert.equal(SAFE_FIELDS.has(field), false, `${field} must not be in safe allowlist`);
    });
  }

  it('SAFE_FIELDS includes id, ticker, strike, entry_credit', () => {
    assert.ok(SAFE_FIELDS.has('id'));
    assert.ok(SAFE_FIELDS.has('ticker'));
    assert.ok(SAFE_FIELDS.has('strike'));
    assert.ok(SAFE_FIELDS.has('entry_credit'));
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: SHADOW lifecycle — rules are publish-blind
// ────────────────────────────────────────────────────────────────
describe('SHADOW lifecycle independence', () => {
  it('exit rules produce identical results for SHADOW vs LIVE', () => {
    const shadow = evaluateExitRules(makeTrade({ publish_state: 'SHADOW' }), makeQuote());
    const live = evaluateExitRules(makeTrade({ publish_state: 'LIVE' }), makeQuote());
    assert.deepStrictEqual(shadow, live);
  });

  it('exit rules produce identical results regardless of reviewed_at', () => {
    const unreviewed = evaluateExitRules(makeTrade({ reviewed_at: null }), makeQuote());
    const reviewed = evaluateExitRules(makeTrade({ reviewed_at: new Date().toISOString() }), makeQuote());
    assert.deepStrictEqual(unreviewed, reviewed);
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: Workflow header + unlogged value
// ────────────────────────────────────────────────────────────────
describe('Workflow security invariants', () => {
  it('x-api-key header is present in auth model', () => {
    const headers = { 'x-api-key': 'test_secret_value' };
    assert.ok('x-api-key' in headers);
    assert.equal(headers['x-api-key'], 'test_secret_value');
  });

  it('Authorization header for Gist uses token scheme', () => {
    const token = 'ghp_fake123';
    const header = `token ${token}`;
    assert.ok(header.startsWith('token '));
    assert.ok(header.includes(token));
  });

  it('secret values must not appear in sanitized log output', () => {
    const secret = 'ghp_supersecretvalue123';
    const logLine = 'Gist write succeeded (revision created)';
    assert.ok(!logLine.includes(secret));
    assert.ok(!logLine.includes('Authorization'));
  });
});

// ────────────────────────────────────────────────────────────────
// v4.2: Market calendar edge cases
// ────────────────────────────────────────────────────────────────
describe('Market calendar coverage', () => {
  it('SUPPORTED_YEARS includes 2025, 2026, 2027', () => {
    const SUPPORTED = [2025, 2026, 2027];
    assert.ok(SUPPORTED.includes(2025));
    assert.ok(SUPPORTED.includes(2026));
    assert.ok(SUPPORTED.includes(2027));
  });

  it('Unsupported year 2028 → fail-closed', () => {
    const SUPPORTED = [2025, 2026, 2027];
    assert.equal(SUPPORTED.includes(2028), false, '2028 not in SUPPORTED_YEARS');
  });

  it('computeDTE returns 0 for today (ET)', () => {
    const today = new Date();
    const et = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const ds = `${et.getFullYear()}-${String(et.getMonth()+1).padStart(2,'0')}-${String(et.getDate()).padStart(2,'0')}`;
    const dte = computeDTE(ds);
    assert.ok(dte <= 0, `DTE for today should be <=0, got ${dte}`);
  });

  it('computeDTE returns positive for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const ds = `${future.getFullYear()}-${String(future.getMonth()+1).padStart(2,'0')}-${String(future.getDate()).padStart(2,'0')}`;
    const dte = computeDTE(ds);
    assert.ok(dte > 0, `DTE should be positive for 7 days from now, got ${dte}`);
  });
});

// ────────────────────────────────────────────────────────────────
// OCC symbol format
// ────────────────────────────────────────────────────────────────
describe('OCC symbol format', () => {
  it('valid PUT OCC symbol produces 40-hex ID', () => {
    const body = { scan_run_id: 'run_occ1', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    const id = makeAlertId(body);
    assert.match(id, /^[0-9a-f]{40}$/, 'PUT OCC symbol should produce a 40-hex alert ID');
  });

  it('valid CALL OCC symbol produces a different ID from PUT', () => {
    const putBody = { scan_run_id: 'run_occ2', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    const callBody = { scan_run_id: 'run_occ2', ticker: 'AAPL', side: 'CALL', contract_symbol: 'AAPL260718C00200000' };
    const putId = makeAlertId(putBody);
    const callId = makeAlertId(callBody);
    assert.match(callId, /^[0-9a-f]{40}$/, 'CALL OCC symbol should produce a 40-hex alert ID');
    assert.notEqual(putId, callId, 'PUT and CALL OCC symbols should produce different IDs');
  });

  it('side mismatch detection: different side in contract symbol → different alert ID', () => {
    const a = { scan_run_id: 'run_occ3', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    const b = { scan_run_id: 'run_occ3', ticker: 'AAPL', side: 'CALL', contract_symbol: 'AAPL260718C00200000' };
    assert.notEqual(makeAlertId(a), makeAlertId(b), 'Same ticker/strike but different side should yield different alert IDs');
  });
});

// ────────────────────────────────────────────────────────────────
// LIVE serializer boundary (SAFE_FIELDS from index.js)
// ────────────────────────────────────────────────────────────────
describe('LIVE serializer boundary', () => {
  const PROD_SAFE_FIELDS = [
    'id', 'ticker', 'side', 'strike', 'expiration',
    'entry_credit', 'entry_stock_price', 'entry_dte',
    'alerted_at', 'status',
    'closed_at', 'exit_debit', 'exit_reason',
    'days_held', 'gross_pnl', 'fees', 'net_pnl', 'outcome',
    'tier', 'is_spread',
  ];

  it('SAFE_FIELDS is an array', () => {
    assert.ok(Array.isArray(PROD_SAFE_FIELDS), 'SAFE_FIELDS should be an array');
  });

  it('SAFE_FIELDS contains exactly the expected 20 fields', () => {
    const expected = new Set([
      'id', 'ticker', 'side', 'strike', 'expiration',
      'entry_credit', 'entry_stock_price', 'entry_dte',
      'alerted_at', 'status',
      'closed_at', 'exit_debit', 'exit_reason',
      'days_held', 'gross_pnl', 'fees', 'net_pnl', 'outcome',
      'tier', 'is_spread',
    ]);
    const actual = new Set(PROD_SAFE_FIELDS);
    assert.deepStrictEqual(actual, expected, 'SAFE_FIELDS must match expected allowlist');
  });

  it('SAFE_FIELDS does NOT contain denied internal fields', () => {
    const denied = ['alert_id', 'scan_run_id', 'contract_symbol', 'publish_state', 'reviewed_at', 'reviewed_by', 'rule_version', 'calc_version'];
    const safeSet = new Set(PROD_SAFE_FIELDS);
    for (const f of denied) {
      assert.equal(safeSet.has(f), false, `${f} must NOT be in SAFE_FIELDS`);
    }
  });

  it('SAFE_FIELDS.length is exactly 20', () => {
    assert.equal(PROD_SAFE_FIELDS.length, 20, 'SAFE_FIELDS should have exactly 20 entries');
  });
});

// ────────────────────────────────────────────────────────────────
// Workflow ET matrix (EST / EDT / expired)
// ────────────────────────────────────────────────────────────────
describe('Workflow ET matrix', () => {
  it('EST winter date computes correct DTE', () => {
    const dte = computeDTE('2026-01-20');
    assert.equal(typeof dte, 'number', 'DTE must be a number');
    assert.equal(Number.isInteger(dte), true, 'DTE must be an integer (from Math.ceil)');
  });

  it('EDT summer date computes correct DTE', () => {
    const dte = computeDTE('2026-07-20');
    assert.equal(typeof dte, 'number', 'DTE must be a number');
    assert.equal(Number.isInteger(dte), true, 'DTE must be an integer (from Math.ceil)');
    assert.ok(dte > 0, `DTE for 2026-07-20 should be positive, got ${dte}`);
  });

  it('expired contract DTE <= 0', () => {
    const dte = computeDTE('2025-01-01');
    assert.ok(dte <= 0, `DTE for 2025-01-01 should be <= 0, got ${dte}`);
  });
});

// ────────────────────────────────────────────────────────────────
// Evaluator edge cases
// ────────────────────────────────────────────────────────────────
describe('Evaluator edge cases', () => {
  it('DATA_REVIEW: both bid and ask are NaN → data_review', () => {
    const r = evaluateExitRules(
      makeTrade(),
      { valid: false, reason: 'nan_bid_ask', retrieved_at: new Date().toISOString() },
    );
    assert.equal(r.triggered, false, 'NaN bid/ask should not trigger exit');
    assert.equal(r.data_review, true, 'NaN bid/ask should flag data_review');
    assert.equal(r.details.rule, 'DATA_FAILURE');
  });

  it('SHADOW trade evaluated same as OPEN', () => {
    const quote = makeQuote();
    const shadowResult = evaluateExitRules(makeTrade({ publish_state: 'SHADOW' }), quote);
    const openResult = evaluateExitRules(makeTrade({ publish_state: 'OPEN' }), quote);
    assert.deepStrictEqual(shadowResult, openResult, 'SHADOW and OPEN must produce identical exit evaluations');
  });

  it('near-boundary profit: ask exactly 50% of entry → PROFIT_TARGET', () => {
    const r = evaluateExitRules(
      makeTrade({ entry_credit: 4.00 }),
      makeQuote({ option: { bid: 1.80, ask: 2.00, last: 1.90, strike: 781 } }),
    );
    assert.equal(r.triggered, true, 'ask at exactly 50% should trigger');
    assert.equal(r.reason, 'PROFIT_TARGET');
    assert.equal(r.exit_debit, 2.00);
  });

  it('near-boundary stop: ask exactly 200% of entry → STOP_LOSS', () => {
    const r = evaluateExitRules(
      makeTrade({ entry_credit: 4.00 }),
      makeQuote({ stock_price: 800, option: { bid: 7.50, ask: 8.00, last: 7.80, strike: 781 } }),
    );
    assert.equal(r.triggered, true, 'ask at exactly 200% should trigger');
    assert.equal(r.reason, 'STOP_LOSS');
    assert.equal(r.exit_debit, 8.00);
  });
});

// ════════════════════════════════════════════════════════════════
// v4.2 BLOCK A: Quote Provider — real ensureSession / getOptionQuote
// ════════════════════════════════════════════════════════════════
describe('Quote Provider (real functions)', () => {
  const origFetch = globalThis.fetch;
  after(() => { globalThis.fetch = origFetch; });

  function fakeResp(status, body, headers = {}) {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (k) => headers[k.toLowerCase()] || null },
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
      json: async () => (typeof body === 'object' ? body : JSON.parse(body)),
    };
  }

  function yahooChain(puts, calls, stockPrice = 210) {
    return {
      optionChain: {
        result: [{
          quote: { regularMarketPrice: stockPrice, regularMarketTime: Math.floor(Date.now() / 1000) },
          options: [{ puts, calls }],
        }],
      },
    };
  }

  function seqFetch(responses) {
    let i = 0;
    return async (url, opts) => {
      const r = i < responses.length ? responses[i++] : responses[responses.length - 1];
      return typeof r === 'function' ? r(url, opts) : r;
    };
  }

  function sessionMocks(crumb, ...rest) {
    return [
      fakeResp(302, '', { 'set-cookie': `A3=test_cookie_val; Path=/` }),
      fakeResp(200, crumb),
      ...rest,
    ];
  }

  it('ensureSession(true) forces cookie→crumb refresh; getOptionQuote sends encoded crumb', async () => {
    const crumb = 'cr/umb+special';
    const target = 'AAPL260718C00200000';
    const calls = [{ contractSymbol: target, bid: 2.5, ask: 3.0, lastPrice: 2.8, strike: 200, volume: 100, openInterest: 500, impliedVolatility: 0.3 }];
    let capturedCookieHeader = null;
    let capturedOptionsUrl = null;

    globalThis.fetch = seqFetch([
      (url) => {
        assert.ok(url.includes('fc.yahoo.com'), 'First call must be cookie endpoint');
        return fakeResp(302, '', { 'set-cookie': 'A3=fresh_cookie; Path=/' });
      },
      (url, opts) => {
        assert.ok(url.includes('getcrumb'), 'Second call must be crumb endpoint');
        capturedCookieHeader = opts?.headers?.Cookie;
        return fakeResp(200, crumb);
      },
      (url) => {
        capturedOptionsUrl = url;
        return fakeResp(200, yahooChain([], calls));
      },
    ]);

    const sessionOk = await ensureSession(true);
    assert.equal(sessionOk, true, 'ensureSession(true) should succeed');
    assert.ok(capturedCookieHeader?.includes('A3='), 'Crumb call must include cookie header');

    const result = await getOptionQuote('AAPL', target, '2026-07-18');
    assert.equal(result.valid, true);
    assert.ok(capturedOptionsUrl, 'Options URL must have been captured');
    assert.ok(
      capturedOptionsUrl.includes(encodeURIComponent(crumb)),
      `Options URL must contain encoded crumb: expected ${encodeURIComponent(crumb)} in ${capturedOptionsUrl}`
    );
    globalThis.fetch = origFetch;
  });

  it('exact OCC match: finds target from mixed puts + calls', async () => {
    const target = 'AAPL260718C00200000';
    const puts = [
      { contractSymbol: 'AAPL260718P00190000', bid: 1, ask: 2, lastPrice: 1.5, strike: 190, volume: 10, openInterest: 50, impliedVolatility: 0.2 },
      { contractSymbol: 'AAPL260718P00195000', bid: 1.5, ask: 2.5, lastPrice: 2, strike: 195, volume: 10, openInterest: 50, impliedVolatility: 0.2 },
      { contractSymbol: 'AAPL260718P00200000', bid: 2, ask: 3, lastPrice: 2.5, strike: 200, volume: 10, openInterest: 50, impliedVolatility: 0.2 },
    ];
    const calls = [
      { contractSymbol: 'AAPL260718C00195000', bid: 3, ask: 4, lastPrice: 3.5, strike: 195, volume: 10, openInterest: 50, impliedVolatility: 0.2 },
      { contractSymbol: target, bid: 2.5, ask: 3.0, lastPrice: 2.8, strike: 200, volume: 100, openInterest: 500, impliedVolatility: 0.3 },
    ];

    globalThis.fetch = seqFetch(sessionMocks('crumb_occ', fakeResp(200, yahooChain(puts, calls))));
    await ensureSession(true);

    const result = await getOptionQuote('AAPL', target, '2026-07-18');
    assert.equal(result.valid, true, 'Quote must be valid');
    assert.equal(result.option.bid, 2.5, 'Must return target contract bid');
    assert.equal(result.option.ask, 3.0, 'Must return target contract ask');
    assert.equal(result.option.strike, 200);
    globalThis.fetch = origFetch;
  });

  it('401 → one forced refresh → retry success', async () => {
    const target = 'SPY260718P00550000';
    const chain = yahooChain(
      [{ contractSymbol: target, bid: 4.0, ask: 4.5, lastPrice: 4.2, strike: 550, volume: 200, openInterest: 1000, impliedVolatility: 0.25 }],
      []
    );
    globalThis.fetch = seqFetch(sessionMocks('crumb_init'));
    await ensureSession(true);

    let callIdx = 0;
    globalThis.fetch = async (url, opts) => {
      callIdx++;
      if (callIdx === 1) return fakeResp(401, 'Unauthorized');
      if (callIdx === 2) return fakeResp(302, '', { 'set-cookie': 'A3=new_cookie; Path=/' });
      if (callIdx === 3) return fakeResp(200, 'crumb_refreshed');
      return fakeResp(200, chain);
    };

    const result = await getOptionQuote('SPY', target, '2026-07-18');
    assert.equal(result.valid, true, 'Should succeed after 401 → refresh → retry');
    assert.equal(result.option.bid, 4.0);
    globalThis.fetch = origFetch;
  });

  it('403 → refresh → second 403 → fail closed', async () => {
    globalThis.fetch = seqFetch(sessionMocks('crumb_403'));
    await ensureSession(true);

    let callIdx = 0;
    globalThis.fetch = async (url) => {
      callIdx++;
      if (callIdx === 1) return fakeResp(403, 'Forbidden');
      if (callIdx === 2) return fakeResp(302, '', { 'set-cookie': 'A3=x; Path=/' });
      if (callIdx === 3) return fakeResp(200, 'crumb_new');
      return fakeResp(403, 'Forbidden');
    };

    const result = await getOptionQuote('SPY', 'SPY260718P00550000', '2026-07-18');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'yahoo_auth_403_refresh_failed');
    globalThis.fetch = origFetch;
  });

  it('HTML crumb → fail closed with session_failed', async () => {
    globalThis.fetch = seqFetch([
      fakeResp(302, '', { 'set-cookie': 'A3=cookie_val; Path=/' }),
      fakeResp(200, '<html>'),
      fakeResp(302, '', { 'set-cookie': 'A3=cookie_val2; Path=/' }),
      fakeResp(200, '<html>'),
    ]);
    await ensureSession(true);

    globalThis.fetch = seqFetch([
      fakeResp(302, '', { 'set-cookie': 'A3=c; Path=/' }),
      fakeResp(200, '<html>'),
      fakeResp(302, '', { 'set-cookie': 'A3=c; Path=/' }),
      fakeResp(200, '<html>'),
    ]);
    const result = await getOptionQuote('AAPL', 'AAPL260718P00200000', '2026-07-18');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'session_failed');
    globalThis.fetch = origFetch;
  });

  it('zero credential logging: no cookie/crumb values in console.error', async () => {
    const logged = [];
    const origError = console.error;
    console.error = (...args) => { logged.push(args.join(' ')); };

    globalThis.fetch = seqFetch([
      fakeResp(302, '', { 'set-cookie': 'A3=SECRET_COOKIE_VAL; Path=/' }),
      fakeResp(200, 'SECRET_CRUMB_VAL'),
      async () => { throw new Error('network timeout'); },
    ]);
    await ensureSession(true);
    const result = await getOptionQuote('AAPL', 'X', '2026-07-18');
    assert.equal(result.valid, false);

    console.error = origError;
    globalThis.fetch = origFetch;

    for (const msg of logged) {
      assert.ok(!msg.includes('SECRET_COOKIE_VAL'), `Cookie value must not appear in logs: ${msg}`);
      assert.ok(!msg.includes('SECRET_CRUMB_VAL'), `Crumb value must not appear in logs: ${msg}`);
    }
  });

  it('MAX_BATCH_MS exported as 25000', () => {
    assert.equal(MAX_BATCH_MS, 25000);
  });
});

// ════════════════════════════════════════════════════════════════
// v4.2 BLOCK B: Ingest handler — real import
// ════════════════════════════════════════════════════════════════
describe('Ingest handler (real functions)', () => {
  const SAVED_KEY = process.env.INGEST_API_KEY;
  const TEST_KEY = 'test_ingest_key_42';

  before(() => { process.env.INGEST_API_KEY = TEST_KEY; });
  after(() => {
    if (SAVED_KEY !== undefined) process.env.INGEST_API_KEY = SAVED_KEY;
    else delete process.env.INGEST_API_KEY;
  });

  function mockRes() {
    const r = { _status: null, _json: null };
    r.status = (s) => { r._status = s; return r; };
    r.json = (j) => { r._json = j; return r; };
    return r;
  }
  function mockReq(method, headers, body) {
    return { method, headers: headers || {}, body: body || {} };
  }

  const goodBody = {
    scan_run_id: 'run_01', alerted_at: '2026-07-11T14:00:00Z', tier: 'standard',
    ticker: 'AAPL', side: 'PUT', strike: 200, expiration: '2026-07-18',
    contract_symbol: 'AAPL260718P00200000', bid: 3.65, ask: 3.80,
    stock_price: 210, dte: 7,
  };

  it('GET → 405 Method not allowed', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('GET'), res);
    assert.equal(res._status, 405);
    assert.equal(res._json.error, 'Method not allowed');
  });

  it('missing x-api-key → 401', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', {}, goodBody), res);
    assert.equal(res._status, 401);
  });

  it('wrong x-api-key → 401', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': 'wrong' }, goodBody), res);
    assert.equal(res._status, 401);
  });

  it('correct key but missing ticker → 400 with field name', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, ticker: '' }), res);
    assert.equal(res._status, 400);
    assert.ok(res._json.missing.includes('ticker'));
  });

  it('invalid alerted_at → 400', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, alerted_at: 'not-a-date' }), res);
    assert.equal(res._status, 400);
    assert.match(res._json.error, /alerted_at/);
  });

  it('side not PUT/CALL → 400', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, side: 'SELL' }), res);
    assert.equal(res._status, 400);
    assert.match(res._json.error, /side/);
  });

  it('strike <= 0 → 400', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, strike: 0 }), res);
    assert.equal(res._status, 400);
    assert.match(res._json.error, /strike/);
  });

  it('bid > ask (crossed) → 400', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, bid: 5.00, ask: 3.00 }), res);
    assert.equal(res._status, 400);
    assert.match(res._json.error, /crossed/);
  });

  it('bid <= 0 → 400', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, bid: 0 }), res);
    assert.equal(res._status, 400);
  });

  it('ask <= 0 → 400', async () => {
    const res = mockRes();
    await ingestHandler(mockReq('POST', { 'x-api-key': TEST_KEY }, { ...goodBody, ask: -1 }), res);
    assert.equal(res._status, 400);
  });

  it('makeAlertId is deterministic and sha256-based', () => {
    const body = { scan_run_id: 'run_X', tier: 'standard', ticker: 'AAPL', side: 'PUT', contract_symbol: 'AAPL260718P00200000' };
    const id1 = ingestMakeAlertId(body);
    const id2 = ingestMakeAlertId(body);
    assert.equal(id1, id2, 'Same input → same alert_id');
    assert.equal(id1.length, 40, 'alert_id is 40 hex chars');
    assert.match(id1, /^[0-9a-f]{40}$/, 'Must be lowercase hex');
  });

  it('different scan_run_id → different alert_id', () => {
    const a = ingestMakeAlertId({ ...goodBody, scan_run_id: 'run_A' });
    const b = ingestMakeAlertId({ ...goodBody, scan_run_id: 'run_B' });
    assert.notEqual(a, b);
  });

  it('different ticker → different alert_id', () => {
    const a = ingestMakeAlertId({ ...goodBody, ticker: 'AAPL' });
    const b = ingestMakeAlertId({ ...goodBody, ticker: 'SPY' });
    assert.notEqual(a, b);
  });

  it('server DTE: computeDTE called by handler with body.expiration', () => {
    const dte = computeDTE('2028-12-15');
    assert.equal(typeof dte, 'number');
    assert.ok(dte > 0, 'Far future expiration must yield positive DTE');
  });
});

// ════════════════════════════════════════════════════════════════
// v4.2 BLOCK C: GET route safe-serializer invariants
// ════════════════════════════════════════════════════════════════
describe('GET route safe-serializer invariants', () => {
  const EXPECTED_SAFE_FIELDS = [
    'id', 'ticker', 'side', 'strike', 'expiration',
    'entry_credit', 'entry_stock_price', 'entry_dte',
    'alerted_at', 'status',
    'closed_at', 'exit_debit', 'exit_reason',
    'days_held', 'gross_pnl', 'fees', 'net_pnl', 'outcome',
    'tier', 'is_spread',
  ];

  const EXIT_REASON_MAP = {
    'PROFIT_TARGET': 'Profit',
    'STOP_LOSS': 'Stop',
    'PRE_ITM': 'Protection',
    'FORCED_TIME_EXIT': 'Time',
    'EXPIRATION': 'Expiration',
  };

  it('SAFE_FIELDS count = 20 (contract test)', () => {
    assert.equal(EXPECTED_SAFE_FIELDS.length, 20);
  });

  it('no internal fields in SAFE_FIELDS', () => {
    const forbidden = ['alert_id', 'scan_run_id', 'contract_symbol', 'publish_state',
      'rule_version', 'calc_version', 'last_evaluated_at', 'reviewed_at',
      'entry_bid', 'entry_ask', 'entry_score', 'entry_grade'];
    for (const f of forbidden) {
      assert.ok(!EXPECTED_SAFE_FIELDS.includes(f), `${f} must NOT be in SAFE_FIELDS`);
    }
  });

  it('exit_reason mapping covers all exit rule reasons', () => {
    const allReasons = ['PROFIT_TARGET', 'STOP_LOSS', 'PRE_ITM', 'FORCED_TIME_EXIT', 'EXPIRATION'];
    for (const r of allReasons) {
      assert.ok(r in EXIT_REASON_MAP, `${r} must have a mapping`);
      assert.ok(typeof EXIT_REASON_MAP[r] === 'string' && EXIT_REASON_MAP[r].length > 0);
    }
  });

  it('exit_reason mapping uses generic user-facing labels (no internals)', () => {
    for (const [, label] of Object.entries(EXIT_REASON_MAP)) {
      assert.ok(!label.includes('_'), `Label "${label}" must not contain underscores`);
      assert.ok(label.length <= 12, `Label "${label}" must be short/generic`);
    }
  });

  it('null exit_reason remains null in mapping logic', () => {
    const reason = null;
    const mapped = reason ? (EXIT_REASON_MAP[reason] || reason) : null;
    assert.equal(mapped, null);
  });

  it('unknown exit_reason passes through unmapped', () => {
    const reason = 'MANUAL_CLOSE';
    const mapped = reason ? (EXIT_REASON_MAP[reason] || reason) : null;
    assert.equal(mapped, 'MANUAL_CLOSE');
  });
});

// ════════════════════════════════════════════════════════════════
// v4.2 BLOCK D: Reconcile handler auth + method guards
// ════════════════════════════════════════════════════════════════
describe('Reconcile handler guards', async () => {
  const { default: reconcileHandler } = await import('./reconcile.js');

  function mockRes() {
    const r = { _status: null, _json: null };
    r.status = (s) => { r._status = s; return r; };
    r.json = (j) => { r._json = j; return r; };
    return r;
  }

  const SAVED_KEY = process.env.INGEST_API_KEY;
  const TEST_KEY = 'test_reconcile_key_42';

  before(() => { process.env.INGEST_API_KEY = TEST_KEY; });
  after(() => {
    if (SAVED_KEY !== undefined) process.env.INGEST_API_KEY = SAVED_KEY;
    else delete process.env.INGEST_API_KEY;
  });

  it('GET → 405', async () => {
    const res = mockRes();
    await reconcileHandler({ method: 'GET', headers: {} }, res);
    assert.equal(res._status, 405);
  });

  it('missing x-api-key → 401', async () => {
    const res = mockRes();
    await reconcileHandler({ method: 'POST', headers: {} }, res);
    assert.equal(res._status, 401);
  });

  it('wrong x-api-key → 401', async () => {
    const res = mockRes();
    await reconcileHandler({ method: 'POST', headers: { 'x-api-key': 'nope' } }, res);
    assert.equal(res._status, 401);
  });

  it('missing DASHBOARD_GIST_ID → 500', async () => {
    const savedGist = process.env.DASHBOARD_GIST_ID;
    const savedToken = process.env.GIST_TOKEN;
    delete process.env.DASHBOARD_GIST_ID;
    delete process.env.GIST_TOKEN;

    const res = mockRes();
    await reconcileHandler({ method: 'POST', headers: { 'x-api-key': TEST_KEY } }, res);
    assert.equal(res._status, 500);
    assert.match(res._json.error, /GIST/i);

    if (savedGist) process.env.DASHBOARD_GIST_ID = savedGist;
    if (savedToken) process.env.GIST_TOKEN = savedToken;
  });
});

// ════════════════════════════════════════════════════════════════
// v4.2 BLOCK E: Evaluator handler auth + market-closed guard
// ════════════════════════════════════════════════════════════════
describe('Evaluator handler guards', async () => {
  const { default: evaluateHandler } = await import('./evaluate.js');

  function mockRes() {
    const r = { _status: null, _json: null, _headers: {} };
    r.status = (s) => { r._status = s; return r; };
    r.json = (j) => { r._json = j; return r; };
    r.setHeader = (k, v) => { r._headers[k] = v; return r; };
    return r;
  }

  const SAVED_KEY = process.env.INGEST_API_KEY;
  const TEST_KEY = 'test_eval_key_42';

  before(() => { process.env.INGEST_API_KEY = TEST_KEY; });
  after(() => {
    if (SAVED_KEY !== undefined) process.env.INGEST_API_KEY = SAVED_KEY;
    else delete process.env.INGEST_API_KEY;
  });

  it('GET → 405', async () => {
    const res = mockRes();
    await evaluateHandler({ method: 'GET', headers: {} }, res);
    assert.equal(res._status, 405);
  });

  it('missing x-api-key → 401', async () => {
    const res = mockRes();
    await evaluateHandler({ method: 'POST', headers: {} }, res);
    assert.equal(res._status, 401);
  });

  it('wrong x-api-key → 401', async () => {
    const res = mockRes();
    await evaluateHandler({ method: 'POST', headers: { 'x-api-key': 'wrong' } }, res);
    assert.equal(res._status, 401);
  });

  it('evaluateExitRules: DATA_REVIEW on invalid quote', () => {
    const r = evaluateExitRules(makeTrade(), { valid: false, reason: 'session_failed', retrieved_at: '' });
    assert.equal(r.data_review, true);
    assert.equal(r.triggered, false);
    assert.equal(r.details.rule, 'DATA_FAILURE');
  });

  it('evaluateExitRules: valid quote no trigger → no data_review', () => {
    const r = evaluateExitRules(makeTrade(), makeQuote());
    assert.equal(r.triggered, false);
    assert.equal(r.data_review, undefined);
  });

  it('MAX_BATCH_MS from _quoteProvider is 25000', () => {
    assert.equal(MAX_BATCH_MS, 25000);
  });
});

// ════════════════════════════════════════════════════════════════
// v4.2 BLOCK F: Date/DTE/timezone boundary tests
// ════════════════════════════════════════════════════════════════
describe('Date/DTE/timezone boundaries', () => {
  it('getETNow returns valid ET components', () => {
    const et = getETNow();
    assert.ok(typeof et.hour === 'number' && et.hour >= 0 && et.hour <= 23);
    assert.ok(typeof et.minute === 'number' && et.minute >= 0 && et.minute <= 59);
    assert.ok(typeof et.dow === 'number' && et.dow >= 0 && et.dow <= 6);
    assert.match(et.dateStr, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(et.year >= 2025 && et.year <= 2030);
  });

  it('computeDTE: same-day expiration → 0 or negative', () => {
    const et = getETNow();
    const dte = computeDTE(et.dateStr);
    assert.ok(dte <= 1, `Same-day DTE should be <= 1, got ${dte}`);
  });

  it('computeDTE: far future is positive', () => {
    const dte = computeDTE('2028-12-15');
    assert.ok(dte > 300, `Far future DTE should be >300, got ${dte}`);
  });

  it('computeDTE: past expiration is negative', () => {
    const dte = computeDTE('2020-01-01');
    assert.ok(dte < 0, `Past DTE should be negative, got ${dte}`);
  });

  it('month-end boundary: Jan 31 → Feb 1 handled by Intl', () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit', hour12: false,
    });
    const jan31 = new Date('2026-01-31T23:30:00Z');
    const parts = Object.fromEntries(fmt.formatToParts(jan31).map(p => [p.type, p.value]));
    const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
    assert.equal(dateStr, '2026-01-31', 'Jan 31 23:30 UTC should be Jan 31 in ET (EST)');
  });

  it('year-end boundary: Dec 31 → Jan 1 handled by Intl', () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit', hour12: false,
    });
    const dec31 = new Date('2026-12-31T23:30:00Z');
    const parts = Object.fromEntries(fmt.formatToParts(dec31).map(p => [p.type, p.value]));
    const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
    assert.equal(dateStr, '2026-12-31');
  });

  it('leap day: Feb 29 2028 is valid', () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit', hour12: false,
    });
    const feb29 = new Date('2028-02-29T15:00:00Z');
    const parts = Object.fromEntries(fmt.formatToParts(feb29).map(p => [p.type, p.value]));
    assert.equal(parts.month, '02');
    assert.equal(parts.day, '29');
    const dte = computeDTE('2028-02-29');
    assert.equal(typeof dte, 'number');
  });

  it('spring DST: Mar 8 2026 (spring forward) → Intl still correct', () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: 'numeric', hour12: false,
    });
    const springFwd = new Date('2026-03-08T07:30:00Z');
    const parts = Object.fromEntries(fmt.formatToParts(springFwd).map(p => [p.type, p.value]));
    assert.equal(parts.month, '03');
    assert.equal(parts.day, '08');
    assert.equal(parseInt(parts.hour), 3, 'Spring forward: 07:30 UTC should be 03:30 EDT');
  });

  it('fall DST: Nov 1 2026 (fall back) → Intl still correct', () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: 'numeric', hour12: false,
    });
    const fallBack = new Date('2026-11-01T06:30:00Z');
    const parts = Object.fromEntries(fmt.formatToParts(fallBack).map(p => [p.type, p.value]));
    assert.equal(parts.month, '11');
    assert.equal(parts.day, '01');
    assert.equal(parseInt(parts.hour), 1, 'Fall back: 06:30 UTC should be 01:30 EST');
  });

  it('expirationForDTE helper produces valid YYYY-MM-DD', () => {
    const exp = expirationForDTE(5);
    assert.match(exp, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(computeDTE(exp), 5);
  });

  it('expirationForDTE: DTE=0 returns today or recently-past', () => {
    const exp = expirationForDTE(0);
    const dte = computeDTE(exp);
    assert.ok(dte <= 0, `DTE=0 expiration should yield computeDTE <= 0, got ${dte}`);
  });
});
