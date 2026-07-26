// GET /api/trades/backtest — read published backtest periods
// Full detail for authenticated income-access members.
// Limited public summary (latest 2 periods, no trade detail) for unauthenticated.
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
  'tz_market', 'market_cal_version', 'computed_at',
  'source_query_ts',
];

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
        // Check income access
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

    if (!isAuthenticated) {
      // Public: limited 2-period summary only
      const { data: periods, error: qErr } = await supabase
        .from('backtest_periods')
        .select(PUBLIC_FIELDS.join(','))
        .eq('run_status', 'PUBLISHED')
        .order('period_start', { ascending: false })
        .limit(2);

      if (qErr) throw qErr;

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
      return res.status(200).json({
        periods: periods || [],
        total: (periods || []).length,
        access: 'public',
        note: 'Historical modeled results summary. Sign in for full detail.',
      });
    }

    // Authenticated member: full data
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

    // Get latest refresh attempt info
    const { data: latestAttempt } = await supabase
      .from('backtest_periods')
      .select('last_attempt_at, run_status, failure_reason')
      .order('last_attempt_at', { ascending: false })
      .limit(1)
      .single();

    const result = {
      periods: (periods || []).map(p => ({
        ...p,
        trades: includeDetail ? (periodDetails[p.id] || []) : undefined,
      })),
      total: total || 0,
      limit,
      offset,
      access: 'member',
      last_refresh: {
        attempted_at: latestAttempt?.last_attempt_at || null,
        status: latestAttempt?.run_status || null,
        failure_reason: latestAttempt?.run_status === 'FAILED' ? latestAttempt?.failure_reason : null,
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
