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
import PushNotificationMockup from "@/components/PushNotificationMockup";
import { toast } from "sonner";
import { useLoginModal } from "../contexts/LoginModalContext";
import GlobalDisclaimer from "@/components/GlobalDisclaimer";

// ── Ticker tape types & fallback data ─────────────────────────
interface TickerPrice {
  sym: string;
  price: number;
  changePct: number;
}

const TICKER_SYMBOLS = ["AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "TSLA", "JPM", "UNH", "V", "QQQ", "SPY", "IWM"];

const FALLBACK_PRICES: TickerPrice[] = [
  { sym: "AAPL", price: 229.85, changePct: 0.54 },
  { sym: "NVDA", price: 195.55, changePct: 0.37 },
  { sym: "MSFT", price: 386.74, changePct: -0.96 },
  { sym: "META", price: 600.29, changePct: 2.98 },
  { sym: "AMZN", price: 244.16, changePct: 0.61 },
  { sym: "GOOGL", price: 366.46, changePct: 1.82 },
  { sym: "TSLA", price: 352.80, changePct: 1.15 },
  { sym: "JPM", price: 268.40, changePct: 0.42 },
  { sym: "UNH", price: 338.90, changePct: -0.31 },
  { sym: "V", price: 312.55, changePct: 0.58 },
  { sym: "QQQ", price: 538.20, changePct: 0.87 },
  { sym: "SPY", price: 572.60, changePct: 0.48 },
  { sym: "IWM", price: 218.75, changePct: -0.14 },
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

// ── Ticker Tape (server-proxied Yahoo Finance prices) ─────────
function TickerTape() {
  const [prices, setPrices] = useState<TickerPrice[]>(FALLBACK_PRICES);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`/api/prices?tickers=${TICKER_SYMBOLS.join(",")}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.prices) return;

        const live: TickerPrice[] = [];
        for (const sym of TICKER_SYMBOLS) {
          const q = json.prices[sym];
          if (q) {
            live.push({ sym, price: q.price, changePct: q.change });
          }
        }
        if (live.length > 0) setPrices(live);
      } catch {
        // keep fallback prices
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, []);

  const items = [...prices, ...prices];
  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-[#0d1118] border-b border-white/5 overflow-hidden h-8">
      <div className="ticker-tape inline-flex items-center h-full gap-8 px-4">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-bold text-white/80">{item.sym}</span>
            <span className="font-mono text-xs text-white/60">${item.price.toFixed(2)}</span>
            <span
              className="font-mono text-xs font-semibold"
              style={{ color: item.changePct >= 0 ? "#22c55e" : "#ef4444" }}
            >
              {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
            </span>
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
      <div className="relative z-10 w-full max-w-[780px] mx-auto px-5 text-center" style={{ paddingTop: "140px", paddingBottom: "80px" }}>

        {/* Eyebrow Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
          style={{
            border: "1px solid rgba(0,229,160,0.3)",
            animation: "heroFadeIn 0.4s ease-out 0.1s both",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#00e5a0",
              display: "inline-block",
              animation: "heroPulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#00e5a0",
            }}
          >
            OPTIONS AI ENGINE · INCOME + DIRECTIONAL STRATEGIES
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginTop: "16px",
            animation: "heroSlideUp 0.6s ease-out 0.2s both",
          }}
        >
          What if you already knew exactly which options setup to make today?
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
            color: "rgba(255,255,255,0.62)",
            maxWidth: "600px",
            margin: "28px auto 0",
            lineHeight: 1.65,
            animation: "heroFadeIn 0.5s ease-out 0.35s both",
          }}
        >
          Two strategies. One AI engine. Signals delivered to your phone before the market opens.
        </p>

        {/* Single CTA */}
        <button
          onClick={() => document.getElementById('strategies')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-8 bg-[#00e5a0] text-[#0a0d12] font-bold text-sm px-8 py-4 rounded-lg hover:bg-[#00ffb3] transition-colors"
          style={{ animation: "heroFadeIn 0.5s ease-out 0.5s both" }}
        >
          ↓ Choose your strategy
        </button>
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
        @keyframes heroPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.0); }
          50%       { box-shadow: 0 0 16px 4px rgba(74,222,128,0.2); }
        }
        @keyframes arrowNudge {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(4px); }
        }
      `}
      </style>
    </section>
  );
}


