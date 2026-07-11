-- ============================================================
-- Modeled Trade Lifecycle v4.2
-- Run in Supabase SQL Editor ONLY after owner approval.
-- ============================================================

-- 1. Modeled trades — canonical trade ledger
CREATE TABLE IF NOT EXISTS public.modeled_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Alert identity (idempotency key)
  alert_id TEXT UNIQUE NOT NULL CHECK (length(alert_id) > 0),
  scan_run_id TEXT NOT NULL CHECK (length(scan_run_id) > 0),
  alerted_at TIMESTAMPTZ NOT NULL,

  -- Contract
  ticker TEXT NOT NULL CHECK (length(ticker) > 0),
  side TEXT NOT NULL CHECK (side IN ('PUT', 'CALL')),
  strike NUMERIC(12,2) NOT NULL CHECK (strike > 0),
  expiration DATE NOT NULL,
  contract_symbol TEXT NOT NULL CHECK (length(contract_symbol) > 0),
  quantity INTEGER NOT NULL DEFAULT 1,
  multiplier INTEGER NOT NULL DEFAULT 100,

  -- Entry (server-validated)
  entry_stock_price NUMERIC(12,2) NOT NULL CHECK (entry_stock_price > 0),
  entry_bid NUMERIC(10,4) NOT NULL CHECK (entry_bid > 0),
  entry_ask NUMERIC(10,4) NOT NULL CHECK (entry_ask > 0),
  entry_credit NUMERIC(10,4) NOT NULL CHECK (entry_credit > 0),
  entry_dte INTEGER NOT NULL,              -- server-computed, authoritative
  entry_dte_caller INTEGER,                -- caller-supplied, audit-only
  entry_score INTEGER,
  entry_grade TEXT,
  entry_quote_source TEXT,
  entry_quote_time TIMESTAMPTZ,
  entry_quote_retrieved_at TIMESTAMPTZ,
  entry_quote_timing TEXT DEFAULT 'delayed_unverified',

  -- Lifecycle (independent axes)
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'CLOSED', 'EXPIRED', 'DATA_REVIEW')),
  publish_state TEXT NOT NULL DEFAULT 'SHADOW'
    CHECK (publish_state IN ('SHADOW', 'LIVE')),

  -- Review gate (required before publication)
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,

  -- Fair evaluation batching
  last_evaluated_at TIMESTAMPTZ,

  -- Exit
  closed_at TIMESTAMPTZ,
  exit_stock_price NUMERIC(12,2),
  exit_option_bid NUMERIC(10,4),
  exit_option_ask NUMERIC(10,4),
  exit_debit NUMERIC(10,4),
  exit_reason TEXT,
  exit_quote_source TEXT,
  exit_quote_time TIMESTAMPTZ,
  exit_quote_retrieved_at TIMESTAMPTZ,

  -- P&L
  days_held INTEGER,
  gross_pnl NUMERIC(12,2),
  fees NUMERIC(8,2) DEFAULT 1.30,
  slippage NUMERIC(8,2) DEFAULT 0,
  net_pnl NUMERIC(12,2),
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('WIN', 'LOSS', 'FLAT')),

  -- Versioning
  rule_version TEXT DEFAULT 'v1',
  calc_version TEXT DEFAULT 'v1',

  -- Spread/micro
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'micro')),
  is_spread BOOLEAN DEFAULT false,
  buy_leg_strike NUMERIC(12,2),
  net_credit NUMERIC(10,4),
  spread_width NUMERIC(10,2),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Immutable event ledger
CREATE TABLE IF NOT EXISTS public.trade_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.modeled_trades(id),
  event_type TEXT NOT NULL CHECK (length(event_type) > 0),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Recovery cursor — one row per source, compare-and-set
