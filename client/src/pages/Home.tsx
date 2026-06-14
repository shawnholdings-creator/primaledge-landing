/* ============================================================
   ELASTIC SIGNAL DESIGN SYSTEM — Home Page
   Mobile-first responsive layout
   Colors: #0a0d12 bg, #00e5a0 teal, #22c55e bull, #ef4444 bear
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import SharedNavbar from "@/components/Navbar";
import { toast } from "sonner";

// ── Ticker tape data ──────────────────────────────────────────
const TICKER_ITEMS = [
  { sym: "AAPL", verdict: "BULLISH SLINGSHOT", grade: "A", change: "+2.4%" },
  { sym: "NVDA", verdict: "READY", grade: "B", change: "+1.8%" },
  { sym: "MSFT", verdict: "COIL", grade: "B", change: "+0.9%" },
  { sym: "META", verdict: "BULLISH SLINGSHOT", grade: "A", change: "+3.1%" },
  { sym: "AMZN", verdict: "READY", grade: "B", change: "+1.2%" },
  { sym: "GOOGL", verdict: "COIL", grade: "C", change: "+0.5%" },
  { sym: "TSLA", verdict: "BULLISH SLINGSHOT", grade: "A", change: "+4.7%" },
  { sym: "JPM", verdict: "READY", grade: "B", change: "+1.1%" },
  { sym: "UNH", verdict: "COIL", grade: "C", change: "+0.3%" },
  { sym: "V", verdict: "BULLISH SLINGSHOT", grade: "A", change: "+2.0%" },
];

const SCAN_ROWS = [
  { sym: "AAPL", verdict: "BULLISH SLINGSHOT", score: 82, grade: "A", price: "185.50" },
  { sym: "NVDA", verdict: "READY", score: 71, grade: "B", price: "875.20" },
  { sym: "META", verdict: "BULLISH SLINGSHOT", score: 79, grade: "A", price: "512.40" },
  { sym: "MSFT", verdict: "COIL", score: 58, grade: "B", price: "415.30" },
  { sym: "V", verdict: "BULLISH SLINGSHOT", score: 76, grade: "A", price: "278.90" },
];

function GradeBadge({ grade }: { grade: string }) {
  const cls = grade === "A" ? "grade-a" : grade === "B" ? "grade-b" : grade === "C" ? "grade-c" : "grade-d";
  return (
    <span className={`${cls} inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono`}>
      {grade}
    </span>
  );
}

function VerdictLabel({ verdict }: { verdict: string }) {
  const cls = verdict.includes("SLINGSHOT") ? "verdict-slingshot" : verdict === "READY" ? "verdict-ready" : verdict === "COIL" ? "verdict-coil" : "verdict-mixed";
  return <span className={`${cls} font-mono text-xs font-semibold tracking-wide`}>{verdict}</span>;
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); } else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Navbar ────────────────────────────────────────────────────
// Using shared Navbar component (see components/Navbar.tsx)

// ── Ticker Tape ───────────────────────────────────────────────
function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-[#0d1118] border-b border-white/5 overflow-hidden h-8">
      <div className="ticker-tape flex items-center h-full gap-8 px-4">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-bold text-white/80">{item.sym}</span>
            <VerdictLabel verdict={item.verdict} />
            <GradeBadge grade={item.grade} />
            <span className="font-mono text-xs text-[#22c55e]">{item.change}</span>
            <span className="text-white/15 mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0a0d12" }}
    >
      {/* Dot-grid neural texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(0,229,160,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[680px] mx-auto px-5 text-center" style={{ paddingTop: "140px", paddingBottom: "80px" }}>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
          style={{
            border: "1px solid rgba(0,229,160,0.3)",
            animation: "heroFadeIn 0.4s ease-out 0.1s both",
          }}
        >
          <span
            className="text-[#00e5a0]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            ● PRIVATE ACCESS — BY INVITATION
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginTop: "16px",
            animation: "heroSlideUp 0.6s ease-out 0.2s both",
          }}
        >
          What if you already knew which setups deserved your attention today?
        </h1>

        {/* Subline */}
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 400,
            fontSize: "0.72rem",
            color: "#00e5a0",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginTop: "20px",
            animation: "heroFadeIn 0.5s ease-out 0.35s both",
          }}
        >
          PRIMAL EDGE — INTELLIGENCE FOR SERIOUS TRADERS
        </p>

        {/* Body */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
            color: "rgba(255,255,255,0.62)",
            maxWidth: "520px",
            margin: "28px auto 0",
            lineHeight: 1.65,
            animation: "heroFadeIn 0.5s ease-out 0.45s both",
          }}
        >
          A private intelligence platform that reads the market before you choose the trade — so you spend less time searching and more time deciding.
        </p>

        {/* Stats Row */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0"
          style={{ marginTop: "36px", animation: "heroFadeIn 0.5s ease-out 0.55s both" }}
        >
          {[
            { top: "LIVE SIGNALS", bottom: "DELIVERED DAILY" },
            { top: "RANKED QUALITY", bottom: "SIGNAL FILTERED" },
            { top: "PRIVATE ACCESS", bottom: "MEMBERS ONLY" },
          ].map((item, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className="hidden sm:block mx-5"
                  style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.1)" }}
                />
              )}
              <div className="text-center">
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "#00e5a0",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    marginBottom: "4px",
                  }}
                >
                  {item.top}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {item.bottom}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Row */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ marginTop: "40px", animation: "heroFadeIn 0.5s ease-out 0.65s both" }}
        >
          <a
            href="#how-it-works"
            className="w-full sm:w-auto text-center transition-all"
            style={{
              border: "1px solid rgba(0,229,160,0.4)",
              background: "transparent",
              color: "#00e5a0",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: "0.9rem",
              padding: "14px 28px",
              borderRadius: "6px",
              minHeight: "48px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00e5a0";
              e.currentTarget.style.background = "rgba(0,229,160,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,229,160,0.4)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            See What's Inside
          </a>
          <Link
            href="/subscribe"
            className="w-full sm:w-auto text-center transition-all"
            style={{
              background: "#00e5a0",
              color: "#0a0d12",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              padding: "14px 28px",
              borderRadius: "6px",
              minHeight: "48px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#00ffb3";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#00e5a0";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Request Access
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ animation: "heroChevronBounce 2s ease-in-out infinite" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.5 }}>
          <path d="M4 7l6 6 6-6" stroke="#00e5a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Hero keyframes */}
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroChevronBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.5; }
          50% { transform: translateX(-50%) translateY(6px); opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}


// ── How It Works ──────────────────────────────────────────────
function HowItWorks() {
  const { ref, inView } = useInView();
  const steps = [
    { num: "01", title: "Autonomous Data Ingestion", desc: "On every cycle, the engine autonomously ingests live market data across a curated universe of premium symbols spanning multiple indices and proprietary watchlists. Data is normalized, adjusted for corporate actions, and staged for feature extraction — zero manual input, zero human bottleneck.", icon: "📡", traderValue: "The engine watches the premium market universe for you, reducing the need to manually cycle through endless charts. Traders get a cleaner starting point: fewer names to chase, more focus on symbols showing meaningful activity." },
    { num: "02", title: "Proprietary Feature Extraction", desc: "Raw price and volume data is transformed through a multi-layer feature engineering pipeline into a high-dimensional numerical representation. The system captures latent relationships between momentum regime, volatility structure, and directional pressure that are invisible to standard technical analysis.", icon: "🧠", traderValue: "Instead of reacting to obvious price movement after the crowd sees it, the system studies structure, compression, momentum, volume behavior, and directional pressure. This helps surface setups that may be forming beneath the noise." },
    { num: "03", title: "Adaptive Conviction Scoring", desc: "A proprietary scoring model evaluates each candidate across multiple orthogonal dimensions of market confluence, producing a single 0–100 conviction score. Dynamic penalty layers adjust for regime risk, overextension, and event proximity — tiering every setup as ELITE, FIRE, PREP, or SUPPRESS.", icon: "🏆", traderValue: "Every candidate is ranked before it reaches the trader. The 0–100 score and grade help separate high-priority setups from weak or early formations, so traders can decide what deserves immediate review." },
    { num: "04", title: "Dual-Channel Signal Dispatch", desc: "Qualifying signals are deduplicated against the session registry, packaged with full context — ticker, conviction score, grade, verdict, and price — and dispatched simultaneously to your mobile device and the live Primal Edge AI Cockpit. Typical signal-to-screen latency: under 3 seconds.", icon: "🔔", traderValue: "When a qualified setup fires, the alert arrives with ticker, verdict, score, grade, price, and context. This turns a raw market event into a fast review-ready signal instead of a vague notification." },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        {/* Bridge headline */}
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">HOW THE ENGINE WORKS</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
            From Market Noise<br />to Ranked Setups
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>Primal Edge translates live market complexity into scored, graded, review-ready signals — helping traders focus on the setups that appear to deserve attention.</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00e5a0]/20 to-transparent" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className={`relative ${inView ? `fade-up fade-up-delay-${i + 1}` : "opacity-0"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border border-[#00e5a0]/30 bg-[#00e5a0]/10 flex items-center justify-center shrink-0">
                    <span className="font-mono text-xs font-bold text-[#00e5a0]">{step.num}</span>
                  </div>
                </div>
                <div className="text-2xl mb-3">{step.icon}</div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-3">{step.desc}</p>
                {/* Trader Value translation */}
                <div className="bg-[#00e5a0]/5 border border-[#00e5a0]/10 rounded-lg px-3 py-2.5 mt-auto">
                  <p className="font-mono text-[10px] text-[#00e5a0]/70 tracking-widest mb-1">WHY TRADERS CARE</p>
                  <p className="text-white/55 text-xs leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{step.traderValue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value strip */}
        <div className={`mt-10 sm:mt-14 flex flex-wrap justify-center gap-3 sm:gap-4 ${inView ? "fade-up fade-up-delay-5" : "opacity-0"}`}>
          {["Premium Universe", "Multi-Timeframe Context", "AI Conviction Score", "Noise Filter", "Fast Alert Delivery"].map((item, i) => (
            <span key={i} className="font-mono text-[10px] sm:text-xs text-white/35 tracking-wider bg-white/3 border border-white/5 rounded-full px-3 sm:px-4 py-1.5">{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────
function Features() {
  const { ref, inView } = useInView();
  const features = [
    { num: "01", title: "Proprietary Adaptive Engine", desc: "The core intelligence layer applies a multi-factor adaptive model to identify high-probability setups across the full premium universe. The model architecture, feature composition, and scoring weights are entirely proprietary — engineered to detect structural patterns that precede significant directional moves.", tag: "ADAPTIVE ENGINE", traderValue: "The engine is built to identify structural behavior across the broader market, not just simple indicator crosses. Traders benefit from a systematic filter designed to reduce emotion, bias, and random chart scanning." },
    { num: "02", title: "Multi-Timeframe Confluence Layer", desc: "Every setup is cross-validated against multiple timeframes simultaneously. The engine applies directional confluence filters and trend-alignment scoring to ensure signals are structurally sound across the macro and micro landscape — filtering out noise at the source.", tag: "MTF CONFLUENCE", traderValue: "A setup is stronger when short-term movement aligns with the larger structure. This helps traders avoid acting on isolated one-timeframe noise and focus on cleaner alignment." },
    { num: "03", title: "Multi-Dimensional Conviction Scoring", desc: "Multiple orthogonal factors — spanning momentum, structure, volume behavior, sector dynamics, and regime awareness — are synthesized into a single 0–100 conviction score through a proprietary weighted intelligence model. The exact dimensions and weights are undisclosed.", tag: "CONVICTION SCORING", traderValue: "Momentum, structure, volume, sector behavior, and regime awareness are compressed into one readable score. Traders can prioritize attention faster without manually weighing every factor from scratch." },
    { num: "04", title: "Sub-3-Second Signal Delivery", desc: "When a high-conviction signal is confirmed, a structured alert payload is dispatched to your mobile device and the web dashboard simultaneously — ticker, score, grade, verdict, and price context delivered in under 3 seconds. No app store dependencies.", tag: "REAL-TIME DISPATCH", traderValue: "Speed matters when a setup starts moving. The trader receives the signal quickly enough to review the chart while the setup is still fresh." },
    { num: "05", title: "Encrypted Live Dashboard", desc: "Access a PIN-secured, real-time analytical dashboard that reflects the latest scan results. View ranked setups, conviction scores, grade badges, and verdicts — updated autonomously every cycle. Your private window into the engine's output.", tag: "LIVE DASHBOARD", traderValue: "The dashboard gives traders a private command center for ranked setups, grades, and verdicts. It helps preserve situational awareness beyond a single phone alert." },
    { num: "06", title: "Intelligent Signal Deduplication", desc: "A session-level deduplication registry ensures you never receive redundant alerts on the same ticker within a single session. Every notification represents a fresh, unique analytical insight — keeping your feed clean, precise, and actionable.", tag: "ANTI-NOISE", traderValue: "Fewer repeated alerts means less noise and more trust in each notification. Traders only see fresh or meaningful signals instead of getting spammed by the same ticker." },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#0d1118]">
      <div className="container">
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">ENGINEERED FEATURES</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl">
            Institutional-Grade Analysis.<br />Retail Simplicity.
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>Every feature is engineered around a single objective: deliver the highest-conviction analytical insights with zero noise and zero delay — built for serious market enthusiasts.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div key={i} className={`relative bg-[#10151d] border border-white/5 rounded-xl p-5 sm:p-6 hover:border-[#00e5a0]/30 hover:bg-[#10151d]/80 transition-all group ${inView ? `fade-up fade-up-delay-${Math.min(i + 1, 5)}` : "opacity-0"}`}>
              <span className="absolute top-4 right-4 font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl text-white/4 leading-none pointer-events-none">{f.num}</span>
              <span className="font-mono text-[10px] text-[#00e5a0]/70 tracking-widest bg-[#00e5a0]/8 border border-[#00e5a0]/15 rounded px-2 py-0.5 mb-4 inline-block">{f.tag}</span>
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-[#00e5a0] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <h3 className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white mb-3 group-hover:text-[#00e5a0] transition-colors">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-3">{f.desc}</p>
              {/* Trader Value translation */}
              <div className="bg-[#00e5a0]/5 border border-[#00e5a0]/10 rounded-lg px-3 py-2.5 mt-auto">
                <p className="font-mono text-[10px] text-[#00e5a0]/70 tracking-widest mb-1">TRADER VALUE</p>
                <p className="text-white/55 text-xs leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.traderValue}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Technology & Methodology ────────────────────────────────
function Technology() {
  const { ref, inView } = useInView();
  const [activeTab, setActiveTab] = useState<"ml" | "pattern" | "backtest" | "signal">("ml");

  const tabs = [
    { id: "ml" as const, label: "Machine Learning", short: "ML Engine" },
    { id: "pattern" as const, label: "Pattern Recognition", short: "Patterns" },
    { id: "backtest" as const, label: "Backtesting", short: "Backtest" },
    { id: "signal" as const, label: "Signal Generation", short: "Signals" },
  ];

  const content = {
    ml: {
      headline: "Adaptive Intelligence Built for Market Microstructure",
      body: [
        "At the core of Primal Edge is a quantitative model trained on extensive historical data across multiple market regimes. The model learns to weight contributing factors by their predictive value — not their intuitive appeal — producing a scoring engine free from cognitive bias, recency bias, and emotional anchoring.",
        "In production, the model evaluates each symbol in real time, computing a composite conviction score from 0 to 100 that reflects the statistical probability of a qualifying setup being present. The model re-evaluates every symbol on each cycle, ensuring output always reflects the most current market state.",
        "The proprietary feature engineering pipeline transforms raw market data into a multi-dimensional numerical representation that captures latent structural relationships invisible to standard chart analysis. The exact feature architecture, training methodology, and scoring weights are undisclosed.",
      ],
      stats: [
        { label: "Architecture", val: "Proprietary Adaptive" },
        { label: "Scoring Range", val: "0 – 100" },
        { label: "Regime Awareness", val: "Dynamic" },
        { label: "Tier System", val: "ELITE / FIRE / PREP" },
      ],
    },
    pattern: {
      headline: "Structural Anomaly Detection Across a Premium Universe",
      body: [
        "The engine applies deterministic, rule-based evaluation to every symbol on every cycle — identifying structural configurations that have historically preceded explosive directional moves. Unlike discretionary chart reading, which is subject to interpretation and inconsistency, the pattern matching engine applies a fully systematic evaluation.",
        "The system scans for a precise convergence of proprietary conditions across a curated universe of premium symbols. All conditions must be present simultaneously for a setup to qualify — partial matches are filtered out entirely. The specific criteria and thresholds are proprietary and not disclosed.",
        "Multi-timeframe confluence checks cross-reference the primary detection against higher timeframe structure. Trend-aligned setups receive scoring bonuses while counter-trend signals are penalized — reflecting the statistical reality that alignment with macro momentum significantly improves resolution rates.",
      ],
      stats: [
        { label: "Universe", val: "Premium Curated" },
        { label: "Detection Mode", val: "Systematic" },
        { label: "Timeframes", val: "Multi-TF" },
        { label: "Noise Filter", val: "Active" },
      ],
    },
    backtest: {
      headline: "Every Parameter Validated Through Rigorous Backtesting",
      body: [
        "No parameter in the Primal Edge signal engine was chosen arbitrarily. Every threshold, scoring weight, and filter condition was derived through systematic backtesting across a multi-year historical dataset spanning multiple market regimes — including trending bull markets, high-volatility corrections, range-bound consolidation periods, and macro-driven drawdowns. Specific parameter values are proprietary.",
        "The backtesting framework was designed to eliminate survivorship bias by evaluating the algorithm against the full universe as it existed at each point in time — not the current list, which would artificially inflate results by excluding companies that were delisted or removed due to poor performance. Walk-forward analysis was used to validate that the algorithm's edge persisted out-of-sample, not just in-sample, providing a more realistic assessment of live performance expectations.",
        "Key metrics evaluated during the backtesting process included setup win rate by grade, average favorable excursion (AFE) versus maximum adverse excursion (MAE), risk-adjusted return per setup, and signal frequency across different volatility regimes (measured by VIX quartile). The final parameter set represents the configuration that produced the most consistent risk-adjusted performance across all tested market conditions — not the configuration that maximized raw returns in a single favorable period.",
      ],
      stats: [
        { label: "Years of Data", val: "5+" },
        { label: "Market Regimes", val: "4" },
        { label: "Bias Correction", val: "Survivorship" },
        { label: "Validation", val: "Walk-Forward" },
      ],
    },
    signal: {
      headline: "From Raw Data to Actionable Signal in Under 3 Seconds",
      body: [
        "Signal generation is the final stage of the Primal Edge pipeline — the point at which raw market data is transformed into a structured, actionable alert. When the engine completes a full evaluation cycle across the premium universe, qualifying setups are ranked by composite score, filtered by grade threshold, and checked against the deduplication registry to prevent repeat alerts on the same ticker within the same trading session.",
        "Each signal is packaged with a full context payload: the ticker symbol, the current price at the time of detection, the composite score, the assigned grade (A through D), the primary verdict classification (Bullish Slingshot, Ready, or Coil), the volume surge ratio relative to the 20-period average, and a multi-timeframe confluence indicator. This payload is formatted and dispatched to the NTFY push notification service, where it is delivered to all active subscribers within seconds of detection.",
        "The signal architecture is designed around the principle of precision over volume. The system does not generate alerts for every symbol that shows marginal improvement — it fires only when a statistically significant convergence of conditions is confirmed. A typical scan cycle produces between 2 and 8 qualifying signals, ensuring that every alert you receive represents a setup worth evaluating — not noise to be filtered.",
      ],
      stats: [
        { label: "Avg Signals / Scan", val: "2 – 8" },
        { label: "Alert Latency", val: "< 3s" },
        { label: "Context Fields", val: "7" },
        { label: "Dedup Window", val: "1 Session" },
      ],
    },
  };

  const active = content[activeTab];

  return (
    <section id="technology" className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        {/* Header */}
        <div className="mb-10 sm:mb-14" ref={ref}>
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">UNDER THE HOOD</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl">
            Institutional-Grade Technology.<br />Retail-Accessible Delivery.
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed">
            The Primal Edge engine is not a simple indicator overlay or a hand-drawn trendline. It is a multi-layer quantitative system built on adaptive intelligence, structural pattern recognition, and statistically validated methodology — engineered to identify high-probability setups with the precision of a systematic fund, delivered as educational analysis to your device in real time.
          </p>
        </div>

        {/* Tab navigation */}
        <div className={`flex flex-wrap gap-2 mb-8 ${inView ? "fade-up fade-up-delay-1" : "opacity-0"}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-['Space_Grotesk'] font-semibold text-sm px-4 py-2.5 rounded-lg border transition-all ${
                activeTab === tab.id
                  ? "bg-[#00e5a0] text-[#0a0d12] border-[#00e5a0]"
                  : "bg-transparent text-white/50 border-white/10 hover:border-[#00e5a0]/40 hover:text-white"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className={`grid lg:grid-cols-5 gap-8 xl:gap-12 ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
          {/* Text — 3 cols */}
          <div className="lg:col-span-3 space-y-5">
            <h3 className="font-['Space_Grotesk'] font-bold text-xl sm:text-2xl text-white">
              {active.headline}
            </h3>
            {active.body.map((para, i) => (
              <p key={i} className="text-white/55 text-sm sm:text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {para}
              </p>
            ))}
          </div>

          {/* Stats — 2 cols */}
          <div className="lg:col-span-2">
            <div className="bg-[#10151d] border border-white/5 rounded-2xl p-6 space-y-4">
              <p className="font-mono text-[10px] text-white/30 tracking-widest mb-2">KEY METRICS</p>
              {active.stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-white/45 text-sm">{stat.label}</span>
                  <span className="font-mono font-bold text-[#00e5a0] text-sm">{stat.val}</span>
                </div>
              ))}

              {/* Divider */}
              <div className="pt-2">
                <div className="bg-[#0d1118] rounded-xl p-4">
                  <p className="font-mono text-[10px] text-white/25 tracking-widest mb-3">PIPELINE OVERVIEW</p>
                  <div className="space-y-2">
                    {[
                      { step: "01", label: "Live Market Data Ingestion", active: activeTab === "ml" || activeTab === "pattern" },
                      { step: "02", label: "Proprietary Feature Extraction", active: activeTab === "ml" },
                      { step: "03", label: "Structural Anomaly Detection", active: activeTab === "pattern" },
                      { step: "04", label: "Adaptive Conviction Scoring", active: activeTab === "ml" },
                      { step: "05", label: "Regime-Aware Penalty Engine", active: activeTab === "backtest" },
                      { step: "06", label: "Dual-Channel Signal Dispatch", active: activeTab === "signal" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                        item.active ? "bg-[#00e5a0]/10 border border-[#00e5a0]/20" : ""
                      }`}>
                        <span className={`font-mono text-[10px] font-bold shrink-0 ${
                          item.active ? "text-[#00e5a0]" : "text-white/20"
                        }`}>{item.step}</span>
                        <span className={`text-xs ${
                          item.active ? "text-white/80" : "text-white/25"
                        }`}>{item.label}</span>
                        {item.active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom disclaimer bar */}
        <div className={`mt-10 bg-[#10151d] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${inView ? "fade-up fade-up-delay-3" : "opacity-0"}`}>
          <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 16 16">
            <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <p className="text-white/35 text-xs leading-relaxed">
            <span className="text-white/55 font-semibold">Research Disclosure:</span> All backtesting results, model performance metrics, and statistical references presented on this page are derived from historical data and are provided for informational and educational purposes only. Past performance of any quantitative model or scanning algorithm does not guarantee future results. Market conditions change continuously, and no system — regardless of its sophistication — can predict future price movements with certainty. The AI Cockpit is a research and educational tool, not a financial advisory service.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Alert Preview ─────────────────────────────────────────────
function AlertPreview() {
  const { ref, inView } = useInView();
  return (
    <section className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          {/* Left: Alert detail list */}
          <div className={`order-2 lg:order-1 ${inView ? "fade-up fade-up-delay-1" : "opacity-0"}`} ref={ref}>
            <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">INSTANT ANALYSIS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Your Phone Buzzes<br />When the Setup Fires
            </h2>
            <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-8">
              No more staring at charts all day. The engine monitors the market for you and sends a push notification the moment a high-conviction setup is confirmed — delivered as educational analysis for your review.
            </p>
            <div className="space-y-4">
              {[
                { label: "Ticker Symbol", val: "NVDA" },
                { label: "Verdict", val: "BULLISH SLINGSHOT" },
                { label: "Score / Grade", val: "82 / A" },
                { label: "Price at Alert", val: "$875.20" },
                { label: "Key Context", val: "AI Cockpit slingshot confirmed, vol surge 2.1x" },
              ].map((item, i) => (
                <div key={i} className="teal-border-left">
                  <span className="font-mono text-[10px] text-white/30 tracking-widest block">{item.label}</span>
                  <span className="font-mono text-sm text-white/80">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual card */}
          <div className={`order-1 lg:order-2 flex justify-center ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
            <div className="relative w-full max-w-xs sm:max-w-sm">
              {/* Simulated phone notification card */}
              <div className="bg-[#10151d] border border-[#00e5a0]/20 rounded-2xl p-5 teal-glow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00e5a0] flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                      <path d="M2 14 Q5 4 9 9 Q13 14 16 4" stroke="#0a0d12" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Space_Grotesk'] font-bold text-white text-sm">Primal Edge</p>
                    <p className="font-mono text-[10px] text-white/40">just now</p>
                  </div>
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#00e5a0] animate-pulse" />
                </div>
                <div className="bg-[#0d1118] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-white">NVDA</span>
                    <GradeBadge grade="A" />
                  </div>
                  <VerdictLabel verdict="BULLISH SLINGSHOT" />
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-mono text-xs text-white/40">Score</span>
                      <span className="font-mono text-xs text-white/80">82 / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-xs text-white/40">Price</span>
                      <span className="font-mono text-xs text-white/80">$875.20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-xs text-white/40">Vol Surge</span>
                      <span className="font-mono text-xs text-[#22c55e]">2.1x avg</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-white/25">AI Cockpit slingshot confirmed</span>
                  <span className="font-mono text-[10px] text-[#00e5a0]">&lt; 3s delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────
function Pricing() {
  const { ref, inView } = useInView();
  return (
    <section id="pricing" className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        <div className="text-center mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">MEMBERSHIP PRICING</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Full Access.<br />One Flat Rate.
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-lg mx-auto">
            One tier. Complete analytical engine access. No upsells. This is a private community of serious, quantitatively-minded market enthusiasts — seats are strictly limited.
          </p>
        </div>

        <div className={`max-w-md mx-auto ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
          <div className="bg-[#10151d] border border-[#00e5a0]/30 rounded-2xl p-6 sm:p-8 teal-glow relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00e5a0]/5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white">Primal Edge — AI Cockpit Access</span>
                <span className="font-mono text-xs text-[#00e5a0] bg-[#00e5a0]/10 border border-[#00e5a0]/20 px-3 py-1 rounded-full whitespace-nowrap">PRIVATE GROUP</span>
              </div>
              <div className="mb-6">
                <span className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl text-white">$49</span>
                <span className="text-white/40 text-base sm:text-lg">/month</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  "Adaptive intelligence engine — premium multi-index universe",
                  "9x daily autonomous scan cycles",
                  "Instant push notifications",
                  "Conviction-graded setups: A, B, C, D",
                  "Live analytical dashboard",
                  "Proprietary multi-dimensional conviction scoring",
                  "Multi-timeframe confluence analysis",
                  "Intelligent signal deduplication",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-[#00e5a0] shrink-0" fill="none" viewBox="0 0 16 16">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-white/65 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/subscribe" className="shimmer-btn block w-full bg-[#00e5a0] text-[#0a0d12] font-['Space_Grotesk'] font-bold text-base py-4 rounded-lg hover:bg-[#00bfa0] transition-all pulse-glow text-center">
                Get Access Now →
              </Link>
              <p className="text-center text-white/30 text-xs mt-4">Cancel anytime. Billed monthly.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────
function FAQ() {
  const { ref, inView } = useInView();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "What is the Primal Edge AI Cockpit?", a: "It is the flagship adaptive intelligence signal within the Primal Edge product suite — a proprietary system that identifies a specific structural pattern across a curated premium universe. The engine assigns a 0–100 conviction score and grades each setup A through D. The exact model architecture, pattern definition, and universe composition are proprietary. All output is provided for educational and analytical purposes only." },
    { q: "What data does the model use?", a: "The engine ingests live market data across a curated premium universe on every cycle. Raw data is transformed through a proprietary feature engineering pipeline into a multi-dimensional numerical representation. The specific data sources, feature composition, and transformation methods are not disclosed." },
    { q: "How do I receive the analysis?", a: "Analytical insights are delivered via push notification to your mobile device. Download a free notification client, subscribe to the private topic provided after sign-up, and receive instant updates the moment the engine confirms a high-conviction setup." },
    { q: "What timeframe does the scanner analyze?", a: "The engine uses a multi-timeframe evaluation approach, cross-referencing the primary scan timeframe against higher timeframe trend structure. The model applies a confluence bonus to trend-aligned setups and penalizes counter-trend signals. Setups are designed for analysis of swing-timeframe structures with a typical 2–10 day observation window." },
    { q: "How was the model validated?", a: "The model was validated across a multi-year historical dataset using walk-forward analysis to confirm out-of-sample performance. Survivorship bias was eliminated by evaluating against the full universe as it existed at each historical point. Detailed methodology is available to active members only." },
    { q: "Is this financial advice?", a: "No. Primal Edge is an educational and analytical tool only. All scan results, scores, and grades are for research and educational purposes only. Past model performance does not guarantee future results. This is not a recommendation to buy, sell, or hold any security. Always conduct your own due diligence and consult a licensed financial advisor." },
    { q: "How many seats are available?", a: "This is a private, close-community service. Seats are strictly limited to maintain analytical quality and ensure every member receives timely, low-noise insights. Once the community is full, a waitlist will open." },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#0d1118]">
      <div className="container max-w-3xl">
        <div className="mb-10 sm:mb-16 text-center" ref={ref}>
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">FAQ</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">Common Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className={`bg-[#10151d] border rounded-xl overflow-hidden transition-all ${open === i ? "border-[#00e5a0]/30" : "border-white/5"} ${inView ? `fade-up fade-up-delay-${Math.min(i + 1, 5)}` : "opacity-0"}`}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-start justify-between px-5 sm:px-6 py-4 text-left gap-4">
                <span className="font-['Space_Grotesk'] font-medium text-white text-sm leading-snug">{faq.q}</span>
                <svg className={`w-4 h-4 text-[#00e5a0] shrink-0 mt-0.5 transition-transform ${open === i ? "rotate-45" : ""}`} fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {open === i && (
                <div className="px-5 sm:px-6 pb-4">
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────
function CTABanner() {
  const { ref, inView } = useInView();
  return (
    <section className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        <div ref={ref} className={`relative bg-gradient-to-br from-[#0d1a14] to-[#0a0d12] border border-[#00e5a0]/20 rounded-2xl p-8 sm:p-12 text-center overflow-hidden ${inView ? "fade-up" : "opacity-0"}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/hero-bg-WRuxyzjuQc2Zg7wTqtkdku.webp)`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0d12]/80" />
          <div className="relative">
            <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-4">PRIVATE MEMBERSHIP — LIMITED SEATS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Stop Guessing.<br />Let the Engine Find the Edge.
            </h2>
            <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Join a private community of systematic market enthusiasts using Primal Edge's adaptive intelligence to study high-conviction setups before the move — scored, graded, and delivered as real-time educational analysis.
            </p>
            <Link href="/subscribe" className="shimmer-btn pulse-glow inline-block bg-[#00e5a0] text-[#0a0d12] font-['Space_Grotesk'] font-bold text-base sm:text-lg px-8 sm:px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all">
              Access the AI Scanner →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0d1118] border-t border-white/5 py-10 sm:py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center">
            <PrimalEdgeLogo size="md" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/30">
            <a href="#how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <Link href="/products" className="hover:text-white/60 transition-colors">Products</Link>
            <Link href="/market-sentiment" className="hover:text-white/60 transition-colors">Market Sentiment</Link>
            <Link href="/sectors" className="hover:text-white/60 transition-colors">Sectors</Link>
            <Link href="/charts" className="hover:text-white/60 transition-colors">Charts</Link>
            <Link href="/education" className="hover:text-white/60 transition-colors">Education</Link>
            <Link href="/podcasts" className="hover:text-white/60 transition-colors">Podcasts</Link>
            <Link href="/references" className="hover:text-white/60 transition-colors">References</Link>
            <Link href="/dev-requests" className="hover:text-white/60 transition-colors">Dev Requests</Link>
            <Link href="/subscribe" className="hover:text-[#00e5a0] transition-colors">Subscribe</Link>
          </div>
          <p className="text-white/20 text-xs text-center">
            © 2025 Primal Edge — Adaptive Intelligence. Decisive Signals. For educational purposes only. Not financial advice.
          </p>
        </div>
      </div>
      {/* Spacer for fixed bottom disclaimer */}
      <div className="h-10" />
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0d12" }}>
      <SharedNavbar />
      <TickerTape />
      <Hero />
      <HowItWorks />
      <Features />
      <Technology />
      <AlertPreview />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
