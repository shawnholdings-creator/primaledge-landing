-- ============================================================
-- Modeled Trade Lifecycle v4.1
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
  entry_dte INTEGER NOT NULL,
  entry_dte_caller INTEGER,
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
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes (UNIQUE on alert_id already creates implicit index)
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.modeled_trades TO service_role;
GRANT SELECT, INSERT ON public.trade_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.recovery_cursors TO service_role;

-- 6. Atomic closure RPC with argument validation
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
  IF p_trade_id IS NULL THEN
    RAISE EXCEPTION 'p_trade_id must not be NULL';
  END IF;
  IF p_exit_debit IS NULL THEN
    RAISE EXCEPTION 'p_exit_debit must not be NULL';
  END IF;
  IF p_exit_reason IS NULL OR length(p_exit_reason) = 0 THEN
    RAISE EXCEPTION 'p_exit_reason must not be NULL or empty';
  END IF;
  IF p_outcome IS NULL OR p_outcome NOT IN ('WIN', 'LOSS', 'FLAT') THEN
    RAISE EXCEPTION 'p_outcome must be WIN, LOSS, or FLAT';
  END IF;

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

-- 7. Cursor compare-and-set RPC (ROW_COUNT → integer)
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
BEGIN
  UPDATE public.recovery_cursors SET
    last_revision_id = p_new_revision,
    last_revision_time = p_new_time,
    updated_at = now()
  WHERE source_name = p_source
    AND last_revision_id = p_expected_revision;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- 8. Review-gate RPC — marks trades as reviewed before publication
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

  UPDATE public.modeled_trades
    SET reviewed_at = now(), reviewed_by = p_actor, updated_at = now()
  WHERE id = ANY(p_trade_ids)
    AND reviewed_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN v_rows;
END;
$$;

-- 9. Guarded publication RPC — reviewed-ID gate enforced
CREATE OR REPLACE FUNCTION public.publish_trades(
  p_trade_ids UUID[],
  p_actor TEXT DEFAULT 'owner'
) RETURNS INT
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INT;
  v_unreviewed INT;
  v_id UUID;
BEGIN
  IF p_trade_ids IS NULL OR array_length(p_trade_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'p_trade_ids must be a non-empty array';
  END IF;
  IF array_length(p_trade_ids, 1) > 100 THEN
    RAISE EXCEPTION 'batch limited to 100 trade IDs';
  END IF;

  -- Reviewed-ID gate: reject if ANY requested trade is unreviewed
  SELECT count(*) INTO v_unreviewed
    FROM public.modeled_trades
    WHERE id = ANY(p_trade_ids)
      AND reviewed_at IS NULL;

  IF v_unreviewed > 0 THEN
    RAISE EXCEPTION '% trade(s) have not been reviewed; review before publishing', v_unreviewed;
  END IF;

  UPDATE public.modeled_trades
    SET publish_state = 'LIVE', updated_at = now()
  WHERE id = ANY(p_trade_ids)
    AND publish_state = 'SHADOW'
    AND status IN ('OPEN', 'CLOSED', 'EXPIRED', 'DATA_REVIEW');

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  FOREACH v_id IN ARRAY p_trade_ids LOOP
    INSERT INTO public.trade_events (trade_id, event_type, event_data)
    SELECT v_id, 'PUBLISHED', jsonb_build_object('actor', p_actor, 'batch_size', v_rows)
    WHERE EXISTS (SELECT 1 FROM public.modeled_trades WHERE id = v_id AND publish_state = 'LIVE');
  END LOOP;

  RETURN v_rows;
END;
$$;

-- 10. Restrict RPC access
REVOKE EXECUTE ON FUNCTION public.close_trade FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_trade TO service_role;

REVOKE EXECUTE ON FUNCTION public.advance_recovery_cursor FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_recovery_cursor TO service_role;

REVOKE EXECUTE ON FUNCTION public.review_trades FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_trades TO service_role;

REVOKE EXECUTE ON FUNCTION public.publish_trades FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_trades TO service_role;

-- ============================================================
-- ROLLBACK — Ledger-Preserving Disable
-- After any data exists, use Phase 1+2 (preserve all rows).
-- Phase 3 removes functions. Phase 4 is destructive/optional.
-- ============================================================
--
-- -- Phase 1: Freeze operations (no new trades, no closures, no publications)
-- REVOKE EXECUTE ON FUNCTION public.close_trade FROM service_role;
-- REVOKE EXECUTE ON FUNCTION public.advance_recovery_cursor FROM service_role;
-- REVOKE EXECUTE ON FUNCTION public.review_trades FROM service_role;
-- REVOKE EXECUTE ON FUNCTION public.publish_trades FROM service_role;
--
-- -- Phase 2: Freeze tables (read-only archive)
-- REVOKE INSERT, UPDATE, DELETE ON public.modeled_trades FROM service_role;
-- REVOKE INSERT ON public.trade_events FROM service_role;
-- REVOKE INSERT, UPDATE ON public.recovery_cursors FROM service_role;
-- -- service_role retains SELECT for data export
--
-- -- Phase 3: Remove functions (optional, tables remain read-only)
-- DROP FUNCTION IF EXISTS public.publish_trades(UUID[], TEXT);
-- DROP FUNCTION IF EXISTS public.review_trades(UUID[], TEXT);
-- DROP FUNCTION IF EXISTS public.close_trade(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.advance_recovery_cursor(TEXT, TEXT, TEXT, TIMESTAMPTZ);
--
-- -- Phase 4: DESTRUCTIVE — only after data export (point of no return)
-- DROP TABLE IF EXISTS public.trade_events;
-- DROP TABLE IF EXISTS public.recovery_cursors;
-- DROP TABLE IF EXISTS public.modeled_trades;
