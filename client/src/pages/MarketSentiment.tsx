/* ============================================================
   MarketSentiment.tsx — Market Sentiment Engine (Live Dashboard)
   Auth: Protected by Supabase auth + user_access approval
   Data: Fetches live sentiment data from GitHub Gist
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileCTA from "@/components/MobileCTA";

/* ─── Gist Config ─────────────────────────────────────────── */
const GIST_ID = "c89dd974e4e74107b5afb88807c12579";
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;
const GIST_FILENAME = "sentiment_dashboard.json";

const REFRESH_MS = 30 * 1000;             // 30 s auto-refresh

/* ─── Market-Hours Helper ─────────────────────────────────── */
function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  return minutes >= 570 && minutes <= 960; // 9:30–16:00
}

/* ─── Types ───────────────────────────────────────────────── */
interface MarketStateItem {
  label: string;
  value?: number;
  avg_score?: number;
  bull_count?: number;
  avg_chg?: number;
  total?: number;
  color: string;
}

interface SentimentData {
  scan_timestamp: string;
  session: string;
  score: number;
  verdict: string;
  verdict_bg: string;
  verdict_tx: string;
  market_state: {
    idx_trend: MarketStateItem;
    idx_now: MarketStateItem;
    breadth: MarketStateItem & { value: number; total: number };
    flow: MarketStateItem;
    leader: MarketStateItem;
    day_type: MarketStateItem;
    htf_bias: MarketStateItem & { bull_count: number };
    vix: MarketStateItem & { value: number };
    extension: MarketStateItem & { avg_chg: number };
    risk: MarketStateItem;
  };
  hot_sector: { name: string; perf: number };
  cold_sector: { name: string; perf: number };
  indices: Array<{
    symbol: string;
    now: string;
    now_score: number;
    now_color: string;
    chg_pct: number;
    chg_color: string;
    range_pos: number;
    range_label: string;
    range_color: string;
    daily_trail: boolean;
    weekly_trail: boolean;
    price: number;
  }>;
  mega_caps: Array<{
    symbol: string;
    status: string;
    status_color: string;
    chg_pct: number;
    chg_color: string;
    range_pos: number;
    range_label: string;
    range_color: string;
    price: number;
  }>;
  sectors: Array<{ symbol: string; name: string; perf: number }>;
  vix_value: number;
  insights?: string[];
}

/* ─── Score Color ─────────────────────────────────────────── */
function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#00e5a0";
  if (score >= 45) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

