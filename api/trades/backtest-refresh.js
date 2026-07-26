// POST /api/trades/backtest-refresh — protected biweekly period refresh
// Computes and publishes completed two-week backtest periods from modeled_trades.
// Idempotent, catch-up capable, concurrency-safe via advisory locks.
import supabase from './_supabase.js';
import crypto from 'crypto';

// ── Constants ────────────────────────────────────────────────
const STRATEGY_VERSION = 'v1';
const MAX_CATCH_UP = 6;          // Max periods to publish in one invocation
const PERIOD_SPAN_DAYS = 11;     // Monday → Friday of week 2 = 11 calendar days

// ── Timezone-safe date helpers ───────────────────────────────
const _etDateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric', month: '2-digit', day: '2-digit',
  weekday: 'short',
  hour12: false,
});

function getETDate() {
  const parts = Object.fromEntries(
    _etDateFmt.formatToParts(new Date()).map(p => [p.type, p.value])
  );
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    year: parseInt(parts.year, 10),
    weekday: parts.weekday, // "Mon", "Tue", etc.
  };
}

/** Find the Monday on or before a given date string (YYYY-MM-DD) */
function mondayOnOrBefore(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = dow === 0 ? 6 : dow - 1; // days back to Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Add N calendar days to a YYYY-MM-DD string */
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Get day of week (0=Sun) for a YYYY-MM-DD */
function getDow(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay();
}

/** SHA-256 hash of a string, truncated to 16 hex chars */
function configHash(obj) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(obj))
    .digest('hex')
    .slice(0, 16);
}

// ── Anchor management ────────────────────────────────────────

async function getOrCreateAnchor() {
  // Check env override first
  const envAnchor = process.env.BACKTEST_PERIOD_ANCHOR_DATE;
  if (envAnchor && /^\d{4}-\d{2}-\d{2}$/.test(envAnchor)) {
    const dow = getDow(envAnchor);
    if (dow !== 1) throw new Error(`BACKTEST_PERIOD_ANCHOR_DATE must be a Monday, got DOW=${dow}`);
    return envAnchor;
  }

  // Check persisted anchor
  const { data: existing } = await supabase
    .from('backtest_config')
    .select('value')
    .eq('key', 'period_anchor_date')
    .single();

  if (existing?.value) return existing.value;

  // Derive from earliest eligible closed LIVE trade
  const { data: earliest } = await supabase
    .from('modeled_trades')
    .select('closed_at')
    .eq('publish_state', 'LIVE')
    .in('status', ['CLOSED', 'EXPIRED'])
    .order('closed_at', { ascending: true })
    .limit(1);

  if (!earliest?.length || !earliest[0].closed_at) {
    return null; // No eligible trades yet
  }

  const closedDate = earliest[0].closed_at.slice(0, 10);
  const anchor = mondayOnOrBefore(closedDate);

  // Persist atomically (ignoreDuplicates for concurrent safety)
  await supabase
    .from('backtest_config')
    .upsert(
      { key: 'period_anchor_date', value: anchor },
      { onConflict: 'key', ignoreDuplicates: true }
    );

  // Re-read to get the authoritative value (in case another invocation won)
  const { data: saved } = await supabase
    .from('backtest_config')
    .select('value')
    .eq('key', 'period_anchor_date')
    .single();

  return saved?.value || anchor;
}

// ── Period computation ───────────────────────────────────────

function computeAllPeriods(anchor, upToDate) {
  const periods = [];
  let start = anchor;
  while (true) {
    const end = addDays(start, PERIOD_SPAN_DAYS);
    // Period must be fully completed: end date <= today in ET
    if (end > upToDate) break;
    periods.push({ start, end });
    start = addDays(end, 3); // Saturday + Sunday + next Monday = +3
  }
  return periods;
}

