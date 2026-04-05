/* ============================================================
   ELASTIC SIGNAL DESIGN SYSTEM — Home Page
   Mobile-first responsive layout
   Colors: #0a0e14 bg, #00d4aa teal, #22c55e bull, #ef4444 bear
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
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
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#00d4aa] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 14 Q5 4 9 9 Q13 14 16 4" stroke="#0a0e14" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-lg text-white tracking-tight">Elastic<span className="text-[#00d4aa]">Scanner</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#how-it-works" className="hover:text-[#00d4aa] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[#00d4aa] transition-colors">Features</a>
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
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6 fade-up fade-up-delay-1">
              <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              <span className="font-mono text-xs text-[#00d4aa] tracking-wider">LIVE SCANNER ACTIVE</span>
            </div>

            <h1 className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-6 fade-up fade-up-delay-2">
              Catch the<br />
              <span className="text-[#00d4aa] teal-text-glow">Slingshot</span><br />
              Before It Fires
            </h1>

            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg fade-up fade-up-delay-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The Elastic Slingshot algorithm scans the S&P 500 in real time, identifying high-probability breakout setups before the move happens. Graded A–D. Delivered to your phone instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 fade-up fade-up-delay-4">
              <Link href="/subscribe" className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base px-8 py-3.5 rounded hover:bg-[#00bfa0] transition-all text-center">
                Start Scanning Now →
              </Link>
              <a href="#how-it-works" className="border border-white/15 text-white/70 font-['Space_Grotesk'] font-medium text-base px-8 py-3.5 rounded hover:border-[#00d4aa]/40 hover:text-white transition-all text-center">
                See How It Works
              </a>
            </div>

            <div className="flex items-center gap-4 mt-8 fade-up fade-up-delay-5">
              <div className="flex -space-x-2">
                {["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0e14]" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-white/50 text-sm"><span className="text-white font-semibold">200+</span> traders already subscribed</p>
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
                <span className="font-mono text-xs text-white/40">elastic_scanner.py — LIVE</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                  <span className="font-mono text-xs text-[#00d4aa]">SCANNING S&P 500</span>
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
                <span className="font-mono text-[10px] text-white/25">503 symbols scanned</span>
                <span className="font-mono text-[10px] text-[#00d4aa]">{visibleRows} setups found</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile scan preview — shown below copy on small screens */}
        <div className="lg:hidden mt-10">
          <div className="bg-[#111820] border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#0d1520] border-b border-white/5">
              <span className="font-mono text-[10px] text-white/40">elastic_scanner.py</span>
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
    { label: "S&P 500 Symbols Scanned", value: 503, suffix: "" },
    { label: "Scans Per Day (Auto)", value: 4, suffix: "x" },
    { label: "Scoring Factors", value: 18, suffix: "+" },
    { label: "Alert Delivery", value: 3, suffix: "s" },
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
    { num: "01", title: "Market Data Pulled", desc: "Every 4 hours, the engine fetches live price data for all 503 S&P 500 symbols. No manual input required.", icon: "📡" },
    { num: "02", title: "Elastic Slingshot Applied", desc: "Each symbol is evaluated against the full Elastic Slingshot algorithm — a proprietary multi-factor system that identifies high-probability breakout setups with precision.", icon: "⚡" },
    { num: "03", title: "Setups Graded A–D", desc: "Qualifying setups are scored 0–100 and graded A through D based on overall confluence. Only the highest-quality setups surface to the top.", icon: "🏆" },
    { num: "04", title: "Alert Sent Instantly", desc: "Grade A and B setups trigger an instant push notification to your phone via NTFY. You see the ticker, verdict, score, grade, and key context — all in one message.", icon: "🔔" },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#0a0e14]">
      <div className="container">
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">HOW IT WORKS</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
            From Market Open<br />to Alert in Seconds
          </h2>
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
    { num: "01", title: "Elastic Slingshot Algorithm", desc: "The core engine identifies stocks meeting the precise Elastic Slingshot criteria — a proprietary set of conditions that historically precede explosive directional moves.", tag: "CORE ENGINE" },
    { num: "02", title: "Multi-Timeframe Grading", desc: "Each setup is evaluated across multiple timeframes. A Grade A setup requires strong confluence across all of them — filtering out noise and surfacing only the highest-conviction setups.", tag: "SIGNAL QUALITY" },
    { num: "03", title: "Multi-Factor Scoring System", desc: "Momentum, sector strength, market conditions, relative volume, trend strength, and quality filters are all combined into a single 0–100 score that ranks every setup objectively.", tag: "SCORING" },
    { num: "04", title: "Instant NTFY Push Alerts", desc: "When a Grade A or B Elastic Slingshot fires, you get a push notification on your phone within seconds — no email, no delay. The alert includes the ticker, verdict, score, grade, and key context.", tag: "DELIVERY" },
    { num: "05", title: "On-Demand Web Dashboard", desc: "Log into the subscriber dashboard at any time to manually trigger a scan, view the full results table, and filter by grade. Your scan history is saved so you can review past setups.", tag: "DASHBOARD" },
    { num: "06", title: "Deduplication & Anti-Spam", desc: "The system tracks every alert sent. If a ticker already triggered an alert today, it won't fire again — keeping your notifications clean, focused, and actionable.", tag: "INTELLIGENCE" },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#0d1520]">
      <div className="container">
        <div className="mb-10 sm:mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">FEATURES</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl">
            Built for Traders<br />Who Demand Edge
          </h2>
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
                    <p className="font-['Space_Grotesk'] font-bold text-white text-sm">ElasticScanner</p>
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
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">PRICING</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Simple, Transparent Access
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-lg mx-auto">
            One tier. Full access. No upsells. This is a private group of serious traders — seats are limited.
          </p>
        </div>

        <div className={`max-w-md mx-auto ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
          <div className="bg-[#111820] border border-[#00d4aa]/30 rounded-2xl p-6 sm:p-8 teal-glow relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00d4aa]/5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white">Elastic Slingshot — Full Access</span>
                <span className="font-mono text-xs text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/20 px-3 py-1 rounded-full whitespace-nowrap">PRIVATE GROUP</span>
              </div>
              <div className="mb-6">
                <span className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl text-white">$49</span>
                <span className="text-white/40 text-base sm:text-lg">/month</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  "Live S&P 500 scanner (503 symbols)",
                  "4x daily automated scans",
                  "Instant NTFY push alerts",
                  "Grade A–D setup filtering",
                  "On-demand web dashboard",
                  "Proprietary Elastic Slingshot scoring",
                  "Multi-timeframe confirmation",
                  "Deduplication & anti-spam",
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
    { q: "What is the Elastic Slingshot?", a: "It's a proprietary trading setup that identifies stocks meeting a specific set of conditions that historically precede sharp directional moves. The exact criteria are proprietary — what matters is the output: high-probability, graded setups delivered to you in real time." },
    { q: "What data source does the scanner use?", a: "The scanner pulls live price data for all 503 S&P 500 symbols from a reliable market data provider. Data is fetched fresh on every scan run to ensure accuracy." },
    { q: "How do I receive the alerts?", a: "Alerts are delivered via NTFY, a free push notification service. You download the NTFY app on your phone, subscribe to the private topic, and receive instant push notifications whenever a qualifying setup is found." },
    { q: "What timeframe does the scanner use?", a: "The scanner uses a multi-timeframe approach, evaluating setups across intraday and higher timeframes for confluence. It is designed for swing trading setups with a typical 2–10 day holding period." },
    { q: "Is this financial advice?", a: "No. The Elastic Scanner is an educational and informational tool. All scan results are for research purposes only. Always conduct your own due diligence and consult a licensed financial advisor before making any investment decisions." },
    { q: "How many seats are available?", a: "This is a private, close-group service. Seats are limited to maintain signal quality and ensure every subscriber gets timely access. Once the group is full, a waitlist will open." },
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
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-4">LIMITED SEATS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Stop Missing the Move.<br />Start Scanning with Edge.
            </h2>
            <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Join a private group of serious traders using the Elastic Slingshot scanner to find high-probability setups before they break out.
            </p>
            <Link href="/subscribe" className="shimmer-btn pulse-glow inline-block bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base sm:text-lg px-8 sm:px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all">
              Get Access Now →
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00d4aa] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M2 14 Q5 4 9 9 Q13 14 16 4" stroke="#0a0e14" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-white">Elastic<span className="text-[#00d4aa]">Scanner</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/30">
            <a href="#how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white/60 transition-colors">FAQ</a>
            <Link href="/subscribe" className="hover:text-[#00d4aa] transition-colors">Subscribe</Link>
          </div>
          <p className="text-white/20 text-xs text-center">
            © 2025 ElasticScanner. For educational purposes only. Not financial advice.
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
      <AlertPreview />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
