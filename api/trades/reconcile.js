// POST /api/trades/reconcile — durable Gist revision replay with cursor
import supabase from './_supabase.js';
import crypto from 'crypto';

function makeAlertId(scanRunId, tier, ticker, side, contractSymbol) {
  const raw = `${scanRunId}|${tier || 'standard'}|${ticker}|${side}|${contractSymbol}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 40);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const gistId = process.env.DASHBOARD_GIST_ID;
  const gistToken = process.env.GIST_TOKEN;
  if (!gistId || !gistToken) {
    return res.status(500).json({ error: 'DASHBOARD_GIST_ID or GIST_TOKEN not set' });
  }

  try {
    // ── Load cursor from recovery_cursors ────────────────────
    const { data: cursorRow, error: cursorErr } = await supabase
      .from('recovery_cursors')
      .select('*')
      .eq('source_name', 'gist_outbox')
      .single();

    // ── FIRST RUN: bootstrap cursor ─────────────────────────
    if (cursorErr || !cursorRow) {
      const gistResp = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${gistToken}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (!gistResp.ok) throw new Error(`Gist fetch: ${gistResp.status}`);
      const gist = await gistResp.json();

      const latestRevision = gist.history?.[0]?.version || null;
      const latestTime = gist.updated_at;

      // One-time bootstrap: ON CONFLICT DO NOTHING prevents duplicate
      const { data: inserted, error: insertErr } = await supabase
        .from('recovery_cursors')
        .upsert({
          source_name: 'gist_outbox',
          last_revision_id: latestRevision,
          last_revision_time: latestTime,
          is_bootstrap: true,
        }, { onConflict: 'source_name', ignoreDuplicates: true })
        .select('source_name');

      if (insertErr) {
        console.error('Bootstrap cursor insert error:', insertErr.message);
        return res.status(500).json({ error: 'Failed to bootstrap cursor' });
      }

      // ignoreDuplicates returns empty array if row already existed
      if (!inserted || inserted.length === 0) {
        return res.status(200).json({ replayed: 0, bootstrapped: false, reason: 'cursor_already_exists' });
      }

      console.log(`Reconcile: bootstrapped cursor at revision ${latestRevision} (${latestTime})`);
      return res.status(200).json({
        replayed: 0,
        bootstrapped: true,
        cursor_revision: latestRevision,
        cursor_time: latestTime,
        note: 'Call again to start normal replay',
      });
    }

    // ── If still bootstrap, mark as active and proceed ──────
    if (cursorRow.is_bootstrap) {
      await supabase.from('recovery_cursors')
        .update({ is_bootstrap: false })
        .eq('source_name', 'gist_outbox');
    }

    // ── Fetch Gist revision history (paginate) ──────────────
    const allRevisions = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const histResp = await fetch(
        `https://api.github.com/gists/${gistId}/commits?per_page=30&page=${page}`,
        { headers: { Authorization: `token ${gistToken}`, Accept: 'application/vnd.github.v3+json' } }
      );
      if (!histResp.ok) throw new Error(`Gist history fetch: ${histResp.status}`);
      const revs = await histResp.json();
      if (!revs || revs.length === 0) {
        hasMore = false;
      } else {
        allRevisions.push(...revs);
        hasMore = revs.length === 30;
        page++;
      }
    }

    // Filter revisions after cursor, order oldest first
    const cursorTime = cursorRow.last_revision_time;
    const unprocessed = allRevisions
      .filter(r => r.committed_at > cursorTime)
      .sort((a, b) => (a.committed_at > b.committed_at ? 1 : -1));

    if (unprocessed.length === 0) {
      return res.status(200).json({ replayed: 0, reconciled: 0, skipped: 0, revisions_processed: 0, cursor_advanced: false });
    }

    let totalReconciled = 0;
    let totalSkipped = 0;
    let revisionsProcessed = 0;
    let cursorAdvanced = false;

    for (const rev of unprocessed) {
      // Fetch revision content
      let content = null;
      try {
        const revResp = await fetch(`https://api.github.com/gists/${gistId}/${rev.version}`, {
          headers: { Authorization: `token ${gistToken}`, Accept: 'application/vnd.github.v3+json' },
        });
        if (revResp.ok) {
          const revGist = await revResp.json();
          content = revGist.files?.['income_scanner_dashboard.json']?.content;
        }
      } catch (e) {
        console.error('Revision fetch error:', e.message);
      }

      if (!content) {
        totalSkipped++;
        continue;
      }

      let payload;
      try {
        payload = JSON.parse(content);
      } catch {
        totalSkipped++;
        continue;
      }

      const candidates = payload.candidates || [];
      const scanTs = payload.scan_timestamp || rev.committed_at || new Date().toISOString();
      let revisionFailed = false;

      for (const c of candidates) {
        // Validate required fields
        if (!c.ticker || !c.strike || !c.expiration || !c.contract_symbol) {
          // Actual validation error — stop processing this revision
          console.error(`Reconcile: invalid candidate in revision ${rev.version}:`, JSON.stringify(c));
          revisionFailed = true;
          break;
        }

        const side = (c.side || 'put').toUpperCase();
        const bid = c.bid ?? c.credit ?? 0;
        if (!bid || bid <= 0) {
          console.error(`Reconcile: candidate missing valid bid/credit in revision ${rev.version}`);
          revisionFailed = true;
          break;
        }

        const alertId = makeAlertId(scanTs, c.tier, c.ticker, side, c.contract_symbol);

        const { data, error } = await supabase.from('modeled_trades').upsert({
          alert_id: alertId,
          scan_run_id: scanTs,
          alerted_at: scanTs,
          ticker: c.ticker,
          side,
          strike: c.strike,
          expiration: c.expiration,
          contract_symbol: c.contract_symbol,
          quantity: 1,
          multiplier: 100,
          entry_stock_price: c.stock_price || 0,
          entry_bid: c.bid ?? null,
          entry_ask: c.ask ?? null,
          entry_credit: bid,
          entry_dte: c.dte || 0,
          entry_dte_caller: c.dte || 0,
          entry_score: c.total_score ?? c.score ?? null,
          entry_grade: c.grade ?? null,
          entry_quote_source: 'reconcile_gist',
          entry_quote_retrieved_at: rev.committed_at || new Date().toISOString(),
          entry_quote_timing: 'delayed_unverified',
          tier: c.tier || 'standard',
          is_spread: c.is_spread || false,
          buy_leg_strike: c.buy_leg_strike ?? null,
          net_credit: c.net_credit ?? null,
          spread_width: c.spread_width ?? null,
          status: 'OPEN',
          publish_state: 'SHADOW',
          fees: 1.30,
        }, { onConflict: 'alert_id', ignoreDuplicates: true }).select('id');

        if (error) {
          // Ignore unique constraint violations (dedup), fail on actual errors
          if (error.code !== '23505') {
            console.error(`Reconcile DB error in revision ${rev.version}:`, error.message);
            revisionFailed = true;
            break;
          }
          totalSkipped++;
          continue;
        }

        if (data?.length > 0) {
          await supabase.from('trade_events').insert({
            trade_id: data[0].id,
            event_type: 'OPENED',
            event_data: { source: 'reconcile', alert_id: alertId, revision: rev.version },
          });
          totalReconciled++;
        } else {
          // ignoreDuplicates dedup
          totalSkipped++;
        }
      }

      // If any candidate in this revision had a real error, DO NOT advance cursor
      if (revisionFailed) {
        console.error(`Reconcile: stopping at revision ${rev.version} due to validation error`);
        return res.status(200).json({
          replayed: totalReconciled,
          reconciled: totalReconciled,
          skipped: totalSkipped,
          revisions_processed: revisionsProcessed,
          cursor_advanced: cursorAdvanced,
          error_revision: rev.version,
        });
      }

      // All candidates succeeded or deduped — advance cursor via CAS RPC
      revisionsProcessed++;
      const { error: casError } = await supabase.rpc('advance_recovery_cursor', {
        p_source: 'gist_outbox',
        p_expected_revision: cursorRow.last_revision_id,
        p_new_revision: rev.version,
        p_new_time: rev.committed_at,
      });

      if (casError) {
        // CAS failed — concurrent worker may have moved cursor
        console.log(`Reconcile: CAS failed for revision ${rev.version}: ${casError.message}`);
      } else {
        cursorAdvanced = true;
        // Update local reference for next iteration
        cursorRow.last_revision_id = rev.version;
        cursorRow.last_revision_time = rev.committed_at;
      }
    }

    return res.status(200).json({
      replayed: totalReconciled,
      reconciled: totalReconciled,
      skipped: totalSkipped,
      revisions_processed: revisionsProcessed,
      cursor_advanced: cursorAdvanced,
    });
  } catch (err) {
    console.error('Reconcile error:', err.message);
    return res.status(500).json({ error: 'Reconcile failed' });
  }
}