// ── Main handler ─────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Constant-time API key comparison
  const apiKey = req.headers['x-api-key'] || '';
  const expected = process.env.INGEST_API_KEY || '';
  if (!expected || apiKey.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isManual = req.query?.mode === 'manual' ||
    (req.body && typeof req.body === 'object' && req.body.manual === true);
  const runType = isManual ? 'manual' : 'scheduled';

  const runLog = {
    started_at: new Date().toISOString(),
    periods_published: 0,
    periods_skipped: 0,
    periods_failed: 0,
    details: [],
  };

  try {
    // 1. Get anchor
    const anchor = await getOrCreateAnchor();
    if (!anchor) {
      return res.status(200).json({
        skipped: true,
        reason: 'no_eligible_trades',
        message: 'No LIVE closed trades found to derive anchor date.',
      });
    }
    runLog.anchor = anchor;

    // 2. Get today in ET
    const { dateStr: todayET, year: currentYear } = getETDate();

    // 3. Compute all possible completed periods from anchor to today
    const allPeriods = computeAllPeriods(anchor, todayET);
    if (allPeriods.length === 0) {
      return res.status(200).json({
        skipped: true,
        reason: 'no_completed_periods',
        anchor,
        today_et: todayET,
      });
    }

    // 4. Find already-published periods
    const { data: published } = await supabase
      .from('backtest_periods')
      .select('period_start, period_end, run_status')
      .eq('strategy_version', STRATEGY_VERSION)
      .in('run_status', ['PUBLISHED', 'COMPUTING']);

    const publishedSet = new Set(
      (published || []).map(p => `${p.period_start}|${p.period_end}`)
    );

    // 5. Find unpublished periods (catch-up)
    const unpublished = allPeriods
      .filter(p => !publishedSet.has(`${p.start}|${p.end}`))
      .slice(0, MAX_CATCH_UP); // Conservative batch limit

    if (unpublished.length === 0) {
      return res.status(200).json({
        skipped: true,
        reason: 'all_periods_published',
        total_periods: allPeriods.length,
        anchor,
      });
    }

    // 6. Process each unpublished period in chronological order
    for (const period of unpublished) {
      const detail = await refreshPeriod(period.start, period.end, runType);
      runLog.details.push(detail);
      if (detail.status === 'published') runLog.periods_published++;
      else if (detail.status === 'skipped') runLog.periods_skipped++;
      else runLog.periods_failed++;
    }

    runLog.completed_at = new Date().toISOString();
    return res.status(200).json(runLog);

  } catch (err) {
    console.error('backtest-refresh error:', err.message);
    runLog.error = err.message;
    runLog.completed_at = new Date().toISOString();
    return res.status(500).json({ error: 'Internal error', run_log: runLog });
  }
}

// ── Per-period refresh logic ─────────────────────────────────

