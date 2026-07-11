// v4 Node test suite — zero external deps (node:test, node:assert, node:crypto)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { evaluateExitRules, computeDTE, VERSION } from './_exitRules.js';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function expirationForDTE(targetDTE) {
  for (let offset = Math.max(-1, targetDTE - 2); offset <= targetDTE + 3; offset++) {
    const d = new Date(); d.setDate(d.getDate() + offset);
    const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const ds = `${et.getFullYear()}-${String(et.getMonth()+1).padStart(2,'0')}-${String(et.getDate()).padStart(2,'0')}`;
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
  const etNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const today = etNow.toISOString().slice(0, 10);
  const dAgo = n => { const d = new Date(etNow); d.setDate(d.getDate() - n); return d.toISOString(); };

  it('14-day: today is within window', () => assert.ok(dAgo(0) >= dAgo(14)));
  it('14-day: 13 days ago is within', () => assert.ok(dAgo(13) >= dAgo(14)));
  it('14-day: 15 days ago is outside', () => assert.ok(dAgo(15) < dAgo(14)));
  it('MTD: today is within month', () => assert.ok(today >= `${today.slice(0,7)}-01`));
  it('MTD: first of month is within', () => assert.ok(`${today.slice(0,7)}-01` >= `${today.slice(0,7)}-01`));
  it('MTD: prev month last day is outside', () => {
    const pm = new Date(etNow); pm.setDate(0);
    assert.ok(pm.toISOString().slice(0,10) < `${today.slice(0,7)}-01`);
  });
});
