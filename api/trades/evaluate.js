// POST /api/trades/evaluate — evaluate OPEN/DATA_REVIEW trades for exit
import supabase from './_supabase.js';
import { isMarketOpen } from './_marketCal.js';
import { getOptionQuote, MAX_BATCH_MS } from './_quoteProvider.js';
import { evaluateExitRules } from './_exitRules.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isMarketOpen()) {
    return res.status(200).json({ skipped: true, reason: 'market_closed' });
  }

  try {
    // Count total eligible first
    const { count: totalEligible } = await supabase
      .from('modeled_trades')
      .select('id', { count: 'exact', head: true })
      .in('status', ['OPEN', 'DATA_REVIEW']);

    // Fetch batch: oldest-first, NULLS FIRST on last_evaluated_at for fairness
    const { data: trades, error } = await supabase
      .from('modeled_trades')
      .select('*')
      .in('status', ['OPEN', 'DATA_REVIEW'])
      .order('last_evaluated_at', { ascending: true, nullsFirst: true })
      .order('alerted_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Fetch trades error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }

    const startMs = Date.now();
    let evaluated = 0, closed = 0, dataReview = 0;

    for (let i = 0; i < trades.length; i++) {
      // Time budget guard — check before each trade
      if (Date.now() - startMs > MAX_BATCH_MS) {
        console.log(`Time budget exceeded after ${i} trades`);
        break;
      }

      const trade = trades[i];
      if (i > 0) await sleep(1000);

      const quote = await getOptionQuote(trade.ticker, trade.contract_symbol, trade.expiration);
      const result = evaluateExitRules(trade, quote);
      evaluated++;

      // ALWAYS update last_evaluated_at for fairness (even on quote failure)
      await supabase.from('modeled_trades')
        .update({ last_evaluated_at: new Date().toISOString() })
        .eq('id', trade.id);

      // ── Data review ────────────────────────────────────────
      if (result.data_review) {
        if (trade.status !== 'DATA_REVIEW') {
          await supabase.from('modeled_trades')
            .update({ status: 'DATA_REVIEW', updated_at: new Date().toISOString() })
            .eq('id', trade.id);
        }
        await supabase.from('trade_events').insert({
          trade_id: trade.id,
          event_type: 'DATA_REVIEW',
          event_data: result.details,
        });
        dataReview++;
        continue;
      }

      // ── Revert DATA_REVIEW → OPEN if quote now valid ──────
      if (trade.status === 'DATA_REVIEW' && !result.triggered) {
        await supabase.from('modeled_trades')
          .update({ status: 'OPEN', updated_at: new Date().toISOString() })
          .eq('id', trade.id);
      }

      // ── Exit triggered ─────────────────────────────────────
      if (result.triggered) {
        const quantity = trade.quantity || 1;
        const multiplier = trade.multiplier || 100;
        const fees = Number(trade.fees ?? 1.30);
        const slippage = Number(trade.slippage ?? 0);
        const grossPnl = (Number(trade.entry_credit) - result.exit_debit) * quantity * multiplier;
        const netPnl = grossPnl - fees - slippage;
        const outcome = netPnl > 0.005 ? 'WIN' : netPnl < -0.005 ? 'LOSS' : 'FLAT';
        const alertedAt = new Date(trade.alerted_at);
        const daysHeld = Math.max(1, Math.ceil((Date.now() - alertedAt.getTime()) / 86400000));

        const { data: rpcResult, error: rpcError } = await supabase.rpc('close_trade', {
          p_trade_id: trade.id,
          p_exit_stock_price: quote.stock_price,
          p_exit_option_bid: quote.option.bid,
          p_exit_option_ask: quote.option.ask,
          p_exit_debit: result.exit_debit,
          p_exit_reason: result.reason,
          p_exit_quote_source: result.exit_quote_source || quote.source,
          p_exit_quote_time: quote.provider_timestamp,
          p_exit_quote_retrieved_at: quote.retrieved_at,
          p_days_held: daysHeld,
          p_gross_pnl: Math.round(grossPnl * 100) / 100,
          p_fees: fees,
          p_slippage: slippage,
          p_net_pnl: Math.round(netPnl * 100) / 100,
          p_outcome: outcome,
          p_rule_version: result.details?.version || 'v1',
        });

        if (rpcError) {
          console.error(`close_trade error for ${trade.id}:`, rpcError.message);
        } else if (rpcResult === null) {
          console.log(`Trade ${trade.id} already closed (concurrent)`);
        } else {
          closed++;
        }
        continue;
      }

      // ── Throttled EVALUATED event (max 1/hr per trade) ────
      const { data: lastEvent } = await supabase.from('trade_events')
        .select('created_at')
        .eq('trade_id', trade.id)
        .eq('event_type', 'EVALUATED')
        .order('created_at', { ascending: false })
        .limit(1);

      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      if (!lastEvent?.[0]?.created_at || lastEvent[0].created_at < oneHourAgo) {
        await supabase.from('trade_events').insert({
          trade_id: trade.id,
          event_type: 'EVALUATED',
          event_data: {
            quote_snapshot: quote.valid ? {
              stock_price: quote.stock_price,
              option_bid: quote.option.bid,
              option_ask: quote.option.ask,
              source: quote.source,
              quote_timing: quote.quote_timing,
              provider_ts: quote.provider_timestamp,
              retrieved_at: quote.retrieved_at,
            } : null,
            exit_check: result.details,
          },
        });
      }
    }

    return res.status(200).json({
      evaluated,
      closed,
      data_review: dataReview,
      batch_size: trades.length,
      total_eligible: totalEligible || 0,
    });
  } catch (err) {
    console.error('Evaluate error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
