/* ============================================================
   ThankYou.tsx — Post-submission confirmation page
   Design: Elastic Signal — dark #0a0e14, teal #00d4aa accent
   Fonts: Space Grotesk (h), DM Sans (body), JetBrains Mono (data)
   ============================================================ */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";

export default function ThankYou() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const steps = [
    {
      num: "01",
      title: "Check Your Email",
      desc: "You'll receive a confirmation from our team at the address you provided within 24 hours.",
    },
    {
      num: "02",
      title: "Download the NTFY App",
      desc: "Install the free NTFY app on your phone — this is how your AI signal alerts will be delivered in real time.",
    },
    {
      num: "03",
      title: "Subscribe to Your Alert Topic",
      desc: "Once approved, you'll receive a private NTFY topic to subscribe to. All Elastic Slingshot and Neural AI Picks alerts will push directly to your phone.",
    },
    {
      num: "04",
      title: "Access the Dashboard",
      desc: "You'll be granted access to the private Primal Edge subscriber dashboard where you can monitor signals on demand.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col">
      {/* Minimal Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e14]/95 backdrop-blur-md border-b border-white/5">
        <div className="container flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <PrimalEdgeLogo size="sm" />
          </Link>
          <Link href="/" className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div
          className="w-full max-w-2xl transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
        >
          {/* Success icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/30 flex items-center justify-center teal-glow">
                <svg className="w-12 h-12 text-[#00d4aa]" fill="none" viewBox="0 0 48 48">
                  <path d="M10 25l10 10L38 14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border border-[#00d4aa]/20 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">APPLICATION RECEIVED</p>
            <h1 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">
              You're on the List.
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Your access request has been received. Our team reviews every application personally — we'll be in touch within <span className="text-white font-semibold">24 hours</span>.
            </p>
          </div>

          {/* Next steps */}
          <div className="bg-[#111820] border border-white/5 rounded-2xl p-6 sm:p-8 mb-6">
            <p className="font-mono text-xs text-white/30 tracking-widest mb-6">WHAT HAPPENS NEXT</p>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-4">
                  <span className="font-mono text-sm font-bold text-[#00d4aa] shrink-0 mt-0.5 w-6">{step.num}</span>
                  <div>
                    <p className="font-['Space_Grotesk'] font-semibold text-white text-sm mb-1">{step.title}</p>
                    <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1 bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-sm py-3.5 rounded-xl hover:bg-[#00bfa0] transition-colors text-center shimmer-btn">
              Return to Home
            </Link>
            <Link href="/products" className="flex-1 border border-white/10 text-white/60 font-['Space_Grotesk'] font-medium text-sm py-3.5 rounded-xl hover:border-[#00d4aa]/40 hover:text-white transition-colors text-center">
              Explore All Products →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1520] border-t border-white/5 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <PrimalEdgeLogo size="md" />
          </Link>
          <p className="text-white/20 text-xs text-center">
            © {new Date().getFullYear()} Primal Edge — Adaptive Intelligence. Decisive Signals. For educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
