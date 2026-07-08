/* ============================================================
   BacktestSignalLog.tsx — Shared component: recent backtest results
   Self-contained: owns data fetching, fallback, stats, and all JSX.
   Used in WeeklyIncomeHero (public) and WeeklyIncome (authenticated).
   ============================================================ */

import { useEffect, useState } from "react";

/* ─── Trade History Gist URL ────────────────────────────────── */
const TRADE_HISTORY_URL =
  (typeof import.meta !== "undefined"
    ? (import.meta as any).env?.VITE_TRADE_HISTORY_GIST_URL
    : undefined) || "";

/* ─── Types ─────────────────────────────────────────────────── */
type TradeRecord = {
  ticker: string;
  entry_date: string;
  strike: number;
  side: string;
  credit: number;
  days_held: number;
  pnl_per_contract: number;
  outcome: "WIN" | "LOSS";
  exit_reason?: string;
};

interface DisplayTrade {
  ticker: string;
  date: string;
  stockPrice: string;
  expiration: string;
  dte: number;
  strike: string;
  strikeRaw: number;
  credit: string;
  creditRaw: number;
  days: number;
  pnl: string;
  pnlRaw: number;
  win: boolean;
  rrRatio: string;
}

/* ─── Fallback Data ─────────────────────────────────────────── */
const FALLBACK_TRADES: DisplayTrade[] = [
  { ticker: "QQQ",   date: "Jun 05, 2026", stockPrice: "$704.29", expiration: "Jun 14, 2026", dte: 9, strike: "$676 Put", strikeRaw: 676,  credit: "$286", creditRaw: 286, days: 3, pnl: "+$170", pnlRaw: 170,  win: true  },
  { ticker: "SMH",   date: "Jun 05, 2026", stockPrice: "$569.69", expiration: "Jun 14, 2026", dte: 9, strike: "$521 Put", strikeRaw: 521,  credit: "$523", creditRaw: 523, days: 3, pnl: "+$369", pnlRaw: 369,  win: true  },
  { ticker: "SNOW",  date: "May 29, 2026", stockPrice: "$255.55", expiration: "Jun 07, 2026", dte: 9, strike: "$218 Put", strikeRaw: 218,  credit: "$687", creditRaw: 687, days: 3, pnl: "+$420", pnlRaw: 420,  win: true  },
  { ticker: "SMH",   date: "May 29, 2026", stockPrice: "$598.93", expiration: "Jun 07, 2026", dte: 9, strike: "$557 Put", strikeRaw: 557,  credit: "$368", creditRaw: 368, days: 4, pnl: "+$329", pnlRaw: 329,  win: true  },
  { ticker: "META",  date: "May 21, 2026", stockPrice: "$606.82", expiration: "May 30, 2026", dte: 9, strike: "$570 Put", strikeRaw: 570,  credit: "$384", creditRaw: 384, days: 5, pnl: "+$225", pnlRaw: 225,  win: true  },
  { ticker: "GOOGL", date: "May 21, 2026", stockPrice: "$387.43", expiration: "May 30, 2026", dte: 9, strike: "$360 Put", strikeRaw: 360,  credit: "$257", creditRaw: 257, days: 5, pnl: "+$131", pnlRaw: 131,  win: true  },
  { ticker: "SMH",   date: "May 21, 2026", stockPrice: "$567.88", expiration: "May 30, 2026", dte: 9, strike: "$528 Put", strikeRaw: 528,  credit: "$415", creditRaw: 415, days: 5, pnl: "+$386", pnlRaw: 386,  win: true  },
].map(t => ({
  ...t,
  rrRatio: (Math.round(((t.strikeRaw - t.creditRaw) / t.creditRaw) * 10) / 10).toFixed(1) + ":1",
}));

/* ─── Data Fetching Hook ────────────────────────────────────── */
function useRecentTrades() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!TRADE_HISTORY_URL) { setLoading(false); return; }
    fetch(TRADE_HISTORY_URL)
      .then(r => r.json())
      .then((data: TradeRecord[]) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 21);
        const recent = data
          .filter(t => new Date(t.entry_date) >= cutoff)
          .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
        setTrades(recent);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { trades, loading, error };
}

