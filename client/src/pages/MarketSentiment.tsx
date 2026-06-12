/* ============================================================
   MarketSentiment.tsx — Standalone product page
   Private-access market intelligence layer
   Design: dark premium, AI/quant, proprietary
   ============================================================ */

import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Link } from "wouter";

const PILLARS = [
  {
    icon: "◆",
    title: "Market Bias",
    desc: "A single directional verdict — bullish, bearish, or neutral — derived from the composite behavior of major indices across multiple timeframes. No ambiguity, no guesswork.",
    tag: "DIRECTIONAL",
  },
  {
    icon: "◆",
    title: "Participation Quality",
    desc: "Measures how broadly the market is confirming its direction. High participation means conviction is widespread; low participation signals fragile, narrow leadership.",
    tag: "BREADTH",
  },
  {
    icon: "◆",
    title: "Volatility Pressure",
    desc: "Real-time volatility regime classification — compressed, normal, or elevated. Traders instantly see whether the tape favors breakout entries or defensive positioning.",
    tag: "REGIME",
  },
  {
    icon: "◆",
    title: "Sector Rotation",
    desc: "Identifies which sector is absorbing the most capital flow in the current session. Tracks the hottest rotation in real time so traders know where institutional energy is concentrating.",
    tag: "FLOW",
  },
  {
    icon: "◆",
    title: "Options-Flow Tone",
    desc: "Quantifies whether aggregate options activity is leaning calls-heavy, puts-heavy, or balanced — an indirect read on how the derivatives market is positioning for near-term direction.",
    tag: "DERIVATIVES",
  },
  {
    icon: "◆",
    title: "Streak Dynamics",
    desc: "Tracks how many consecutive sessions the sentiment has maintained its current direction. Sustained streaks confirm trend persistence; breaks signal potential regime shifts.",
    tag: "PERSISTENCE",
  },
  {
    icon: "◆",
    title: "Key-Symbol Alignment",
    desc: "An 11-symbol grid monitoring every major index and high-impact name across daily, weekly, and compression timeframes — instant visual confirmation of broad directional agreement.",
    tag: "MULTI-TF",
  },
];

