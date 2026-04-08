/* ============================================================
   ELASTIC SIGNAL DESIGN SYSTEM — Subscribe Page
   Subscription sign-up form with pricing summary sidebar
   ============================================================ */

import { useState } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import { toast } from "sonner";

function GradeBadge({ grade }: { grade: string }) {
  const cls = grade === "A" ? "grade-a" : grade === "B" ? "grade-b" : "grade-c";
  return (
    <span className={`${cls} inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono`}>
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
    if (!form.firstName || !form.email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      {/* Navbar */}
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

      <div className="pt-24 pb-16 sm:pt-28 px-4 sm:px-0">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">JOIN THE PRIVATE GROUP</p>
            <h1 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
              Get Access to<br />Primal Edge AI Scanner
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto">
              Fill in your details below to request access. Seats are limited — we'll confirm your subscription and onboard you within 24 hours.
            </p>
          </div>

          {submitted ? (
            /* ── Success State ── */
            <div className="max-w-lg mx-auto text-center">
              <div className="bg-[#111820] border border-[#00d4aa]/30 rounded-2xl p-8 sm:p-10 teal-glow">
                <div className="w-16 h-16 rounded-full bg-[#00d4aa]/15 border border-[#00d4aa]/30 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[#00d4aa]" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="font-['Space_Grotesk'] font-bold text-2xl sm:text-3xl text-white mb-3">
                  Request Received!
                </h2>
                <p className="text-white/55 text-base leading-relaxed mb-6">
                  Thank you, <span className="text-white font-semibold">{form.firstName}</span>! We've received your subscription request. You'll receive a confirmation email at <span className="text-[#00d4aa]">{form.email}</span> with onboarding instructions within 24 hours.
                </p>
                <div className="bg-[#0d1520] rounded-xl p-4 mb-6 text-left space-y-2">
                  <p className="font-mono text-xs text-white/30 tracking-widest mb-3">NEXT STEPS</p>
                  {[
                    "Check your email for onboarding instructions",
                    "Download the NTFY app on your phone",
                    "Subscribe to your private alert topic",
                    "Log in to the subscriber dashboard",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#00d4aa] shrink-0 mt-0.5">0{i + 1}</span>
                      <span className="text-white/60 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                <Link href="/" className="inline-block text-[#00d4aa] font-['Space_Grotesk'] font-medium text-sm hover:underline">
                  ← Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form + Summary ── */
            <div className="grid lg:grid-cols-5 gap-8 xl:gap-12 max-w-5xl mx-auto">
              {/* Form — 3 cols */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="bg-[#111820] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-5">
                  <h2 className="font-['Space_Grotesk'] font-semibold text-lg text-white mb-2">Your Details</h2>

                  {/* Name row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">FIRST NAME *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className="w-full bg-[#0d1520] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors font-['DM_Sans']"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">LAST NAME</label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="w-full bg-[#0d1520] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors font-['DM_Sans']"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="w-full bg-[#0d1520] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors font-['DM_Sans']"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">PHONE NUMBER</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#0d1520] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors font-['DM_Sans']"
                    />
                  </div>

                  {/* Trading experience */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">TRADING EXPERIENCE *</label>
                    <select
                      name="tradingExp"
                      value={form.tradingExp}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#0d1520] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00d4aa]/50 transition-colors font-['DM_Sans'] appearance-none"
                    >
                      <option value="" disabled className="text-white/30">Select your experience level</option>
                      <option value="beginner">Beginner (0–1 years)</option>
                      <option value="intermediate">Intermediate (1–3 years)</option>
                      <option value="advanced">Advanced (3–5 years)</option>
                      <option value="professional">Professional (5+ years)</option>
                    </select>
                  </div>

                  {/* NTFY topic preference */}
                  <div>
                    <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">PREFERRED NTFY USERNAME <span className="text-white/20 normal-case font-sans">(optional)</span></label>
                    <input
                      type="text"
                      name="ntfyTopic"
                      value={form.ntfyTopic}
                      onChange={handleChange}
                      placeholder="e.g. johndoe_alerts"
                      className="w-full bg-[#0d1520] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors font-mono"
                    />
                    <p className="text-white/25 text-xs mt-1.5">We'll use this to set up your private NTFY alert topic. Leave blank and we'll assign one for you.</p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5 pt-5">
                    <h2 className="font-['Space_Grotesk'] font-semibold text-lg text-white mb-4">Disclaimer & Agreement</h2>
                    <div className="bg-[#0d1520] rounded-xl p-4 mb-4">
                      <p className="text-white/40 text-xs leading-relaxed">
                        Primal Edge is an <strong className="text-white/60">educational and informational tool only</strong>. Scan results do not constitute financial advice, investment recommendations, or solicitations to buy or sell any security. All trading involves risk. Past performance of any scanner setup does not guarantee future results. You are solely responsible for your own trading decisions. Always consult a licensed financial advisor before making investment decisions.
                      </p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agree"
                        checked={form.agree}
                        onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0d1520] accent-[#00d4aa] shrink-0"
                      />
                      <span className="text-white/55 text-sm leading-snug">
                        I understand this is for educational purposes only and not financial advice. I agree to the terms and conditions.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="shimmer-btn w-full bg-[#00d4aa] text-[#0a0e14] font-['Space_Grotesk'] font-bold text-base py-4 rounded-lg hover:bg-[#00bfa0] transition-all disabled:opacity-60 disabled:cursor-not-allowed pulse-glow"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Submitting Request...
                      </span>
                    ) : "Request Access →"}
                  </button>
                  <p className="text-center text-white/25 text-xs">We'll confirm your access within 24 hours. Cancel anytime.</p>
                </form>
              </div>

              {/* Access Summary — 2 cols */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-24 space-y-4">
                  {/* Access summary */}
                  <div className="bg-[#111820] border border-[#00d4aa]/25 rounded-2xl p-6 teal-glow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-['Space_Grotesk'] font-semibold text-white text-sm">What You Get</span>
                      <span className="font-mono text-xs text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/20 px-2 py-0.5 rounded-full">PRIVATE GROUP</span>
                    </div>
                    <div className="space-y-2.5 mb-5">
                      {[
                        "Premium multi-index universe scanned",
                        "4x daily automated AI scans",
                        "Instant NTFY push alerts",
                        "Grade A–D ML filtering",
                        "Neural AI Picks — top-conviction curated alerts",
                        "On-demand AI dashboard",
                        "Elastic Slingshot — flagship AI signal",
                        "Multi-timeframe AI confirmation",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <svg className="w-3.5 h-3.5 text-[#00d4aa] shrink-0" fill="none" viewBox="0 0 16 16">
                            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-white/55 text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample alerts */}
                  <div className="bg-[#111820] border border-white/5 rounded-2xl p-5">
                    <p className="font-mono text-[10px] text-white/30 tracking-widest mb-3">SAMPLE ALERTS</p>
                    <div className="space-y-2">
                      {[
                        { sym: "AAPL", verdict: "BULLISH SLINGSHOT", grade: "A", score: 82 },
                        { sym: "META", verdict: "BULLISH SLINGSHOT", grade: "A", score: 79 },
                        { sym: "NVDA", verdict: "READY", grade: "B", score: 71 },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center gap-2 bg-[#0d1520] rounded-lg px-3 py-2.5">
                          <span className="font-mono text-sm font-bold text-white w-12 shrink-0">{row.sym}</span>
                          <span className={`font-mono text-xs font-semibold flex-1 min-w-0 truncate ${row.verdict.includes("SLINGSHOT") ? "text-[#00d4aa]" : "text-[#3b82f6]"}`}>{row.verdict}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white/40">{row.score}</span>
                            <GradeBadge grade={row.grade} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust signals */}
                  <div className="bg-[#111820] border border-white/5 rounded-2xl p-5 space-y-3">
                    {[
                      { icon: "🔒", text: "Secure & private — your data is never shared" },
                      { icon: "❌", text: "Cancel anytime, no questions asked" },
                      { icon: "⚡", text: "Onboarded within 24 hours of request" },
                      { icon: "📱", text: "Works on any phone via NTFY app" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <span className="text-white/45 text-xs leading-snug">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
