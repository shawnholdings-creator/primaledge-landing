// Temporary migration endpoint — applies backtest + modeled_trades schema
// Uses POSTGRES_URL from Vercel env for direct DB connection
// Protected by INGEST_API_KEY
// DELETE THIS FILE after migration succeeds
import crypto from 'node:crypto';
import pg from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Auth
  const key = req.headers['x-api-key'] || '';
  const expected = process.env.INGEST_API_KEY || '';
  if (!expected || key.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const connStr = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connStr) {
    return res.status(500).json({
      error: 'No POSTGRES_URL',
      env_keys: Object.keys(process.env).filter(k => k.match(/POSTGRES|SUPA/i)).sort(),
    });
  }

  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const statements = [
      // modeled_trades (prerequisite)
      `CREATE TABLE IF NOT EXISTS modeled_trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id TEXT UNIQUE NOT NULL,
        scan_run_id TEXT,
        ticker TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('PUT','CALL')),
        contract_symbol TEXT NOT NULL,
        strike NUMERIC(10,2) NOT NULL,
        expiration DATE NOT NULL,
        entry_credit NUMERIC(8,4) NOT NULL,
        stock_price_at_entry NUMERIC(10,2),
        tier TEXT DEFAULT 'standard',
        status TEXT NOT NULL DEFAULT 'LIVE' CHECK (status IN ('LIVE','CLOSED','EXPIRED','ROLLED')),
        outcome TEXT CHECK (outcome IN ('WIN','LOSS','FLAT','PENDING')),
        exit_price NUMERIC(8,4),
        exit_reason TEXT,
        net_pnl NUMERIC(12,2),
        closed_at TIMESTAMPTZ,
        ingested_at TIMESTAMPTZ DEFAULT now(),
        evaluated_at TIMESTAMPTZ,
        strategy_version TEXT DEFAULT 'v1',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`,
      `ALTER TABLE modeled_trades ENABLE ROW LEVEL SECURITY`,
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='modeled_trades' AND policyname='service_role_all') THEN
          EXECUTE 'CREATE POLICY service_role_all ON modeled_trades FOR ALL TO service_role USING (true) WITH CHECK (true)';
        END IF;
      END $$`,
      `CREATE INDEX IF NOT EXISTS idx_mt_status ON modeled_trades(status)`,
      `CREATE INDEX IF NOT EXISTS idx_mt_ticker ON modeled_trades(ticker)`,
      `CREATE INDEX IF NOT EXISTS idx_mt_ingested ON modeled_trades(ingested_at DESC)`,

      // backtest_config
      `CREATE TABLE IF NOT EXISTS backtest_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      )`,

      // backtest_periods
      `CREATE TABLE IF NOT EXISTS backtest_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        strategy_version TEXT NOT NULL DEFAULT 'v1',
        trade_count INT NOT NULL DEFAULT 0 CHECK (trade_count >= 0),
        wins INT NOT NULL DEFAULT 0 CHECK (wins >= 0),
        losses INT NOT NULL DEFAULT 0 CHECK (losses >= 0),
        flats INT NOT NULL DEFAULT 0 CHECK (flats >= 0),
        win_rate NUMERIC(5,2) CHECK (win_rate >= 0 AND win_rate <= 100),
        net_pnl NUMERIC(12,2) NOT NULL DEFAULT 0,
        avg_credit NUMERIC(8,4),
        avg_hold_days NUMERIC(6,2),
        run_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (run_status IN ('PENDING','COMPUTING','PUBLISHED','FAILED','STALE')),
        validation_state TEXT NOT NULL DEFAULT 'valid' CHECK (validation_state IN ('valid','partial','failed','no_trades')),
        warning_message TEXT,
        failure_reason TEXT,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (period_start, period_end, strategy_version),
        CHECK (period_end = period_start + 11),
        CHECK (wins + losses + flats = trade_count)
      )`,

      // backtest_period_trades
      `CREATE TABLE IF NOT EXISTS backtest_period_trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_id UUID NOT NULL REFERENCES backtest_periods(id) ON DELETE CASCADE,
        trade_id UUID NOT NULL,
        UNIQUE (period_id, trade_id)
      )`,

      // Advisory lock function
      `CREATE OR REPLACE FUNCTION acquire_backtest_lock(p_start DATE, p_version TEXT)
       RETURNS BOOLEAN LANGUAGE plpgsql AS $$
       BEGIN
         RETURN pg_try_advisory_xact_lock(hashtext(p_start::text || '|' || p_version));
       END;
       $$`,

      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_bp_status ON backtest_periods(run_status)`,
      `CREATE INDEX IF NOT EXISTS idx_bp_start ON backtest_periods(period_start DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_bpt_period ON backtest_period_trades(period_id)`,
      `CREATE INDEX IF NOT EXISTS idx_bpt_trade ON backtest_period_trades(trade_id)`,

      // RLS
      `ALTER TABLE backtest_periods ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE backtest_period_trades ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE backtest_config ENABLE ROW LEVEL SECURITY`,

      // RLS policies
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='backtest_periods' AND policyname='anon_read_published') THEN
          EXECUTE 'CREATE POLICY anon_read_published ON backtest_periods FOR SELECT TO anon USING (run_status = ''PUBLISHED'')';
        END IF;
      END $$`,

      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='backtest_config' AND policyname='service_only_config') THEN
          EXECUTE 'CREATE POLICY service_only_config ON backtest_config FOR ALL TO service_role USING (true) WITH CHECK (true)';
        END IF;
      END $$`,

      // Record migration version
      `INSERT INTO backtest_config (key, value) VALUES ('migration_version', 'backtest_periods_v1')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    ];

    const results = [];
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        results.push({ i, status: 'OK' });
      } catch (err) {
        results.push({ i, status: 'ERROR', msg: err.message, sql: statements[i].substring(0, 80) });
      }
    }

    // Verify
    const verify = {};
    for (const table of ['backtest_config', 'backtest_periods', 'backtest_period_trades', 'modeled_trades']) {
      try {
        const { rows } = await client.query(`SELECT count(*) as n FROM ${table}`);
        verify[table] = { exists: true, rows: parseInt(rows[0].n) };
      } catch (err) {
        verify[table] = { exists: false, error: err.message };
      }
    }

    // Test advisory lock
    try {
      const { rows } = await client.query(`SELECT acquire_backtest_lock('2025-01-06'::date, 'v1') as locked`);
      verify.advisory_lock = { works: true, result: rows[0].locked };
    } catch (err) {
      verify.advisory_lock = { works: false, error: err.message };
    }

    // Check migration version
    try {
      const { rows } = await client.query(`SELECT value FROM backtest_config WHERE key = 'migration_version'`);
      verify.migration_version = rows[0]?.value;
    } catch {}

    await client.end();

    const errors = results.filter(r => r.status === 'ERROR');
    return res.status(errors.length > 0 ? 207 : 200).json({
      success: errors.length === 0,
      migration_version: 'backtest_periods_v1',
      total: statements.length,
      ok: results.filter(r => r.status === 'OK').length,
      errors,
      tables: verify,
    });
  } catch (err) {
    try { await client.end(); } catch {}
    return res.status(500).json({ error: err.message });
  }
}
