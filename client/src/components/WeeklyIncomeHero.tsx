/* ============================================================
   WeeklyIncomeHero.tsx — Public tease hero for Weekly Options Income
   Design: dark bg #0a0a0a, accent #00ff96, amber #f0b429
   All styles inline — no external CSS files required.
   ============================================================ */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import Navbar from "./Navbar";
import { useLoginModal } from "../contexts/LoginModalContext";

/* ─── Trade History Gist URL ────────────────────────────────── */
const TRADE_HISTORY_URL =
  (typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_TRADE_HISTORY_GIST_URL
    : undefined) ||
  '';

/* ─── Types ─────────────────────────────────────────────────── */
type TradeRecord = {
  ticker: string;
  entry_date: string;
  strike: number;
  side: string;
  credit: number;
  days_held: number;
  pnl_per_contract: number;
  outcome: 'WIN' | 'LOSS';
  exit_reason?: string;
};

/* ─── Design Tokens ─────────────────────────────────────────── */
const T = {
  bg: "#0a0a0a",
  accent: "#00ff96",
  amber: "#f0b429",
  cardBg: "#111",
  cardBorder: "1px solid rgba(255,255,255,0.08)",
  radius: "12px",
  white: "#fff",
  muted: "#666",
  dimmed: "#555",
  faint: "#444",
  ghost: "#333",
  fontMono: "'Space Mono', 'Fira Code', 'Courier New', monospace",
  fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
  fontBody: "'Inter', sans-serif",
} as const;

/* ─── Keyframe injection (once) ─────────────────────────────── */
const STYLE_ID = "weekly-income-hero-keyframes";
function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes wih-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    @keyframes wih-fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes wih-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(6px); }
    }
    @keyframes borderPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.0), inset 0 0 0 2px rgba(74,222,128,0.7); }
      50%       { box-shadow: 0 0 16px 4px rgba(74,222,128,0.25), inset 0 0 0 2px rgba(74,222,128,1); }
    }
    @keyframes arrowNudge {
      0%, 100% { transform: translateX(0); }
      50%       { transform: translateX(4px); }
    }
    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Reusable primitives ───────────────────────────────────── */
const pulsingDot = (size = 8, color = T.accent): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: "50%",
  backgroundColor: color,
  display: "inline-block",
  animation: "wih-pulse 2s ease-in-out infinite",
  flexShrink: 0,
});

const cardStyle: React.CSSProperties = {
  background: T.cardBg,
  border: T.cardBorder,
  borderRadius: T.radius,
};

const sectionGap: React.CSSProperties = {
  marginTop: 56,
};

/* ─── Recent Trades hook ───────────────────────────────────── */
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

