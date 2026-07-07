/* ============================================================
   Subscribe.tsx — Private Access Request Page
   Design: Dark institutional AI aesthetic, lead gen only, no pricing
   ============================================================ */

import { useState } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import { toast } from "sonner";

function GradeBadge({ grade, size = "sm" }: { grade: string; size?: "sm" | "md" }) {
  const colors: Record<string, { bg: string; text: string }> = {
    A: { bg: "#22c55e", text: "#fff" },
    B: { bg: "#3b82f6", text: "#fff" },
    C: { bg: "#f59e0b", text: "#0a0d12" },
  };
  const c = colors[grade] || colors["B"];
  const dim = size === "md" ? "w-7 h-7 text-xs" : "w-5 h-5 text-[10px]";
  return (
    <span
      className={`${dim} rounded-full inline-flex items-center justify-center font-bold font-mono`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {grade}
    </span>
  );
}

export default function Subscribe() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    tradingExp: "",
    ntfyTopic: "",
    agree: false,
    agreeDocusign: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agree) {
      toast.error("Please agree to the terms to continue.");
      return;
    }
    if (!form.agreeDocusign) {
      toast.error("Please agree to read and sign disclosures via DocuSign.");
      return;
    }
    if (!form.firstName || !form.email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);

    try {
      const resp = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          tradingExp: form.tradingExp,
          ntfyTopic: form.ntfyTopic,
        }),
      });

      if (!resp.ok) throw new Error("Submission failed");

      setSubmitted(true);
      toast.success("Request submitted successfully!");
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("Something went wrong. Please try again or email support@primaledge.io.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0d12]/95 backdrop-blur-md border-b border-white/5">
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

      <div className="pt-24 pb-24 sm:pt-28">
        <div className="container">

          {/* ── HERO HEADER ── */}
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#00e5a0] animate-pulse" />
              <span className="font-mono text-[10px] text-[#00e5a0] tracking-wider">PRIVATE ACCESS</span>
            </div>

            <h1 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-3 leading-tight">
              Adaptive Multi-Timeframe<br />
              <span className="text-[#00e5a0]">Signal Intelligence</span>
            </h1>

            <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Private momentum and slingshot intelligence across major U.S. equities.
            </p>

            <p className="text-white/35 text-sm max-w-xl mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Built for traders seeking high-conviction multi-timeframe setups using the proprietary AI Cockpit signal architecture.
            </p>
          </div>

          {submitted ? (
            /* ── SUCCESS STATE ── */
            <div className="max-w-lg mx-auto text-center">
              <div className="bg-[#10151d] border border-[#00e5a0]/30 rounded-2xl p-8 sm:p-10" style={{ boxShadow: "0 0 60px rgba(0,229,160,0.08)" }}>
                <div className="w-16 h-16 rounded-full bg-[#00e5a0]/15 border border-[#00e5a0]/30 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[#00e5a0]" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="font-['Space_Grotesk'] font-bold text-2xl sm:text-3xl text-white mb-3">
                  Request Received
                </h2>
                <p className="text-white/55 text-base leading-relaxed mb-6">
                  Thank you, <span className="text-white font-semibold">{form.firstName}</span>. We've received your access request. You'll receive onboarding instructions at <span className="text-[#00e5a0]">{form.email}</span> within 24 hours.
                </p>
                <div className="bg-[#0d1118] rounded-xl p-4 mb-6 text-left space-y-2">
                  <p className="font-mono text-[10px] text-white/30 tracking-widest mb-3">NEXT STEPS</p>
                  {[
                    "Check your email for onboarding instructions",
                    "Download NTFY on your phone for push alerts",
                    "Subscribe to your private alert channel",
                    "Access the live Primal Edge AI Cockpit",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#00e5a0] shrink-0 mt-0.5">0{i + 1}</span>
                      <span className="text-white/60 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                <Link href="/" className="inline-block text-[#00e5a0] font-['Space_Grotesk'] font-medium text-sm hover:underline">
                  ← Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* ── MAIN CONTENT GRID ── */
            <div className="grid lg:grid-cols-5 gap-8 xl:gap-12 max-w-5xl mx-auto">

              {/* LEFT: FORM — 3 cols */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="bg-[#10151d] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-5">
                  <h2 className="font-['Space_Grotesk'] font-semibold text-lg text-white mb-1">Request Access</h2>
                  <p className="text-white/30 text-xs font-mono tracking-wider mb-4">PRIVATE · LIMITED SEATS · BY APPLICATION</p>

                  {/* Name row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">FIRST NAME *</label>
                      <input
                        type="text" name="firstName" value={form.firstName} onChange={handleChange} required
                        placeholder="First name"
                        className="w-full bg-[#0d1118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">LAST NAME</label>
                      <input
                        type="text" name="lastName" value={form.lastName} onChange={handleChange}
                        placeholder="Last name"
                        className="w-full bg-[#0d1118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">EMAIL ADDRESS *</label>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange} required
                      placeholder="you@example.com"
                      className="w-full bg-[#0d1118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">PHONE NUMBER <span className="text-white/20 normal-case font-sans">(optional)</span></label>
                    <input
                      type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#0d1118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                    />
                  </div>

                  {/* Trading experience */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">TRADING EXPERIENCE *</label>
                    <select
                      name="tradingExp" value={form.tradingExp} onChange={handleChange} required
                      className="w-full bg-[#0d1118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00e5a0]/50 transition-colors appearance-none"
                    >
                      <option value="" disabled className="text-white/30">Select your experience level</option>
                      <option value="beginner">Beginner (0–1 years)</option>
                      <option value="intermediate">Intermediate (1–3 years)</option>
                      <option value="advanced">Advanced (3–5 years)</option>
                      <option value="professional">Professional (5+ years)</option>
                    </select>
                  </div>

                  {/* Alert username */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">PREFERRED ALERT USERNAME <span className="text-white/20 normal-case font-sans">(optional)</span></label>
                    <input
                      type="text" name="ntfyTopic" value={form.ntfyTopic} onChange={handleChange}
                      placeholder="e.g. johndoe_alerts"
                      className="w-full bg-[#0d1118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors font-mono"
                    />
                    <p className="text-white/20 text-xs mt-1.5">Used to configure your private alert channel. Leave blank and we'll assign one.</p>
                  </div>

                  {/* Agreement */}
                  <div className="border-t border-white/5 pt-5">
                    <div className="bg-[#0d1118] rounded-xl p-4 mb-4">
                      <p className="text-white/40 text-xs leading-relaxed">
                        Primal Edge is an <strong className="text-white/60">educational and analytical tool only</strong>. Scan results, scores, and grades do not constitute financial advice, investment recommendations, or solicitations to buy or sell any security. All analysis is for educational purposes only. You are solely responsible for your own decisions.
                      </p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox" name="agree" checked={form.agree} onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0d1118] accent-[#00e5a0] shrink-0"
                      />
                      <span className="text-white/55 text-sm leading-snug">
                        I understand this is for educational and analytical purposes only. Not financial advice.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox" name="agreeDocusign" checked={form.agreeDocusign} onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0d1118] accent-[#00e5a0] shrink-0"
                      />
                      <span className="text-white/55 text-sm leading-snug">
                        I agree to read and sign the required disclosures via DocuSign upon approval.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00e5a0] text-[#0a0d12] font-['Space_Grotesk'] font-bold text-base py-4 rounded-lg hover:bg-[#00bfa0] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ boxShadow: "0 0 30px rgba(0,229,160,0.15)" }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Submitting...
                      </span>
                    ) : "Request Access →"}
                  </button>
                </form>
              </div>

              {/* RIGHT: SIDEBAR — 2 cols */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 space-y-4">

                  {/* What's Included */}
                  <div className="bg-[#10151d] border border-[#00e5a0]/20 rounded-2xl p-6" style={{ boxShadow: "0 0 40px rgba(0,229,160,0.06)" }}>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-['Space_Grotesk'] font-semibold text-white text-sm">Private Access</span>
                      <span className="font-mono text-[10px] text-[#00e5a0] bg-[#00e5a0]/10 border border-[#00e5a0]/20 px-2 py-0.5 rounded-full">BY INVITATION</span>
                    </div>
                    <div className="space-y-2.5 mb-5">
                      {[
                        "Curated signal delivery",
                        "Ranked watchlists",
                        "Real-time momentum alerts",
                        "Bullish & bearish opportunities",
                        "Multi-index market coverage",
                        "Mobile-first experience",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <svg className="w-3.5 h-3.5 text-[#00e5a0] shrink-0" fill="none" viewBox="0 0 16 16">
                            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-white/55 text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="bg-[#10151d] border border-white/5 rounded-2xl p-5">
                    <p className="font-mono text-[10px] text-white/30 tracking-widest mb-4">ENGINE CAPABILITIES</p>
                    <div className="space-y-2.5">
                      {[
                        "AI-ranked bullish & bearish setups",
                        "AI Cockpit™ slingshot detection",
                        "Compression → expansion tracking",
                        "4H / 1D / 1W alignment engine",
                        "Mobile push alerts",
                        "Anti-noise filtering",
                        "Institutional-style workflow",
                        "Continuous options scanner evolution",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="w-1 h-1 rounded-full bg-[#00e5a0]/50 shrink-0" />
                          <span className="text-white/40 text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample Alert */}
                  <div className="bg-[#10151d] border border-white/5 rounded-2xl p-5">
                    <p className="font-mono text-[10px] text-white/30 tracking-widest mb-4">SAMPLE ALERT OUTPUT</p>

                    {/* Bullish */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#22c55e] text-xs">▲</span>
                        <span className="font-mono text-[10px] text-[#22c55e] tracking-widest font-bold">BULLISH</span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { sym: "NVDA", tier: "FIRE", score: 91, grade: "A" },
                          { sym: "AMZN", tier: "PREP", score: 82, grade: "B" },
                        ].map((r, i) => (
                          <div key={i} className="flex items-center justify-between bg-[#0d1118] rounded-lg px-3 py-2">
                            <span className="font-mono text-sm font-bold text-white w-12">{r.sym}</span>
                            <span className="font-mono text-[10px] text-[#f97316] font-bold tracking-wider">{r.tier}</span>
                            <span className="font-mono text-xs text-white/50">{r.score}</span>
                            <GradeBadge grade={r.grade} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bearish */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#ef4444] text-xs">▼</span>
                        <span className="font-mono text-[10px] text-[#ef4444] tracking-widest font-bold">BEARISH</span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { sym: "AAPL", tier: "FIRE", score: 88, grade: "A" },
                        ].map((r, i) => (
                          <div key={i} className="flex items-center justify-between bg-[#0d1118] rounded-lg px-3 py-2">
                            <span className="font-mono text-sm font-bold text-white w-12">{r.sym}</span>
                            <span className="font-mono text-[10px] text-[#f97316] font-bold tracking-wider">{r.tier}</span>
                            <span className="font-mono text-xs text-white/50">{r.score}</span>
                            <GradeBadge grade={r.grade} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Who This Is For */}
                  <div className="bg-[#10151d] border border-white/5 rounded-2xl p-5">
                    <p className="font-mono text-[10px] text-white/30 tracking-widest mb-4">WHO THIS IS FOR</p>
                    <div className="space-y-2.5">
                      {[
                        "Active options traders",
                        "Swing traders",
                        "Momentum traders",
                        "Traders seeking structured workflow",
                        "Traders wanting mobile-ready alerts",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <svg className="w-3 h-3 text-[#00e5a0]/60 shrink-0" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span className="text-white/45 text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust */}
                  <div className="bg-[#10151d] border border-white/5 rounded-2xl p-5 space-y-3">
                    {[
                      { icon: "🔒", text: "Secure & private — your data is never shared" },
                      { icon: "⚡", text: "Onboarded within 24 hours of approval" },
                      { icon: "📱", text: "Works on any device — mobile-first design" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="text-white/40 text-xs leading-snug">{item.text}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Bottom disclaimer */}
          <div className="mt-16 text-center space-y-1">
            <p className="font-mono text-[10px] text-red-400/70 tracking-widest">
              EDUCATIONAL & ANALYSIS PURPOSES ONLY.
            </p>
            <p className="font-mono text-[10px] text-red-400/50 tracking-wider">
              NOT FINANCIAL ADVICE. NOT A RECOMMENDATION TO BUY, SELL, OR HOLD ANY SECURITY.
            </p>
          </div>

          {/* Spacer for fixed bottom disclaimer */}
          <div className="h-12" />

        </div>
      </div>
    </div>
  );
}
