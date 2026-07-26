import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────
interface BacktestPeriod {
  id?: string;
  period_start: string;
  period_end: string;
  trade_count: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  net_pnl: number;
  avg_credit?: number | null;
  avg_hold_days?: number | null;
  validation_state: string;
  warning_message?: string | null;
  published_at: string | null;
  strategy_version: string;
  run_status?: string;
  trades?: PeriodTrade[];
}

interface PeriodTrade {
  ticker: string;
  side: "PUT" | "CALL";
  strike: number;
  expiration: string;
  entry_credit: number;
  net_pnl: number;
  outcome: "WIN" | "LOSS" | "FLAT" | null;
  days_held: number;
  closed_at: string;
  exit_reason: string | null;
}

interface BacktestResponse {
  periods: BacktestPeriod[];
  total: number;
  access: "public" | "member";
  // Authoritative status from backend
  status: "populated" | "no_completed_periods" | "no_qualifying_setup" | "stale";
  screening_completed: boolean;
  last_evaluated_at: string | null;
  last_successful_refresh_at: string | null;
  next_scheduled_review_at: string | null;
  published_setup_count: number;
  stale_reason?: string;
  // Legacy
  last_refresh?: {
    attempted_at: string | null;
    status: string | null;
    failure_reason: string | null;
  };
  strategy_version?: string;
  note?: string;
  limit?: number;
  offset?: number;
}

// All 6 UI-meaningful states
type LoadState =
  | "loading"
  | "error"
  | "no_completed_periods"
  | "no_qualifying_setup"
  | "populated"
  | "stale";

// ── Data Hook ────────────────────────────────────────────────
function useBacktestPeriods(isAuthenticated: boolean) {
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {};
      if (isAuthenticated) {
        const sessionStr = localStorage.getItem("sb-session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (session?.access_token) {
              headers["Authorization"] = `Bearer ${session.access_token}`;
            }
          } catch { /* ignore parse errors */ }
        }
      }

      const detailParam = isAuthenticated ? "&detail=true" : "";
      const resp = await fetch(`/api/trades/backtest?limit=26${detailParam}`, {
        headers,
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const json: BacktestResponse = await resp.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // Derive UI state from backend-authoritative status
  let state: LoadState = "loading";
  if (loading) {
    state = "loading";
  } else if (error) {
    state = "error";
  } else if (data?.status === "stale") {
    state = "stale";
  } else if (data?.status === "populated") {
    state = "populated";
  } else if (data?.status === "no_qualifying_setup") {
    state = "no_qualifying_setup";
  } else {
    // no_completed_periods or unexpected — treat as no_completed_periods
    state = "no_completed_periods";
  }

  return { data, loading, error, state, refetch: fetchPeriods };
}

// ── Helpers ──────────────────────────────────────────────────
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00Z");
  const e = new Date(end + "T12:00:00Z");
  const sMonth = s.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const sDay = s.getUTCDate();
  const eDay = e.getUTCDate();
  const year = e.getUTCFullYear();
  if (sMonth === eMonth) {
    return `${sMonth} ${sDay}–${eDay}, ${year}`;
  }
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`;
}

function formatCurrency(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}$${Math.abs(val).toFixed(2)}`;
}

function formatPct(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return `${val.toFixed(1)}%`;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " ET";
}

function formatScheduledTime(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " ET";
}

// ── Status Badge ─────────────────────────────────────────────
function StatusBadge({ period }: { period: BacktestPeriod }) {
  if (period.validation_state === "no_trades") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
        No Trades
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: "rgba(0,229,160,0.12)", color: "#00e5a0" }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", display: "inline-block" }} />
      Published
    </span>
  );
}

// ── Outcome Badge ────────────────────────────────────────────
function OutcomeBadge({ outcome }: { outcome: string | null }) {
  const styles: Record<string, { bg: string; color: string }> = {
    WIN: { bg: "rgba(0,229,160,0.15)", color: "#00e5a0" },
    LOSS: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    FLAT: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
  };
  const s = styles[outcome || ""] || styles.FLAT;
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {outcome || "—"}
    </span>
  );
}

// ── Trade Detail Row ─────────────────────────────────────────
function TradeDetailCard({ trade }: { trade: PeriodTrade }) {
  return (
    <div
      className="flex items-center justify-between py-2 px-3 border-b border-white/5 last:border-b-0"
      style={{ fontSize: "0.75rem" }}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-white">{trade.ticker}</span>
        <span
          className="px-1.5 py-0.5 rounded text-xs font-bold"
          style={{
            background: trade.side === "PUT" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            color: trade.side === "PUT" ? "#ef4444" : "#3b82f6",
          }}
        >
          {trade.side}
        </span>
        <span className="text-gray-500">${trade.strike}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{trade.days_held}d</span>
        <span
          className="font-mono font-bold"
          style={{ color: trade.net_pnl >= 0 ? "#00e5a0" : "#ef4444" }}
        >
          {formatCurrency(trade.net_pnl)}
        </span>
        <OutcomeBadge outcome={trade.outcome} />
      </div>
    </div>
  );
}

