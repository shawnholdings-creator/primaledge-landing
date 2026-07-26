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

type LoadState = "loading" | "error" | "empty" | "populated" | "stale";

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
        // Get session token from Supabase
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
      setError(err instanceof Error ? err.message : "Failed to load backtest data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  let state: LoadState = "loading";
  if (!loading && error) state = "error";
  else if (!loading && (!data?.periods?.length)) state = "empty";
  else if (!loading && data?.last_refresh?.status === "FAILED") state = "stale";
  else if (!loading && data?.periods?.length) state = "populated";

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
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
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
                  ⚠ Last refresh failed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 m-0">
              Two-week modeled results history · Strategy {data?.strategy_version || "v1"}
            </p>
          </div>
          {data?.last_refresh?.attempted_at && (
            <span className="text-xs text-gray-600 font-mono">
              Updated {formatTimestamp(data.last_refresh.attempted_at)}
            </span>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="py-2">
          {[1, 2, 3].map(i => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {state === "error" && (
        <div className="px-6 py-8 text-center">
          <p className="text-xs text-red-400 mb-3">Unable to load backtest data</p>
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ minHeight: 44, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {state === "empty" && (
        <div className="px-6 py-8 text-center">
          <p className="text-xs text-gray-500">
            No completed backtest periods yet. Results will appear here after the first two-week window completes.
          </p>
        </div>
      )}

      {/* ── Populated — Desktop Table ── */}
      {state !== "loading" && state !== "error" && state !== "empty" && (
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

      {/* ── Stale indicator ── */}
      {state === "stale" && data?.last_refresh?.failure_reason && (
        <div className="px-4 py-2 border-t border-white/5">
          <p className="text-xs text-yellow-500/70 m-0">
            Last refresh attempt failed. Showing previously published data.
          </p>
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