/* ─── Circular Gauge ─────────────────────────────────────── */
function ScoreGauge({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease", filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-black leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", color, textShadow: `0 0 20px ${color}40` }}
        >
          {score}<span className="text-lg font-bold ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="bg-[#0c1016] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-green-500/40 animate-pulse" />
              <span className="ml-3 text-[10px] text-white/15 font-mono tracking-wider">MARKET SENTIMENT ENGINE — LOADING…</span>
            </div>
            <div className="p-6 space-y-3">
              <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Market State Cell ───────────────────────────────────── */
function StateCell({ title, label, sub, color }: { title: string; label: string; sub?: string; color: string }) {
  return (
    <div className="bg-[#0a0d12]/60 border border-white/[0.06] rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors">
      <div className="text-[10px] tracking-[0.18em] uppercase mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}>
        {title}
      </div>
      <div
        className="text-sm font-bold leading-tight truncate"
        style={{ fontFamily: "'JetBrains Mono', monospace", color }}
        title={label}
      >
        {label}
      </div>
      {sub && (
        <div className="text-[10px] text-white/20 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── TickerTape ──────────────────────────────────────────── */
function TickerTape({ data }: { data: SentimentData | null }) {
  if (!data) return null;

  const items: { symbol: string; price: number; chg_pct?: number }[] = [];
  for (const idx of data.indices) {
    items.push({ symbol: idx.symbol, price: idx.price, chg_pct: idx.chg_pct });
  }
  for (const mc of data.mega_caps) {
    items.push({ symbol: mc.symbol, price: mc.price, chg_pct: mc.chg_pct });
  }
  items.push({ symbol: "VIX", price: data.vix_value });

  const duped = [...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div
        className="sticky top-20 z-40 overflow-hidden"
        style={{
          background: "#0a0d12",
          borderTop: "1px solid rgba(0,229,160,0.18)",
          borderBottom: "1px solid rgba(0,229,160,0.18)",
        }}
      >
        <div
          className="ticker-track flex items-center whitespace-nowrap py-2"
          style={{ animation: "ticker-scroll 50s linear infinite" }}
        >
          {duped.map((item, i) => {
            const isVix = item.symbol === "VIX";
            const chg = item.chg_pct;
            const isUp = chg !== undefined && chg > 0;
            const isDown = chg !== undefined && chg < 0;
            const chgColor = isUp ? "#22c55e" : isDown ? "#ef4444" : "#9ca3af";

            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-4"
                style={{ fontFamily: "monospace, 'Courier New'", fontSize: "13px", letterSpacing: "0.02em" }}
              >
                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{item.symbol}</span>
                <span style={{ color: "#94a3b8" }}>
                  {"$"}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {!isVix && chg !== undefined && (
                  <span style={{ color: chgColor, fontWeight: 600 }}>
                    {isUp ? "+" : ""}{chg.toFixed(2)}%
                  </span>
                )}
                <span style={{ color: "rgba(0,229,160,0.35)", margin: "0 4px", fontWeight: 300 }}>
                  {"|"}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─── InsightCards ─────────────────────────────────────────── */
function InsightCards({ insights }: { insights?: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!insights || insights.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % insights.length;
        if (scrollRef.current) {
          const card = scrollRef.current.children[0] as HTMLElement | undefined;
          if (card) {
            const cardWidth = card.getBoundingClientRect().width;
            const gap = 12; // gap-3 = 12px
            scrollRef.current.scrollTo({ left: next * (cardWidth + gap), behavior: "smooth" });
          }
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [insights]);

  // Sync activeIdx on manual scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !insights || insights.length <= 1) return;

    const handleScroll = () => {
      const card = el.children[0] as HTMLElement | undefined;
      if (!card) return;
      const cardWidth = card.getBoundingClientRect().width;
      const gap = 12;
      const idx = Math.round(el.scrollLeft / (cardWidth + gap));
      setActiveIdx(Math.min(idx, insights.length - 1));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [insights]);

  if (!insights || insights.length === 0) return null;

  return (
    <div className="mt-4">
      <div
        className="text-[9px] tracking-widest uppercase mb-2 font-bold"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}
      >
        TODAY'S MARKET INSIGHTS
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth", scrollbarWidth: "none" }}
      >
        {insights.map((text, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-lg px-4 py-3"
            style={{
              width: "280px",
              minWidth: "280px",
              background: "#111118",
              borderLeft: "3px solid #00e5a0",
              scrollSnapAlign: "start",
            }}
          >
            <p className="text-sm text-white leading-relaxed" style={{ fontSize: "14px" }}>{text}</p>
          </div>
        ))}
      </div>
      {/* Dot indicators */}
      {insights.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {insights.map((_, i) => (
            <button
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? "8px" : "6px",
                height: i === activeIdx ? "8px" : "6px",
                backgroundColor: i === activeIdx ? "#00e5a0" : "rgba(255,255,255,0.2)",
              }}
              onClick={() => {
                setActiveIdx(i);
                if (scrollRef.current) {
                  const card = scrollRef.current.children[0] as HTMLElement | undefined;
                  if (card) {
                    const cardWidth = card.getBoundingClientRect().width;
                    const gap = 12;
                    scrollRef.current.scrollTo({ left: i * (cardWidth + gap), behavior: "smooth" });
                  }
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SectorHeatStrip ─────────────────────────────────────── */
function SectorHeatStrip({ sectors }: { sectors: Array<{ symbol: string; name: string; perf: number }> }) {
  if (!sectors || sectors.length === 0) return null;

  const SECTOR_NAMES: Record<string, string> = {
    XLK: "Technology", XLF: "Financials", XLE: "Energy",
    XLRE: "Real Estate", XLV: "Healthcare", XLI: "Industrials", XLU: "Utilities",
  };

  const maxPerf = Math.max(...sectors.map((s) => s.perf));
  const minPerf = Math.min(...sectors.map((s) => s.perf));

  function pillBg(perf: number): string {
    const abs = Math.abs(perf);
    const isFlat = abs <= 0.1;
    if (isFlat) return "rgba(107,114,128,0.15)";
    if (perf > 0) {
      if (abs > 2) return "rgba(34,197,94,0.5)";
      if (abs >= 1) return "rgba(34,197,94,0.3)";
      return "rgba(34,197,94,0.15)";
    }
    // negative
    if (abs > 2) return "rgba(239,68,68,0.5)";
    if (abs >= 1) return "rgba(239,68,68,0.3)";
    return "rgba(239,68,68,0.15)";
  }

  function pillStyle(perf: number): React.CSSProperties {
    const base: React.CSSProperties = {
      backgroundColor: pillBg(perf),
      borderRadius: "8px",
      padding: "8px 12px",
      minWidth: "80px",
      flexShrink: 0,
      border: "1px solid transparent",
    };
    if (perf === maxPerf) {
      base.boxShadow = "0 0 8px #00e5a040";
      base.borderColor = "#00e5a0";
    } else if (perf === minPerf) {
      base.boxShadow = "0 0 8px #ef444440";
      base.borderColor = "#ef4444";
    }
    return base;
  }

  return (
    <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl p-4 mb-4">
      <div
        className="text-[9px] tracking-widest uppercase mb-3 font-bold"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}
      >
        SECTOR FLOW TODAY
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {sectors.map((sec) => (
          <div key={sec.symbol} style={pillStyle(sec.perf)} className="text-center">
            <div className="text-white/70 truncate" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
              {SECTOR_NAMES[sec.symbol] || sec.name}
            </div>
            <div
              className="font-bold text-white mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
            >
              {sec.perf >= 0 ? "+" : ""}{sec.perf.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard Body (Protected Content) ──────────────────── */
const SECTOR_NAMES: Record<string, string> = {
  XLK: "Technology", XLF: "Financials", XLE: "Energy",
  XLRE: "Real Estate", XLV: "Healthcare", XLI: "Industrials", XLU: "Utilities",
};

function DashboardBody({ data }: { data: SentimentData | null }) {
  if (!data) return null;

  const ms = data.market_state;

  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-16">
      <div className="container max-w-5xl mx-auto">

        {/* ═══ VERDICT BANNER ═══ */}
        <div
          className="rounded-xl px-4 sm:px-6 py-4 mb-6 text-center border"
          style={{
            backgroundColor: data.verdict_bg,
            borderColor: `${data.verdict_tx}30`,
            boxShadow: `0 0 40px ${data.verdict_bg}40, inset 0 1px 0 ${data.verdict_tx}15`,
          }}
        >
          <div
            className="text-xl sm:text-2xl lg:text-3xl font-black tracking-wide"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: data.verdict_tx }}
          >
            {data.verdict}
          </div>
        </div>

        {/* ═══ SCORE + MARKET STATE ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-6">

          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center bg-[#0c1016] border border-white/[0.06] rounded-xl px-4 sm:px-8 py-4 sm:py-6">
            <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}>
              SIGNAL STRENGTH
            </div>
            <ScoreGauge score={data.score} />
          </div>

          {/* Market State Grid — 5×2 */}
          <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl p-4">
            <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}>
              MARKET DETAILS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <StateCell title="OVERALL TREND" label={ms.idx_trend.label} color={ms.idx_trend.color} />
              <StateCell title="BREADTH" label={ms.breadth.value !== undefined && ms.breadth.total !== undefined ? (ms.breadth.value / ms.breadth.total >= 0.7 ? "Expanding" : ms.breadth.value / ms.breadth.total >= 0.4 ? "Moderate" : "Narrow") : ms.breadth.label || "--"} color={ms.breadth.color} />
              <StateCell title="INDEX DIRECTION" label={ms.idx_now.label} sub={ms.idx_now.avg_score !== undefined ? `Avg: ${ms.idx_now.avg_score}` : undefined} color={ms.idx_now.color} />
              <StateCell title="FLOW" label={ms.flow.label} color={ms.flow.color} />
              <StateCell title="STRENGTH" label={ms.leader.label} color={ms.leader.color} />
              <StateCell title="DAY TYPE" label={ms.day_type.label} color={ms.day_type.color} />
              <StateCell title="BACKGROUND TREND" label={ms.htf_bias.label} sub={ms.htf_bias.bull_count !== undefined ? (ms.htf_bias.bull_count >= 3 ? "Strong" : ms.htf_bias.bull_count >= 2 ? "Mixed" : "Weak") : undefined} color={ms.htf_bias.color} />
              <StateCell title="VIX" label={ms.vix.label} sub={ms.vix.value !== undefined ? `${ms.vix.value.toFixed(1)}` : undefined} color={ms.vix.color} />
              <StateCell title="EXTENSION" label={ms.extension.label} sub={ms.extension.avg_chg !== undefined ? `Avg: ${ms.extension.avg_chg > 0 ? "+" : ""}${ms.extension.avg_chg.toFixed(2)}%` : undefined} color={ms.extension.color} />
              <StateCell title="RISK" label={ms.risk.label} color={ms.risk.color} />
            </div>
          </div>
        </div>

        {/* ═══ HOT / COLD SECTOR BAR ═══ */}
        <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl p-4 mb-6">
          <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}>
            SECTOR HEAT
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Hot */}
            <div className="flex-1 rounded-lg px-4 py-3 border" style={{ backgroundColor: "#22c55e10", borderColor: "#22c55e25" }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-white/25 tracking-widest uppercase block mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    🔥 HOT
                  </span>
                  <span className="text-sm font-bold text-[#22c55e]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {data.hot_sector.name}
                  </span>
                </div>
                <span className="text-lg font-black text-[#22c55e]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  +{data.hot_sector.perf.toFixed(2)}%
                </span>
              </div>
            </div>
            {/* Cold */}
            <div className="flex-1 rounded-lg px-4 py-3 border" style={{ backgroundColor: "#ef444410", borderColor: "#ef444425" }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-white/25 tracking-widest uppercase block mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    🧊 COLD
                  </span>
                  <span className="text-sm font-bold text-[#ef4444]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {data.cold_sector.name}
                  </span>
                </div>
                <span className="text-lg font-black text-[#ef4444]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.cold_sector.perf.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTOR HEAT STRIP (between hot/cold and index tracker) ═══ */}
        <SectorHeatStrip sectors={data.sectors} />

        {/* ═══ SYMBOL GRID — INDICES ═══ */}
        <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[10px] text-[#00e5a0] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              INDEX TRACKER
            </span>
            <div className="flex items-center gap-3 text-[9px] text-white/15" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-white/10" /> D-Trail</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-white/10" /> W-Trail</span>
            </div>
          </div>

          {/* Header */}
          <div
            className="hidden sm:grid gap-3 px-4 py-2.5 text-[9px] text-white/25 tracking-widest uppercase border-b border-white/[0.04]"
            style={{ fontFamily: "'JetBrains Mono', monospace", gridTemplateColumns: "1fr 1.2fr 0.8fr 1fr 0.6fr 0.6fr 0.8fr" }}
          >
            <span>Symbol</span>
            <span>Condition</span>
            <span className="text-right">Price</span>
            <span className="text-right">% Chg</span>
            <span className="text-center">D</span>
            <span className="text-center">W</span>
            <span className="text-right">Range</span>
          </div>

          {data.indices.map((idx, i) => (
            <div key={idx.symbol}>
              {/* Mobile card */}
              <div
                className="sm:hidden px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90">{idx.symbol}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: idx.now_color, background: `${idx.now_color}15` }}>{idx.now}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: idx.chg_color }}>
                    {idx.chg_pct >= 0 ? "+" : ""}{idx.chg_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>${idx.price.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-sm ${idx.daily_trail ? "bg-[#22c55e]" : "bg-white/8"}`} title="D-Trail" />
                    <div className={`w-2.5 h-2.5 rounded-sm ${idx.weekly_trail ? "bg-[#3b82f6]" : "bg-white/8"}`} title="W-Trail" />
                    <span className="text-[10px] font-bold" style={{ color: idx.range_color }}>{idx.range_label}</span>
                  </div>
                </div>
              </div>
              {/* Desktop row */}
              <div
                className="hidden sm:grid gap-3 px-4 py-3 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  gridTemplateColumns: "1fr 1.2fr 0.8fr 1fr 0.6fr 0.6fr 0.8fr",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <span className="text-sm font-bold text-white/90">{idx.symbol}</span>
                <span className="text-xs font-bold truncate" style={{ color: idx.now_color }}>{idx.now}</span>
                <span className="text-xs text-white/50 text-right">${idx.price.toFixed(2)}</span>
                <span className="text-xs font-bold text-right" style={{ color: idx.chg_color }}>
                  {idx.chg_pct >= 0 ? "+" : ""}{idx.chg_pct.toFixed(2)}%
                </span>
                <div className="flex justify-center">
                  <div className={`w-3 h-3 rounded-sm ${idx.daily_trail ? "bg-[#22c55e]" : "bg-white/8"}`}
                    style={idx.daily_trail ? { boxShadow: "0 0 6px #22c55e50" } : {}}
                    title={idx.daily_trail ? "Daily Trail Active" : "No Daily Trail"}
                  />
                </div>
                <div className="flex justify-center">
                  <div className={`w-3 h-3 rounded-sm ${idx.weekly_trail ? "bg-[#3b82f6]" : "bg-white/8"}`}
                    style={idx.weekly_trail ? { boxShadow: "0 0 6px #3b82f650" } : {}}
                    title={idx.weekly_trail ? "Weekly Trail Active" : "No Weekly Trail"}
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold" style={{ color: idx.range_color }}>{idx.range_label}</span>
                  <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(2, Math.min(100, idx.range_pos))}%`, backgroundColor: idx.range_color }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SYMBOL GRID — MEGA CAPS ═══ */}
        <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[10px] text-[#00e5a0] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              MEGA CAP MONITOR
            </span>
          </div>

          {/* Header */}
          <div
            className="hidden sm:grid gap-3 px-4 py-2.5 text-[9px] text-white/25 tracking-widest uppercase border-b border-white/[0.04]"
            style={{ fontFamily: "'JetBrains Mono', monospace", gridTemplateColumns: "1fr 1.2fr 0.8fr 1fr 1fr" }}
          >
            <span>Symbol</span>
            <span>Status</span>
            <span className="text-right">Price</span>
            <span className="text-right">% Chg</span>
            <span className="text-right">Range</span>
          </div>

          {data.mega_caps.map((mc, i) => (
            <div key={mc.symbol}>
              {/* Mobile card */}
              <div
                className="sm:hidden px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90">{mc.symbol}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: mc.status_color, background: `${mc.status_color}15` }}>{mc.status}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: mc.chg_color }}>
                    {mc.chg_pct >= 0 ? "+" : ""}{mc.chg_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>${mc.price.toFixed(2)}</span>
                  <span className="text-[10px] font-bold" style={{ color: mc.range_color }}>{mc.range_label}</span>
                </div>
              </div>
              {/* Desktop row */}
              <div
                className="hidden sm:grid gap-3 px-4 py-3 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  gridTemplateColumns: "1fr 1.2fr 0.8fr 1fr 1fr",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <span className="text-sm font-bold text-white/90">{mc.symbol}</span>
                <span className="text-xs font-bold truncate" style={{ color: mc.status_color }}>{mc.status}</span>
                <span className="text-xs text-white/50 text-right">${mc.price.toFixed(2)}</span>
                <span className="text-xs font-bold text-right" style={{ color: mc.chg_color }}>
                  {mc.chg_pct >= 0 ? "+" : ""}{mc.chg_pct.toFixed(2)}%
                </span>
                <div className="text-right">
                  <span className="text-[10px] font-bold" style={{ color: mc.range_color }}>{mc.range_label}</span>
                  <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(2, Math.min(100, mc.range_pos))}%`, backgroundColor: mc.range_color }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SECTORS STRIP ═══ */}
        <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl p-4 mb-6">
          <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}>
            SECTOR PERFORMANCE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {data.sectors.map((sec) => {
              const isPos = sec.perf >= 0;
              const perfColor = isPos ? "#22c55e" : "#ef4444";
              const barWidth = Math.min(100, Math.abs(sec.perf) * 20);

              return (
                <div
                  key={sec.symbol}
                  className="bg-[#0a0d12]/60 border border-white/[0.06] rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-white/90" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {SECTOR_NAMES[sec.symbol] || sec.name}
                    </span>
                    <span className="text-[10px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: perfColor }}>
                      {isPos ? "+" : ""}{sec.perf.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, barWidth)}%`, backgroundColor: perfColor }}
                    />
                  </div>
                  <div className="text-[9px] text-white/40 mt-1 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {sec.symbol}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ VIX QUICK STAT ═══ */}
        {data.vix_value !== undefined && (
          <div className="bg-[#0c1016] border border-white/[0.06] rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.18em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}>VIX</span>
              <span
                className="text-xl font-black"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: data.vix_value < 16 ? "#22c55e" : data.vix_value < 22 ? "#f59e0b" : data.vix_value < 30 ? "#f97316" : "#ef4444",
                }}
              >
                {data.vix_value.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-white/20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {data.vix_value < 16 ? "LOW VOL" : data.vix_value < 22 ? "NORMAL" : data.vix_value < 30 ? "ELEVATED" : "HIGH FEAR"}
            </span>
          </div>
        )}



        {/* ═══ RESEARCH DISCLAIMER ═══ */}
        <div className="max-w-4xl mx-auto bg-[#0c1016] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex items-start gap-3 mb-8">
          <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
            <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <p className="text-white/35 text-xs leading-relaxed">
            <span className="text-white/55 font-semibold">Research Disclosure:</span> Market Sentiment Engine is an educational and analytical intelligence tool. Sentiment readings, scores, directional labels, and all visual readouts are derived from proprietary analysis of real-time market data. They are provided for informational purposes only and do not constitute financial advice or a recommendation to buy, sell, or hold any security. Past performance of any model or analytical system does not guarantee future results.
          </p>
        </div>

      </div>
    </section>
  );
}

/* ─── Main Export — Page Level Data Fetching ────────────────── */
export default function MarketSentiment() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(GIST_API, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const gist = await resp.json();
      const content = gist.files?.[GIST_FILENAME]?.content;
      if (!content) throw new Error(`${GIST_FILENAME} not found in Gist`);
      const parsed: SentimentData = JSON.parse(content);
      setData(parsed);
      setError(null);
      setLastFetch(new Date());
    } catch (e: any) {
      console.error("Sentiment fetch failed:", e);
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <LoadingSkeleton />;

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0a0d12] text-white">
        <Navbar />
        <section className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <div className="bg-[#0c1016] border border-red-500/20 rounded-2xl p-12">
              <p className="text-red-400/80 text-lg font-mono mb-2">Connection Error</p>
              <p className="text-white/30 text-sm mb-6">{error}</p>
              <button onClick={fetchData} className="text-sm text-[#00e5a0] font-mono hover:underline">
                Retry →
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ─── Session badge color ─── */
  const sessionBadge = () => {
    const s = data?.session.toUpperCase() ?? "";
    if (s.includes("LIVE")) return { color: "#28c840", pulse: true };
    if (s.includes("PRE")) return { color: "#f59e0b", pulse: true };
    if (s.includes("POST")) return { color: "#6b7280", pulse: false };
    return { color: "#6b7280", pulse: false };
  };
  const badge = sessionBadge();

  /* ─── Timestamp display ─── */
  const scanTime = data?.scan_timestamp
    ? new Date(data.scan_timestamp).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
      })
    : "—";

  const lastUpdatedStr = lastFetch
    ? lastFetch.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white overflow-x-hidden pb-14 lg:pb-0">
      <Navbar />
      <TickerTape data={data} />

      {/* Public hero header */}
      <section className="pt-[116px] pb-4 px-4 sm:px-6 lg:px-8"> {/* 80px navbar + 36px ticker */}
        <div className="container max-w-5xl mx-auto">

          {/* ═══ HEADER ═══ */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="text-center sm:text-left">
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight sm:leading-none"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: "linear-gradient(135deg, #00e5a0, #00e5a0)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  MARKET SENTIMENT ENGINE
                </h1>
                <p className="text-white/20 text-[0.55rem] sm:text-[0.6rem] lg:text-[0.65rem] font-mono tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.35em] uppercase mt-1.5">
                  MARKET SENTIMENT ENGINE
                </p>
              </div>

              {/* Session badge */}
              <div
                className="flex items-center gap-2.5 px-4 py-2 rounded-full"
                style={{
                  background: `${badge.color}08`,
                  border: `1px solid ${badge.color}18`,
                  boxShadow: `0 0 20px ${badge.color}08`,
                }}
              >
                <span className="relative flex h-2 w-2">
                  {badge.pulse && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: badge.color }} />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: badge.color }} />
                </span>
                <span
                  className="text-[0.6rem] font-bold tracking-wider"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: badge.color }}
                >
                  {data?.session}
                </span>
              </div>
            </div>

            {/* Scan timestamp / last updated */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-4 text-[0.65rem] sm:text-[10px] text-white/20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>SCAN: {scanTime}</span>
              {lastUpdatedStr && <span>FETCHED: {lastUpdatedStr}</span>}
              {error && <span className="text-red-400/60">⚠ {error}</span>}
            </div>
          </div>

          <InsightCards insights={data?.insights} />

        </div>
      </section>

      <ProtectedRoute product="sentiment">
        <DashboardBody data={data} />
      </ProtectedRoute>
      <MobileCTA />
    </div>
  );
}
