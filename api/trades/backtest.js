// GET /api/trades/backtest — read published backtest periods + authoritative status
// Full detail for authenticated income-access members.
// Limited public summary (latest 2 periods, no trade detail) for unauthenticated.
//
// Status contract (returned in every 200 response):
//   status: 'populated' | 'no_completed_periods' | 'no_qualifying_setup' | 'stale'
//   screening_completed: boolean  — true when the screening system has run at least once
//   last_evaluated_at: ISO string | null
//   last_successful_refresh_at: ISO string | null
//   next_scheduled_review_at: ISO string | null  — next Monday 06:00 UTC
//   published_setup_count: number
import supabase from './_supabase.js';

// Fields safe for public summary (no internal run metadata)
const PUBLIC_FIELDS = [
  'period_start', 'period_end', 'trade_count', 'wins', 'losses',
  'win_rate', 'net_pnl', 'validation_state', 'warning_message',
  'published_at', 'strategy_version',
];

// Additional fields for authenticated members
const MEMBER_FIELDS = [
  ...PUBLIC_FIELDS,
  'id', 'avg_credit', 'avg_hold_days', 'run_status',
];

// ── Helpers ──────────────────────────────────────────────────

/** Next Monday at 06:00 UTC from now */
function nextScheduledReview() {
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const daysToMonday = dow === 0 ? 1 : dow === 1 ? 7 : 8 - dow;
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + daysToMonday);
  next.setUTCHours(6, 0, 0, 0);
  return next.toISOString();
}

/** Derive authoritative status from query results + metadata */
function deriveStatus(periods, configMeta, latestRefreshMeta) {
  const publishedCount = periods?.length || 0;
  const hasAnchor = !!configMeta?.anchor;
  const latestRefreshStatus = latestRefreshMeta?.run_status || null;
  const latestRefreshReason = latestRefreshMeta?.failure_reason || null;
  const lastAttemptAt = latestRefreshMeta?.last_attempt_at || null;
  const lastPublishedAt = latestRefreshMeta?.published_at || null;
  const screeningCompleted = configMeta?.screening_completed === true;

  // Determine the primary status
  let status;
  if (publishedCount > 0 && latestRefreshStatus === 'FAILED') {
    status = 'stale';
  } else if (publishedCount > 0) {
    status = 'populated';
  } else if (screeningCompleted || hasAnchor) {
    // The system has run, but produced zero published periods
    status = 'no_qualifying_setup';
  } else {
    // System has never run or has no anchor → no periods exist yet
    status = 'no_completed_periods';
  }

  return {
    status,
    screening_completed: screeningCompleted || hasAnchor,
    last_evaluated_at: lastAttemptAt || configMeta?.last_refresh_at || null,
    last_successful_refresh_at: lastPublishedAt || null,
    next_scheduled_review_at: nextScheduledReview(),
    published_setup_count: publishedCount,
    ...(status === 'stale' ? {
      stale_reason: latestRefreshReason || 'Last refresh attempt did not succeed.',
    } : {}),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Determine auth level
    const authHeader = req.headers['authorization'] || '';
    let isAuthenticated = false;
    let userId = null;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const { data: access } = await supabase
          .from('user_access')
          .select('income_access')
          .eq('user_id', user.id)
          .single();

        if (access?.income_access === true) {
          isAuthenticated = true;
          userId = user.id;
        }
      }
    }

    // Parse query params
    const limit = Math.min(Math.max(parseInt(req.query?.limit) || 26, 1), 52);
    const offset = Math.max(parseInt(req.query?.offset) || 0, 0);
    const includeDetail = req.query?.detail === 'true' && isAuthenticated;

    // ── Fetch config metadata (anchor, last refresh timestamp) ──
    const { data: configRows } = await supabase
      .from('backtest_config')
      .select('key, value, updated_at')
      .in('key', ['period_anchor_date', 'last_refresh_at', 'screening_completed']);

    const configMeta = {};
    for (const row of (configRows || [])) {
      if (row.key === 'period_anchor_date') configMeta.anchor = row.value;
      else if (row.key === 'last_refresh_at') configMeta.last_refresh_at = row.value;
      else if (row.key === 'screening_completed') configMeta.screening_completed = row.value === 'true';
    }

    // ── Fetch latest refresh attempt metadata ──
    let latestRefreshMeta = null;
    try {
      const { data: latestAttempt } = await supabase
        .from('backtest_periods')
        .select('last_attempt_at, run_status, failure_reason, published_at')
        .order('last_attempt_at', { ascending: false })
        .limit(1)
        .single();
      latestRefreshMeta = latestAttempt;
    } catch { /* no rows yet — normal */ }

    if (!isAuthenticated) {
      // Public: limited 2-period summary only
      const { data: periods, error: qErr } = await supabase
        .from('backtest_periods')
        .select(PUBLIC_FIELDS.join(','))
        .eq('run_status', 'PUBLISHED')
        .order('period_start', { ascending: false })
        .limit(2);

      if (qErr) throw qErr;

      const statusMeta = deriveStatus(periods, configMeta, latestRefreshMeta);

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
      return res.status(200).json({
        periods: periods || [],
        total: (periods || []).length,
        access: 'public',
        ...statusMeta,
        note: 'Historical modeled results summary. Sign in for full detail.',
      });
    }

    // ── Authenticated member: full data ──

    // Get total count
    const { count: total, error: cErr } = await supabase
      .from('backtest_periods')
      .select('id', { count: 'exact', head: true })
      .eq('run_status', 'PUBLISHED');

    if (cErr) throw cErr;

    // Get paginated periods
    const { data: periods, error: qErr } = await supabase
      .from('backtest_periods')
      .select(MEMBER_FIELDS.join(','))
      .eq('run_status', 'PUBLISHED')
      .order('period_start', { ascending: false })
      .range(offset, offset + limit - 1);

    if (qErr) throw qErr;

    // Optionally include trade details
    let periodDetails = {};
    if (includeDetail && periods?.length > 0) {
      const periodIds = periods.map(p => p.id);
      const { data: trades } = await supabase
        .from('backtest_period_trades')
        .select('period_id, ticker, side, strike, expiration, entry_credit, net_pnl, outcome, days_held, closed_at, exit_reason')
        .in('period_id', periodIds)
        .order('closed_at', { ascending: true });

      if (trades) {
        for (const t of trades) {
          if (!periodDetails[t.period_id]) periodDetails[t.period_id] = [];
          periodDetails[t.period_id].push(t);
        }
      }
    }

    const statusMeta = deriveStatus(periods, configMeta, latestRefreshMeta);

    const result = {
      periods: (periods || []).map(p => ({
        ...p,
        trades: includeDetail ? (periodDetails[p.id] || []) : undefined,
      })),
      total: total || 0,
      limit,
      offset,
      access: 'member',
      ...statusMeta,
      // Legacy compatibility: keep last_refresh for any existing consumers
      last_refresh: {
        attempted_at: latestRefreshMeta?.last_attempt_at || null,
        status: latestRefreshMeta?.run_status || null,
        failure_reason: latestRefreshMeta?.run_status === 'FAILED' ? latestRefreshMeta?.failure_reason : null,
      },
      strategy_version: 'v1',
    };

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    return res.status(200).json(result);

  } catch (err) {
    console.error('backtest read error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