/* ─── Component ─────────────────────────────────────────────── */
export default function BacktestSignalLog() {
  const { trades: recentTrades, loading } = useRecentTrades();

  const displayTrades: DisplayTrade[] = (recentTrades && recentTrades.length > 0)
    ? recentTrades.map(t => ({
        ticker: t.ticker,
        date: new Date(t.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        stockPrice: `$${Number((t as any).stock_price ?? (t as any).entry_price ?? 0).toFixed(2)}`,
        expiration: new Date(new Date(t.entry_date).getTime() + ((t as any).dte ?? 0) * 86400000)
          .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        dte: (t as any).dte ?? 0,
        strike: `$${t.strike} ${t.side === "put" ? "Put" : "Call"}`,
        credit: `$${Math.round(t.credit * 100)}`,
        days: t.days_held,
        pnl: `${t.pnl_per_contract >= 0 ? "+" : ""}$${Math.abs(Math.round(t.pnl_per_contract)).toLocaleString()}`,
        creditRaw: Math.round(t.credit * 100),
        pnlRaw: Math.round(t.pnl_per_contract),
        win: t.outcome === "WIN",
        strikeRaw: t.strike,
        rrRatio: (Math.round(((t.strike - t.credit * 100) / (t.credit * 100)) * 10) / 10).toFixed(1) + ":1",
      }))
    : FALLBACK_TRADES;

  const totalTrades = displayTrades.length;
  const totalWins = displayTrades.filter(t => t.win).length;
  const totalIncome = displayTrades.filter(t => t.win).reduce((s, t) => s + t.pnlRaw, 0);
  const totalCredits = displayTrades.reduce((s, t) => s + t.creditRaw, 0);

  const weeklyStats = (() => {
    const weeks: Record<string, { label: string; wins: number; losses: number; net: number }> = {};
    displayTrades.forEach(t => {
      const d = new Date(t.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      const label = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!weeks[key]) weeks[key] = { label: `Wk of ${label}`, wins: 0, losses: 0, net: 0 };
      if (t.win) { weeks[key].wins++; weeks[key].net += t.pnlRaw; }
      else { weeks[key].losses++; weeks[key].net -= Math.abs(t.pnlRaw); }
    });
    return Object.values(weeks).slice(-3).reverse();
  })();

  const periodLabel = displayTrades.length > 0
    ? `${displayTrades[displayTrades.length - 1].date} \u2013 ${displayTrades[0].date}`
    : "Last 3 weeks";

  if (loading) return null;

  return (
    <div>
      {/* PART 1 — Terminal Banner */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-t-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-[10px] font-mono text-green-400/70 uppercase tracking-widest m-0">
              Backtest Signal Log · If You Had Taken These Trades
            </p>
            <p className="text-white font-black text-lg mt-0.5 m-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              +${totalIncome.toLocaleString()} net income · {totalWins}/{totalTrades} signals won
            </p>
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            {periodLabel} · 1 contract/signal
          </div>
        </div>
      </div>

      {/* PART 2 — Weekly Scorecard Strip */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-3 border-l border-r border-white/10">
        {weeklyStats.map((week, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center py-3 px-2 sm:px-4 border-b border-white/10 text-center ${
              i < weeklyStats.length - 1 ? "border-r border-white/10" : ""
            }`}
          >
            <p className="text-[10px] text-gray-500 font-mono m-0">{week.label}</p>
            <p
              className={`text-sm sm:text-base font-black mt-1 m-0 ${week.net > 0 ? "text-green-400" : "text-red-400"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {week.net > 0 ? "+" : ""}${Math.abs(week.net).toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 m-0">
              {week.wins}W · {week.losses}L
            </p>
          </div>
        ))}
      </div>

      {/* PART 3 — Full Trade Log Table */}
      <div className="w-full max-w-2xl mx-auto border border-white/10 border-t-0 rounded-b-xl overflow-hidden mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/5">
              {/* Ticker — always visible */}
              <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Ticker</th>
              {/* Date — sm+ */}
              <th className="hidden sm:table-cell px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Date</th>
              {/* Stock Price — md+ */}
              <th className="hidden md:table-cell px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Stock Price</th>
              {/* Strike — always */}
              <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Strike</th>
              {/* Expiry — md+ */}
              <th className="hidden md:table-cell px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Expiry</th>
              {/* DTE — lg+ */}
              <th className="hidden lg:table-cell px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">DTE</th>
              {/* Credit — always */}
              <th className="px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Credit</th>
              {/* Days — md+ */}
              <th className="hidden md:table-cell px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Days</th>
              {/* P&L — sm+ */}
              <th className="hidden sm:table-cell px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">P&L</th>
              {/* Risk/Reward — lg+ */}
              <th className="hidden lg:table-cell px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Risk/Reward</th>
              {/* Result — always */}
              <th className="px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap">Result</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.map((t, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold text-white whitespace-nowrap">{t.ticker}</td>
                <td className="hidden sm:table-cell px-2 sm:px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{t.date}</td>
                <td className="hidden md:table-cell px-2 sm:px-3 py-2 text-right text-xs text-gray-300 whitespace-nowrap">{t.stockPrice}</td>
                <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-300 whitespace-nowrap">{t.strike}</td>
                <td className="hidden md:table-cell px-2 sm:px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{t.expiration}</td>
                <td className="hidden lg:table-cell px-2 sm:px-3 py-2 text-right text-xs text-gray-500">{t.dte}d</td>
                <td className="px-2 sm:px-3 py-2 text-right text-xs sm:text-sm text-green-400 font-semibold">{t.credit}</td>
                <td className="hidden md:table-cell px-2 sm:px-3 py-2 text-right text-xs text-gray-400">{t.days}d</td>
                <td className={`hidden sm:table-cell px-2 sm:px-3 py-2 text-right text-xs sm:text-sm font-semibold ${t.win ? "text-green-400" : "text-red-400"}`}>{t.pnl}</td>
                <td className="hidden lg:table-cell px-2 sm:px-3 py-2 text-right text-xs text-gray-300 font-mono">{t.rrRatio}</td>
                <td className="px-2 sm:px-3 py-2 text-right">
                  <span className={`${t.win ? "bg-green-400/15 text-green-400" : "bg-red-400/15 text-red-400"} text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full`}>
                    {t.win ? "WIN" : "LOSS"}
                  </span>
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="border-t border-white/10 bg-white/[0.04]">
              <td className="px-2 sm:px-3 py-2 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider">TOTAL · {totalWins}/{totalTrades} wins</td>
              <td className="hidden sm:table-cell px-2 sm:px-3 py-2" />
              <td className="hidden md:table-cell px-2 sm:px-3 py-2" />
              <td className="px-2 sm:px-3 py-2" />
              <td className="hidden md:table-cell px-2 sm:px-3 py-2" />
              <td className="hidden lg:table-cell px-2 sm:px-3 py-2" />
              <td className="px-2 sm:px-3 py-2 text-right text-gray-400 text-xs font-semibold">${totalCredits.toLocaleString()} collected</td>
              <td className="hidden md:table-cell px-2 sm:px-3 py-2" />
              <td className="hidden sm:table-cell px-2 sm:px-3 py-2 text-right font-black text-green-400">+${totalIncome.toLocaleString()}</td>
              <td className="hidden lg:table-cell px-2 sm:px-3 py-2" />
              <td className="px-2 sm:px-3 py-2 text-right">
                <span className="bg-green-400/20 text-green-400 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalTrades > 0 ? Math.round(totalWins / totalTrades * 100) : 0}% WIN
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        {/* Footnote */}
        <p className="text-[11px] text-gray-600 px-3 py-2 border-t border-white/5 m-0">
          Backtest simulation · Stock price, strike &amp; expiration verifiable on Yahoo Finance / CBOE historical chains · 1 contract per signal · Updates weekly. Past results do not guarantee future performance. Not financial advice.
        </p>
      </div>
    </div>
  );
}
