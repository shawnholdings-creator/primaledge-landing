-- ============================================================
-- Backtest Periods v1.0 — Biweekly aggregation tables
-- Run in Supabase SQL Editor ONLY after owner approval.
-- ============================================================
-- Depends on: supabase_modeled_trades.sql (modeled_trades table)

-- ── 1. Backtest period anchor configuration ──────────────────
-- Stores the deterministic anchor date for biweekly period alignment.
-- Once set, NEVER changes — ensures historical periods don't shift.
CREATE TABLE IF NOT EXISTS public.backtest_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backtest_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.backtest_config FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.backtest_config TO service_role;
CREATE POLICY "service_full_config"
  ON public.backtest_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── 2. Backtest periods — completed two-week windows ─────────
-- A biweekly period: Monday 00:00:00 ET → Friday 23:59:59.999 ET of the second week
-- = period_start (Monday) through period_start + 11 calendar days (Friday)
CREATE TABLE IF NOT EXISTS public.backtest_periods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Period boundaries (America/New_York)
  period_start      DATE NOT NULL,           -- Monday of week 1
  period_end        DATE NOT NULL,           -- Friday of week 2 (= period_start + 11)
  tz_market         TEXT NOT NULL DEFAULT 'America/New_York',
  market_cal_version TEXT NOT NULL DEFAULT '2025-2027-v1',

  -- Strategy provenance
  strategy_version  TEXT NOT NULL DEFAULT 'v1',
  config_hash       TEXT,                    -- SHA-256 of strategy params at compute time

  -- Aggregated results (computed from modeled_trades)
  trade_count       INT NOT NULL DEFAULT 0 CHECK (trade_count >= 0),
  wins              INT NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses            INT NOT NULL DEFAULT 0 CHECK (losses >= 0),
  flats             INT NOT NULL DEFAULT 0 CHECK (flats >= 0),
  win_rate          NUMERIC(5,2),
  net_pnl           NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_credit        NUMERIC(10,4),
  avg_hold_days     NUMERIC(6,2),

  -- Lifecycle (non-public until PUBLISHED)
  run_status        TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (run_status IN ('PENDING', 'COMPUTING', 'PUBLISHED', 'FAILED', 'STALE')),
  run_type          TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (run_type IN ('scheduled', 'manual', 'catch_up')),
  failure_reason    TEXT,
  validation_state  TEXT NOT NULL DEFAULT 'valid'
    CHECK (validation_state IN ('valid', 'partial', 'failed', 'no_trades')),
  warning_message   TEXT,

  -- Provenance timestamps
  source_query_ts   TIMESTAMPTZ,             -- When trade data was queried
  computed_at       TIMESTAMPTZ,             -- When aggregation completed
  published_at      TIMESTAMPTZ,             -- When run_status → PUBLISHED
  last_attempt_at   TIMESTAMPTZ,             -- Latest refresh attempt

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Consistency checks
  CONSTRAINT chk_period_order CHECK (period_end > period_start),
  CONSTRAINT chk_period_span CHECK (period_end = period_start + INTERVAL '11 days'),
  CONSTRAINT chk_outcome_sum CHECK (wins + losses + flats = trade_count),
  CONSTRAINT chk_win_rate_valid CHECK (
    win_rate IS NULL OR (win_rate >= 0 AND win_rate <= 100)
  ),

  -- Idempotency: one row per period + strategy version
  CONSTRAINT uq_period_strategy UNIQUE (period_start, period_end, strategy_version)
);

-- ── 3. Backtest period trade details (linked) ────────────────
CREATE TABLE IF NOT EXISTS public.backtest_period_trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id     UUID NOT NULL REFERENCES public.backtest_periods(id) ON DELETE CASCADE,
  trade_id      UUID NOT NULL REFERENCES public.modeled_trades(id),
  ticker        TEXT NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('PUT', 'CALL')),
  strike        NUMERIC(12,2),
  expiration    DATE,
  entry_credit  NUMERIC(10,4),
  net_pnl       NUMERIC(12,2),
  outcome       TEXT CHECK (outcome IS NULL OR outcome IN ('WIN', 'LOSS', 'FLAT')),
  days_held     INT,
  closed_at     TIMESTAMPTZ,
  exit_reason   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate trade linkage within a period
  CONSTRAINT uq_period_trade UNIQUE (period_id, trade_id)
);

-- ── 4. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bp_status_start
  ON public.backtest_periods (run_status, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_bp_strategy
  ON public.backtest_periods (strategy_version, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_bpt_period
  ON public.backtest_period_trades (period_id);

-- ── 5. RLS — service_role only ───────────────────────────────
ALTER TABLE public.backtest_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_period_trades ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.backtest_periods FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.backtest_period_trades FROM anon, authenticated, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backtest_periods TO service_role;
GRANT SELECT, INSERT, DELETE ON public.backtest_period_trades TO service_role;

CREATE POLICY "service_full_bp"
  ON public.backtest_periods FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "service_full_bpt"
  ON public.backtest_period_trades FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── 6. Advisory lock function for concurrent refresh safety ──
-- Uses pg_advisory_xact_lock with a deterministic hash of the period key.
-- Lock is held for the duration of the transaction and released on COMMIT/ROLLBACK.
CREATE OR REPLACE FUNCTION public.acquire_backtest_lock(
  p_period_start DATE,
  p_strategy_version TEXT
) RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  lock_key BIGINT;
BEGIN
  -- Create a deterministic 64-bit lock key from period + strategy
  lock_key := hashtext(p_period_start::TEXT || '|' || p_strategy_version);
  -- Attempt non-blocking advisory lock (transaction-scoped)
  RETURN pg_try_advisory_xact_lock(lock_key);
END;
$$;

-- ── 7. updated_at trigger (matches project pattern) ──────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_backtest_periods_updated
  BEFORE UPDATE ON public.backtest_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_backtest_config_updated
  BEFORE UPDATE ON public.backtest_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROLLBACK SCRIPT — run if migration needs to be reverted
-- ============================================================
-- DROP TRIGGER IF EXISTS trg_backtest_config_updated ON public.backtest_config;
-- DROP TRIGGER IF EXISTS trg_backtest_periods_updated ON public.backtest_periods;
-- DROP FUNCTION IF EXISTS public.set_updated_at();
-- DROP FUNCTION IF EXISTS public.acquire_backtest_lock(DATE, TEXT);
-- DROP TABLE IF EXISTS public.backtest_period_trades CASCADE;
-- DROP TABLE IF EXISTS public.backtest_periods CASCADE;
-- DROP TABLE IF EXISTS public.backtest_config CASCADE;
