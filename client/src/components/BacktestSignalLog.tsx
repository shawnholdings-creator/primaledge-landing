/* ============================================================
   BacktestSignalLog.tsx — Modeled Trade Results
   Self-contained: owns data fetching, stats, and all JSX.
   Used in WeeklyIncomeHero (public) and WeeklyIncome (authenticated).
   ============================================================ */

import { useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────── */
interface ModeledTrade {
  id: string;
  ticker: string;
  side: "PUT" | "CALL";
  strike: number;
  expiration: string;
  entry_credit: number;
  entry_stock_price: number;
  entry_dte: number;
  alerted_at: string;
  status: string;
  closed_at: string | null;
  exit_debit: number | null;
  exit_reason: string | null;
  days_held: number | null;
  gross_pnl: number | null;
  fees: number | null;
  net_pnl: number | null;
  outcome: "WIN" | "LOSS" | "FLAT" | null;
  tier: string;
  is_spread: boolean;
}

interface MTDSummary {
  net_pnl: number;
  wins: number;
  losses: number;
  flats: number;
  count: number;
  win_rate: number;
}

interface TradesResponse {
  open: ModeledTrade[];
  closed_14d: ModeledTrade[];
  mtd: MTDSummary;
  data_health: { last_evaluated: string | null; issues: string[] };
}

/* ─── Data Fetching Hook ────────────────────────────────────── */
function useTradesAPI() {
  const [data, setData] = useState<TradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: TradesResponse) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function dteRemaining(expiration: string) {
  const diff = Math.ceil(
    (new Date(expiration).getTime() - Date.now()) / 86_400_000
  );
  return Math.max(diff, 0);
}

/* ─── Pill styles ───────────────────────────────────────────── */
const sidePillClass = (side: "PUT" | "CALL") =>
  side === "PUT"
    ? "bg-[#00e5a0]/15 text-[#00e5a0]"
    : "bg-[#f0b429]/15 text-[#f0b429]";

const outcomePillClass = (outcome: "WIN" | "LOSS" | "FLAT" | null) => {
  if (outcome === "WIN") return "bg-green-400/15 text-green-400";
  if (outcome === "LOSS") return "bg-red-400/15 text-red-400";
  return "bg-white/10 text-white/50";
};

/* ─── Component ─────────────────────────────────────────────── */
export default function BacktestSignalLog() {
  const { data, loading, error } = useTradesAPI();
  const [sideFilter, setSideFilter] = useState<"all" | "puts" | "calls">(
    "all"
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0d1117] p-6 text-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-32 h-3 bg-white/10 rounded" />
          <div className="w-48 h-3 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0d1117] p-6 text-center text-white/40 text-sm">
        Unable to load modeled trade results. Please try again later.
      </div>
    );
  }

  const { open, closed_14d, mtd, data_health } = data;

  const filterTrade = (t: ModeledTrade) => {
    if (sideFilter === "puts") return t.side === "PUT";
    if (sideFilter === "calls") return t.side === "CALL";
    return true;
  };

  const filteredOpen = open.filter(filterTrade);
  const filteredClosed = closed_14d.filter(filterTrade);

  const pillBtn = (
    label: string,
    value: "all" | "puts" | "calls"
  ) => (
    <button
      onClick={() => setSideFilter(value)}
      className={`font-mono text-[0.65rem] uppercase tracking-wider rounded-full px-3 py-1 border-none cursor-pointer transition-colors ${
        sideFilter === value
          ? "bg-[#00e5a0] text-[#0a0d12] font-bold"
          : "bg-white/[0.06] text-white/50 font-normal hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="rounded-t-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00e5a0] animate-pulse" />
          <p className="text-[10px] font-mono text-green-400/70 uppercase tracking-widest m-0">
            Modeled Trade Results
          </p>
        </div>
        <p className="text-[11px] text-white/40 m-0">
          Rule-based simulated entries and exits using public market data. Not
          broker executions.
        </p>
      </div>

      {/* ─── Filter Tabs ─────────────────────────────────────── */}
      <div className="border-x border-white/10 flex gap-2 px-4 py-3 border-b border-white/[0.06]">
        {pillBtn("All", "all")}
        {pillBtn("Puts", "puts")}
        {pillBtn("Calls", "calls")}
      </div>

      {/* ─── Stats Banner ────────────────────────────────────── */}
      <div className="border-x border-white/10 grid grid-cols-3">
        {[
          {
            label: "Net P&L (MTD)",
            value: fmtCurrency(mtd.net_pnl),
            color: mtd.net_pnl >= 0 ? "text-green-400" : "text-red-400",
          },
          {
            label: "Win Rate",
            value: `${mtd.win_rate.toFixed(0)}%`,
            color: "text-white",
          },
          {
            label: "Total Trades",
            value: String(mtd.count),
            color: "text-white",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center py-3 px-2 border-b border-white/10 text-center ${
              i < 2 ? "border-r border-white/10" : ""
            }`}
          >
            <p className="text-[10px] text-gray-500 font-mono m-0 uppercase tracking-wider">
              {s.label}
            </p>
            <p
              className={`text-base sm:text-lg font-black mt-1 m-0 ${s.color}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Currently Tracking (Open) ───────────────────────── */}
      <div className="border-x border-white/10 border-b border-white/10 px-4 py-3">
        <p className="text-[10px] font-mono text-green-400/70 uppercase tracking-widest mb-2 m-0">
          Currently Tracking
        </p>
        {filteredOpen.length === 0 ? (
          <p className="text-sm text-white/40 m-0">
            No trades currently being tracked
          </p>
        ) : (
          <div className="space-y-2">
            {filteredOpen.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]"
              >
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-white font-bold text-sm">
                  {t.ticker}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sidePillClass(t.side)}`}
                >
                  {t.side}
                </span>
                <span className="text-white/60 text-xs">
                  ${t.strike}
                </span>
                <span className="text-white/40 text-xs">
                  exp {fmtDate(t.expiration)}
                </span>
                <span className="text-[#00e5a0] text-xs font-semibold">
                  ${t.entry_credit}
                </span>
                <span className="text-white/40 text-xs">
                  {dteRemaining(t.expiration)}d left
                </span>
                <span className="text-white/30 text-[10px] ml-auto">
                  entered {fmtDate(t.alerted_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Closed — Last 14 Days ───────────────────────────── */}
      <div className="border border-white/10 border-t-0 rounded-b-xl overflow-hidden mb-4">
        <p className="text-[10px] font-mono text-green-400/70 uppercase tracking-widest px-4 pt-3 pb-1 m-0">
          Closed — Last 14 Days
        </p>

        {filteredClosed.length === 0 ? (
          <p className="text-sm text-white/40 px-4 py-4 m-0">
            No trades closed in the last 14 days
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    {[
                      { label: "Side", align: "left" },
                      { label: "Ticker", align: "left" },
                      { label: "Strike", align: "right" },
                      { label: "Entry Credit", align: "right" },
                      { label: "Exit Debit", align: "right" },
                      { label: "Days", align: "right" },
                      { label: "Net P&L", align: "right" },
                      { label: "Outcome", align: "center" },
                      { label: "Exit Reason", align: "left" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`px-3 py-2 text-[10px] text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap text-${h.align}`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClosed.map((t, i) => (
                    <tr
                      key={t.id}
                      className={i % 2 === 0 ? "bg-white/[0.02]" : ""}
                    >
                      <td className="px-3 py-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sidePillClass(t.side)}`}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-bold text-white">
                        {t.ticker}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-gray-300">
                        ${t.strike}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-[#00e5a0] font-semibold">
                        ${t.entry_credit}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-white/60">
                        {t.exit_debit != null ? `$${t.exit_debit}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-gray-400">
                        {t.days_held ?? "—"}d
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-sm font-semibold ${
                          (t.net_pnl ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {fmtCurrency(t.net_pnl)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${outcomePillClass(t.outcome)}`}
                        >
                          {t.outcome ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-white/40 whitespace-nowrap">
                        {t.exit_reason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2 px-3 pb-3">
              {filteredClosed.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#0d1117] border border-white/10 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">
                        {t.ticker}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sidePillClass(t.side)}`}
                      >
                        {t.side}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${outcomePillClass(t.outcome)}`}
                    >
                      {t.outcome ?? "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-white/40">Strike</span>{" "}
                      <span className="text-white/80">${t.strike}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Entry</span>{" "}
                      <span className="text-[#00e5a0] font-semibold">
                        ${t.entry_credit}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Exit</span>{" "}
                      <span className="text-white/60">
                        {t.exit_debit != null ? `$${t.exit_debit}` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Days</span>{" "}
                      <span className="text-white/60">
                        {t.days_held ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Net P&L</span>{" "}
                      <span
                        className={`font-semibold ${
                          (t.net_pnl ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {fmtCurrency(t.net_pnl)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Reason</span>{" "}
                      <span className="text-white/50">
                        {t.exit_reason ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── Monthly Footer ──────────────────────────────────── */}
        <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3">
          <p
            className="text-sm font-black text-white m-0"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Month-to-Date:{" "}
            <span
              className={mtd.net_pnl >= 0 ? "text-green-400" : "text-red-400"}
            >
              Net {fmtCurrency(mtd.net_pnl)}
            </span>{" "}
            <span className="text-white/40 font-normal text-xs">
              | {mtd.wins} wins / {mtd.losses} losses | {mtd.count} trades
            </span>
          </p>
        </div>

        {/* ─── Data Health ─────────────────────────────────────── */}
        <div className="border-t border-white/5 px-4 py-2 flex flex-wrap items-center gap-2">
          <p className="text-[10px] text-gray-600 m-0">
            Last evaluated:{" "}
            {data_health.last_evaluated
              ? new Date(data_health.last_evaluated).toLocaleString()
              : "N/A"}
          </p>
          {data_health.issues.length > 0 && (
            <span className="text-[10px] text-[#f0b429] flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b429]" />
              {data_health.issues[0]}
            </span>
          )}
        </div>

        {/* ─── Disclosure ──────────────────────────────────────── */}
        <p className="text-[11px] text-gray-600 px-4 py-2 border-t border-white/5 m-0">
          Modeled results use public market data and rule-based simulated
          entries and exits. They are not broker executions. Quotes may be
          delayed or unavailable.
        </p>
      </div>
    </div>
  );
}
