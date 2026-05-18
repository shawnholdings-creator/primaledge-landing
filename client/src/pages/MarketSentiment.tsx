/* ============================================================
   MarketSentiment.tsx — Live product page
   Shows the sample watermarked TradingView Market Sentiment overlay
   ============================================================ */

import Navbar from "../components/Navbar";
import { Link } from "wouter";

export default function MarketSentiment() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0e14] pt-32 pb-32">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#00d4aa] tracking-widest mb-4 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              LIVE PRODUCT
            </div>
            <h1 className="font-['Space_Grotesk'] font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
              Market Sentiment
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              A proprietary TradingView overlay that delivers real-time multi-timeframe sentiment analysis across major indices and Mag-7 tickers — conviction, streak, sector flow, and directional alignment in one unified dashboard panel.
            </p>
          </div>

          {/* Overall Market Sentiment — Indicator Overview Card */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="relative bg-[#111820] border border-[#00d4aa]/15 rounded-2xl overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#00d4aa]/0 via-[#00d4aa] to-[#00d4aa]/0" />
              <div className="p-6 sm:p-8 lg:p-10">
                {/* Indicator badge + title */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5">
                  <span className="font-mono text-[10px] text-[#00d4aa]/70 tracking-widest bg-[#00d4aa]/8 border border-[#00d4aa]/15 rounded px-2.5 py-1 inline-block w-fit">INDICATOR</span>
                  <h2 className="font-['Space_Grotesk'] font-bold text-2xl sm:text-3xl text-white">
                    Overall Market Sentiment
                  </h2>
                </div>

                {/* Description */}
                <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Overall Market Sentiment is a real-time command layer that translates broad market conditions into a clean, trader-ready readout. It synthesizes index behavior, multi-timeframe bias, sector participation, volatility, options-flow pressure, and symbol-level alignment into one compact sentiment panel.
                </p>

                {/* Trader Value box */}
                <div className="bg-[#00d4aa]/5 border border-[#00d4aa]/10 rounded-lg px-4 sm:px-5 py-4 mb-6">
                  <p className="font-mono text-[10px] text-[#00d4aa]/70 tracking-widest mb-2">WHY TRADERS CARE</p>
                  <p className="text-white/55 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Less guesswork, less chart-hopping, and faster context on whether the tape is bullish, defensive, sector-led, or mixed — before reviewing individual setups.
                  </p>
                </div>

                {/* Key capabilities strip */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Index Behavior", "MTF Bias", "Sector Participation", "Volatility Regime", "Options Flow", "Symbol Alignment"].map((item, i) => (
                    <span key={i} className="font-mono text-[10px] text-white/30 tracking-wider bg-white/3 border border-white/5 rounded-full px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>

                {/* CTA row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Link href="/subscribe">
                    <button className="shimmer-btn bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#00bfa0] transition-all overflow-hidden relative">
                      <span className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/0 via-white/15 to-[#00d4aa]/0 animate-shimmer" />
                      <span className="relative">View Market Sentiment →</span>
                    </button>
                  </Link>
                  <span className="text-white/25 text-xs font-mono tracking-wider">Educational & analysis purposes only</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Image */}
          <div className="relative max-w-5xl mx-auto mb-12 sm:mb-16">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 teal-glow">
              <img
                src="/market_sentiment_sample.png"
                alt="Market Sentiment — Sample Preview"
                className="w-full h-auto"
                loading="eager"
              />
              {/* SAMPLE overlay badge */}
              <div className="absolute top-4 left-4 font-mono text-xs font-bold tracking-widest text-white/60 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
                SAMPLE PREVIEW
              </div>
            </div>
            <p className="text-center text-white/30 text-xs font-mono mt-3 tracking-wider">
              Live TradingView overlay — real-time data shown to active subscribers only
            </p>
          </div>

          {/* Feature Grid */}
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
            {[
              { icon: "🟢", title: "Overall Verdict", desc: "BULLISH or BEARISH — a single conviction-weighted verdict across all monitored timeframes and tickers." },
              { icon: "🔥", title: "Conviction Level", desc: "LOW, MODERATE, or HIGH — quantified confidence in the current directional bias based on internal signal density." },
              { icon: "📊", title: "Streak Tracking", desc: "How many consecutive sessions the sentiment has maintained its direction — identifying sustained trends vs. reversals." },
              { icon: "⚡", title: "Volatility & Participation", desc: "Real-time volatility regime and market participation breadth — know whether the market is quiet or loaded." },
              { icon: "🏦", title: "Sector Flow", desc: "Identifies the hottest rotating sector and tracks options flow bias (Calls Heavy vs. Puts Heavy) across the market." },
              { icon: "📱", title: "Mag-7 + Index Grid", desc: "11-symbol grid showing 1D, 1W, and Coil status for every major index and Mag-7 name — instant multi-timeframe alignment." },
            ].map((item, i) => (
              <div key={i} className="bg-[#111820] border border-white/5 rounded-xl p-5 hover:border-[#00d4aa]/20 transition-colors group">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-white text-sm sm:text-base mb-2 group-hover:text-[#00d4aa] transition-colors">{item.title}</h3>
                <p className="text-white/40 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/subscribe">
              <button className="shimmer-btn pulse-glow bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base px-10 py-4 rounded-lg hover:bg-[#00bfa0] transition-all overflow-hidden relative">
                <span className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/0 via-white/15 to-[#00d4aa]/0 animate-shimmer" />
                <span className="relative">Get Access to Market Sentiment →</span>
              </button>
            </Link>
            <p className="text-white/25 text-xs font-mono mt-4 tracking-wider">
              Included with all Primal Edge subscriptions
            </p>
          </div>

          {/* Disclaimer */}
          <div className="max-w-4xl mx-auto mt-12 bg-[#111820] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
              <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <p className="text-white/35 text-xs leading-relaxed">
              <span className="text-white/55 font-semibold">Disclaimer:</span> Market Sentiment is an educational and analytical tool. Sentiment readings, conviction levels, and directional labels are derived from historical and real-time data and do not constitute financial advice or a recommendation to buy, sell, or hold any security.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
