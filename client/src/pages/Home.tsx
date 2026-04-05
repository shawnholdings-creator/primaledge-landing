/* ============================================================
   ELASTIC SIGNAL DESIGN SYSTEM — Home Page
   Mobile-first responsive layout
   Colors: #0a0e14 bg, #00d4aa teal, #22c55e bull, #ef4444 bear
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
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
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0e14]/95 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
      <div className="container flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <PrimalEdgeLogo size="sm" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#how-it-works" className="hover:text-[#00d4aa] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[#00d4aa] transition-colors">Features</a>
          <a href="#technology" className="hover:text-[#00d4aa] transition-colors">Technology</a>
          <a href="#pricing" className="hover:text-[#00d4aa] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[#00d4aa] transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/subscribe" className="shimmer-btn bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-semibold text-sm px-4 py-2 rounded hover:bg-[#00bfa0] transition-colors">
            Get Access
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d1520] border-b border-white/5 px-4 py-4 flex flex-col gap-4">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-white/70 text-sm hover:text-[#00d4aa] transition-colors">How It Works</a>
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-white/70 text-sm hover:text-[#00d4aa] transition-colors">Features</a>
          <a href="#technology" onClick={() => setMenuOpen(false)} className="text-white/70 text-sm hover:text-[#00d4aa] transition-colors">Technology</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-white/70 text-sm hover:text-[#00d4aa] transition-colors">Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)} className="text-white/70 text-sm hover:text-[#00d4aa] transition-colors">FAQ</a>
          <Link href="/subscribe" className="bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-sm px-4 py-2.5 rounded text-center">
            Get Access →
          </Link>
        </div>
      )}
    </nav>
  );
}

// ── Ticker Tape ───────────────────────────────────────────────
function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-[#0d1520] border-b border-white/5 overflow-hidden h-8">
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
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVisibleRows(v => {
        if (v >= SCAN_ROWS.length) { clearInterval(id); return v; }
        return v + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0e14 0%, #0d1520 50%, #0a0e14 100%)" }}
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/hero-bg-WRuxyzjuQc2Zg7wTqtkdku.webp)`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e14] via-[#0a0e14]/80 to-transparent" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Hero brand logo */}
            <div className="mb-6 fade-up fade-up-delay-1">
              <PrimalEdgeLogo size="lg" />
            </div>

            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6 fade-up fade-up-delay-2">
              <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              <span className="font-mono text-xs text-[#00d4aa] tracking-wider">AI ENGINE ACTIVE — LIVE</span>
            </div>

            <h1 className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-6 fade-up fade-up-delay-2">
              AI-Powered.<br />
              <span className="text-[#00d4aa] teal-text-glow">Slingshot</span><br />
              Precision.
            </h1>

            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg fade-up fade-up-delay-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              A proprietary AI-driven scanning engine trained on thousands of historical price structures across multiple indices and premium watchlists. It identifies high-probability Elastic Slingshot breakout setups in real time — graded A–D by adaptive intelligence, delivered to your phone in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 fade-up fade-up-delay-4">
              <Link href="/subscribe" className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base px-8 py-3.5 rounded hover:bg-[#00bfa0] transition-all text-center">
                Access the AI Scanner →
              </Link>
              <a href="#how-it-works" className="border border-white/15 text-white/70 font-['Space_Grotesk'] font-medium text-base px-8 py-3.5 rounded hover:border-[#00d4aa]/40 hover:text-white transition-all text-center">
                See How It Works
              </a>
            </div>

            <div className="flex items-center gap-4 mt-8 fade-up fade-up-delay-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00d4aa]/20 border border-[#00d4aa]/40">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="#00d4aa"/>
                  </svg>
                </span>
                <p className="text-white/60 text-sm font-medium tracking-wide">Exclusive <span className="text-[#00d4aa] font-semibold">Elite Members</span> Only</p>
              </div>
            </div>
          </div>

          {/* Right: Live scan mock — hidden on mobile, shown lg+ */}
          <div className="hidden lg:block">
            <div className="bg-[#111820] border border-white/8 rounded-xl overflow-hidden teal-glow">
              <div className="flex items-center justify-between px-4 py-3 bg-[#0d1520] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                </div>
                <span className="font-mono text-xs text-white/40">PRIMAL EDGE — SIGNAL ENGINE</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                  <span className="font-mono text-[10px] text-[#00d4aa]">SCANNING LIVE MARKET</span>
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-[#0d1520]/50 border-b border-white/5">
                {["TICKER","VERDICT","SCORE","GRADE","PRICE"].map(h => (
                  <span key={h} className="font-mono text-[10px] text-white/30 tracking-widest">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-white/5">
                {SCAN_ROWS.slice(0, visibleRows).map((row, i) => (
                  <div key={i} className="scan-row grid grid-cols-5 gap-2 px-4 py-3 hover:bg-white/3 transition-colors">
                    <span className="font-mono text-sm font-bold text-white">{row.sym}</span>
                    <VerdictLabel verdict={row.verdict} />
                    <span className="font-mono text-sm text-white/70">{row.score}</span>
                    <GradeBadge grade={row.grade} />
                    <span className="font-mono text-sm text-white/70">${row.price}</span>
                  </div>
                ))}
                {visibleRows < SCAN_ROWS.length && (
                  <div className="px-4 py-3 flex items-center gap-2">
                    <span className="font-mono text-xs text-white/30 animate-pulse">Scanning...</span>
                    <span className="font-mono text-xs text-[#00d4aa] animate-pulse">▋</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-[#0d1520]/50 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/25">Premium universe scanned</span>
                <span className="font-mono text-[10px] text-[#00d4aa]">{visibleRows} setups found</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile scan preview — shown below copy on small screens */}
        <div className="lg:hidden mt-10">
          <div className="bg-[#111820] border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#0d1520] border-b border-white/5">
              <span className="font-mono text-[10px] text-white/40">PRIMAL EDGE ENGINE</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                <span className="font-mono text-[10px] text-[#00d4aa]">LIVE</span>
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {SCAN_ROWS.slice(0, 3).map((row, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                  <span className="font-mono text-sm font-bold text-white w-14">{row.sym}</span>
                  <VerdictLabel verdict={row.verdict} />
                  <GradeBadge grade={row.grade} />
                  <span className="font-mono text-xs text-white/60">${row.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────
function Stats() {
  const { ref, inView } = useInView();
  const stats = [
    { label: "Premium Symbols Evaluated by AI", value: 5000, suffix: "+" },
    { label: "AI Scan Cycles Per Day", value: 4, suffix: "x" },
    { label: "ML Feature Dimensions", value: 18, suffix: "+" },
    { label: "AI Alert Delivery", value: 3, suffix: "s" },
  ];
  return (
    <section ref={ref} className="py-12 sm:py-16 bg-[#0d1520] border-y border-white/5">
      <div className="container grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#00d4aa] mb-2">
              {inView ? <Counter to={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <p className="text-white/40 text-xs sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────
function HowItWorks() {
  const { ref, inView } = useInView();
  const steps = [
    { num: "01", title: "AI Data Ingestion", desc: "On every cycle, the AI engine fetches live market data across a curated premium universe spanning multiple indices and proprietary watchlists. No manual input. No human latency. Fully autonomous.", icon: "📡" },
    { num: "02", title: "ML Pattern Recognition", desc: "Each symbol is run through the machine learning pattern recognition layer — a supervised model trained on thousands of historical breakout structures to detect the Elastic Slingshot signature.", icon: "🤖" },
    { num: "03", title: "AI Grades Every Setup", desc: "The ML scoring engine computes a 0–100 confidence score for each qualifying setup and assigns a grade of A through D based on multi-timeframe confluence, volume confirmation, and trend alignment.", icon: "🏆" },
    { num: "04", title: "Instant AI Alert Dispatched", desc: "Grade A and B signals trigger an instant push notification to your phone via NTFY — ticker, AI score, grade, verdict, and key context delivered in under 3 seconds.", icon: "🔔" },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#0a0e14]">
      <div className="container">
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">HOW THE AI WORKS</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
            From Raw Market Data<br />to AI Signal in Seconds
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>The Primal Edge pipeline ingests live market data across our premium universe, runs it through a proprietary adaptive intelligence scoring engine, and dispatches graded alerts — all without human intervention.</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4aa]/20 to-transparent" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className={`relative ${inView ? `fade-up fade-up-delay-${i + 1}` : "opacity-0"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/10 flex items-center justify-center shrink-0">
                    <span className="font-mono text-xs font-bold text-[#00d4aa]">{step.num}</span>
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
    { num: "01", title: "Proprietary AI Signal Engine", desc: "The core AI engine applies a multi-layer adaptive model to identify the precise Elastic Slingshot signature — a quantitatively validated structure that historically precedes explosive directional moves. The exact architecture is proprietary.", tag: "AI CORE ENGINE" },
    { num: "02", title: "Multi-Timeframe AI Grading", desc: "The ML model evaluates each setup across multiple timeframes simultaneously. A Grade A signal requires strong cross-timeframe confluence — the AI filters out noise and surfaces only the highest-conviction setups.", tag: "AI SIGNAL QUALITY" },
    { num: "03", title: "Multi-Dimension ML Scoring", desc: "Momentum, sector strength, market regime, relative volume, trend state, and volatility regime are encoded into a high-dimensional feature vector — producing a single 0–100 AI confidence score per setup. The exact dimensions are proprietary.", tag: "ML SCORING" },
    { num: "04", title: "Instant AI Push Alerts", desc: "When the AI engine confirms a Grade A or B signal, an instant push notification fires to your phone in under 3 seconds — ticker, AI score, grade, verdict, and full signal context. No app required beyond a free notification client.", tag: "AI DELIVERY" },
    { num: "05", title: "AI-Powered Web Dashboard", desc: "Log into the subscriber dashboard to manually trigger an AI scan on demand, view the full ranked results table, filter by AI grade, and review your complete signal history.", tag: "AI DASHBOARD" },
    { num: "06", title: "Intelligent Signal Deduplication", desc: "The AI signal registry tracks every alert dispatched. Duplicate signals within the same session are suppressed automatically — keeping your alerts clean, precise, and actionable.", tag: "AI INTELLIGENCE" },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#0d1520]">
      <div className="container">
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">AI-POWERED FEATURES</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl">
            Institutional AI.<br />Retail Simplicity.
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>Every feature is engineered around a single objective: deliver the highest-confidence AI-generated trade signals with zero noise and zero delay.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div key={i} className={`relative bg-[#111820] border border-white/5 rounded-xl p-5 sm:p-6 hover:border-[#00d4aa]/30 hover:bg-[#111820]/80 transition-all group ${inView ? `fade-up fade-up-delay-${Math.min(i + 1, 5)}` : "opacity-0"}`}>
              <span className="absolute top-4 right-4 font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl text-white/4 leading-none pointer-events-none">{f.num}</span>
              <span className="font-mono text-[10px] text-[#00d4aa]/70 tracking-widest bg-[#00d4aa]/8 border border-[#00d4aa]/15 rounded px-2 py-0.5 mb-4 inline-block">{f.tag}</span>
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-[#00d4aa] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <h3 className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white mb-3 group-hover:text-[#00d4aa] transition-colors">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
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
      headline: "A Machine Learning Engine Built for Market Structure",
      body: [
        "At the core of the Primal Edge signal suite is a supervised machine learning model trained on thousands of historical price structures across a curated premium universe spanning multiple indices and proprietary watchlists. The model was developed using a feature-engineered dataset that captures the statistical fingerprint of high-probability breakout conditions — encoding relationships between price volatility, momentum dispersion, relative volume, and trend state into a unified numerical representation.",
        "During training, the model was exposed to labeled examples of setups that preceded significant directional moves alongside setups that resolved as false signals or chop. Through iterative gradient optimization, the algorithm learned to weight each contributing factor according to its predictive value — not its intuitive appeal. The result is a scoring engine that operates free from cognitive bias, recency bias, and emotional anchoring.",
        "In production, the model evaluates each symbol in real time, computing a composite score from 0 to 100 that reflects the statistical probability of a qualifying Elastic Slingshot setup being present. Scores above 70 with multi-timeframe confirmation are classified as Grade A. Scores in the 55–70 range with partial confluence are classified as Grade B. The model re-evaluates every symbol on each scan cycle, ensuring the output always reflects the most current market state.",
      ],
      stats: [
        { label: "Training Samples", val: "10,000+" },
        { label: "Feature Dimensions", val: "18" },
        { label: "Score Range", val: "0 – 100" },
        { label: "Model Type", val: "Supervised" },
      ],
    },
    pattern: {
      headline: "Precision Pattern Matching Across a Premium Universe",
      body: [
        "The Elastic Slingshot algorithm is built on a foundation of structural pattern recognition — the systematic identification of specific price and volume configurations that have historically preceded explosive directional moves. Unlike discretionary chart reading, which is subject to interpretation and inconsistency, the pattern matching engine applies a deterministic, rule-based evaluation to every symbol on every scan cycle.",
        "The engine scans for a precise convergence of proprietary conditions across a curated universe of premium symbols. All conditions must be present simultaneously for a setup to qualify — partial matches are filtered out entirely. The specific criteria and thresholds are proprietary and not disclosed.",
        "The pattern logic also incorporates a multi-timeframe confluence check. A setup that appears on the primary scan timeframe is cross-referenced against higher timeframe trend structure. Setups that align with the prevailing macro trend receive a confluence bonus in the scoring model, while counter-trend setups are penalized — reflecting the statistical reality that trend-aligned breakouts resolve favorably at a significantly higher rate than counter-trend attempts.",
      ],
      stats: [
        { label: "Universe", val: "Premium" },
        { label: "Conditions Required", val: "3 of 3" },
        { label: "Timeframes Checked", val: "Multi-TF" },
        { label: "False Signal Filter", val: "Active" },
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
    <section id="technology" className="py-16 sm:py-24 bg-[#0a0e14]">
      <div className="container">
        {/* Header */}
        <div className="mb-10 sm:mb-14" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">UNDER THE HOOD</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl">
            Institutional-Grade Technology.<br />Retail-Accessible Delivery.
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mt-4 leading-relaxed">
            The Primal Edge signal engine is not a simple indicator or a hand-drawn trendline. It is a multi-layer quantitative system built on adaptive machine learning, structural pattern recognition, and statistically validated backtesting — engineered to identify high-probability setups with the precision of a systematic fund, delivered to your phone in real time. The Elastic Slingshot is the flagship signal within the Primal Edge product suite.
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
                  ? "bg-[#00d4aa] text-[#0a0e14] border-[#00d4aa]"
                  : "bg-transparent text-white/50 border-white/10 hover:border-[#00d4aa]/40 hover:text-white"
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
            <div className="bg-[#111820] border border-white/5 rounded-2xl p-6 space-y-4">
              <p className="font-mono text-[10px] text-white/30 tracking-widest mb-2">KEY METRICS</p>
              {active.stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-white/45 text-sm">{stat.label}</span>
                  <span className="font-mono font-bold text-[#00d4aa] text-sm">{stat.val}</span>
                </div>
              ))}

              {/* Divider */}
              <div className="pt-2">
                <div className="bg-[#0d1520] rounded-xl p-4">
                  <p className="font-mono text-[10px] text-white/25 tracking-widest mb-3">PIPELINE OVERVIEW</p>
                  <div className="space-y-2">
                    {[
                      { step: "01", label: "OHLCV Data Ingestion", active: activeTab === "ml" || activeTab === "pattern" },
                      { step: "02", label: "Feature Engineering", active: activeTab === "ml" },
                      { step: "03", label: "Pattern Matching Engine", active: activeTab === "pattern" },
                      { step: "04", label: "ML Scoring Model", active: activeTab === "ml" },
                      { step: "05", label: "Backtest Validation Layer", active: activeTab === "backtest" },
                      { step: "06", label: "Signal Generation & Dispatch", active: activeTab === "signal" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                        item.active ? "bg-[#00d4aa]/10 border border-[#00d4aa]/20" : ""
                      }`}>
                        <span className={`font-mono text-[10px] font-bold shrink-0 ${
                          item.active ? "text-[#00d4aa]" : "text-white/20"
                        }`}>{item.step}</span>
                        <span className={`text-xs ${
                          item.active ? "text-white/80" : "text-white/25"
                        }`}>{item.label}</span>
                        {item.active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse shrink-0" />
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
        <div className={`mt-10 bg-[#111820] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${inView ? "fade-up fade-up-delay-3" : "opacity-0"}`}>
          <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 16 16">
            <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <p className="text-white/35 text-xs leading-relaxed">
            <span className="text-white/55 font-semibold">Research Disclosure:</span> All backtesting results, model performance metrics, and statistical references presented on this page are derived from historical data and are provided for informational and educational purposes only. Past performance of any quantitative model or scanning algorithm does not guarantee future results. Market conditions change continuously, and no system — regardless of its sophistication — can predict future price movements with certainty. The Elastic Scanner is a research and educational tool, not a financial advisory service.
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
    <section className="py-16 sm:py-24 bg-[#0a0e14]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          {/* Left: Alert detail list */}
          <div className={`order-2 lg:order-1 ${inView ? "fade-up fade-up-delay-1" : "opacity-0"}`} ref={ref}>
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">INSTANT ALERTS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Your Phone Rings<br />When the Setup Fires
            </h2>
            <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-8">
              No more staring at charts all day. The Elastic Scanner monitors the market for you and sends a push notification the moment a Grade A or B Elastic Slingshot setup is confirmed.
            </p>
            <div className="space-y-4">
              {[
                { label: "Ticker Symbol", val: "NVDA" },
                { label: "Verdict", val: "BULLISH SLINGSHOT" },
                { label: "Score / Grade", val: "82 / A" },
                { label: "Price at Alert", val: "$875.20" },
                { label: "Key Context", val: "Elastic Slingshot confirmed, vol surge 2.1x" },
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
              <div className="bg-[#111820] border border-[#00d4aa]/20 rounded-2xl p-5 teal-glow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00d4aa] flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                      <path d="M2 14 Q5 4 9 9 Q13 14 16 4" stroke="#0a0e14" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Space_Grotesk'] font-bold text-white text-sm">Primal Edge</p>
                    <p className="font-mono text-[10px] text-white/40">just now</p>
                  </div>
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
                </div>
                <div className="bg-[#0d1520] rounded-xl p-4 space-y-2">
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
                  <span className="font-mono text-[10px] text-white/25">Elastic Slingshot confirmed</span>
                  <span className="font-mono text-[10px] text-[#00d4aa]">&lt; 3s delivery</span>
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
    <section id="pricing" className="py-16 sm:py-24 bg-[#0a0e14]">
      <div className="container">
        <div className="text-center mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">AI ACCESS PRICING</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Full AI Access.<br />One Flat Rate.
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-lg mx-auto">
            One tier. Complete AI scanner access. No upsells. This is a private group of serious, quantitatively-minded traders — seats are strictly limited.
          </p>
        </div>

        <div className={`max-w-md mx-auto ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
          <div className="bg-[#111820] border border-[#00d4aa]/30 rounded-2xl p-6 sm:p-8 teal-glow relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00d4aa]/5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white">Primal Edge — Elastic Slingshot Access</span>
                <span className="font-mono text-xs text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/20 px-3 py-1 rounded-full whitespace-nowrap">PRIVATE GROUP</span>
              </div>
              <div className="mb-6">
                <span className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl text-white">$49</span>
                <span className="text-white/40 text-base sm:text-lg">/month</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  "AI-powered scanner — premium multi-index universe",
                  "4x daily autonomous AI scan cycles",
                  "Instant AI push alerts via NTFY",
                  "ML-graded setups: A, B, C, D",
                  "On-demand AI web dashboard",
                  "Proprietary multi-dimension ML confidence scoring",
                  "Multi-timeframe AI confluence check",
                  "Intelligent signal deduplication",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-[#00d4aa] shrink-0" fill="none" viewBox="0 0 16 16">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-white/65 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/subscribe" className="shimmer-btn block w-full bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base py-4 rounded-lg hover:bg-[#00bfa0] transition-all pulse-glow text-center">
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
    { q: "What is the Primal Edge Elastic Slingshot Scanner?", a: "It is the flagship AI signal within the Primal Edge product suite — a proprietary adaptive intelligence system that identifies the Elastic Slingshot setup across a curated premium universe spanning multiple indices and proprietary watchlists. The engine assigns a 0–100 ML confidence score and grades each setup A through D. The exact model architecture and universe composition are proprietary — what matters is the output: high-probability, AI-graded signals delivered to your phone in real time." },
    { q: "What data does the AI model use?", a: "The AI engine ingests live market data across a curated premium universe on every scan cycle. The machine learning model encodes this raw data into a high-dimensional proprietary feature vector — capturing momentum, volatility regime, relative volume, trend state, and multi-timeframe confluence — before computing the final confidence score. The specific data sources and feature dimensions are not disclosed." },
    { q: "How do I receive the AI alerts?", a: "AI-generated alerts are delivered via NTFY, a free push notification service. Download the NTFY app on your phone, subscribe to the private topic provided after sign-up, and receive instant push notifications the moment the AI engine confirms a Grade A or B Elastic Slingshot signal." },
    { q: "What timeframe does the AI scanner use?", a: "The AI scanner uses a multi-timeframe evaluation approach, cross-referencing the primary scan timeframe against higher timeframe trend structure. The machine learning model applies a confluence bonus to trend-aligned setups and penalizes counter-trend signals — reflecting the statistical edge of trading with macro momentum. Setups are designed for swing trading with a typical 2–10 day holding period." },
    { q: "How was the AI model backtested?", a: "The model was backtested across a multi-year historical dataset using walk-forward analysis to validate out-of-sample performance. Survivorship bias was eliminated by evaluating the model against the full universe as it existed at each historical point in time. Key metrics included win rate by grade, average favorable excursion vs. maximum adverse excursion, and signal frequency across different volatility regimes. Detailed backtesting results are available to active subscribers only." },
    { q: "Is this financial advice?", a: "No. Primal Edge is an educational and informational tool. All AI-generated scan results are for research purposes only. Past model performance does not guarantee future results. Always conduct your own due diligence and consult a licensed financial advisor before making any investment decisions." },
    { q: "How many seats are available?", a: "This is a private, close-group service. Seats are strictly limited to maintain AI signal quality and ensure every subscriber receives timely, low-noise alerts. Once the group is full, a waitlist will open." },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#0d1520]">
      <div className="container max-w-3xl">
        <div className="mb-10 sm:mb-16 text-center" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">FAQ</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">Common Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className={`bg-[#111820] border rounded-xl overflow-hidden transition-all ${open === i ? "border-[#00d4aa]/30" : "border-white/5"} ${inView ? `fade-up fade-up-delay-${Math.min(i + 1, 5)}` : "opacity-0"}`}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-start justify-between px-5 sm:px-6 py-4 text-left gap-4">
                <span className="font-['Space_Grotesk'] font-medium text-white text-sm leading-snug">{faq.q}</span>
                <svg className={`w-4 h-4 text-[#00d4aa] shrink-0 mt-0.5 transition-transform ${open === i ? "rotate-45" : ""}`} fill="none" viewBox="0 0 16 16">
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
    <section className="py-16 sm:py-24 bg-[#0a0e14]">
      <div className="container">
        <div ref={ref} className={`relative bg-gradient-to-br from-[#0d1a14] to-[#0a0e14] border border-[#00d4aa]/20 rounded-2xl p-8 sm:p-12 text-center overflow-hidden ${inView ? "fade-up" : "opacity-0"}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/hero-bg-WRuxyzjuQc2Zg7wTqtkdku.webp)`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0e14]/80" />
          <div className="relative">
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-4">AI ACCESS — LIMITED SEATS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Stop Guessing.<br />Let the AI Find the Setup.
            </h2>
            <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Join a private group of quantitatively-minded traders using the Primal Edge AI signal suite — starting with the Elastic Slingshot — to identify high-probability breakout setups before the move, powered by adaptive intelligence and delivered in real time.
            </p>
            <Link href="/subscribe" className="shimmer-btn pulse-glow inline-block bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base sm:text-lg px-8 sm:px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all">
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
    <footer className="bg-[#0d1520] border-t border-white/5 py-10 sm:py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center">
            <PrimalEdgeLogo size="md" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/30">
            <a href="#how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#technology" className="hover:text-white/60 transition-colors">Technology</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white/60 transition-colors">FAQ</a>
            <Link href="/subscribe" className="hover:text-[#00d4aa] transition-colors">Subscribe</Link>
          </div>
          <p className="text-white/20 text-xs text-center">
            © 2025 Primal Edge — Adaptive Intelligence. Decisive Signals. For educational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0e14" }}>
      <Navbar />
      <TickerTape />
      <Hero />
      <Stats />
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