async function refreshPeriod(periodStart, periodEnd, runType) {
  const periodKey = `${periodStart}|${periodEnd}|${STRATEGY_VERSION}`;

  try {
    // 1. Acquire advisory lock (non-blocking)
    const { data: lockResult } = await supabase.rpc('acquire_backtest_lock', {
      p_period_start: periodStart,
      p_strategy_version: STRATEGY_VERSION,
    });

    if (lockResult === false) {
      return {
        period: { start: periodStart, end: periodEnd },
        status: 'skipped',
        reason: 'lock_held_by_another_process',
      };
    }

    // 2. Double-check not already published (inside lock)
    const { data: existing } = await supabase
      .from('backtest_periods')
      .select('id, run_status')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .eq('strategy_version', STRATEGY_VERSION)
      .single();

    if (existing?.run_status === 'PUBLISHED') {
      return {
        period: { start: periodStart, end: periodEnd },
        status: 'skipped',
        reason: 'already_published',
      };
    }

    // 3. Upsert COMPUTING status
    const periodId = existing?.id || undefined;
    const computingRow = {
      period_start: periodStart,
      period_end: periodEnd,
      strategy_version: STRATEGY_VERSION,
      run_status: 'COMPUTING',
      run_type: runType,
      last_attempt_at: new Date().toISOString(),
      tz_market: 'America/New_York',
      market_cal_version: '2025-2027-v1',
      config_hash: configHash({ strategy: STRATEGY_VERSION, span: PERIOD_SPAN_DAYS }),
    };
    if (periodId) computingRow.id = periodId;

    const { data: upserted, error: upsertErr } = await supabase
      .from('backtest_periods')
      .upsert(computingRow, { onConflict: 'period_start,period_end,strategy_version' })
      .select('id')
      .single();

    if (upsertErr) throw upsertErr;
    const rowId = upserted.id;

    // 4. Query trades for this window
    // Window: closed_at >= periodStart 00:00 ET through periodEnd 23:59:59 ET
    const windowStart = `${periodStart}T00:00:00-04:00`; // Safe conservative (EDT)
    const windowEnd = `${periodEnd}T23:59:59-05:00`;     // Safe conservative (EST)
    // Use wider window and filter precisely in aggregation to handle DST
    const safeStart = `${periodStart}T00:00:00-05:00`;   // EST (widest)
    const safeEnd = `${periodEnd}T23:59:59.999-04:00`;   // EDT (widest)

    const sourceQueryTs = new Date().toISOString();
    const { data: trades, error: tradeErr } = await supabase
      .from('modeled_trades')
      .select('id, ticker, side, strike, expiration, entry_credit, net_pnl, outcome, days_held, closed_at, exit_reason, status')
      .eq('publish_state', 'LIVE')
      .in('status', ['CLOSED', 'EXPIRED'])
      .gte('closed_at', safeStart)
      .lte('closed_at', safeEnd)
      .order('closed_at', { ascending: true });

    if (tradeErr) throw tradeErr;

    // 5. Compute aggregates
    const eligible = trades || [];
    const tradeCount = eligible.length;
    const wins = eligible.filter(t => t.outcome === 'WIN').length;
    const losses = eligible.filter(t => t.outcome === 'LOSS').length;
    const flats = eligible.filter(t => t.outcome === 'FLAT').length;

    // Validate outcome accounting
    if (wins + losses + flats !== tradeCount) {
      // Some trades have NULL outcome — mark partial
      await markFailed(rowId, 'Outcome accounting mismatch: some trades have NULL outcome');
      return {
        period: { start: periodStart, end: periodEnd },
        status: 'failed',
        reason: 'outcome_accounting_mismatch',
        trade_count: tradeCount,
        null_outcomes: tradeCount - wins - losses - flats,
      };
    }

    const netPnl = eligible.reduce((s, t) => s + Number(t.net_pnl || 0), 0);
    const winRate = tradeCount > 0 ? Math.round((wins / tradeCount) * 10000) / 100 : null;
    const avgCredit = tradeCount > 0
      ? eligible.reduce((s, t) => s + Number(t.entry_credit || 0), 0) / tradeCount
      : null;
    const avgHoldDays = tradeCount > 0
      ? eligible.reduce((s, t) => s + Number(t.days_held || 0), 0) / tradeCount
      : null;

    // Validate numerics
    if (!isFinite(netPnl) || (avgCredit !== null && !isFinite(avgCredit))) {
      await markFailed(rowId, 'Non-finite numeric values detected');
      return {
        period: { start: periodStart, end: periodEnd },
        status: 'failed',
        reason: 'non_finite_values',
      };
    }

    // 6. Determine validation state
    let validationState = 'valid';
    let warningMessage = null;
    if (tradeCount === 0) {
      validationState = 'no_trades';
      warningMessage = 'No modeled trades closed in this completed period.';
    }

    // 7. Delete any stale linked trades from a previous failed attempt
    await supabase.from('backtest_period_trades').delete().eq('period_id', rowId);

    // 8. Insert linked trades
    if (tradeCount > 0) {
      const tradeRows = eligible.map(t => ({
        period_id: rowId,
        trade_id: t.id,
        ticker: t.ticker,
        side: t.side,
        strike: t.strike,
        expiration: t.expiration,
        entry_credit: t.entry_credit,
        net_pnl: t.net_pnl,
        outcome: t.outcome,
        days_held: t.days_held,
        closed_at: t.closed_at,
        exit_reason: t.exit_reason,
      }));

      const { error: insertErr } = await supabase
        .from('backtest_period_trades')
        .insert(tradeRows);

      if (insertErr) {
        await markFailed(rowId, `Trade detail insertion failed: ${insertErr.message}`);
        return {
          period: { start: periodStart, end: periodEnd },
          status: 'failed',
          reason: 'trade_insert_failed',
          error: insertErr.message,
        };
      }
    }

    // 9. Publish
    const now = new Date().toISOString();
    const { error: publishErr } = await supabase
      .from('backtest_periods')
      .update({
        trade_count: tradeCount,
        wins,
        losses,
        flats,
        win_rate: winRate,
        net_pnl: Math.round(netPnl * 100) / 100,
        avg_credit: avgCredit !== null ? Math.round(avgCredit * 10000) / 10000 : null,
        avg_hold_days: avgHoldDays !== null ? Math.round(avgHoldDays * 100) / 100 : null,
        run_status: 'PUBLISHED',
        validation_state: validationState,
        warning_message: warningMessage,
        source_query_ts: sourceQueryTs,
        computed_at: now,
        published_at: now,
        last_attempt_at: now,
      })
      .eq('id', rowId);

    if (publishErr) {
      await markFailed(rowId, `Publication update failed: ${publishErr.message}`);
      throw publishErr;
    }

    return {
      period: { start: periodStart, end: periodEnd },
      status: 'published',
      trade_count: tradeCount,
      wins,
      losses,
      win_rate: winRate,
      net_pnl: Math.round(netPnl * 100) / 100,
    };

  } catch (err) {
    console.error(`refreshPeriod ${periodKey} error:`, err.message);
    return {
      period: { start: periodStart, end: periodEnd },
      status: 'failed',
      reason: err.message,
    };
  }
}

async function markFailed(periodId, reason) {
  try {
    await supabase
      .from('backtest_periods')
      .update({
        run_status: 'FAILED',
        failure_reason: reason,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', periodId);
  } catch (e) {
    console.error('markFailed error:', e.message);
  }
}
