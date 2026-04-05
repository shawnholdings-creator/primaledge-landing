/* ============================================================
   ELASTIC SIGNAL DESIGN SYSTEM — Home Page
   Sections: Navbar, Ticker Tape, Hero, Stats, How It Works,
             Features, Alerts, Pricing, FAQ, Footer
   Colors: #0a0e14 bg, #00d4aa teal, #22c55e bull, #ef4444 bear
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
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

// ── Mock scan results ─────────────────────────────────────────
const SCAN_ROWS = [
  { sym: "AAPL", verdict: "BULLISH SLINGSHOT", score: 82, grade: "A", price: "185.50", ext: "0.4x", comp: "YES", adx: "28.4", vol: "1.8x" },
  { sym: "NVDA", verdict: "READY", score: 71, grade: "B", price: "875.20", ext: "0.7x", comp: "YES", adx: "32.1", vol: "1.4x" },
  { sym: "META", verdict: "BULLISH SLINGSHOT", score: 79, grade: "A", price: "512.40", ext: "0.5x", comp: "YES", adx: "30.8", vol: "2.1x" },
  { sym: "MSFT", verdict: "COIL", score: 58, grade: "B", price: "415.30", ext: "0.3x", comp: "YES", adx: "22.7", vol: "1.2x" },
  { sym: "V", verdict: "BULLISH SLINGSHOT", score: 76, grade: "A", price: "278.90", ext: "0.6x", comp: "YES", adx: "27.3", vol: "1.6x" },
];

// ── Helpers ───────────────────────────────────────────────────
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

// ── Intersection Observer hook ────────────────────────────────
function useInView(threshold = 0.15) {
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

// ── Animated counter ──────────────────────────────────────────
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
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0e14]/95 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#00d4aa] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 14 Q5 4 9 9 Q13 14 16 4" stroke="#0a0e14" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-lg text-white tracking-tight">Elastic<span className="text-[#00d4aa]">Scanner</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#how-it-works" className="hover:text-[#00d4aa] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[#00d4aa] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[#00d4aa] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[#00d4aa] transition-colors">FAQ</a>
        </div>
        <button
          onClick={() => toast.info("Subscription portal coming soon!")}
          className="shimmer-btn bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-semibold text-sm px-5 py-2 rounded hover:bg-[#00bfa0] transition-colors"
        >
          Get Access
        </button>
      </div>
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
      className="relative min-h-screen flex items-center pt-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0e14 0%, #0d1520 50%, #0a0e14 100%)" }}
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/hero-bg-WRuxyzjuQc2Zg7wTqtkdku.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e14] via-[#0a0e14]/80 to-transparent" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6 fade-up fade-up-delay-1">
              <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              <span className="font-mono text-xs text-[#00d4aa] tracking-wider">LIVE SCANNER ACTIVE</span>
            </div>

            <h1 className="font-['Space_Grotesk'] font-bold text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-6 fade-up fade-up-delay-2">
              Catch the<br />
              <span className="text-[#00d4aa] teal-text-glow">Slingshot</span><br />
              Before It Fires
            </h1>

            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg fade-up fade-up-delay-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The Elastic Slingshot algorithm scans the S&P 500 in real time, identifying high-probability breakout setups before the move happens. Graded A–D. Delivered to your phone instantly.
            </p>

            <div className="flex flex-wrap gap-4 fade-up fade-up-delay-4">
              <button
                onClick={() => toast.info("Subscription portal coming soon!")}
                className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base px-8 py-3.5 rounded hover:bg-[#00bfa0] transition-all"
              >
                Start Scanning Now →
              </button>
              <a href="#how-it-works" className="border border-white/15 text-white/70 font-['Space_Grotesk'] font-medium text-base px-8 py-3.5 rounded hover:border-[#00d4aa]/40 hover:text-white transition-all">
                See How It Works
              </a>
            </div>

            <div className="flex items-center gap-6 mt-8 fade-up fade-up-delay-5">
              <div className="flex -space-x-2">
                {["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0e14]" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-white/50 text-sm"><span className="text-white font-semibold">200+</span> traders already subscribed</p>
            </div>
          </div>

          {/* Right: Live scan mock */}
          <div className="hidden lg:block">
            <div className="bg-[#111820] border border-white/8 rounded-xl overflow-hidden teal-glow">
              {/* Terminal header */}
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

              {/* Table header */}
              <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-[#0d1520]/50 border-b border-white/5">
                {["TICKER","VERDICT","SCORE","GRADE","PRICE"].map(h => (
                  <span key={h} className="font-mono text-[10px] text-white/30 tracking-widest">{h}</span>
                ))}
              </div>

              {/* Animated rows */}
              <div className="divide-y divide-white/5">
                {SCAN_ROWS.slice(0, visibleRows).map((row, i) => (
                  <div key={i} className="scan-row grid grid-cols-5 gap-2 px-4 py-3 hover:bg-white/3 transition-colors" style={{ animationDelay: `${i * 0.1}s` }}>
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

              {/* Footer */}
              <div className="px-4 py-2 bg-[#0d1520]/50 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/25">503 symbols scanned</span>
                <span className="font-mono text-[10px] text-[#00d4aa]">{visibleRows} setups found</span>
              </div>
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
    { label: "Alert Delivery (Seconds)", value: 3, suffix: "s" },
  ];
  return (
    <section ref={ref} className="py-16 bg-[#0d1520] border-y border-white/5">
      <div className="container grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-[#00d4aa] mb-2">
              {inView ? <Counter to={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <p className="text-white/40 text-sm">{s.label}</p>
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
    {
      num: "01",
      title: "Market Data Pulled",
      desc: "Every 4 hours, the engine fetches live price data for all 503 S&P 500 symbols. No manual input required.",
      icon: "📡",
    },
    {
      num: "02",
      title: "Elastic Slingshot Applied",
      desc: "Each symbol is evaluated against the full Elastic Slingshot algorithm — a proprietary multi-factor system that identifies high-probability breakout setups with precision.",
      icon: "⚡",
    },
    {
      num: "03",
      title: "Setups Graded A–D",
      desc: "Qualifying setups are scored 0–100 and graded A through D based on overall confluence. Only the highest-quality setups surface to the top.",
      icon: "🏆",
    },
    {
      num: "04",
      title: "Alert Sent Instantly",
      desc: "Grade A and B setups trigger an instant push notification to your phone via NTFY. You see the ticker, verdict, score, grade, and key context — all in one message.",
      icon: "🔔",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#0a0e14]">
      <div className="container">
       <div className="mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">HOW IT WORKS</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white">
            From Market Open<br />to Alert in Seconds
          </h2>
        </div>

        {/* Horizontal step flow */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4aa]/20 to-transparent" />

          <div className="grid lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative ${inView ? `fade-up fade-up-delay-${i + 1}` : "opacity-0"}`}
              >
                {/* Step number */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/10 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-[#00d4aa]">{step.num}</span>
                  </div>
                  <div className="hidden lg:block flex-1 h-px bg-[#00d4aa]/10" />
                </div>
                <div className="text-2xl mb-3">{step.icon}</div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-lg text-white mb-2">{step.title}</h3>
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
    {
      num: "01",
      title: "Elastic Slingshot Algorithm",
      desc: "The core engine identifies stocks meeting the precise Elastic Slingshot criteria — a proprietary set of conditions that historically precede explosive directional moves.",
      tag: "CORE ENGINE",
    },
    {
      num: "02",
      title: "Multi-Timeframe Grading",
      desc: "Each setup is evaluated across multiple timeframes. A Grade A setup requires strong confluence across all of them — filtering out noise and surfacing only the highest-conviction setups.",
      tag: "SIGNAL QUALITY",
    },
    {
      num: "03",
      title: "Multi-Factor Scoring System",
      desc: "Momentum, sector strength, market conditions, relative volume, trend strength, and quality filters are all combined into a single 0–100 score that ranks every setup objectively.",
      tag: "SCORING",
    },
    {
      num: "04",
      title: "Instant NTFY Push Alerts",
      desc: "When a Grade A or B Elastic Slingshot fires, you get a push notification on your phone within seconds — no email, no delay. The alert includes the ticker, verdict, score, grade, and key context.",
      tag: "DELIVERY",
    },
    {
      num: "05",
      title: "On-Demand Web Dashboard",
      desc: "Log into the subscriber dashboard at any time to manually trigger a scan, view the full results table, and filter by grade. Your scan history is saved so you can review past setups.",
      tag: "DASHBOARD",
    },
    {
      num: "06",
      title: "Deduplication & Anti-Spam",
      desc: "The system tracks every alert sent. If a ticker already triggered an alert today, it won't fire again — keeping your notifications clean, focused, and actionable.",
      tag: "INTELLIGENCE",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#0d1520]">
      <div className="container">
        <div className="mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">FEATURES</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white max-w-2xl">
            Built for Traders<br />Who Demand Edge
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`relative bg-[#111820] border border-white/5 rounded-xl p-6 hover:border-[#00d4aa]/30 hover:bg-[#111820]/80 transition-all group ${inView ? `fade-up fade-up-delay-${Math.min(i + 1, 5)}` : "opacity-0"}`}
            >
              {/* Decorative section number */}
              <span className="absolute top-4 right-4 font-['Space_Grotesk'] font-bold text-5xl text-white/4 leading-none pointer-events-none">{f.num}</span>
              {/* Tag */}
              <span className="font-mono text-[10px] text-[#00d4aa]/70 tracking-widest bg-[#00d4aa]/8 border border-[#00d4aa]/15 rounded px-2 py-0.5 mb-4 inline-block">{f.tag}</span>
              {/* Left border accent on hover */}
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-[#00d4aa] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <h3 className="font-['Space_Grotesk'] font-semibold text-lg text-white mb-3 group-hover:text-[#00d4aa] transition-colors">{f.title}</h3>
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
    <section className="py-24 bg-[#0a0e14]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Phone mockup */}
          <div className={`flex justify-center ${inView ? "fade-up fade-up-delay-1" : "opacity-0"}`} ref={ref}>
            <div className="relative">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/ntfy-alert-Vo6us3BRFzPzVjCSX6DSXm.webp"
                alt="NTFY push alert on phone"
                className="w-64 rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 bg-[#00d4aa] text-[#0a0e14] font-mono text-xs font-bold px-3 py-1.5 rounded-full">
                &lt; 3s delivery
              </div>
            </div>
          </div>

          {/* Right: Copy */}
          <div className={inView ? "fade-up fade-up-delay-2" : "opacity-0"}>
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">INSTANT ALERTS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white mb-6">
              Your Phone Rings<br />When the Setup Fires
            </h2>
            <p className="text-white/55 text-lg leading-relaxed mb-8">
              No more staring at charts all day. The Elastic Scanner monitors the market for you and sends a push notification the moment a Grade A or B Elastic Slingshot setup is confirmed. Every alert includes the full context you need to act.
            </p>

            <div className="space-y-4">
              {[
                { label: "Ticker Symbol", val: "NVDA" },
                { label: "Verdict", val: "BULLISH SLINGSHOT" },
                { label: "Score / Grade", val: "82 / A" },
                { label: "Price at Alert", val: "$875.20" },
                { label: "Key Context", val: "Elastic Slingshot confirmed, vol surge 2.1x" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 teal-border-left">
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-white/30 tracking-widest block">{item.label}</span>
                    <span className="font-mono text-sm text-white/80">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Scanner Preview ───────────────────────────────────────────
function ScannerPreview() {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-[#0d1520]">
      <div className="container">
        <div className="text-center mb-12" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">LIVE DASHBOARD</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white mb-4">
            The Full Results Table,<br />On Demand
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Log in to the subscriber dashboard at any time to run a manual scan and view the complete results — sortable by grade, score, or verdict.
          </p>
        </div>

        <div className={`max-w-4xl mx-auto ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/scanner-mockup-2eqRnakZLLFJ9dFvBQGSCY.webp"
            alt="Elastic Scanner dashboard showing live scan results"
            className="w-full rounded-xl border border-white/8 shadow-2xl teal-glow"
          />
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────
function Pricing() {
  const { ref, inView } = useInView();
  return (
    <section id="pricing" className="py-24 bg-[#0a0e14]">
      <div className="container">
        <div className="text-center mb-16" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">PRICING</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white mb-4">
            Simple, Transparent Access
          </h2>
          <p className="text-white/50 text-lg max-w-lg mx-auto">
            One tier. Full access. No upsells. This is a private group of serious traders — seats are limited.
          </p>
        </div>

        <div className={`max-w-md mx-auto ${inView ? "fade-up fade-up-delay-2" : "opacity-0"}`}>
          <div className="bg-[#111820] border border-[#00d4aa]/30 rounded-2xl p-8 teal-glow relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00d4aa]/5 blur-3xl rounded-full" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <span className="font-['Space_Grotesk'] font-semibold text-lg text-white">Elastic Slingshot — Full Access</span>
                <span className="font-mono text-xs text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/20 px-3 py-1 rounded-full">PRIVATE GROUP</span>
              </div>

              <div className="mb-6">
                <span className="font-['Space_Grotesk'] font-bold text-5xl text-white">$49</span>
                <span className="text-white/40 text-lg">/month</span>
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

              <button
                onClick={() => toast.info("Subscription portal coming soon! Join the waitlist.")}
                className="shimmer-btn w-full bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base py-4 rounded-lg hover:bg-[#00bfa0] transition-all pulse-glow"
              >
                Get Access Now →
              </button>

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
    {
      q: "What is the Elastic Slingshot?",
      a: "It's a proprietary trading setup that identifies stocks meeting a specific set of conditions that historically precede sharp directional moves. The exact criteria are proprietary — what matters is the output: high-probability, graded setups delivered to you in real time.",
    },
    {
      q: "What data source does the scanner use?",
      a: "The scanner pulls live price data for all 503 S&P 500 symbols from a reliable market data provider. Data is fetched fresh on every scan run to ensure accuracy.",
    },
    {
      q: "How do I receive the alerts?",
      a: "Alerts are delivered via NTFY, a free push notification service. You download the NTFY app on your phone, subscribe to the private topic, and receive instant push notifications whenever a qualifying setup is found.",
    },
    {
      q: "What timeframe does the scanner use?",
      a: "The scanner uses a multi-timeframe approach, evaluating setups across intraday and higher timeframes for confluence. It is designed for swing trading setups with a typical 2–10 day holding period.",
    },
    {
      q: "Is this financial advice?",
      a: "No. The Elastic Scanner is an educational and informational tool. All scan results are for research purposes only. Always conduct your own due diligence and consult a licensed financial advisor before making any investment decisions.",
    },
    {
      q: "How many seats are available?",
      a: "This is a private, close-group service. Seats are limited to maintain signal quality and ensure every subscriber gets timely access. Once the group is full, a waitlist will open.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#0d1520]">
      <div className="container max-w-3xl">
        <div className="mb-16 text-center" ref={ref}>
          <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">FAQ</p>
          <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white">
            Common Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`bg-[#111820] border rounded-xl overflow-hidden transition-all ${open === i ? "border-[#00d4aa]/30" : "border-white/5"} ${inView ? `fade-up fade-up-delay-${Math.min(i + 1, 5)}` : "opacity-0"}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-['Space_Grotesk'] font-medium text-white text-sm">{faq.q}</span>
                <svg
                  className={`w-4 h-4 text-[#00d4aa] shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}
                  fill="none" viewBox="0 0 16 16"
                >
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-4">
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
    <section className="py-24 bg-[#0a0e14]">
      <div className="container">
        <div
          ref={ref}
          className={`relative bg-gradient-to-br from-[#0d1a14] to-[#0a0e14] border border-[#00d4aa]/20 rounded-2xl p-12 text-center overflow-hidden ${inView ? "fade-up" : "opacity-0"}`}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/hero-bg-WRuxyzjuQc2Zg7wTqtkdku.webp)`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0e14]/80" />
          <div className="relative">
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-4">LIMITED SEATS</p>
            <h2 className="font-['Space_Grotesk'] font-bold text-4xl lg:text-5xl text-white mb-6">
              Stop Missing the Move.<br />Start Scanning with Edge.
            </h2>
            <p className="text-white/55 text-lg max-w-xl mx-auto mb-8">
              Join a private group of serious traders using the Elastic Slingshot scanner to find high-probability setups before they break out.
            </p>
            <button
              onClick={() => toast.info("Subscription portal coming soon! Join the waitlist.")}
              className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-lg px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all"
            >
              Get Access Now →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0d1520] border-t border-white/5 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00d4aa] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M2 14 Q5 4 9 9 Q13 14 16 4" stroke="#0a0e14" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-white">Elastic<span className="text-[#00d4aa]">Scanner</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white/60 transition-colors">FAQ</a>
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
      <ScannerPreview />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
