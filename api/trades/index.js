// GET /api/trades — public dashboard read (LIVE only, safe allowlist)
import supabase from './_supabase.js';

// ── Safe field allowlist — no internal/provider/rule details ───
const SAFE_FIELDS = [
  'id', 'ticker', 'side', 'strike', 'expiration',
  'entry_credit', 'entry_stock_price', 'entry_dte',
  'alerted_at', 'status',
  'closed_at', 'exit_debit', 'exit_reason',
  'days_held', 'gross_pnl', 'fees', 'net_pnl', 'outcome',
  'tier', 'is_spread',
];

const SAFE_SET = new Set(SAFE_FIELDS);

// Map internal exit reasons to generic user-facing categories
const EXIT_REASON_MAP = {
  'PROFIT_TARGET': 'Profit',
  'STOP_LOSS': 'Stop',
  'PRE_ITM': 'Protection',
  'FORCED_TIME_EXIT': 'Time',
  'EXPIRATION': 'Expiration',
};

function sanitize(rows) {
  return (rows || []).map(r => {
    const clean = {};
    for (const k of SAFE_SET) {
      if (r[k] !== undefined) clean[k] = r[k];
    }
    // Map exit_reason to generic category
    clean.exit_reason = r.exit_reason ? (EXIT_REASON_MAP[r.exit_reason] || r.exit_reason) : null;
    return clean;
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sideFilter = (req.query.side || '').toUpperCase();
  const filterSide = ['PUT', 'CALL'].includes(sideFilter) ? sideFilter : null;

  try {
    // Compute ET date boundaries
    const etFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour12: false,
    });
    const etParts = Object.fromEntries(
      etFmt.formatToParts(new Date()).map(p => [p.type, p.value])
    );
    const today = `${etParts.year}-${etParts.month}-${etParts.day}`;
    const etNow = new Date(`${today}T12:00:00`);
    const d14 = new Date(etNow);
    d14.setDate(d14.getDate() - 14);
    const fourteenDaysAgo = d14.toISOString();
    const monthStart = `${today.slice(0, 7)}-01T00:00:00`;

    const selectFields = SAFE_FIELDS.join(',');

    // ── Open trades (LIVE only) ──────────────────────────────
    let openQ = supabase.from('modeled_trades').select(selectFields)
      .in('status', ['OPEN', 'DATA_REVIEW'])
      .eq('publish_state', 'LIVE')
      .order('alerted_at', { ascending: false });
    if (filterSide) openQ = openQ.eq('side', filterSide);
    const { data: openTrades, error: e1 } = await openQ;
    if (e1) throw e1;

    // ── Closed last 14 days (LIVE only) ──────────────────────
    let closedQ = supabase.from('modeled_trades').select(selectFields)
      .in('status', ['CLOSED', 'EXPIRED'])
      .eq('publish_state', 'LIVE')
      .gte('closed_at', fourteenDaysAgo)
      .order('closed_at', { ascending: false });
    if (filterSide) closedQ = closedQ.eq('side', filterSide);
    const { data: closedTrades, error: e2 } = await closedQ;
    if (e2) throw e2;

    // ── MTD (LIVE only) ──────────────────────────────────────
    let mtdQ = supabase.from('modeled_trades').select('net_pnl,outcome,side')
      .in('status', ['CLOSED', 'EXPIRED'])
      .eq('publish_state', 'LIVE')
      .gte('closed_at', monthStart);
    if (filterSide) mtdQ = mtdQ.eq('side', filterSide);
    const { data: mtdRows, error: e3 } = await mtdQ;
    if (e3) throw e3;

    const wins = mtdRows.filter(r => r.outcome === 'WIN').length;
    const losses = mtdRows.filter(r => r.outcome === 'LOSS').length;
    const flats = mtdRows.filter(r => r.outcome === 'FLAT').length;
    const mtdNetPnl = mtdRows.reduce((s, r) => s + Number(r.net_pnl || 0), 0);

    // ── Data health ──────────────────────────────────────────
    const { data: lastEval } = await supabase.from('trade_events')
      .select('created_at')
      .eq('event_type', 'EVALUATED')
      .order('created_at', { ascending: false })
      .limit(1);

    const issues = [];
    if (openTrades?.some(t => t.status === 'DATA_REVIEW')) {
      issues.push('Some trades have stale/missing quotes');
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    return res.status(200).json({
      open: sanitize(openTrades),
      closed_14d: sanitize(closedTrades),
      mtd: {
        net_pnl: Math.round(mtdNetPnl * 100) / 100,
        wins,
        losses,
        flats,
        count: mtdRows.length,
        win_rate: mtdRows.length > 0 ? Math.round((wins / mtdRows.length) * 100) : 0,
      },
      data_health: {
        last_evaluated: lastEval?.[0]?.created_at || null,
        issues,
      },
    });
  } catch (err) {
    console.error('trades/index error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