// ── Two Strategies ────────────────────────────────────────────
function TwoStrategies() {
  return (
    <section id="strategies" className="w-full py-16 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex flex-col items-center gap-1 mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400/70">Two Strategies. One Engine.</p>
          <h2 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Which trader are you?</h2>
          <p className="text-gray-400 text-sm mt-1 max-w-md">Both products are powered by the same options AI engine — choose the strategy that fits your style.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">

          <a href="/weekly-income" className="group flex-1 rounded-2xl border-2 border-green-400/60 bg-white/[0.03] p-6 flex flex-col gap-3 hover:border-green-400 hover:bg-green-400/[0.06] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer no-underline"
            style={{ animation: "borderPulse 2.5s ease-in-out infinite" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Income Strategy</span>
              <span className="text-xs text-gray-500">FLAGSHIP</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-green-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sell Premium</h3>
            <p className="text-white font-bold text-base">Weekly Options Income Dashboard</p>
            <p className="text-gray-400 text-sm">Monitors the most actively traded stocks for high-probability income setups. Collect weekly credit. Let time decay work for you.</p>
            <ul className="text-xs text-gray-400 space-y-1 mt-1 list-none p-0">
              <li>✓ Short-duration, time-efficient setups</li>
              <li>✓ High-probability, AI-filtered opportunities</li>
              <li>✓ 92.1% historical success rate · validated methodology</li>
            </ul>
            {/* Push notification preview */}
            <div className="my-3">
              <PushNotificationMockup
                ticker="META"
                grade="A"
                setupType="BULLISH SLINGSHOT"
                strike="$540"
                expiry="Jun 27"
                credit="—"
                score="88"
                animDelay={0.1}
              />
            </div>
            <span className="mt-auto inline-block bg-green-400 text-black font-black text-sm px-5 py-3 rounded-lg text-center group-hover:brightness-110 transition-all duration-150">
              Explore Weekly Income <span style={{ display: "inline-block", animation: "arrowNudge 1.2s ease-in-out infinite" }}>→</span>
            </span>
          </a>

          <a href="/products" className="group flex-1 rounded-2xl border-2 border-white/20 bg-white/[0.03] p-6 flex flex-col gap-3 hover:border-white/40 hover:bg-white/[0.06] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer no-underline">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-300 bg-white/10 px-2 py-0.5 rounded-full">Directional Strategy</span>
              <span className="text-xs text-gray-500">AI COCKPIT</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Trade Breakouts</h3>
            <p className="text-white font-bold text-base">Primal Edge AI Cockpit</p>
            <p className="text-gray-400 text-sm">Identify high-conviction directional setups on the most liquid names in the market. Graded A–D by the AI engine. Act before the move.</p>
            <ul className="text-xs text-gray-400 space-y-1 mt-1 list-none p-0">
              <li>✓ A-grade setups · 81% historical hit rate</li>
              <li>✓ Multi-timeframe confluence scoring</li>
              <li>✓ Real-time mobile alerts</li>
            </ul>
            {/* Blurred AI Cockpit table preview */}
            <div className="my-3 rounded-xl overflow-hidden" style={{ background: "#0d1118", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", marginLeft: "6px", letterSpacing: "0.12em" }}>AI COCKPIT</span>
              </div>
              <div style={{ padding: "8px 10px", position: "relative" }}>
                <div style={{ filter: "blur(5px)", userSelect: "none" }}>
                  {[
                    { ticker: "NVDA", verdict: "BULLISH SLINGSHOT", score: "92", grade: "A", price: "$148.50" },
                    { ticker: "META", verdict: "READY", score: "85", grade: "A", price: "$612.30" },
                    { ticker: "TSLA", verdict: "COIL", score: "71", grade: "B", price: "$265.80" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "#fff", fontWeight: 700 }}>{row.ticker}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "#22c55e" }}>{row.verdict}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "#00e5a0", fontWeight: 700 }}>{row.score}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.7)" }}>{row.price}</span>
                    </div>
                  ))}
                </div>
                {/* Lock overlay */}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔒</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>Members only</span>
                </div>
              </div>
            </div>
            <span className="mt-auto inline-block bg-white/10 text-white font-black text-sm px-5 py-3 rounded-lg text-center group-hover:bg-white/20 transition-all duration-150">
              Explore AI Cockpit →
            </span>
          </a>

        </div>

        <p className="text-center text-xs text-gray-600 mt-5">One subscription covers both strategies.</p>

      </div>
    </section>
  );
}