// ── Expandable Period Row (Desktop) ──────────────────────────
function PeriodRow({
  period,
  isExpanded,
  onToggle,
  isMember,
}: {
  period: BacktestPeriod;
  isExpanded: boolean;
  onToggle: () => void;
  isMember: boolean;
}) {
  const hasTrades = period.trades && period.trades.length > 0;
  const canExpand = isMember && hasTrades;

  return (
    <>
      <tr
        className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
        style={{ cursor: canExpand ? "pointer" : "default" }}
        onClick={canExpand ? onToggle : undefined}
      >
        <td className="py-3 px-4 text-xs font-mono text-white whitespace-nowrap">
          <div className="flex items-center gap-2">
            {canExpand && (
              <span
                className="text-gray-500 transition-transform"
                style={{
                  display: "inline-block",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  minWidth: 16, minHeight: 16,
                }}
              >
                ▶
              </span>
            )}
            {formatDateRange(period.period_start, period.period_end)}
          </div>
        </td>
        <td className="py-3 px-4 text-xs">
          <StatusBadge period={period} />
        </td>
        <td className="py-3 px-4 text-xs text-center text-white font-medium">
          {period.trade_count}
        </td>
        <td className="py-3 px-4 text-xs text-center">
          <span style={{ color: (period.win_rate ?? 0) >= 70 ? "#00e5a0" : (period.win_rate ?? 0) >= 50 ? "#fbbf24" : "#ef4444" }}>
            {formatPct(period.win_rate)}
          </span>
          {period.trade_count > 0 && (
            <span className="text-gray-600 ml-1">
              ({period.wins}W/{period.losses}L)
            </span>
          )}
        </td>
        <td
          className="py-3 px-4 text-xs text-right font-mono font-bold"
          style={{ color: period.net_pnl >= 0 ? "#00e5a0" : "#ef4444" }}
        >
          {formatCurrency(period.net_pnl)}
        </td>
        {isMember && (
          <>
            <td className="py-3 px-4 text-xs text-center text-gray-400">
              {period.avg_credit ? `$${Number(period.avg_credit).toFixed(2)}` : "—"}
            </td>
            <td className="py-3 px-4 text-xs text-center text-gray-400">
              {period.avg_hold_days ? `${Number(period.avg_hold_days).toFixed(1)}d` : "—"}
            </td>
          </>
        )}
      </tr>
      {isExpanded && hasTrades && (
        <tr>
          <td colSpan={isMember ? 7 : 5} className="p-0">
            <div
              className="mx-4 mb-3 rounded-lg overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="px-3 py-2 border-b border-white/5">
                <span className="text-xs text-green-400/70 uppercase tracking-widest font-mono">
                  Period Trades
                </span>
              </div>
              {period.trades!.map((t, i) => (
                <TradeDetailCard key={i} trade={t} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Mobile Period Card ───────────────────────────────────────
function PeriodCard({
  period,
  isExpanded,
  onToggle,
  isMember,
}: {
  period: BacktestPeriod;
  isExpanded: boolean;
  onToggle: () => void;
  isMember: boolean;
}) {
  const hasTrades = period.trades && period.trades.length > 0;
  const canExpand = isMember && hasTrades;

  return (
    <div
      className="rounded-lg overflow-hidden mb-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <button
        type="button"
        className="w-full text-left px-4 py-3"
        style={{ minHeight: 44, background: "transparent", border: "none", cursor: canExpand ? "pointer" : "default" }}
        onClick={canExpand ? onToggle : undefined}
        disabled={!canExpand}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-white font-bold">
            {formatDateRange(period.period_start, period.period_end)}
          </span>
          <StatusBadge period={period} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Trades</div>
            <div className="text-xs text-white font-bold">{period.trade_count}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Win Rate</div>
            <div className="text-xs font-bold" style={{ color: (period.win_rate ?? 0) >= 50 ? "#00e5a0" : "#ef4444" }}>
              {formatPct(period.win_rate)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-0.5">Net P&L</div>
            <div
              className="text-xs font-mono font-bold"
              style={{ color: period.net_pnl >= 0 ? "#00e5a0" : "#ef4444" }}
            >
              {formatCurrency(period.net_pnl)}
            </div>
          </div>
        </div>

        {isMember && (period.avg_credit || period.avg_hold_days) && (
          <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-white/5">
            <div>
              <span className="text-xs text-gray-500">Avg Credit: </span>
              <span className="text-xs text-gray-300">
                {period.avg_credit ? `$${Number(period.avg_credit).toFixed(2)}` : "—"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Avg Hold: </span>
              <span className="text-xs text-gray-300">
                {period.avg_hold_days ? `${Number(period.avg_hold_days).toFixed(1)}d` : "—"}
              </span>
            </div>
          </div>
        )}

        {canExpand && (
          <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/5">
            <span className="text-xs text-green-400/60">
              {isExpanded ? "▲ Hide trades" : "▼ View trades"}
            </span>
          </div>
        )}
      </button>

      {isExpanded && hasTrades && (
        <div className="border-t border-white/5">
          {period.trades!.map((t, i) => (
            <TradeDetailCard key={i} trade={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeleton Loader ──────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-3 px-4 border-b border-white/5">
      <div className="h-3 w-28 bg-white/5 rounded" />
      <div className="h-3 w-16 bg-white/5 rounded" />
      <div className="h-3 w-8 bg-white/5 rounded" />
      <div className="h-3 w-16 bg-white/5 rounded" />
      <div className="h-3 w-14 bg-white/5 rounded ml-auto" />
    </div>
  );
}

// ── No Qualifying Setup Card ─────────────────────────────────
function NoQualifyingSetupCard({
  data,
}: {
  data: BacktestResponse | null;
}) {
  return (
    <div
      data-testid="no-qualifying-setup-card"
      className="px-4 sm:px-6 py-6"
    >
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)",
          border: "1px solid rgba(251,191,36,0.15)",
        }}
      >
        {/* Header with shield icon */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 44, height: 44,
              background: "rgba(251,191,36,0.12)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h4
              className="text-white font-bold m-0"
              style={{ fontSize: "0.9375rem", lineHeight: 1.4 }}
            >
              No qualifying setup this week
            </h4>
            <p
              className="text-gray-400 mt-1 m-0"
              style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
            >
              We reviewed the current watchlist and did not publish a trade because
              no candidate met every required quality and risk-control check.
            </p>
          </div>
        </div>

        {/* Metadata timestamps */}
        <div
          className="rounded-lg px-4 py-3 mb-4"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Screening completed:</span>
              <span className="text-xs text-gray-300 font-mono">
                {formatTimestamp(data?.last_evaluated_at || null)}
              </span>
            </div>
            {data?.next_scheduled_review_at && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Next scheduled review:</span>
                <span className="text-xs text-gray-300 font-mono">
                  {formatScheduledTime(data.next_scheduled_review_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Standards statement */}
        <p
          className="text-gray-500 m-0 mb-4"
          style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
        >
          The system does not lower standards simply to create a weekly trade.
        </p>

        {/* Action links */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#methodology"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              minHeight: 44,
              background: "rgba(251,191,36,0.1)",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.2)",
              textDecoration: "none",
            }}
          >
            View methodology
          </a>
          <a
            href="#backtest-history"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              minHeight: 44,
              background: "rgba(255,255,255,0.05)",
              color: "#9ca3af",
              border: "1px solid rgba(255,255,255,0.08)",
              textDecoration: "none",
            }}
          >
            View historical modeled results
          </a>
        </div>
      </div>
    </div>
  );
}

// ── No Completed Periods Card ────────────────────────────────
function NoCompletedPeriodsCard({
  data,
}: {
  data: BacktestResponse | null;
}) {
  return (
    <div
      data-testid="no-completed-periods-card"
      className="px-4 sm:px-6 py-6"
    >
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.02) 100%)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 44, height: 44,
              background: "rgba(99,102,241,0.12)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h4
              className="text-white font-bold m-0"
              style={{ fontSize: "0.9375rem", lineHeight: 1.4 }}
            >
              No completed backtest periods yet
            </h4>
            <p
              className="text-gray-400 mt-1 m-0"
              style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
            >
              The modeled-trade evaluation system has not yet completed its first
              two-week review window. Results will appear here automatically once the
              first period finishes.
            </p>
            {data?.next_scheduled_review_at && (
              <p
                className="text-gray-500 mt-3 m-0"
                style={{ fontSize: "0.75rem" }}
              >
                Next scheduled review: {formatScheduledTime(data.next_scheduled_review_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Error Card ───────────────────────────────────────────────
function ErrorCard({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div
      data-testid="backtest-error-card"
      className="px-4 sm:px-6 py-6"
    >
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 44, height: 44,
              background: "rgba(239,68,68,0.12)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1">
            <h4
              className="text-white font-bold m-0"
              style={{ fontSize: "0.9375rem", lineHeight: 1.4 }}
            >
              Unable to load results
            </h4>
            <p
              className="text-gray-400 mt-1 m-0"
              style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
            >
              A technical error occurred while requesting data. This is a connection
              or server issue, not a data or screening problem.
            </p>
            <p
              className="text-red-400/70 mt-2 m-0 font-mono"
              style={{ fontSize: "0.6875rem" }}
            >
              {error}
            </p>
            <button
              data-testid="backtest-retry-button"
              onClick={onRetry}
              className="mt-4 px-5 py-2 rounded-lg text-xs font-medium text-white transition-colors"
              style={{
                minHeight: 44, minWidth: 100,
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function BacktestResultsTable({
  isMember = false,
}: {
  isMember?: boolean;
}) {
  const { data, loading, error, state, refetch } = useBacktestPeriods(isMember);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  const togglePeriod = (key: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const periods = data?.periods || [];

  return (
    <div
      data-testid="backtest-results-table"
      data-state={state}
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-base m-0">
                Biweekly Backtest Results
              </h3>
              {state === "stale" && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
                >
                  ⚠ Data may be outdated
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 m-0">
              Two-week modeled results history · Strategy {data?.strategy_version || "v1"}
            </p>
          </div>
          {data?.last_evaluated_at && (
            <span className="text-xs text-gray-600 font-mono">
              Last evaluated {formatTimestamp(data.last_evaluated_at)}
            </span>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="py-2" role="status" aria-label="Loading backtest results">
          {[1, 2, 3].map(i => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {state === "error" && (
        <ErrorCard error={error || "Unknown error"} onRetry={refetch} />
      )}

      {/* ── No Qualifying Setup ── */}
      {state === "no_qualifying_setup" && (
        <NoQualifyingSetupCard data={data} />
      )}

      {/* ── No Completed Periods ── */}
      {state === "no_completed_periods" && (
        <NoCompletedPeriodsCard data={data} />
      )}

      {/* ── Populated / Stale — Desktop Table ── */}
      {(state === "populated" || state === "stale") && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-2 px-4 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Period
                  </th>
                  <th className="py-2 px-4 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-4 text-center text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Trades
                  </th>
                  <th className="py-2 px-4 text-center text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="py-2 px-4 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Net P&L
                  </th>
                  {isMember && (
                    <>
                      <th className="py-2 px-4 text-center text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Avg Credit
                      </th>
                      <th className="py-2 px-4 text-center text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Avg Hold
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <PeriodRow
                    key={`${p.period_start}-${p.period_end}`}
                    period={p}
                    isExpanded={expandedPeriods.has(`${p.period_start}-${p.period_end}`)}
                    onToggle={() => togglePeriod(`${p.period_start}-${p.period_end}`)}
                    isMember={isMember}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden px-4 py-3">
            {periods.map(p => (
              <PeriodCard
                key={`${p.period_start}-${p.period_end}`}
                period={p}
                isExpanded={expandedPeriods.has(`${p.period_start}-${p.period_end}`)}
                onToggle={() => togglePeriod(`${p.period_start}-${p.period_end}`)}
                isMember={isMember}
              />
            ))}
          </div>

          {/* Pagination info */}
          {data?.total && data.total > periods.length && (
            <div className="px-4 py-2 border-t border-white/5 text-center">
              <span className="text-xs text-gray-500">
                Showing {periods.length} of {data.total} periods
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Stale freshness notice ── */}
      {state === "stale" && (
        <div className="px-4 sm:px-6 py-3 border-t border-white/5">
          <div
            className="rounded-lg px-4 py-3"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}
          >
            <p className="text-xs m-0" style={{ color: "#fbbf24" }}>
              ⚠ The latest refresh did not complete successfully. Showing the last
              valid published data below.
              {data?.stale_reason && (
                <span className="text-gray-500 ml-1">({data.stale_reason})</span>
              )}
            </p>
            {data?.last_successful_refresh_at && (
              <p className="text-xs text-gray-500 mt-1 m-0">
                Last successful refresh: {formatTimestamp(data.last_successful_refresh_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Disclosure ── */}
      <div className="px-4 sm:px-6 py-3 border-t border-white/5">
        <p className="text-xs text-gray-600 m-0 leading-relaxed">
          Historical modeled/backtest results are educational and illustrative only. They
          do not guarantee future results and are not broker executions or personalized
          investment advice. Each period aggregates modeled trades closed within the
          two-week window using rule-based entry and exit criteria applied to public
          market data.
        </p>
        {!isMember && data?.note && (
          <p className="text-xs text-gray-500 mt-1 m-0">{data.note}</p>
        )}
      </div>
    </div>
  );
}