CREATE TABLE IF NOT EXISTS public.recovery_cursors (
  source_name TEXT PRIMARY KEY,
  last_revision_id TEXT NOT NULL,
  last_revision_time TIMESTAMPTZ NOT NULL,
  is_bootstrap BOOLEAN NOT NULL DEFAULT false,
  bootstrapped_at TIMESTAMPTZ,            -- set once on bootstrap→CAS transition
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.modeled_trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_publish ON public.modeled_trades(publish_state);
CREATE INDEX IF NOT EXISTS idx_trades_closed_at ON public.modeled_trades(closed_at);
CREATE INDEX IF NOT EXISTS idx_trades_expiration ON public.modeled_trades(expiration);
CREATE INDEX IF NOT EXISTS idx_trades_eval_order
  ON public.modeled_trades(last_evaluated_at NULLS FIRST, alerted_at);
CREATE INDEX IF NOT EXISTS idx_events_trade_id ON public.trade_events(trade_id);

-- 5. RLS — deny all by default, service_role only
ALTER TABLE public.modeled_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_full_trades"
  ON public.modeled_trades FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "service_full_events"
  ON public.trade_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "service_full_cursors"
  ON public.recovery_cursors FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.modeled_trades FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.trade_events FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.recovery_cursors FROM anon, authenticated, PUBLIC;

-- service_role gets table access for modeled_trades and trade_events
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modeled_trades TO service_role;
GRANT SELECT, INSERT ON public.trade_events TO service_role;
-- recovery_cursors: NO direct SELECT/INSERT/UPDATE to service_role
-- All cursor access goes through RPCs only
GRANT USAGE ON SCHEMA public TO service_role;

-- ============================================================
-- 6. close_trade — atomic closure with full validation
-- ============================================================
CREATE OR REPLACE FUNCTION public.close_trade(
  p_trade_id UUID,
  p_exit_stock_price NUMERIC,
  p_exit_option_bid NUMERIC,
  p_exit_option_ask NUMERIC,
  p_exit_debit NUMERIC,
  p_exit_reason TEXT,
  p_exit_quote_source TEXT,
  p_exit_quote_time TIMESTAMPTZ,
  p_exit_quote_retrieved_at TIMESTAMPTZ,
  p_days_held INTEGER,
  p_gross_pnl NUMERIC,
  p_fees NUMERIC,
  p_slippage NUMERIC,
  p_net_pnl NUMERIC,
  p_outcome TEXT,
  p_rule_version TEXT DEFAULT 'v1'
) RETURNS UUID
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade_id UUID;
BEGIN
  -- Argument validation
  IF p_trade_id IS NULL THEN
    RAISE EXCEPTION 'p_trade_id must not be NULL';
  END IF;
  IF p_exit_debit IS NULL OR p_exit_debit < 0 THEN
    RAISE EXCEPTION 'p_exit_debit must be >= 0';
  END IF;
  IF p_exit_reason IS NULL OR length(p_exit_reason) = 0 THEN
    RAISE EXCEPTION 'p_exit_reason must not be NULL or empty';
  END IF;
  IF p_exit_reason NOT IN ('PROFIT_TARGET','STOP_LOSS','PRE_ITM','FORCED_TIME_EXIT','EXPIRATION') THEN
    RAISE EXCEPTION 'p_exit_reason must be a valid exit reason';
  END IF;
  IF p_outcome IS NULL OR p_outcome NOT IN ('WIN', 'LOSS', 'FLAT') THEN
    RAISE EXCEPTION 'p_outcome must be WIN, LOSS, or FLAT';
  END IF;
  IF p_days_held IS NULL OR p_days_held < 0 THEN
    RAISE EXCEPTION 'p_days_held must be >= 0';
  END IF;
  IF p_fees IS NULL OR p_fees < 0 THEN
    RAISE EXCEPTION 'p_fees must be >= 0';
  END IF;
  IF p_slippage IS NULL OR p_slippage < 0 THEN
    RAISE EXCEPTION 'p_slippage must be >= 0';
  END IF;

  -- EXPIRATION ↔ expiration_settlement coupling (both directions)
  IF p_exit_reason = 'EXPIRATION' AND p_exit_quote_source IS DISTINCT FROM 'expiration_settlement' THEN
    RAISE EXCEPTION 'EXPIRATION reason requires expiration_settlement source';
  END IF;
  IF p_exit_quote_source = 'expiration_settlement' AND p_exit_reason IS DISTINCT FROM 'EXPIRATION' THEN
    RAISE EXCEPTION 'expiration_settlement source requires EXPIRATION reason';
  END IF;

  -- Atomic update: WHERE clause is the concurrency gate
  UPDATE public.modeled_trades SET
    status = CASE WHEN p_exit_reason = 'EXPIRATION' THEN 'EXPIRED' ELSE 'CLOSED' END,
    closed_at = now(),
    exit_stock_price = p_exit_stock_price,
    exit_option_bid = p_exit_option_bid,
    exit_option_ask = p_exit_option_ask,
    exit_debit = p_exit_debit,
    exit_reason = p_exit_reason,
    exit_quote_source = p_exit_quote_source,
    exit_quote_time = p_exit_quote_time,
    exit_quote_retrieved_at = p_exit_quote_retrieved_at,
    days_held = p_days_held,
    gross_pnl = p_gross_pnl,
    fees = p_fees,
    slippage = p_slippage,
    net_pnl = p_net_pnl,
    outcome = p_outcome,
    rule_version = p_rule_version,
    updated_at = now()
  WHERE id = p_trade_id
    AND status IN ('OPEN', 'DATA_REVIEW')
  RETURNING id INTO v_trade_id;

  IF v_trade_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.trade_events (trade_id, event_type, event_data)
  VALUES (v_trade_id, 'CLOSED', jsonb_build_object(
    'reason', p_exit_reason,
    'exit_debit', p_exit_debit,
    'net_pnl', p_net_pnl,
    'outcome', p_outcome,
    'quote_source', p_exit_quote_source
  ));

  RETURN v_trade_id;
END;
$$;

-- ============================================================
-- 7. advance_recovery_cursor — CAS with irreversible bootstrap
-- ============================================================
CREATE OR REPLACE FUNCTION public.advance_recovery_cursor(
  p_source TEXT,
  p_expected_revision TEXT,
  p_new_revision TEXT,
  p_new_time TIMESTAMPTZ
) RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INT;
  v_is_bootstrap BOOLEAN;
BEGIN
  -- Read current state
  SELECT is_bootstrap INTO v_is_bootstrap
    FROM public.recovery_cursors
    WHERE source_name = p_source
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- If still bootstrap, transition to CAS mode (irreversible)
  IF v_is_bootstrap THEN
    UPDATE public.recovery_cursors SET
      is_bootstrap = false,
      bootstrapped_at = now(),
      last_revision_id = p_new_revision,
      last_revision_time = p_new_time,
      updated_at = now()
    WHERE source_name = p_source
      AND is_bootstrap = true;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
  END IF;

  -- Normal CAS: compare expected, advance if match
  UPDATE public.recovery_cursors SET
    last_revision_id = p_new_revision,
    last_revision_time = p_new_time,
    updated_at = now()
  WHERE source_name = p_source
    AND last_revision_id = p_expected_revision
    AND is_bootstrap = false;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- ============================================================
-- 8. bootstrap_cursor — one-time only, DB-enforced
-- ============================================================
CREATE OR REPLACE FUNCTION public.bootstrap_cursor(
  p_source TEXT,
  p_revision TEXT,
  p_time TIMESTAMPTZ
) RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if cursor already exists (any state)
  SELECT EXISTS(
    SELECT 1 FROM public.recovery_cursors WHERE source_name = p_source
  ) INTO v_exists;

  IF v_exists THEN
    RETURN false;  -- Already bootstrapped or active; reject re-bootstrap
  END IF;

  INSERT INTO public.recovery_cursors (source_name, last_revision_id, last_revision_time, is_bootstrap)
  VALUES (p_source, p_revision, p_time, true);

  RETURN true;
END;
$$;

-- ============================================================
-- 9. read_cursor — service_role read access via RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.read_cursor(
  p_source TEXT
) RETURNS TABLE(
  source_name TEXT,
  last_revision_id TEXT,
  last_revision_time TIMESTAMPTZ,
  is_bootstrap BOOLEAN,
  bootstrapped_at TIMESTAMPTZ
)
SET search_path = ''
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT source_name, last_revision_id, last_revision_time, is_bootstrap, bootstrapped_at
  FROM public.recovery_cursors
  WHERE source_name = p_source;
$$;

-- ============================================================
-- 10. review_trades — review gate before publication
-- ============================================================
CREATE OR REPLACE FUNCTION public.review_trades(
  p_trade_ids UUID[],
  p_actor TEXT DEFAULT 'owner'
) RETURNS INT
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INT;
BEGIN
  IF p_trade_ids IS NULL OR array_length(p_trade_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'p_trade_ids must be a non-empty array';
  END IF;
  IF p_actor IS NULL OR length(trim(p_actor)) = 0 THEN
    RAISE EXCEPTION 'p_actor must not be blank';
  END IF;

  UPDATE public.modeled_trades
    SET reviewed_at = now(), reviewed_by = p_actor, updated_at = now()
  WHERE id = ANY(p_trade_ids)
    AND reviewed_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

-- ============================================================
-- 11. publish_trades — hardened: dedup, existence, lock, RETURNING
-- ============================================================
CREATE OR REPLACE FUNCTION public.publish_trades(
  p_trade_ids UUID[],
  p_actor TEXT DEFAULT 'owner'
) RETURNS INT
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deduped UUID[];
  v_existing INT;
  v_unreviewed INT;
  v_rows INT;
  v_updated_ids UUID[];
  v_id UUID;
BEGIN
  -- Reject blank actor
  IF p_actor IS NULL OR length(trim(p_actor)) = 0 THEN
    RAISE EXCEPTION 'p_actor must not be blank';
  END IF;

  -- Reject NULL/empty array
  IF p_trade_ids IS NULL OR array_length(p_trade_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'p_trade_ids must be a non-empty array';
  END IF;

  -- Deduplicate input IDs
  v_deduped := ARRAY(SELECT DISTINCT unnest(p_trade_ids));

  -- Batch limit (post-dedup)
  IF array_length(v_deduped, 1) > 100 THEN
    RAISE EXCEPTION 'batch limited to 100 trade IDs';
  END IF;

  -- Existence check: all IDs must exist
  SELECT count(*) INTO v_existing
    FROM public.modeled_trades
    WHERE id = ANY(v_deduped);
  IF v_existing != array_length(v_deduped, 1) THEN
    RAISE EXCEPTION '% of % trade IDs not found',
      array_length(v_deduped, 1) - v_existing, array_length(v_deduped, 1);
  END IF;

  -- Reviewed-ID gate: reject if ANY requested trade is unreviewed
  SELECT count(*) INTO v_unreviewed
    FROM public.modeled_trades
    WHERE id = ANY(v_deduped)
      AND reviewed_at IS NULL;
  IF v_unreviewed > 0 THEN
    RAISE EXCEPTION '% trade(s) have not been reviewed', v_unreviewed;
  END IF;

  -- Lock the full set FOR UPDATE (prevent concurrent publish race)
  PERFORM id FROM public.modeled_trades
    WHERE id = ANY(v_deduped)
    FOR UPDATE;

  -- Atomic SHADOW->LIVE transition; collect updated IDs into array
  WITH updated AS (
    UPDATE public.modeled_trades
      SET publish_state = 'LIVE', updated_at = now()
    WHERE id = ANY(v_deduped)
      AND publish_state = 'SHADOW'
    RETURNING id
  )
  SELECT array_agg(id), count(*) INTO v_updated_ids, v_rows FROM updated;

  -- Coalesce: if no rows updated, v_rows defaults
  v_rows := COALESCE(v_rows, 0);

  -- Emit exactly 1 PUBLISHED event per actual SHADOW->LIVE transition
  IF v_updated_ids IS NOT NULL AND array_length(v_updated_ids, 1) > 0 THEN
    FOREACH v_id IN ARRAY v_updated_ids LOOP
      INSERT INTO public.trade_events (trade_id, event_type, event_data)
      VALUES (v_id, 'PUBLISHED', jsonb_build_object('actor', p_actor, 'batch_size', v_rows));
    END LOOP;
  END IF;

  RETURN v_rows;
END;
$$;

-- ============================================================
-- 12. Restrict RPC access
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.close_trade FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_trade TO service_role;

REVOKE EXECUTE ON FUNCTION public.advance_recovery_cursor FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_recovery_cursor TO service_role;

REVOKE EXECUTE ON FUNCTION public.bootstrap_cursor FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_cursor TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_cursor FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_cursor TO service_role;

REVOKE EXECUTE ON FUNCTION public.review_trades FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_trades TO service_role;

REVOKE EXECUTE ON FUNCTION public.publish_trades FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_trades TO service_role;


-- ============================================================
-- ROLLBACK — Ledger-Preserving Disable (transactional, idempotent)
-- Run as a single transaction. Safe to run twice.
-- ============================================================
--
-- BEGIN;
--
-- -- Phase 1: Revoke function EXECUTE (IF EXISTS guards via DO block)
-- DO $phase1$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='close_trade' AND pronamespace='public'::regnamespace) THEN
--     REVOKE EXECUTE ON FUNCTION public.close_trade FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='advance_recovery_cursor' AND pronamespace='public'::regnamespace) THEN
--     REVOKE EXECUTE ON FUNCTION public.advance_recovery_cursor FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='bootstrap_cursor' AND pronamespace='public'::regnamespace) THEN
--     REVOKE EXECUTE ON FUNCTION public.bootstrap_cursor FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='read_cursor' AND pronamespace='public'::regnamespace) THEN
--     REVOKE EXECUTE ON FUNCTION public.read_cursor FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='review_trades' AND pronamespace='public'::regnamespace) THEN
--     REVOKE EXECUTE ON FUNCTION public.review_trades FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='publish_trades' AND pronamespace='public'::regnamespace) THEN
--     REVOKE EXECUTE ON FUNCTION public.publish_trades FROM service_role;
--   END IF;
-- END $phase1$;
--
-- -- Phase 2: Freeze tables (read-only archive)
-- DO $phase2$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='modeled_trades' AND schemaname='public') THEN
--     REVOKE INSERT, UPDATE, DELETE ON public.modeled_trades FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='trade_events' AND schemaname='public') THEN
--     REVOKE INSERT ON public.trade_events FROM service_role;
--   END IF;
--   IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='recovery_cursors' AND schemaname='public') THEN
--     REVOKE INSERT, UPDATE, DELETE ON public.recovery_cursors FROM service_role;
--   END IF;
-- END $phase2$;
--
-- -- Phase 3: Remove functions
-- DROP FUNCTION IF EXISTS public.publish_trades(UUID[], TEXT);
-- DROP FUNCTION IF EXISTS public.review_trades(UUID[], TEXT);
-- DROP FUNCTION IF EXISTS public.close_trade(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC,
--   TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC,
--   TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.advance_recovery_cursor(TEXT, TEXT, TEXT, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS public.bootstrap_cursor(TEXT, TEXT, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS public.read_cursor(TEXT);
--
-- COMMIT;
--
-- -- Phase 4: DESTRUCTIVE (point of no return — only after data export)
-- -- DROP TABLE IF EXISTS public.trade_events;
-- -- DROP TABLE IF EXISTS public.recovery_cursors;
-- -- DROP TABLE IF EXISTS public.modeled_trades;
