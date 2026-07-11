// POST /api/trades/ingest — idempotent alert ingestion
import supabase from './_supabase.js';
import crypto from 'crypto';
import { computeDTE } from './_exitRules.js';

const REQUIRED = [
  'scan_run_id', 'alerted_at', 'tier', 'ticker', 'side', 'strike',
  'expiration', 'contract_symbol', 'bid', 'ask', 'stock_price', 'dte',
];

function makeAlertId(body) {
  const raw = `${body.scan_run_id}|${body.tier || 'standard'}|${body.ticker}|${body.side}|${body.contract_symbol}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 40);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;

  // Required field check
  const missing = REQUIRED.filter(f => body[f] == null || body[f] === '');
  if (missing.length > 0) return res.status(400).json({ error: 'Missing fields', missing });

  // Validate alerted_at is ISO-8601 UTC
  const alertedAt = new Date(body.alerted_at);
  if (isNaN(alertedAt.getTime())) {
    return res.status(400).json({ error: 'alerted_at must be ISO-8601 UTC' });
  }

  // Validate side
  const side = (body.side || '').toUpperCase();
  if (!['PUT', 'CALL'].includes(side)) {
    return res.status(400).json({ error: 'side must be PUT or CALL' });
  }

  // Numeric validations
  const strike = Number(body.strike);
  const stockPrice = Number(body.stock_price);
  const bid = Number(body.bid);
  const ask = Number(body.ask);

  if (strike <= 0) return res.status(400).json({ error: 'strike must be > 0' });
  if (stockPrice <= 0) return res.status(400).json({ error: 'stock_price must be > 0' });
  if (bid <= 0) return res.status(400).json({ error: 'bid must be > 0' });
  if (ask <= 0) return res.status(400).json({ error: 'ask must be > 0' });
  if (bid > ask) return res.status(400).json({ error: 'bid must be <= ask (crossed market)' });

  // Server-side authoritative DTE
  const entry_dte = computeDTE(body.expiration);

  // entry_credit derived from validated bid
  const entry_credit = bid;

  // alert_id for idempotency
  const alertId = makeAlertId({ ...body, side });

  try {
    const row = {
      alert_id: alertId,
      scan_run_id: body.scan_run_id,
      alerted_at: alertedAt.toISOString(),
      ticker: body.ticker,
      side,
      strike,
      expiration: body.expiration,
      contract_symbol: body.contract_symbol,
      quantity: 1,
      multiplier: 100,
      entry_stock_price: stockPrice,
      entry_bid: bid,
      entry_ask: ask,
      entry_credit,
      entry_dte,
      entry_dte_caller: Number(body.dte),
      entry_score: body.score ?? null,
      entry_grade: body.grade ?? null,
      entry_quote_source: body.quote_source || 'scanner',
      entry_quote_time: body.quote_time || null,
      entry_quote_retrieved_at: body.quote_retrieved_at || new Date().toISOString(),
      entry_quote_timing: 'delayed_unverified',
      tier: body.tier || 'standard',
      is_spread: body.is_spread || false,
      buy_leg_strike: body.buy_leg_strike ?? null,
      net_credit: body.net_credit ?? null,
      spread_width: body.spread_width ?? null,
      status: 'OPEN',
      publish_state: 'SHADOW',
      fees: 1.30,
    };

    const { data, error } = await supabase
      .from('modeled_trades')
      .upsert(row, { onConflict: 'alert_id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error('Ingest DB error:', error.message);
      return res.status(500).json({ error: 'Database error' });
    }

    // ignoreDuplicates returns empty array on conflict
    if (!data || data.length === 0) {
      return res.status(200).json({ created: false, reason: 'duplicate', alert_id: alertId });
    }

    // Insert OPENED event
    await supabase.from('trade_events').insert({
      trade_id: data[0].id,
      event_type: 'OPENED',
      event_data: {
        alert_id: alertId,
        ticker: body.ticker,
        side,
        strike,
        expiration: body.expiration,
        entry_credit,
        contract_symbol: body.contract_symbol,
      },
    });

    return res.status(201).json({ created: true, id: data[0].id, alert_id: alertId });
  } catch (err) {
    console.error('Ingest error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}

export { makeAlertId };
