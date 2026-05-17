/* ============================================================
   AIDashboard.tsx — PIN-Locked AI Dashboard (Live Feed)
   Design: Terminal-style signal engine matching screenshot mockup
   PIN gate: temporary access control before auth is built
   Data: Fetches live signal data from GitHub Gist
   ============================================================ */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";

const CORRECT_PIN = "1331";

// GitHub Gist raw URL
const GIST_ID = "a490177229d88de297de0bf4746fdff8";
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/* ─── Types ─────────────────────────────────────────────────── */
interface Signal {
  ticker: string;
  signal: string;
  verdict: string;
  direction: string;
  score: number;
  ext: number;
  grade: string;
  price: number;
}

interface DashboardData {
  timestamp: string;
  tickers_scanned: number;
  actionable_count: number;
  signals: Signal[];
}

/* ─── PIN Gate ──────────────────────────────────────────────── */
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...pin];
    next[index] = value.slice(-1);
    setPin(next);
    setError(false);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }

    // Auto-submit on last digit
    if (index === 3 && value) {
      const entered = [...next].join("");
      if (entered === CORRECT_PIN) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin(["", "", "", ""]);
          refs[0].current?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          {/* Lock Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-2xl">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="22" width="32" height="22" rx="4" stroke="#00d4aa" strokeWidth="2.5" />
                <path d="M16 22V14a8 8 0 0 1 16 0v8" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="33" r="3" fill="#00d4aa" />
                <path d="M24 36v3" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <h1
            className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            AI Dashboard
          </h1>
          <p className="text-white/40 text-sm mb-8">Enter your 4-digit access PIN to continue</p>

          {/* PIN Inputs */}
          <div
            className={`flex justify-center gap-4 mb-6 ${shake ? "animate-shake" : ""}`}
            style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 bg-[#0d1520] outline-none transition-all duration-200 ${
                  error
                    ? "border-red-500 text-red-400"
                    : digit
                    ? "border-[#00d4aa] text-[#00d4aa]"
                    : "border-white/10 text-white focus:border-[#00d4aa]/60"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 font-mono animate-pulse">
              Incorrect PIN. Try again.
            </p>
          )}

          <p className="text-white/20 text-xs mt-8">
            Contact{" "}
            <a href="mailto:support@primaledge.io" className="text-[#00d4aa]/60 hover:text-[#00d4aa]">
              support@primaledge.io
            </a>{" "}
            for access
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="bg-[#0d1520] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-green-500/40 animate-pulse" />
            </div>
            <div className="p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-lg mb-3 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Dashboard Content (shown after PIN unlock) ───────────── */
