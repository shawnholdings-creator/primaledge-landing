/* ============================================================
   Products.tsx — Primal Edge Product Suite
   Design: Elastic Signal — dark #0a0e14, teal #00d4aa accent
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";

const PRODUCTS = [
  {
    id: "elastic-slingshot",
    name: "Elastic Slingshot Scanner",
    tag: "LIVE",
    tagColor: "#00d4aa",
    description:
      "The flagship Primal Edge AI signal engine. Scans thousands of premium symbols across multiple indices in real time, identifying high-probability breakout setups graded A–D by adaptive intelligence.",
    features: ["Real-time AI scanning", "A–D signal grading", "Instant push alerts", "Premium symbol universe"],
    cta: "Get Access",
    ctaHref: "/subscribe",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 24L12 14l6 6 10-14" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 10h6v6" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "bearish-scanner",
    name: "Bearish Reversal Scanner",
    tag: "COMING SOON",
    tagColor: "#f59e0b",
    description:
      "Identify high-probability bearish reversal and breakdown setups across the full market universe. Powered by the same adaptive intelligence engine as the Elastic Slingshot — optimized for short-side opportunities.",
    features: ["Short-side signal detection", "Multi-timeframe analysis", "AI-graded setups", "Instant alerts"],
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
    tag: "COMING SOON",
    tagColor: "#f59e0b",
    description:
      "Track unusual options activity and institutional flow in real time. Surface high-conviction directional bets before the crowd catches on — powered by Primal Edge's proprietary signal intelligence.",
    features: ["Unusual options activity", "Institutional flow tracking", "Strike & expiry analysis", "AI conviction scoring"],
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
      "Quantify expected move, IV rank, and historical earnings drift to identify the highest-probability earnings plays. Know exactly which setups offer edge before the catalyst hits.",
    features: ["Expected move analysis", "IV rank & percentile", "Historical drift scoring", "Pre-earnings setups"],
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
  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-4">
        <div className="container max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
            <span className="font-mono text-xs text-[#00d4aa] tracking-wider">PRIMAL EDGE PRODUCT SUITE</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Every Edge.<br /><span className="text-[#00d4aa]">One Platform.</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
            Primal Edge is building a suite of AI-powered signal tools for serious traders. Each product is engineered with the same adaptive intelligence engine — purpose-built for a specific market opportunity.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-24 px-4">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="relative bg-[#0d1520] border border-white/5 rounded-2xl p-8 hover:border-[#00d4aa]/20 transition-all duration-300 group"
              >
                {/* Tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white/5 rounded-xl">{product.icon}</div>
                  <span
                    className="text-xs font-bold tracking-widest px-3 py-1 rounded-full border"
                    style={{ color: product.tagColor, borderColor: `${product.tagColor}40`, backgroundColor: `${product.tagColor}10` }}
                  >
                    {product.tag}
                  </span>
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
                        <path d="M2 7l3.5 3.5L12 3" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={product.ctaHref}>
                  <button
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200"
                    style={
                      product.tag === "LIVE"
                        ? { backgroundColor: "#00d4aa", color: "#0a0e14" }
                        : { backgroundColor: "transparent", color: "#f59e0b", border: "1px solid #f59e0b40" }
                    }
                  >
                    {product.cta} →
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1520] border-t border-white/5 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <PrimalEdgeLogo size="md" />
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} Primal Edge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
