/* ============================================================
   ComingSoonPage.tsx — Reusable placeholder page
   Design: Elastic Signal — dark #0a0e14, teal #00d4aa accent
   ============================================================ */

import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";

interface ComingSoonPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  activeNav?: string;
  teaserItems: { label: string; desc: string }[];
}

export default function ComingSoonPage({
  title,
  subtitle,
  description,
  icon,
  teaserItems,
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 md:pt-40 pb-16 px-4">
        <div className="container max-w-3xl text-center">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-2xl">
              {icon}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="font-mono text-xs text-[#f59e0b] tracking-wider">COMING SOON</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {title}
          </h1>
          <p className="text-[#00d4aa] font-semibold text-lg mb-6 tracking-wide">{subtitle}</p>
          <p className="text-white/50 text-base leading-relaxed max-w-2xl mx-auto">{description}</p>
        </div>
      </section>

      {/* Teaser Cards */}
      <section className="pb-24 px-4">
        <div className="container max-w-4xl">
          <p className="text-white/30 text-xs font-mono tracking-widest text-center mb-8 uppercase">What's Coming</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teaserItems.map((item) => (
              <div key={item.label} className="bg-[#0d1520] border border-white/5 rounded-xl p-6 hover:border-[#00d4aa]/20 transition-all">
                <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-center justify-center mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                </div>
                <h4 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Notify CTA */}
          <div className="mt-12 sm:mt-16 text-center bg-[#0d1520] border border-[#00d4aa]/20 rounded-2xl p-6 sm:p-10">
            <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Be First to Know
            </h3>
            <p className="text-white/40 text-sm mb-6">Join the Primal Edge elite access list and get notified the moment this launches.</p>
            <Link href="/subscribe">
              <button className="bg-[#00d4aa] text-[#0a0e14] font-bold px-8 py-3 rounded-xl hover:bg-[#00d4aa]/90 transition-colors">
                Request Early Access →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1520] border-t border-white/5 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <PrimalEdgeLogo size="md" />
          </Link>
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} Primal Edge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