function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(GIST_API, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const gist = await resp.json();
      const content = gist.files?.["dashboard.json"]?.content;
      if (!content) throw new Error("dashboard.json not found in Gist");
      const parsed: DashboardData = JSON.parse(content);
      setData(parsed);
      setError(null);
    } catch (e: any) {
      console.error("Failed to fetch dashboard data:", e);
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <LoadingSkeleton />;

  const signals = data?.signals || [];
  const timestamp = data?.timestamp && data.timestamp !== "--"
    ? new Date(data.timestamp).toLocaleString()
    : "Awaiting first scan...";

  // Grade badge colors (circle style)
  const gradeStyle: Record<string, { bg: string; text: string }> = {
    A: { bg: "#22c55e", text: "#fff" },
    B: { bg: "#3b82f6", text: "#fff" },
    C: { bg: "#f59e0b", text: "#0a0e14" },
    D: { bg: "#6b7280", text: "#fff" },
  };

  // Verdict color map
  const verdictColor = (verdict: string): string => {
    if (verdict.includes("SLINGSHOT")) return "#22c55e";
    if (verdict.includes("ELITE")) return "#22c55e";
    if (verdict.includes("TRIGGER")) return "#f97316";
    if (verdict.includes("FIRE")) return "#f97316";
    if (verdict === "COIL") return "#3b82f6";
    if (verdict === "READY") return "#3b82f6";
    return "#a78bfa";
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Terminal Window */}
          <div className="bg-[#0d1520] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">

            {/* Title Bar with Traffic Lights */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-6">
                {/* Traffic light dots */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                {/* Title */}
                <span
                  className="text-sm text-white/60 tracking-widest uppercase"
                  style={{ fontFamily: "'JetBrains Mono', 'Space Grotesk', monospace" }}
                >
                  Primal Edge — Signal Engine
                </span>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28c840] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#28c840]" />
                </span>
                <span
                  className="text-xs text-[#28c840] tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Scanning Live Market
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="px-2 sm:px-4 py-2">
              {/* Header Row */}
              <div
                className="grid gap-4 px-4 py-3 text-xs text-white/30 tracking-widest uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  gridTemplateColumns: "1fr 1.5fr 0.7fr 0.7fr 1fr",
                }}
              >
                <span>Ticker</span>
                <span>Verdict</span>
                <span className="text-center">Score</span>
                <span className="text-center">Grade</span>
                <span className="text-right">Price</span>
              </div>

              {/* Divider */}
              <div className="border-b border-white/5 mx-2" />

              {/* Empty State */}
              {signals.length === 0 && !error && (
                <div className="px-4 py-20 text-center">
                  <p
                    className="text-white/30 text-sm mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    No actionable signals
                  </p>
                  <p className="text-white/15 text-xs">
                    Markets may be quiet or misaligned. Next scan runs at the top of the hour.
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="px-4 py-20 text-center">
                  <p className="text-red-400/60 text-sm font-mono mb-2">Connection Error</p>
                  <p className="text-white/15 text-xs">{error}</p>
                  <button
                    onClick={fetchData}
                    className="mt-4 text-xs text-[#00d4aa] font-mono hover:underline"
                  >
                    Retry →
                  </button>
                </div>
              )}

              {/* Signal Rows */}
              {signals.map((s, i) => {
                const gc = gradeStyle[s.grade] || gradeStyle["D"];
                const vc = verdictColor(s.verdict || s.signal || "");
                return (
                  <div
                    key={`${s.ticker}-${i}`}
                    className="grid gap-4 px-4 py-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center scan-row"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      gridTemplateColumns: "1fr 1.5fr 0.7fr 0.7fr 1fr",
                    }}
                  >
                    {/* Ticker */}
                    <span
                      className="text-base font-bold text-white"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {s.ticker}
                    </span>

                    {/* Verdict */}
                    <span
                      className="text-sm font-bold tracking-wide leading-tight"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: vc,
                      }}
                    >
                      {s.verdict || s.signal}
                    </span>

                    {/* Score */}
                    <span
                      className="text-center text-base text-white/80"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {s.score}
                    </span>

                    {/* Grade — Circle Badge */}
                    <div className="flex justify-center">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ backgroundColor: gc.bg, color: gc.text }}
                      >
                        {s.grade}
                      </div>
                    </div>

                    {/* Price */}
                    <span
                      className="text-right text-base text-white/70"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {s.price ? `$${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
              <span
                className="text-xs text-white/20"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Premium universe scanned • {timestamp}
              </span>
              <span
                className="text-xs"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: signals.length > 0 ? "#00d4aa" : "rgba(255,255,255,0.2)",
                }}
              >
                {signals.length > 0 ? `${signals.length} setups found` : "0 setups found"}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-white/15 text-xs mt-6 font-mono tracking-wide">
            EDUCATIONAL ANALYSIS ONLY. NOT FINANCIAL ADVICE. NOT A RECOMMENDATION TO BUY, SELL, OR HOLD.
          </p>
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

/* ─── Main Export ──────────────────────────────────────────── */
export default function AIDashboard() {
  const [unlocked, setUnlocked] = useState(false);

  // Check sessionStorage for previous unlock
  useEffect(() => {
    if (sessionStorage.getItem("pe_dash_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem("pe_dash_unlocked", "1");
    setUnlocked(true);
  };

  if (!unlocked) {
    return <PinGate onUnlock={handleUnlock} />;
  }

  return <DashboardContent />;
}