function MarketSentimentContent() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0e14]">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00d4aa]/5 rounded-full blur-[120px]" />
          </div>

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] text-[#00d4aa]/70 tracking-widest bg-[#00d4aa]/8 border border-[#00d4aa]/15 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                PRIVATE ACCESS · INTELLIGENCE LAYER
              </div>

              <h1 className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 leading-tight">
                Market Sentiment
              </h1>

              <p className="font-['Space_Grotesk'] text-lg sm:text-xl text-[#00d4aa]/80 mb-6">
                Read the market state. Filter the noise. Focus the opportunity.
              </p>

              <p className="text-white/45 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Overall Market Sentiment is a private-access intelligence layer built to decode the live market state into a single actionable dashboard. It synthesizes market bias, participation quality, volatility pressure, sector rotation, options-flow tone, streak dynamics, and key-symbol alignment into a clean visual readout designed for fast interpretation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/subscribe">
                  <button className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base px-8 py-3.5 rounded-lg hover:bg-[#00bfa0] transition-all overflow-hidden relative w-full sm:w-auto">
                    <span className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/0 via-white/15 to-[#00d4aa]/0 animate-shimmer" />
                    <span className="relative">Request Market Sentiment Access</span>
                  </button>
                </Link>
                <a href="#preview" className="border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-['Space_Grotesk'] font-semibold text-base px-8 py-3.5 rounded-lg transition-all w-full sm:w-auto text-center">
                  Preview the Sentiment Layer ↓
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── VISUAL PRODUCT PREVIEW ────────────────────────────── */}
        <section id="preview" className="pb-16 sm:pb-24">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              {/* Preview label */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <span className="font-mono text-[10px] text-white/25 tracking-widest">SAMPLE READOUT</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* Sample image with frame */}
              <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0d1117]">
                {/* Top bar mock */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1117] border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="font-mono text-[10px] text-white/20 ml-3 tracking-wider">MARKET SENTIMENT — PRIVATE INTELLIGENCE LAYER</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                    <span className="font-mono text-[10px] text-[#00d4aa]/60 tracking-wider">LIVE</span>
                  </div>
                </div>

                {/* Image with watermark */}
                <div className="relative">
                  <img
                    src="/market_sentiment_sample.png"
                    alt="Market Sentiment — Sample Intelligence Readout"
                    className="w-full h-auto"
                    loading="eager"
                  />
                  {/* Diagonal SAMPLE watermark — repeating grid */}
                  <div
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                    style={{ zIndex: 2 }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-50%",
                        left: "-50%",
                        width: "200%",
                        height: "200%",
                        display: "flex",
                        flexWrap: "wrap",
                        alignContent: "center",
                        justifyContent: "center",
                        gap: "60px 80px",
                        transform: "rotate(-35deg)",
                      }}
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: "clamp(2rem, 5vw, 3.5rem)",
                            fontWeight: 900,
                            letterSpacing: "0.2em",
                            color: "rgba(255,255,255,0.07)",
                            textTransform: "uppercase",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          SAMPLE
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-white/20 text-xs font-mono mt-4 tracking-wider">
                Sample readout — live data available to private-access subscribers only
              </p>
            </div>
          </div>
        </section>

        {/* ── TRADER VALUE BRIDGE ────────────────────────────────── */}
        <section className="py-12 sm:py-16 border-y border-white/5 bg-[#0d1117]/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-white/50 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                For traders, this creates a more disciplined decision backdrop: understand when the environment supports momentum, when conditions are fragmented, and when selectivity should take priority over activity.
              </p>
            </div>
          </div>
        </section>

        {/* ── SEVEN PILLARS ─────────────────────────────────────── */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <div className="text-center mb-12 sm:mb-16">
              <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">INTELLIGENCE DIMENSIONS</p>
              <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
                Seven Layers of<br />Market Context
              </h2>
            </div>

            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {PILLARS.map((pillar, i) => (
                <div
                  key={i}
                  className={`relative bg-[#111820] border border-white/5 rounded-xl p-6 hover:border-[#00d4aa]/20 transition-all group ${
                    i === 6 ? "sm:col-span-2 lg:col-span-1 sm:max-w-md sm:mx-auto lg:max-w-none" : ""
                  }`}
                >
                  {/* Tag */}
                  <span className="font-mono text-[9px] text-[#00d4aa]/50 tracking-widest bg-[#00d4aa]/5 border border-[#00d4aa]/10 rounded px-2 py-0.5 mb-4 inline-block">
                    {pillar.tag}
                  </span>

                  {/* Number */}
                  <div className="absolute top-5 right-5 font-['Space_Grotesk'] text-4xl font-bold text-white/3">
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  <h3 className="font-['Space_Grotesk'] font-semibold text-base sm:text-lg text-white mb-3 group-hover:text-[#00d4aa] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONVERSION SECTION ────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-[#0a0e14] to-[#0d1117]">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#111820] border border-[#00d4aa]/10 rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#00d4aa]/0 via-[#00d4aa] to-[#00d4aa]/0" />
                <div className="p-8 sm:p-12 lg:p-14">
                  <div className="text-center mb-10">
                    <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">PRIVATE ACCESS</p>
                    <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl text-white mb-4">
                      Clearer Context. Reduced Noise.
                    </h2>
                    <p className="text-white/45 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Market Sentiment gives you the environmental read before you commit to a position. Instead of reacting to isolated charts, you operate from a structured view of the market's current state.
                    </p>
                  </div>

                  {/* Value propositions */}
                  <div className="grid sm:grid-cols-3 gap-6 mb-10">
                    {[
                      {
                        icon: "🔒",
                        title: "Private Access",
                        desc: "Exclusive intelligence layer available only to verified subscribers. Not a public feed.",
                      },
                      {
                        icon: "🎯",
                        title: "Clearer Market Context",
                        desc: "Seven dimensions of market state — synthesized into one clean, fast-read dashboard.",
                      },
                      {
                        icon: "🔇",
                        title: "Reduced Noise",
                        desc: "Stop cycling through charts and feeds. One glance tells you whether conditions support action or patience.",
                      },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <h3 className="font-['Space_Grotesk'] font-semibold text-white text-sm mb-2">{item.title}</h3>
                        <p className="text-white/35 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/subscribe">
                      <button className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all overflow-hidden relative w-full sm:w-auto">
                        <span className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/0 via-white/15 to-[#00d4aa]/0 animate-shimmer" />
                        <span className="relative">Request Market Sentiment Access</span>
                      </button>
                    </Link>
                    <a href="#preview" className="border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-['Space_Grotesk'] font-semibold text-sm px-8 py-3.5 rounded-lg transition-all w-full sm:w-auto text-center">
                      Preview the Sentiment Layer ↑
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── DISCLAIMER ───────────────────────────────────────── */}
        <section className="pb-32">
          <div className="container">
            <div className="max-w-4xl mx-auto bg-[#111820] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex items-start gap-3">
              <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
                <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <p className="text-white/35 text-xs leading-relaxed">
                <span className="text-white/55 font-semibold">Research Disclosure:</span> Market Sentiment is an educational and analytical intelligence tool. Sentiment readings, conviction levels, directional labels, and all visual readouts are derived from proprietary analysis of historical and real-time data. They are provided for informational purposes only and do not constitute financial advice or a recommendation to buy, sell, or hold any security. Past performance of any model or analytical system does not guarantee future results.
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}

/* ─── Main Export — Auth Protected ─────────────────────────── */
export default function MarketSentiment() {
  return (
    <ProtectedRoute product="sentiment">
      <MarketSentimentContent />
    </ProtectedRoute>
  );
}
