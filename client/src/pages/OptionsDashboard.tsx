/* ============================================================
   OptionsDashboard.tsx — 0/1DTE Options Prep Dashboard
   Auth: Protected by Supabase auth + user_access approval
   Purpose: Manual trade-prep reference, educational only
   ============================================================ */

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ─── Market Hours Helper ──────────────────────────────────── */
function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  return minutes >= 570 && minutes <= 960;
}

function getMarketPhase(): { label: string; color: string; icon: string } {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const minutes = et.getHours() * 60 + et.getMinutes();

  if (day === 0 || day === 6) return { label: "WEEKEND", color: "#6b7280", icon: "🌙" };
  if (minutes < 240) return { label: "OVERNIGHT", color: "#6b7280", icon: "🌙" };
  if (minutes < 570) return { label: "PRE-MARKET", color: "#f59e0b", icon: "🌅" };
  if (minutes < 600) return { label: "OPENING RANGE", color: "#22c55e", icon: "🔔" };
  if (minutes < 870) return { label: "CORE SESSION", color: "#22c55e", icon: "📊" };
  if (minutes < 960) return { label: "POWER HOUR", color: "#f97316", icon: "⚡" };
  return { label: "AFTER HOURS", color: "#6b7280", icon: "🌆" };
}

function getETTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/* ─── TradingView Embed ────────────────────────────────────── */
function TVChart({
  symbol,
  height = "400",
  id,
}: {
  symbol: string;
  height?: string;
  id: string;
}) {
  useEffect(() => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "5",
      timezone: "America/New_York",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(10, 14, 20, 1)",
      gridColor: "rgba(0, 229, 160, 0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
      studies: [
        "MASimple@tv-basicstudies",
        "VWAP@tv-basicstudies",
      ],
    });
    container.appendChild(script);
  }, [symbol, id]);

  return (
    <div
      id={id}
      className="tradingview-widget-container"
      style={{ height, width: "100%" }}
    />
  );
}

/* ─── Mini Chart Widget ────────────────────────────────────── */
function TVMiniChart({ symbol, id }: { symbol: string; id: string }) {
  useEffect(() => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });
    container.appendChild(script);
  }, [symbol, id]);

  return (
    <div
      id={id}
      className="tradingview-widget-container"
      style={{ height: "160px", width: "100%" }}
    />
  );
}