/* ─── Animated Stat with count-up ──────────────────────────── */
function AnimatedStat({ target, prefix = '', suffix = '', label, decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; label: string; decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) { setVal(target); return; }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, prefersReduced]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '16px 12px',
      textAlign: 'center',
    }}>
      <span style={{
        fontSize: 28,
        fontWeight: 900,
        color: '#4ade80',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: T.fontDisplay,
      }}>
        {prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}
      </span>
      <span style={{
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontFamily: T.fontMono,
      }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
export default function WeeklyIncomeHero() {
  const { openLoginModal } = useLoginModal();
  const [isMobile, setIsMobile] = useState(false);
  const [showTrades, setShowTrades] = useState(false);

  // Recent trades from Gist
  const { trades: recentTrades, loading: tradesLoading, error: tradesError } = useRecentTrades();

  // Fallback hardcoded data (used when Gist env var not set or no data)
  const FALLBACK_TRADES = [
    { ticker: 'QQQ',   date: 'Jun 05, 2026', stockPrice: '$704.29', expiration: 'Jun 14, 2026', dte: 9, strike: '$676 Put', credit: '$286', days: 3, pnl: '+$170', creditRaw: 286, pnlRaw: 170,  win: true },
    { ticker: 'SMH',   date: 'Jun 05, 2026', stockPrice: '$569.69', expiration: 'Jun 14, 2026', dte: 9, strike: '$521 Put', credit: '$523', days: 3, pnl: '+$369', creditRaw: 523, pnlRaw: 369,  win: true },
    { ticker: 'SNOW',  date: 'May 29, 2026', stockPrice: '$255.55', expiration: 'Jun 07, 2026', dte: 9, strike: '$218 Put', credit: '$687', days: 3, pnl: '+$420', creditRaw: 687, pnlRaw: 420,  win: true },
    { ticker: 'SMH',   date: 'May 29, 2026', stockPrice: '$598.93', expiration: 'Jun 07, 2026', dte: 9, strike: '$557 Put', credit: '$368', days: 4, pnl: '+$329', creditRaw: 368, pnlRaw: 329,  win: true },
    { ticker: 'META',  date: 'May 21, 2026', stockPrice: '$606.82', expiration: 'May 30, 2026', dte: 9, strike: '$570 Put', credit: '$384', days: 5, pnl: '+$225', creditRaw: 384, pnlRaw: 225,  win: true },
    { ticker: 'GOOGL', date: 'May 21, 2026', stockPrice: '$387.43', expiration: 'May 30, 2026', dte: 9, strike: '$360 Put', credit: '$257', days: 5, pnl: '+$131', creditRaw: 257, pnlRaw: 131,  win: true },
    { ticker: 'SMH',   date: 'May 21, 2026', stockPrice: '$567.88', expiration: 'May 30, 2026', dte: 9, strike: '$528 Put', credit: '$415', days: 5, pnl: '+$386', creditRaw: 415, pnlRaw: 386,  win: true },
  ];

  const displayTrades = (recentTrades && recentTrades.length > 0)
    ? recentTrades.map(t => ({
        ticker: t.ticker,
        date: new Date(t.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        stockPrice: `$${Number((t as any).stock_price ?? (t as any).entry_price ?? 0).toFixed(2)}`,
        expiration: new Date(new Date(t.entry_date).getTime() + ((t as any).dte ?? 0) * 86400000)
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dte: (t as any).dte ?? 0,
        strike: `$${t.strike} ${t.side === 'put' ? 'Put' : 'Call'}`,
        credit: `$${Math.round(t.credit * 100)}`,
        days: t.days_held,
        pnl: `${t.pnl_per_contract >= 0 ? '+' : ''}$${Math.abs(Math.round(t.pnl_per_contract)).toLocaleString()}`,
        creditRaw: Math.round(t.credit * 100),
        pnlRaw: Math.round(t.pnl_per_contract),
        win: t.outcome === 'WIN',
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
      const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weeks[key]) weeks[key] = { label: `Wk of ${label}`, wins: 0, losses: 0, net: 0 };
      if (t.win) { weeks[key].wins++; weeks[key].net += t.pnlRaw; }
      else { weeks[key].losses++; weeks[key].net -= Math.abs(t.pnlRaw); }
    });
    return Object.values(weeks).slice(-3).reverse();
  })();

  const periodLabel = displayTrades.length > 0
    ? `${displayTrades[displayTrades.length - 1].date} \u2013 ${displayTrades[0].date}`
    : 'Last 3 weeks';


  useEffect(() => {
    injectKeyframes();
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.white }}>
      {/* ─── 1. Navbar ──────────────────────────────────────── */}
      <Navbar />

      {/* ─── Page Container ─────────────────────────────────── */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: isMobile ? "160px 16px 0" : "160px 24px 0",
        }}
      >
        {/* ─── 2. Eyebrow + Headline + Sub ────────────────── */}
        <section
          style={{
            textAlign: "center",
            animation: "wih-fadeUp 0.7s ease-out both",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <span style={pulsingDot(6)} />
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.accent,
              }}
            >
              WEEKLY OPTIONS INCOME DASHBOARD
            </span>
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 40 : 56,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            <span style={{ color: T.white }}>$5K or $500K —</span>
            <br />
            <span style={{ color: T.white }}>the engine finds your setup.</span>
            <br />
            <span style={{ color: T.accent }}>You collect the premium.</span>
          </h1>
        </section>

        {/* ─── 3. Credibility: Animated Stats + Trade Log ──── */}
        <section style={{ ...sectionGap, animation: 'wih-fadeUp 0.7s ease-out 0.1s both' }}>

          {/* 4-stat grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: 12,
            width: '100%',
            maxWidth: 640,
            margin: '0 auto 20px',
          }}>
            {([
              { target: 92.1, suffix: '%',      label: 'Avg Win Rate',          decimals: 1 },
              { target: 385,  prefix: '$',       label: 'Avg Credit / Contract', decimals: 0 },
              { target: 5.5,  suffix: ' days',   label: 'Avg Hold Time',         decimals: 1 },
              { target: 76,   suffix: ' trades', label: 'Backtest Sample',       decimals: 0 },
            ] as const).map((s, i) => (
              <AnimatedStat key={i} target={s.target} prefix={'prefix' in s ? s.prefix : ''} suffix={'suffix' in s ? s.suffix : ''} label={s.label} decimals={s.decimals} />
            ))}
          </div>

          {/* Footnote */}
          <p style={{
            fontSize: 11,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 1.5,
          }}>
            *Backtested across 13 tickers · 76 trades · 18-month period (Jan 2025–Jun 2026). Past results do not guarantee future performance.
          </p>

          {/* Collapsible trade log */}
          <button
            onClick={() => setShowTrades(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              margin: '0 auto 12px',
              background: 'none',
              border: 'none',
              color: '#4ade80',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              fontFamily: T.fontMono,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#86efac'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#4ade80'; }}
          >
            {showTrades ? 'Hide sample trades ▲' : 'See sample trades →'}
          </button>

          <div style={{
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
            maxHeight: showTrades ? 500 : 0,
            opacity: showTrades ? 1 : 0,
          }}>
            <div style={{
              width: '100%',
              maxWidth: 640,
              margin: '0 auto 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {['Ticker', 'Date', 'Strike', 'Credit', 'Days', 'P&L', 'Result'].map((h, i) => (
                        <th key={h} style={{
                          padding: '8px 12px',
                          textAlign: i < 3 ? 'left' : 'right',
                          color: '#9ca3af',
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ticker: 'QQQ',  date: 'Apr 09, 2025', strike: '$419 Put', credit: '$410', days: 9, pnl: '+$410',   win: true  },
                      { ticker: 'TSLA', date: 'May 01, 2025', strike: '$240 Put', credit: '$668', days: 7, pnl: '+$493',   win: true  },
                      { ticker: 'MSTR', date: 'Apr 02, 2025', strike: '$267 Put', credit: '$797', days: 6, pnl: '-$2,631', win: false },
                      { ticker: 'META', date: 'Apr 24, 2025', strike: '$465 Put', credit: '$678', days: 4, pnl: '+$383',   win: true  },
                      { ticker: 'LLY',  date: 'Oct 22, 2025', strike: '$752 Put', credit: '$558', days: 5, pnl: '+$384',   win: true  },
                      { ticker: 'GLD',  date: 'Mar 11, 2026', strike: '$450 Put', credit: '$255', days: 7, pnl: '-$745',   win: false },
                      { ticker: 'BLK',  date: 'Jan 20, 2026', strike: '$1032 Put',credit: '$602', days: 2, pnl: '+$336',   win: true  },
                      { ticker: 'SPY',  date: 'Apr 09, 2025', strike: '$495 Put', credit: '$422', days: 9, pnl: '+$422',   win: true  },
                    ].map((t, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: T.white, whiteSpace: 'nowrap' }}>{t.ticker}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap' }}>{t.date}</td>
                        <td style={{ padding: '8px 12px', color: '#d1d5db', whiteSpace: 'nowrap' }}>{t.strike}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>{t.credit}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#9ca3af' }}>{t.days}d</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: t.win ? '#4ade80' : '#f87171' }}>{t.pnl}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <span style={{
                            background: t.win ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                            color: t.win ? '#4ade80' : '#f87171',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 9999,
                          }}>{t.win ? 'WIN' : 'LOSS'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{
                fontSize: 11,
                color: '#4b5563',
                padding: '8px 12px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                margin: 0,
              }}>
                Real backtest trades · Jan 2025–Jun 2026 · 76 total trades · 92.1% win rate. Educational only — not financial advice.
              </p>
            </div>
          </div>

        </section>

        {/* ─── Backtest Signal Log — 3-part layout ──────────── */}
        {!tradesLoading && (
          <section style={{ ...sectionGap, animation: 'wih-fadeUp 0.7s ease-out 0.15s both' }}>

            {/* PART 1 — Terminal Banner */}
            <div style={{ width: '100%', maxWidth: 640, margin: '0 auto 0' }}>
              <div style={{
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <div>
                  <p style={{
                    fontSize: 10,
                    fontFamily: T.fontMono,
                    color: 'rgba(74,222,128,0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    margin: 0,
                  }}>
                    Backtest Signal Log · If You Had Taken These Trades
                  </p>
                  <p style={{
                    color: T.white,
                    fontWeight: 900,
                    fontSize: 17,
                    marginTop: 2,
                    margin: '2px 0 0',
                    fontFamily: T.fontDisplay,
                  }}>
                    +${totalIncome.toLocaleString()} net income · {totalWins}/{totalTrades} signals won
                  </p>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', fontFamily: T.fontMono }}>
                  {periodLabel} · 1 contract/signal
                </div>
              </div>
            </div>

            {/* PART 2 — Weekly Scorecard Strip */}
            <div style={{
              width: '100%',
              maxWidth: 640,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }}>
              {weeklyStats.map((week, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMobile ? '10px 8px' : '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  borderRight: i < weeklyStats.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 10, color: '#6b7280', fontFamily: T.fontMono, margin: 0 }}>{week.label}</p>
                  <p style={{
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 900,
                    margin: '4px 0 0',
                    color: week.net > 0 ? '#4ade80' : '#f87171',
                    fontFamily: T.fontDisplay,
                  }}>
                    {week.net > 0 ? '+' : ''}${Math.abs(week.net).toLocaleString()}
                  </p>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>
                    {week.wins}W · {week.losses}L
                  </p>
                </div>
              ))}
            </div>

            {/* PART 3 — Full Trade Log Table */}
            <div style={{
              width: '100%',
              maxWidth: 640,
              margin: '0 auto 16px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderTop: 'none',
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {['Ticker', 'Date', 'Stock Price', 'Strike', 'Expiry', 'DTE', 'Credit', 'Days', 'P&L', 'Result'].map((h, i) => (
                        <th key={h} style={{
                          padding: '8px 12px',
                          textAlign: i < 2 || i === 3 || i === 4 ? 'left' : 'right',
                          color: '#9ca3af',
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTrades.map((t, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: T.white, whiteSpace: 'nowrap' }}>{t.ticker}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap' }}>{t.date}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#d1d5db', fontSize: 11, whiteSpace: 'nowrap' }}>{t.stockPrice}</td>
                        <td style={{ padding: '8px 12px', color: '#d1d5db', whiteSpace: 'nowrap' }}>{t.strike}</td>
                        <td style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 11, whiteSpace: 'nowrap' }}>{t.expiration}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#6b7280', fontSize: 11 }}>{t.dte}d</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>{t.credit}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#9ca3af' }}>{t.days}d</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: t.win ? '#4ade80' : '#f87171' }}>{t.pnl}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <span style={{
                            background: t.win ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                            color: t.win ? '#4ade80' : '#f87171',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 9999,
                          }}>{t.win ? 'WIN' : 'LOSS'}</span>
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                      <td colSpan={2} style={{ padding: '8px 12px', color: T.white, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Total · {totalWins}/{totalTrades} wins
                      </td>
                      <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'right', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>
                        ${totalCredits.toLocaleString()} collected
                      </td>
                      <td style={{ padding: '8px 12px' }} />
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#4ade80', fontSize: 14 }}>
                        +${totalIncome.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <span style={{
                          background: 'rgba(74,222,128,0.2)',
                          color: '#4ade80',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 9999,
                        }}>
                          {totalTrades > 0 ? Math.round(totalWins / totalTrades * 100) : 0}% WIN
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{
                fontSize: 11,
                color: '#4b5563',
                padding: '8px 12px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                margin: 0,
              }}>
                Backtest simulation · Stock price, strike & expiration verifiable on Yahoo Finance / CBOE historical chains · 1 contract per signal · Updates weekly. Past results do not guarantee future performance. Not financial advice.
              </p>
            </div>

          </section>
        )}

        {/* ─── Who It's For — redesigned CTA cards ──────── */}
        <section style={{ textAlign: 'center', animation: 'wih-fadeUp 0.7s ease-out 0.15s both' }}>

          {/* Section label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 20, marginTop: 8 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(74,222,128,0.7)',
              fontFamily: T.fontMono,
              margin: 0,
            }}>
              Step 1 of 1
            </p>
            <h3 style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 900,
              color: T.white,
              textAlign: 'center',
              lineHeight: 1.2,
              margin: 0,
              fontFamily: T.fontDisplay,
            }}>
              Choose your account size to get started
            </h3>
            <svg
              width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              style={{ marginTop: 4, animation: 'wih-bounce 1s ease-in-out infinite' }}
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Cards wrapper — entrance animation */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 16,
            width: '100%',
            maxWidth: 580,
            margin: '0 auto',
            animation: 'fadeSlideUp 0.5s cubic-bezier(0.23,1,0.32,1) both',
          }}>

            {/* Standard card */}
            <button
              aria-label="Select Standard Mode — accounts $10,000 and above"
              onClick={() => openLoginModal("/weekly-income")}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderRadius: 12,
                border: '2px solid #4ade80',
                background: 'rgba(34,197,94,0.05)',
                padding: 20,
                cursor: 'pointer',
                textAlign: 'center',
                minHeight: 160,
                width: '100%',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontFamily: 'inherit',
                animation: 'borderPulse 2.5s ease-in-out infinite, cardEntrance 0.5s cubic-bezier(0.23,1,0.32,1) both',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #4ade80'; e.currentTarget.style.outlineOffset = '2px'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
              <div>
                <p style={{ color: '#4ade80', fontSize: 28, fontWeight: 900, margin: 0, fontFamily: T.fontDisplay }}>
                  $10,000+
                </p>
                <p style={{ color: T.white, fontSize: 15, fontWeight: 700, margin: '4px 0 0' }}>
                  Standard Mode
                </p>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
                  Full watchlist · All qualifying setups
                </p>
              </div>
              <span style={{
                display: 'block',
                background: '#4ade80',
                color: '#000',
                fontSize: 14,
                fontWeight: 900,
                padding: isMobile ? '14px 20px' : '10px 20px',
                borderRadius: 8,
                width: '100%',
                transition: 'filter 0.15s ease',
              }}>
                Unlock Dashboard <span style={{ display: 'inline-block', animation: 'arrowNudge 1.2s ease-in-out infinite' }}>→</span>
              </span>
            </button>

            {/* Micro card */}
            <button
              aria-label="Select Micro Mode — accounts under $10,000"
              onClick={() => openLoginModal("/weekly-income")}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderRadius: 12,
                border: '2px solid rgba(74,222,128,0.6)',
                background: 'rgba(34,197,94,0.05)',
                padding: 20,
                cursor: 'pointer',
                textAlign: 'center',
                minHeight: 160,
                width: '100%',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontFamily: 'inherit',
                animation: 'borderPulse 2.5s ease-in-out 0.1s infinite, cardEntrance 0.5s cubic-bezier(0.23,1,0.32,1) 0.1s both',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #4ade80'; e.currentTarget.style.outlineOffset = '2px'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
              <div>
                <p style={{ color: 'rgba(74,222,128,0.8)', fontSize: 28, fontWeight: 900, margin: 0, fontFamily: T.fontDisplay }}>
                  Under $10K
                </p>
                <p style={{ color: T.white, fontSize: 15, fontWeight: 700, margin: '4px 0 0' }}>
                  Micro Mode
                </p>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
                  Sized for smaller accounts · 1 contract at a time
                </p>
              </div>
              <span style={{
                display: 'block',
                background: 'rgba(74,222,128,0.8)',
                color: '#000',
                fontSize: 14,
                fontWeight: 900,
                padding: isMobile ? '14px 20px' : '10px 20px',
                borderRadius: 8,
                width: '100%',
                transition: 'filter 0.15s ease',
              }}>
                Unlock Dashboard <span style={{ display: 'inline-block', animation: 'arrowNudge 1.2s ease-in-out infinite' }}>→</span>
              </span>
            </button>

          </div>



          {/* Standalone Get Access CTA */}
          <Link href="/subscribe">
            <button
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 320,
                margin: '24px auto 0',
                background: T.accent,
                color: T.bg,
                fontWeight: 700,
                fontSize: 15,
                padding: '14px 32px',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Get Access →
            </button>
          </Link>
        </section>



        {/* ─── 4. Blurred Recommendation Card ─────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.2s both" }}>
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {/* Blurred content */}
            <div style={{ filter: "blur(5px)", padding: 20 }}>
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    background: "rgba(0,255,150,0.1)",
                    color: T.accent,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontFamily: T.fontMono,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  QQQ
                </span>
                <span
                  style={{
                    background: "rgba(0,255,150,0.1)",
                    color: T.accent,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontFamily: T.fontMono,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Grade A
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    color: T.muted,
                    fontSize: 12,
                  }}
                >
                  Score: 89/100
                </span>
              </div>

              {/* Data grid 2x2 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {[
                  ["Strike", "$685"],
                  ["Credit", "$3.65"],
                  ["Expiry", "Jul 02"],
                  ["Cushion", "5.2%"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: T.dimmed }}>{label}</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.white,
                        marginTop: 2,
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Score bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "89%",
                    height: "100%",
                    borderRadius: 3,
                    background: T.accent,
                  }}
                />
              </div>
            </div>

            {/* Lock overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>📱🔒</span>
              <p style={{
                color: T.white,
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
                margin: '8px 0 0',
              }}>
                Real-time mobile alerts — members only
              </p>
              <p style={{
                color: '#9ca3af',
                fontSize: 12,
                textAlign: 'center',
                maxWidth: 280,
                margin: '6px 0 0',
                lineHeight: 1.5,
              }}>
                Get notified the moment a qualifying setup is detected. Push alerts direct to your phone.
              </p>
              <button
                onClick={() => openLoginModal("/weekly-income")}
                style={{
                  marginTop: 12,
                  background: '#4ade80',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: 14,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: 280,
                  transition: 'filter 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                Unlock This Setup →
              </button>
            </div>
          </div>
        </section>

        {/* ─── 5. Alert Feed Tease ────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.3s both" }}>
          <div
            style={{
              ...cardStyle,
              maxWidth: 560,
              margin: "0 auto",
              padding: 20,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.white,
                }}
              >
                Recent Alerts
              </span>
              <span style={pulsingDot(6)} />
            </div>

            {/* Rows */}
            {[
              "Alert sent · 2h ago · Grade A · Score 89 · [REDACTED] · $█.██",
              "Alert sent · 4h ago · Grade B · Score 76 · [REDACTED] · $█.██",
              "Alert sent · Yesterday · Grade A · Score 91 · [REDACTED] · $█.██",
              "Alert sent · 2 days ago · Grade A · Score 84 · [REDACTED] · $█.██",
              "Alert sent · 3 days ago · Grade B · Score 78 · [REDACTED] · $█.██",
            ].map((text, i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                <span style={pulsingDot(6)} />
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 12,
                    color: T.muted,
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5b. Trade Management ──────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.35s both" }}>
          {/* A. Eyebrow + Headline + Subtext */}
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              TRADE MANAGEMENT
            </div>
            <h2
              style={{
                fontFamily: T.fontDisplay,
                fontSize: isMobile ? 28 : 36,
                fontWeight: 900,
                color: T.white,
                lineHeight: 1.15,
                margin: "0 0 14px",
              }}
            >
              Know exactly when to exit.
              <br />
              <span style={{ color: T.accent }}>Before it costs you.</span>
            </h2>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 15,
                color: T.muted,
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 560,
              }}
            >
              Finding the setup is only half the job. The engine watches your open
              trades around the clock and sends you a single notification the moment
              it's time to get out — no spreadsheets, no checking prices every hour.
            </p>
          </div>

          {/* B. 3-Step Flow */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              marginTop: 32,
              maxWidth: 600,
              margin: "32px auto 0",
            }}
          >
            {[
              {
                num: "01",
                title: "You get the signal",
                desc: "The engine surfaces a qualifying setup and sends an alert to your phone.",
              },
              {
                num: "02",
                title: "You log the trade",
                desc: "Add it to your personal tracker in the dashboard. Takes 10 seconds.",
              },
              {
                num: "03",
                title: "We watch it for you",
                desc: "The engine monitors the trade continuously and pushes one notification when it's time to exit.",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  ...cardStyle,
                  flex: 1,
                  padding: "20px 20px 20px 18px",
                  borderLeft: `3px solid ${T.accent}`,
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.accent,
                    marginBottom: 6,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.white,
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 13,
                    color: T.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          {/* C. Stat Callout */}
          <div
            style={{
              marginTop: 32,
              maxWidth: 400,
              margin: "32px auto 0",
              borderLeft: `3px solid ${T.amber}`,
              background: "rgba(240,180,41,0.04)",
              padding: "20px 24px",
              borderRadius: "0 10px 10px 0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 32,
                fontWeight: 700,
                color: T.amber,
                lineHeight: 1.1,
              }}
            >
              168 hours
            </div>
            <div
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: T.muted,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              of manual price-checking a week — replaced by one push notification
            </div>
          </div>

          {/* D. Blurred Position Table Tease */}
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              maxWidth: 560,
              margin: "32px auto 0",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.4fr 1fr",
                padding: "12px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {["TRADE", "STATUS", "ACTION"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: T.dimmed,
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Data rows (blurred) */}
            <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
              {[
                {
                  trade: "████ PUT",
                  status: "Monitoring",
                  statusColor: T.accent,
                  statusBg: "rgba(0,255,150,0.08)",
                  statusBorder: "rgba(0,255,150,0.15)",
                  action: "—",
                  highlight: false,
                },
                {
                  trade: "████ PUT",
                  status: "⚠ Exit Signal Sent",
                  statusColor: T.amber,
                  statusBg: "rgba(240,180,41,0.15)",
                  statusBorder: "rgba(240,180,41,0.4)",
                  action: "Mark Closed",
                  highlight: true,
                },
                {
                  trade: "████ CALL",
                  status: "Monitoring",
                  statusColor: T.accent,
                  statusBg: "rgba(0,255,150,0.08)",
                  statusBorder: "rgba(0,255,150,0.15)",
                  action: "—",
                  highlight: false,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.4fr 1fr",
                    padding: "11px 20px",
                    borderBottom:
                      i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    alignItems: "center",
                    background: row.highlight
                      ? "rgba(240,180,41,0.06)"
                      : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {row.trade}
                  </span>
                  <span>
                    <span
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 10,
                        fontWeight: 600,
                        color: row.statusColor,
                        background: row.statusBg,
                        border: `1px solid ${row.statusBorder}`,
                        padding: "3px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {row.status}
                    </span>
                  </span>
                  <span
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {row.action}
                  </span>
                </div>
              ))}
            </div>

            {/* Lock overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>🔒</span>
              <span style={{ fontSize: 13, color: "#ccc", marginTop: 8 }}>
                Members only
              </span>
              <button
                onClick={() => openLoginModal("/weekly-income")}
                style={{
                  marginTop: 16,
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Sign In to Track Your Trades →
              </button>
            </div>
          </div>
        </section>

        {/* ─── 6. Stat Strip 2 ────────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.35s both" }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
            }}
          >
            <StatTile value="1,200+" label="Setups Backtested" color={T.white} />
            <StatTile value="18 Months" label="Validation Period" color={T.white} />
            <StatTile value="1:2.4" label="Avg Risk/Reward" color={T.white} />
          </div>
        </section>

        {/* ─── 7. Callout Block ───────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.4s both" }}>
          <div
            style={{
              borderLeft: "3px solid rgba(0,255,150,0.4)",
              background: "rgba(0,255,150,0.04)",
              padding: "16px 20px",
              borderRadius: "0 8px 8px 0",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: "#aaa",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              A-grade setups showed an average risk/reward of 1:2.4 in
              backtesting.
            </p>
          </div>
        </section>

        {/* ─── 8. Blurred Results Table ───────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.45s both" }}>
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {/* Table content */}
            <div style={{ padding: 0 }}>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 0.6fr 0.6fr 1.4fr",
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {["Ticker", "Grade", "Score", "Outcome"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: T.dimmed,
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Data rows */}
              {[
                { ticker: "████", grade: "A", score: "89", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "A", score: "84", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "B", score: "77", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "A", score: "91", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "B", score: "73", outcome: "— Still open", outcomeColor: T.amber },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 0.6fr 0.6fr 1.4fr",
                    padding: "10px 20px",
                    borderBottom:
                      i < 4
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    fontSize: 13,
                  }}
                >
                  <span style={{ filter: "blur(5px)", color: T.white }}>
                    {row.ticker}
                  </span>
                  <span style={{ color: T.white }}>{row.grade}</span>
                  <span style={{ color: T.white }}>{row.score}</span>
                  <span style={{ color: row.outcomeColor }}>
                    {row.outcome}
                  </span>
                </div>
              ))}
            </div>

            {/* Caption */}
            <p
              style={{
                fontSize: 11,
                color: T.dimmed,
                textAlign: "center",
                padding: "12px 20px 16px",
                margin: 0,
              }}
            >
              4 of 5 last week's qualifying setups reached their target.
              Tickers visible to members only.
            </p>

            {/* Lock overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>🔒</span>
              <span style={{ fontSize: 13, color: "#ccc", marginTop: 8 }}>
                Members only
              </span>
              <button
                onClick={() => openLoginModal("/weekly-income")}
                style={{
                  marginTop: 16,
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Unlock This Setup →
              </button>
            </div>
          </div>
        </section>

        {/* ─── A. Founder Statement ──────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.5s both" }}>
          <div
            style={{
              borderLeft: "2px solid #00ff96",
              paddingLeft: 20,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 15,
                color: "#ccc",
                fontStyle: "italic",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              &ldquo;I built this because I was spending 3 hours every Sunday scanning charts
              to find 2 setups worth trading. The engine now does that in seconds and
              delivers only the setups that meet a strict conviction threshold.&rdquo;
            </p>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 13,
                color: "#00ff96",
                fontStyle: "normal",
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              — Shawn, Primal Edge
            </p>
          </div>
        </section>

        {/* ─── B. Transparency Block ─────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.55s both" }}>
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "28px 32px",
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              HONEST ABOUT THE DOWNSIDE
            </div>
            <h3
              style={{
                fontFamily: T.fontBody,
                fontSize: 18,
                fontWeight: 600,
                color: T.white,
                margin: "0 0 14px",
              }}
            >
              Not every setup reaches its target. Here is what that looks like.
            </h3>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: "#888",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              In backtesting, B-grade setups missed their target 29% of the time.
              A-grade setups missed 19% of the time. When a setup misses, the defined
              risk level established before entry is the maximum loss — there are no
              surprises and no unlimited downside. The engine does not predict market
              direction. It identifies setups with favorable historical probability
              profiles and lets you decide whether to act.
            </p>
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
                marginTop: 20,
              }}
            />
            <p
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: "#555",
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              *Based on backtesting across 1,200+ qualifying setups over 18 months.
              Past results do not guarantee future performance.
            </p>
          </div>
        </section>

        {/* ─── C. What You Get On Day One ────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.6s both" }}>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 11,
              color: T.accent,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            WHAT HAPPENS AFTER YOU JOIN
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            {[
              {
                step: "DAY 1",
                title: "Dashboard Access Activated",
                desc: "Your Weekly Options Income Dashboard goes live immediately. No setup required.",
              },
              {
                step: "DAY 1",
                title: "Alert Delivery Configured",
                desc: "Push alerts are routed to your phone within minutes of joining. You will not miss a signal.",
              },
              {
                step: "DAY 1",
                title: "Full Setup Archive Unlocked",
                desc: "Browse every qualifying setup the engine has surfaced since launch — with scores, grades, and outcomes.",
              },
              {
                step: "NEXT SCAN",
                title: "Your First Qualifying Setup",
                desc: "The engine runs multiple times daily. Your first alert arrives within the next scan cycle after joining.",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: T.accent,
                  }}
                >
                  {card.step}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 15,
                    fontWeight: 600,
                    color: T.white,
                    marginTop: 6,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 13,
                    color: "#888",
                    lineHeight: 1.6,
                    marginTop: 4,
                  }}
                >
                  {card.desc}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: 14,
              color: "#555",
              textAlign: "center",
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Cancel anytime. No contracts, no lock-in.
          </p>
        </section>


        {/* ─── 9. Final CTA ───────────────────────────────── */}
        <section
          style={{
            textAlign: "center",
            padding: "80px 0",
            animation: "wih-fadeUp 0.7s ease-out 0.5s both",
          }}
        >
          <h2
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 28,
              fontWeight: 700,
              color: T.white,
              margin: "0 0 32px",
            }}
          >
            Start collecting income this week.
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link href="/subscribe">
              <button
                style={{
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 32px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Request Access →
              </button>
            </Link>
            <button
              onClick={() => openLoginModal("/weekly-income")}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ccc",
                fontWeight: 600,
                fontSize: 14,
                padding: "14px 28px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Already a member? Sign in →
            </button>
          </div>
        </section>

        {/* ─── 10. Footer Disclaimer ──────────────────────── */}
        <footer
          style={{
            textAlign: "center",
            paddingBottom: 40,
            fontSize: 10,
            color: T.ghost,
          }}
        >
          Based on backtesting. Past results do not guarantee future
          performance.
        </footer>
      </div>
    </div>
  );
}

/* ─── StatTile sub-component ────────────────────────────────── */
function StatTile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        flex: 1,
        padding: "24px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color,
          fontFamily: T.fontDisplay,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}