// ── How It Works ──────────────────────────────────────────────
function HowItWorks() {
  const { ref, inView } = useInView();
  const steps = [
    { num: "01", title: "Scan", desc: "The engine continuously monitors the most actively traded stocks and ETFs — the names where options liquidity and premium quality are highest.", icon: "📡" },
    { num: "02", title: "Score", desc: "Every setup is scored 0–100 by conviction — only the top qualify.", icon: "🏆" },
    { num: "03", title: "Deliver", desc: "The highest-ranked signal reaches your phone and dashboard in under 3 seconds.", icon: "🔔" },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        {/* Bridge headline */}
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">HOW THE OPTIONS AI ENGINE WORKS</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
            From Market Noise<br />to One Engine. Two Strategies. Zero Guesswork.
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>Whether you're selling premium for weekly income or trading high-conviction directional breakouts — the Primal Edge engine handles the scanning, scoring, and delivery. You focus on execution.</p>
        </div>

        <div className="relative">
          <div className="hidden sm:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00e5a0]/20 to-transparent" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className={`relative ${inView ? `fade-up fade-up-delay-${i + 1}` : "opacity-0"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border border-[#00e5a0]/30 bg-[#00e5a0]/10 flex items-center justify-center shrink-0">
                    <span className="font-mono text-xs font-bold text-[#00e5a0]">{step.num}</span>
                  </div>
                </div>
                <div className="text-2xl mb-3">{step.icon}</div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────
function Features() {
  const { ref, inView } = useInView();
  const features = [
    { num: "01", title: "Proprietary Adaptive Engine", desc: "The core intelligence layer applies a multi-factor adaptive model to identify high-probability options income setups across the most liquid stocks and ETFs — filtered through a proprietary multi-factor intelligence layer. The model architecture, feature composition, and scoring weights are entirely proprietary.", tag: "ADAPTIVE ENGINE", traderValue: "The engine is built to identify structural behavior across the broader market, not just simple indicator crosses. Traders benefit from a systematic filter designed to reduce emotion, bias, and random chart scanning." },
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
          <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">ENGINEERED FOR OPTIONS TRADERS</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl">
            Built for Both Sides of the Options Market.<br />Retail Simplicity.
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>Every feature serves one goal: surface the highest-conviction options setup — whether that's a premium-selling income trade or a directional breakout — with zero noise and zero delay.</p>
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
      headline: "Structural Anomaly Detection Across Premium Stocks & ETFs",
      body: [
        "The engine applies deterministic, rule-based evaluation to every symbol on every cycle — identifying structural configurations that have historically preceded explosive directional moves. Unlike discretionary chart reading, which is subject to interpretation and inconsistency, the pattern matching engine applies a fully systematic evaluation.",
        "The system scans for a precise convergence of proprietary conditions across a curated universe of blue-chip stocks and options-liquid ETFs. All conditions must be present simultaneously for a setup to qualify — partial matches are filtered out entirely. The specific criteria and thresholds are proprietary and not disclosed.",
        "Multi-timeframe confluence checks cross-reference the primary detection against higher timeframe structure. Trend-aligned setups receive scoring bonuses while counter-trend signals are penalized — reflecting the statistical reality that alignment with macro momentum significantly improves resolution rates.",
      ],
      stats: [
        { label: "Universe", val: "Premium Stocks & Options-Liquid ETFs" },
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
        "Signal generation is the final stage of the Primal Edge pipeline — the point at which raw market data is transformed into a structured, actionable alert. When the engine completes a full evaluation cycle across blue-chip stocks and ETFs, qualifying setups are ranked by composite score, filtered by grade threshold, and checked against the deduplication registry to prevent repeat alerts on the same ticker within the same trading session.",
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
            Institutional-Grade Options Intelligence.<br />Retail-Accessible Delivery.
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed">
            The Primal Edge engine is not a simple options screener or a hand-drawn trendline. It is a multi-layer quantitative system built on adaptive intelligence, options-specific feature engineering, and statistically validated methodology — designed from the ground up for options income and directional strategies, delivered as educational analysis to your device in real time.
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
            Your Phone Buzzes<br />When an Options Income Setup Qualifies
            </h2>
            <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-8">
              No more scanning all day. The engine monitors premium stocks for qualifying options income setups and sends a push notification the moment a high-conviction opportunity is confirmed — delivered as educational analysis for your review.
            </p>
            <div className="space-y-4">
              {[
                { label: "Ticker Symbol", val: "NVDA" },
                { label: "Verdict", val: "INCOME SIGNAL · HIGH CONVICTION" },
                { label: "Score / Grade", val: "82 / A" },
                { label: "Price at Alert", val: "$875.20" },
                { label: "Key Context", val: "AI Score 82 · Grade A · Confirmed Setup" },
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

// ── Access ───────────────────────────────────────────────────
function AccessSection() {
  const { ref, inView } = useInView();
  return (
    <section id="access" className="py-16 sm:py-24 bg-[#0a0d12]">
      <div className="container">
        <div className="text-center" ref={ref}>
          <div className={inView ? "fade-up" : "opacity-0"}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.12em",
                color: "#00e5a0",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              ACCESS IS BY INVITATION — REACH OUT TO LEARN MORE
            </p>
            <h2 className="font-['Space_Grotesk'] font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
              Private Access Only
            </h2>
            <p className="text-white/50 text-base sm:text-lg max-w-lg mx-auto mb-8">
              Primal Edge is a private, invitation-only options AI platform for serious income traders. Pricing is discussed privately upon approval.
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center transition-all"
              style={{
                background: "#00e5a0",
                color: "#0a0d12",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                padding: "14px 36px",
                borderRadius: "6px",
                minHeight: "48px",
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
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────
function FAQ() {
  const { ref, inView } = useInView();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "What is the Primal Edge Options AI Engine?", a: "The Primal Edge Options AI Engine is a proprietary scanning and scoring system built exclusively for options income traders. It monitors blue-chip stocks and ETFs for high-probability put and call selling setups, scores each opportunity on a 0–100 conviction scale, and delivers the highest-ranked signals to your dashboard and phone in real time." },
    { q: "What data does the model use?", a: "The engine ingests live market data and proprietary multi-dimensional signals — all processed through the AI intelligence layer. The specific data inputs, feature composition, and transformation methods are not disclosed." },
    { q: "How do I receive the analysis?", a: "Analytical insights are delivered via push notification to your mobile device. Download a free notification client, subscribe to the private topic provided after sign-up, and receive instant updates the moment the engine confirms a high-conviction setup." },
    { q: "What timeframe does the engine analyze?", a: "The engine uses a multi-timeframe evaluation approach, cross-referencing the primary scan timeframe against higher timeframe trend structure. The model applies a confluence bonus to trend-aligned setups and penalizes counter-trend signals. Setups are designed for analysis of swing-timeframe structures with a typical 2–10 day observation window." },
    { q: "How was the model validated?", a: "The model was validated across a multi-year historical dataset using walk-forward analysis to confirm out-of-sample performance. Survivorship bias was eliminated by evaluating against the full universe as it existed at each historical point. Detailed methodology is available to active members only." },
    { q: "Is this financial advice?", a: "No. Primal Edge is an educational and analytical tool only. All scan results, scores, and grades are for research and educational purposes only. Past model performance does not guarantee future results. This is not a recommendation to buy, sell, or hold any security. Always conduct your own due diligence and consult a licensed financial advisor." },
    { q: "How many seats are available?", a: "Primal Edge is a private, invitation-only platform. Access is reviewed individually to maintain signal quality and ensure every member receives a focused, low-noise experience. Applications are reviewed within 24 hours." },
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
                  {i === 2 && (
                    <div className="mt-4">
                      <PushNotificationMockup
                        ticker="META"
                        grade="A"
                        setupType="BULLISH SLINGSHOT"
                        strike="$540"
                        expiry="Jun 27"
                        credit="—"
                        score="88"
                        animDelay={0.1}
                      />
                    </div>
                  )}
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
            {/* Social proof */}
            <div className="flex justify-center items-center flex-wrap gap-4 mb-6">
              {["Now Accepting Applications", "By Invitation Only"].map((item) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "rgba(0,229,160,0.6)" }}>●</span> {item}
                </span>
              ))}
            </div>
            <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-4">PRIVATE MEMBERSHIP — LIMITED SEATS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Stop Guessing Which Options Setup to Make.<br />Let the Engine Decide.
            </h2>
            <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Join a curated group of options traders using the Primal Edge AI engine to find high-conviction setups — scored, graded, and delivered as real-time educational analysis.
            </p>
            <Link href="/subscribe" className="shimmer-btn pulse-glow inline-block bg-[#00e5a0] text-[#0a0d12] font-['Space_Grotesk'] font-bold text-base sm:text-lg px-8 sm:px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all">
              Request Access →
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
            <Link href="/products" className="hover:text-white/60 transition-colors">Features</Link>
            <Link href="/subscribe" className="hover:text-white/60 transition-colors">Access</Link>
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
            © 2025 Primal Edge — The Options AI Engine. For educational purposes only. Not financial advice.
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
      <TwoStrategies />
      <HowItWorks />
      <AlertPreview />
      <CTABanner />
      <GlobalDisclaimer />
      <Footer />
    </div>
  );
}
