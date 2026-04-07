/* ============================================================
   DevRequests.tsx — Development Requests page
   Design: Elastic Signal — dark #0a0e14, teal #00d4aa accent
   ============================================================ */

import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";

const CATEGORIES = [
  "New Scanner / Signal",
  "Chart or Indicator",
  "Education Content",
  "Podcast Topic",
  "Platform Feature",
  "Data / Reference",
  "Other",
];

const EXISTING_REQUESTS = [
  { id: 1, title: "Bearish Reversal Scanner", votes: 47, category: "New Scanner / Signal", status: "In Development" },
  { id: 2, title: "Options Flow Scanner", votes: 38, category: "New Scanner / Signal", status: "Planned" },
  { id: 3, title: "Earnings Volatility Scanner", votes: 31, category: "New Scanner / Signal", status: "Planned" },
  { id: 4, title: "Sector Rotation Dashboard", votes: 29, category: "Platform Feature", status: "Planned" },
  { id: 5, title: "Weekly Market Sentiment Report", votes: 22, category: "Education Content", status: "Under Review" },
  { id: 6, title: "Options Greeks Reference Guide", votes: 18, category: "Data / Reference", status: "Under Review" },
];

const STATUS_COLORS: Record<string, string> = {
  "In Development": "#00d4aa",
  "Planned": "#f59e0b",
  "Under Review": "#a78bfa",
};

export default function DevRequests() {
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0], description: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Please enter a request title."); return; }
    setSubmitted(true);
    toast.success("Request submitted! We'll review it shortly.");
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 md:pt-40 pb-12 px-4">
        <div className="container max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
            <span className="font-mono text-xs text-[#00d4aa] tracking-wider">COMMUNITY DRIVEN DEVELOPMENT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Shape the<br /><span className="text-[#00d4aa]">Primal Edge</span> Roadmap.
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
            Elite members drive what gets built next. Submit your feature requests, vote on existing ideas, and watch the platform evolve around what matters most to you.
          </p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="container max-w-5xl grid lg:grid-cols-2 gap-10">

          {/* Submit Form */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Submit a Request
            </h2>
            {submitted ? (
              <div className="bg-[#00d4aa]/10 border border-[#00d4aa]/30 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#00d4aa]/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14l6 6L23 8" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Request Received!</h3>
                <p className="text-white/50 text-sm mb-6">Your request has been submitted for review. Elite members will be able to vote on it shortly.</p>
                <button onClick={() => setSubmitted(false)} className="text-[#00d4aa] text-sm font-medium hover:underline">
                  Submit another request →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/60 text-xs font-mono tracking-wider mb-2 uppercase">Request Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Weekly Options Flow Heatmap"
                    className="w-full bg-[#0d1520] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-mono tracking-wider mb-2 uppercase">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#0d1520] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00d4aa]/50 transition-colors"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-mono tracking-wider mb-2 uppercase">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what you'd like to see and why it would be valuable..."
                    rows={4}
                    className="w-full bg-[#0d1520] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-mono tracking-wider mb-2 uppercase">Your Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Get notified when your request is reviewed"
                    className="w-full bg-[#0d1520] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00d4aa]/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#00d4aa] text-[#0a0e14] font-bold py-3.5 rounded-xl hover:bg-[#00d4aa]/90 transition-colors"
                >
                  Submit Request →
                </button>
              </form>
            )}
          </div>

          {/* Existing Requests */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Top Requested Features
            </h2>
            <div className="space-y-3">
              {EXISTING_REQUESTS.map((req) => (
                <div key={req.id} className="bg-[#0d1520] border border-white/5 rounded-xl p-3 sm:p-4 flex items-center gap-3 hover:border-[#00d4aa]/20 transition-all group">
                  {/* Vote button */}
                  <button
                    onClick={() => toast.success("Vote recorded!")}
                    className="flex flex-col items-center gap-0.5 min-w-[40px] p-2 rounded-lg bg-white/5 hover:bg-[#00d4aa]/10 hover:border-[#00d4aa]/30 border border-transparent transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2L10 8H2L6 2Z" fill="#00d4aa"/>
                    </svg>
                    <span className="text-white font-bold text-xs">{req.votes}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{req.title}</p>
                    <p className="text-white/30 text-xs mt-0.5">{req.category}</p>
                  </div>
                  <span
                    className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border whitespace-nowrap shrink-0"
                    style={{ color: STATUS_COLORS[req.status], borderColor: `${STATUS_COLORS[req.status]}40`, backgroundColor: `${STATUS_COLORS[req.status]}10` }}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-white/20 text-xs text-center mt-6 font-mono">More requests visible to Elite Members</p>
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
