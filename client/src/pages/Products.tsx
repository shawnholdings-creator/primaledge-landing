/* ============================================================
   Products.tsx — Primal Edge Product Suite
   Design: Elastic Signal — dark #0a0d12, teal #00e5a0 accent
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";

const PRODUCTS = [
  {
    id: "weekly-income",
    name: "Weekly Income Dashboard",
    tag: "LIVE",
    tag2: "FLAGSHIP",
    tagColor: "#00e5a0",
    description:
      "The flagship options income tool. Monitors the most actively traded stocks and ETFs for weekly income opportunities — scored by the AI conviction engine, filtered through proprietary intelligence layers, and delivered to your phone the moment a setup qualifies.",
    features: ["Income opportunities", "100-point scoring model", "Real-time phone alerts", "Premium stocks & ETFs universe"],
    strategyBadge: { text: "Income Strategy", color: "text-green-400", bg: "bg-green-400/10" },
    cta: "View Dashboard",
    ctaHref: "/weekly-income",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4v24" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M10 12l6-6 6 6" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 20l6 6 6-6" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="13" width="24" height="6" rx="3" stroke="#00e5a0" strokeWidth="1.5" opacity="0.4"/>
      </svg>
    ),
  },
  {
    id: "ai-dashboard",
    name: "Primal Edge AI Cockpit",
    tag: "BETA",
    tagColor: "#a855f7",
    description:
      "Live intelligence feed from the AI Cockpit engine. Real-time signal output with multi-timeframe, multi-index analysis powered by the v3.0 scoring engine. PIN-protected early access.",
    features: ["Live signal feed", "Backtest analytics", "Verdict ladder grading", "Multi-index scanning"],
    strategyBadge: { text: "Directional Strategy", color: "text-blue-400", bg: "bg-blue-400/10" },
    cta: "View Dashboard",
    ctaHref: "/ai-dashboard",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="4" stroke="#a855f7" strokeWidth="2.5"/>
        <path d="M10 20l4-6 4 4 6-8" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="20" r="1.5" fill="#a855f7"/>
        <circle cx="14" cy="14" r="1.5" fill="#a855f7"/>
        <circle cx="18" cy="18" r="1.5" fill="#a855f7"/>
        <circle cx="24" cy="10" r="1.5" fill="#a855f7"/>
      </svg>
    ),
  },
  {
    id: "ai-cockpit-scanner",
    name: "AI Cockpit Scanner",
    tag: "LIVE",
    tagColor: "#00e5a0",
    description:
      "The flagship Primal Edge AI signal engine. Monitors the most liquid stocks and ETFs across multiple indices in real time, identifying high-probability options setups graded A–D by the Primal Edge adaptive intelligence engine.",
    features: ["Real-time AI scanning", "A–D signal grading", "Instant push alerts", "Premium stocks & ETF universe"],
    strategyBadge: { text: "Directional Strategy", color: "text-blue-400", bg: "bg-blue-400/10" },
    cta: "View Dashboard",
    ctaHref: "/subscribe",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 24L12 14l6 6 10-14" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 10h6v6" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "bearish-scanner",
    name: "Bearish Reversal Scanner",
    tag: "COMING SOON",
    tagColor: "#f59e0b",
    description:
      "Identify high-probability bearish reversal and breakdown setups across the most liquid stocks and ETFs. Powered by the same adaptive intelligence engine as the AI Cockpit — optimized for short-side opportunities.",
    features: ["Short-side signal detection", "Multi-timeframe analysis", "AI-graded setups", "Instant alerts"],
    strategyBadge: { text: "Directional Strategy", color: "text-blue-400", bg: "bg-blue-400/10" },
    cta: "Join Waitlist",
    ctaHref: "/subscribe",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 8L12 18l6-6 10 14" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 22h6v-6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "options-scanner",
    name: "Options Flow Scanner",
    tag: "IN DEV",
    tagColor: "#3b82f6",
    description:
      "Track unusual options activity and institutional flow in real time. Surface high-conviction directional bets before the crowd catches on — powered by Primal Edge's proprietary signal intelligence.",
    features: ["Unusual options activity", "Institutional flow tracking", "Timing & structure analysis", "AI conviction scoring"],
    strategyBadge: { text: "Flow Intelligence", color: "text-purple-400", bg: "bg-purple-400/10" },
    cta: "Join Waitlist",
    ctaHref: "/subscribe",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="10" stroke="#f59e0b" strokeWidth="2.5"/>
        <path d="M16 10v6l4 4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "earnings-scanner",
    name: "Earnings Volatility Scanner",
    tag: "COMING SOON",
    tagColor: "#f59e0b",
    description:
      "Quantify expected move, volatility conditions, and historical earnings drift to identify the highest-probability earnings plays. Know exactly which setups offer edge before the catalyst hits.",
    features: ["Expected range analysis", "Volatility regime analysis", "Historical drift scoring", "Pre-earnings setups"],
    strategyBadge: { text: "Income Strategy", color: "text-green-400", bg: "bg-green-400/10" },
    cta: "Join Waitlist",
    ctaHref: "/subscribe",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="18" width="4" height="10" rx="1" fill="#f59e0b" opacity="0.4"/>
        <rect x="10" y="12" width="4" height="16" rx="1" fill="#f59e0b" opacity="0.6"/>
        <rect x="16" y="6" width="4" height="22" rx="1" fill="#f59e0b"/>
        <rect x="22" y="10" width="4" height="18" rx="1" fill="#f59e0b" opacity="0.7"/>
      </svg>
    ),
  },
];

export default function Products() {
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-4">
        <div className="container max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00e5a0] animate-pulse" />
            <span className="font-mono text-xs text-[#00e5a0] tracking-wider">PRIMAL EDGE OPTIONS AI ENGINE</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Every Options Edge.<br /><span className="text-[#00e5a0]">One Platform.</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
            Primal Edge is building a suite of AI-powered options tools for serious traders. Each product is powered by the same options AI engine — purpose-built for a specific strategy: income or directional.
          </p>
          {!user && (
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => openLoginModal()}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#ccc",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,255,150,0.5)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#ccc";
                }}
              >
                Member Login
              </button>
              <span className="text-white/20 text-xs">Already have access? Sign in here.</span>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-24 px-4">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="relative bg-[#0d1118] border border-white/5 rounded-2xl p-8 hover:border-[#00e5a0]/20 transition-all duration-300 group"
              >
                {/* Tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white/5 rounded-xl">{product.icon}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold tracking-widest px-3 py-1 rounded-full border"
                      style={{ color: product.tagColor, borderColor: `${product.tagColor}40`, backgroundColor: `${product.tagColor}10` }}
                    >
                      {product.tag}
                    </span>
                    {(product as any).tag2 && (
                      <span
                        className="text-xs font-bold tracking-widest px-3 py-1 rounded-full border"
                        style={{ color: "#00e5a0", borderColor: "rgba(0,229,160,0.4)", backgroundColor: "rgba(0,229,160,0.1)" }}
                      >
                        {(product as any).tag2}
                      </span>
                    )}
                    {(product as any).strategyBadge && (
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${(product as any).strategyBadge.color} ${(product as any).strategyBadge.bg}`}>
                        {(product as any).strategyBadge.text}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {product.name}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">{product.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 3" stroke="#00e5a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {(() => {
                  const handleClick = () => {
                    window.location.href = product.ctaHref;
                  };
                  return (
                    <button
                      onClick={handleClick}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200"
                      style={
                        product.tag === "LIVE"
                          ? { backgroundColor: "#00e5a0", color: "#0a0d12" }
                          : product.tag === "BETA"
                          ? { backgroundColor: "#a855f7", color: "#fff" }
                          : product.tag === "IN DEV"
                          ? { backgroundColor: "transparent", color: "#3b82f6", border: "1px solid #3b82f640" }
                          : { backgroundColor: "transparent", color: "#f59e0b", border: "1px solid #f59e0b40" }
                      }
                    >
                      {product.cta} →
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1118] border-t border-white/5 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <PrimalEdgeLogo size="md" />
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} Primal Edge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