/* ─── Checklist Item ───────────────────────────────────────── */
function CheckItem({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all group"
      style={{
        background: checked ? "rgba(0,229,160,0.06)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${checked ? "rgba(0,229,160,0.15)" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      <div
        className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
        style={{
          borderColor: checked ? "#00e5a0" : "rgba(255,255,255,0.15)",
          background: checked ? "rgba(0,229,160,0.2)" : "transparent",
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-medium transition-colors"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: checked ? "#00e5a0" : "rgba(255,255,255,0.5)",
            textDecoration: checked ? "line-through" : "none",
          }}
        >
          {label}
        </span>
        {sub && (
          <span className="block text-[10px] text-white/20 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {sub}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Verdict Badge ────────────────────────────────────────── */
function VerdictBadge({ verdict, description }: { verdict: string; description: string }) {
  const config: Record<string, { color: string; bg: string; border: string; glow: string }> = {
    "Bullish Bias": { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", glow: "0 0 12px rgba(34,197,94,0.15)" },
    "Bearish Bias": { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", glow: "0 0 12px rgba(239,68,68,0.15)" },
    "Neutral / No Trade": { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", glow: "none" },
    "Trend Confirmed": { color: "#00e5a0", bg: "rgba(0,229,160,0.08)", border: "rgba(0,229,160,0.2)", glow: "0 0 12px rgba(0,229,160,0.15)" },
    "Chop Risk": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", glow: "0 0 12px rgba(245,158,11,0.15)" },
    "Breakout Watch": { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", glow: "0 0 12px rgba(59,130,246,0.15)" },
    "Rejection Watch": { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", glow: "0 0 12px rgba(249,115,22,0.15)" },
    "Wait For Retest": { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", glow: "0 0 12px rgba(167,139,250,0.15)" },
    "Premium Risk Elevated": { color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)", glow: "0 0 12px rgba(239,68,68,0.1)" },
  };

  const c = config[verdict] || config["Neutral / No Trade"];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
      style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: c.glow }}
    >
      <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}60` }} />
      <div>
        <span
          className="text-sm font-bold tracking-wide"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: c.color }}
        >
          {verdict}
        </span>
        <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

/* ─── Section Header ───────────────────────────────────────── */
function SectionHead({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-lg">{icon}</span>
      <div>
        <h3
          className="text-[11px] text-[#00e5a0] tracking-[0.2em] uppercase font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {title}
        </h3>
        {subtitle && (
          <span className="text-[9px] text-white/20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Rules Row ────────────────────────────────────────────── */
function RuleRow({ bias, icon, color, conditions }: { bias: string; icon: string; color: string; conditions: string[] }) {
  return (
    <div
      className="rounded-xl px-4 py-3.5 transition-all"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}15`,
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">{icon}</span>
        <span
          className="text-xs font-bold tracking-wider uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace", color }}
        >
          {bias}
        </span>
      </div>
      <ul className="space-y-1.5">
        {conditions.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: `${color}60` }} />
            <span className="text-[11px] text-white/40 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {c}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function OptionsDashboardContent() {
  const [clock, setClock] = useState(getETTime());
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(getETTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const phase = getMarketPhase();
  const checkCount = Object.values(checklist).filter(Boolean).length;
  const totalChecks = 9;

  const toggleCheck = (key: string) =>
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const preMarketItems = useMemo(() => [
    { key: "news", label: "Major news / events today?", sub: "FOMC, earnings, CPI, jobs data" },
    { key: "futures", label: "Futures bias direction", sub: "ES, NQ — green or red pre-market" },
    { key: "gap", label: "Gap direction assessed", sub: "Gap up, gap down, or flat open" },
    { key: "pm_levels", label: "Pre-market high / low marked", sub: "Key levels from overnight session" },
    { key: "pd_levels", label: "Prior day H / L / close noted", sub: "Yesterday's key reaction levels" },
    { key: "vix", label: "VIX direction checked", sub: "Rising = caution, falling = confidence" },
    { key: "em", label: "Expected move zone calculated", sub: "ATM straddle price = expected range" },
    { key: "or_plan", label: "Opening range plan set", sub: "First 15-30 min — observe, don't chase" },
    { key: "liquidity", label: "Options liquidity / spread check", sub: "Tight bid-ask, sufficient OI" },
  ], []);

  return (
    <div className="min-h-screen cockpit-bg text-white flex flex-col">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 relative z-10">
        <div className="container max-w-7xl mx-auto">

          {/* ─── Header ─── */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
              <div className="text-center sm:text-left">
                <h1
                  className="text-3xl sm:text-4xl font-black tracking-tight gradient-text leading-none"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  OPTIONS PREP
                </h1>
                <p className="text-white/20 text-[10px] font-mono tracking-[0.35em] uppercase mt-1.5">
                  0DTE / 1DTE · TRADE PREPARATION · EDUCATIONAL ONLY
                </p>
              </div>

              {/* Phase + Clock */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: `${phase.color}08`,
                    border: `1px solid ${phase.color}18`,
                    boxShadow: `0 0 20px ${phase.color}08`,
                  }}
                >
                  <span className="text-sm">{phase.icon}</span>
                  <span
                    className="text-[10px] font-bold tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: phase.color }}
                  >
                    {phase.label}
                  </span>
                </div>
                <div className="cmd-stat px-3 py-1.5">
                  <span
                    className="text-xs text-white/50 font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {clock} ET
                  </span>
                </div>
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="cmd-stat text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Primary</div>
                <div className="text-lg font-bold text-[#00e5a0] font-mono leading-none">SPY / SPX</div>
              </div>
              <div className="cmd-stat text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Confirm</div>
                <div className="text-lg font-bold text-[#3b82f6] font-mono leading-none">QQQ / NDX</div>
              </div>
              <div className="cmd-stat text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Risk</div>
                <div className="text-lg font-bold text-[#f59e0b] font-mono leading-none">VIX</div>
              </div>
              <div className={`cmd-stat text-center ${checkCount === totalChecks ? "cmd-stat-active" : ""}`}>
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Prep</div>
                <div
                  className="text-lg font-bold font-mono leading-none"
                  style={{ color: checkCount === totalChecks ? "#00e5a0" : "rgba(255,255,255,0.3)" }}
                >
                  {checkCount}/{totalChecks}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ MAIN GRID ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

            {/* ─── LEFT: Charts (2 cols on desktop) ─── */}
            <div className="lg:col-span-2 space-y-4">

              {/* SPY Execution Chart */}
              <div className="animated-border">
                <div className="glass-card-accent rounded-2xl overflow-hidden">
                  {!isMarketOpen() || true ? null : <div className="scan-sweep" />}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      </div>
                      <span
                        className="text-xs text-[#00e5a0] tracking-[0.2em] uppercase font-bold"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        SPY — Execution View
                      </span>
                    </div>
                    <span className="text-[9px] text-white/20 font-mono">5 min · VWAP · EMA · ALMA</span>
                  </div>
                  <div style={{ height: "420px" }}>
                    <TVChart symbol="AMEX:SPY" height="420px" id="tv-spy-main" />
                  </div>
                </div>
              </div>

              {/* QQQ Confirmation Chart */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#3b82f6] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      QQQ — Confirmation
                    </span>
                  </div>
                  <span className="text-[9px] text-white/20 font-mono">Must confirm SPY direction</span>
                </div>
                <div style={{ height: "320px" }}>
                  <TVChart symbol="NASDAQ:QQQ" height="320px" id="tv-qqq-confirm" />
                </div>
              </div>

              {/* VIX Risk Gauge */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#f59e0b] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      VIX — Risk Gauge
                    </span>
                  </div>
                  <span className="text-[9px] text-white/20 font-mono">Rising VIX = elevated premium risk</span>
                </div>
                <div style={{ height: "260px" }}>
                  <TVChart symbol="TVC:VIX" height="260px" id="tv-vix-risk" />
                </div>
              </div>

              {/* ─── Rules Reference ─── */}
              <div className="glass-card rounded-2xl overflow-hidden p-5">
                <SectionHead icon="📋" title="Decision Framework" subtitle="When to consider calls, puts, or no trade" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <RuleRow
                    bias="Calls Favored"
                    icon="📈"
                    color="#22c55e"
                    conditions={[
                      "Price holds above VWAP",
                      "9 EMA above 21 ALMA",
                      "SPY + QQQ confirm strength",
                      "Breadth improving",
                      "VIX stable or falling",
                      "Key level breaks and retests",
                    ]}
                  />
                  <RuleRow
                    bias="Puts Favored"
                    icon="📉"
                    color="#ef4444"
                    conditions={[
                      "Price below VWAP",
                      "9 EMA below 21 ALMA",
                      "SPY + QQQ confirm weakness",
                      "Breadth deteriorating",
                      "VIX rising or risk-off",
                      "Key level loses and rejects",
                    ]}
                  />
                  <RuleRow
                    bias="No Trade"
                    icon="🚫"
                    color="#6b7280"
                    conditions={[
                      "Signals conflict",
                      "Price chops around VWAP",
                      "VIX spikes unpredictably",
                      "Breadth diverges from price",
                      "No clean retest observed",
                      "Opening range not established",
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* ─── RIGHT: Prep Panels ─── */}
            <div className="space-y-4">

              {/* Pre-Market Checklist */}
              <div className="glass-card-accent rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <SectionHead icon="✅" title="Pre-Market Checklist" />
                  {checkCount === totalChecks && (
                    <span
                      className="text-[9px] font-bold tracking-wider px-2 py-1 rounded-full"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#00e5a0",
                        background: "rgba(0,229,160,0.1)",
                        border: "1px solid rgba(0,229,160,0.2)",
                      }}
                    >
                      READY
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  {preMarketItems.map((item) => (
                    <CheckItem
                      key={item.key}
                      label={item.label}
                      sub={item.sub}
                      checked={!!checklist[item.key]}
                      onChange={() => toggleCheck(item.key)}
                    />
                  ))}
                </div>
                {/* Progress bar */}
                <div className="px-4 pb-3">
                  <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(checkCount / totalChecks) * 100}%`,
                        background: checkCount === totalChecks
                          ? "linear-gradient(90deg, #00e5a0, #3b82f6)"
                          : "linear-gradient(90deg, #f59e0b, #f97316)",
                        boxShadow: checkCount === totalChecks
                          ? "0 0 12px rgba(0,229,160,0.4)"
                          : "0 0 8px rgba(245,158,11,0.3)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Key Levels Reference */}
              <div className="glass-card rounded-2xl overflow-hidden p-4">
                <SectionHead icon="📐" title="Key Levels" subtitle="Mark these on your chart before trading" />
                <div className="space-y-2">
                  {[
                    { label: "VWAP", desc: "Volume Weighted Average Price — institutional anchor", color: "#a78bfa" },
                    { label: "9 EMA", desc: "Short-term momentum guide", color: "#3b82f6" },
                    { label: "21 ALMA", desc: "Trend direction filter", color: "#f59e0b" },
                    { label: "PM High/Low", desc: "Pre-market range extremes", color: "#22c55e" },
                    { label: "Prior Day H/L/C", desc: "Yesterday's key reaction zones", color: "#ef4444" },
                    { label: "Opening Range", desc: "First 15-30 min high/low", color: "#00e5a0" },
                    { label: "Expected Move", desc: "ATM straddle implied range", color: "#f97316" },
                  ].map((level) => (
                    <div
                      key={level.label}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: `${level.color}06`, border: `1px solid ${level.color}10` }}
                    >
                      <div className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: level.color }} />
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[11px] font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: level.color }}
                        >
                          {level.label}
                        </span>
                        <span className="text-[9px] text-white/20 ml-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {level.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict Reference */}
              <div className="glass-card rounded-2xl overflow-hidden p-4">
                <SectionHead icon="🎯" title="Verdict System" subtitle="Plain-English assessment framework" />
                <div className="space-y-2">
                  <VerdictBadge verdict="Bullish Bias" description="Price action and indicators lean bullish — calls may be favored" />
                  <VerdictBadge verdict="Bearish Bias" description="Price action and indicators lean bearish — puts may be favored" />
                  <VerdictBadge verdict="Trend Confirmed" description="Multiple signals align — higher conviction in directional bias" />
                  <VerdictBadge verdict="Breakout Watch" description="Price approaching key level — potential range expansion" />
                  <VerdictBadge verdict="Rejection Watch" description="Price testing resistance or support — watching for reversal" />
                  <VerdictBadge verdict="Wait For Retest" description="Level broke but needs confirmation — don't chase the move" />
                  <VerdictBadge verdict="Chop Risk" description="Mixed signals — range-bound, no clear direction" />
                  <VerdictBadge verdict="Premium Risk Elevated" description="VIX spiking — options expensive, wider stops needed" />
                  <VerdictBadge verdict="Neutral / No Trade" description="No edge identified — protecting capital is the trade" />
                </div>
              </div>

              {/* Breadth Quick Refs */}
              <div className="glass-card rounded-2xl overflow-hidden p-4">
                <SectionHead icon="📊" title="Breadth Signals" subtitle="Market internals to watch" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { symbol: "AMEX:UVOL", label: "Up Volume" },
                    { symbol: "AMEX:DVOL", label: "Down Volume" },
                    { symbol: "INDEX:ADD", label: "NYSE A/D Line" },
                    { symbol: "INDEX:TICK", label: "NYSE TICK" },
                  ].map((item) => (
                    <div key={item.label} className="text-center px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <TVMiniChart symbol={item.symbol} id={`tv-breadth-${item.label.replace(/\s/g, "").toLowerCase()}`} />
                      <span className="text-[9px] text-white/25 font-mono tracking-wider uppercase">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ─── Disclaimer ─── */}
          <div className="mt-8 text-center">
            <p className="text-white/15 text-[10px] font-mono tracking-wide max-w-2xl mx-auto leading-relaxed">
              EDUCATIONAL ANALYSIS & TRADE PREPARATION REFERENCE ONLY. NOT FINANCIAL ADVICE.
              NOT A RECOMMENDATION TO BUY, SELL, OR HOLD ANY SECURITY OR OPTIONS CONTRACT.
              OPTIONS TRADING INVOLVES SUBSTANTIAL RISK OF LOSS. 0DTE/1DTE OPTIONS CAN EXPIRE WORTHLESS.
              ALWAYS DO YOUR OWN RESEARCH AND CONSULT A LICENSED FINANCIAL ADVISOR.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1118] border-t border-white/5 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <PrimalEdgeLogo size="md" />
          </Link>
          <p className="text-white/20 text-sm">&copy; {new Date().getFullYear()} Primal Edge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Main Export — Auth Protected ─────────────────────────── */
export default function OptionsDashboard() {
  return (
    <ProtectedRoute>
      <OptionsDashboardContent />
    </ProtectedRoute>
  );
}
