/* ============================================================
   AIDashboard.tsx — PIN-Locked AI Dashboard (Live Feed)
   Design: Elastic Signal — dark #0a0e14, teal #00d4aa accent
   PIN gate: temporary access control before auth is built
   Data: Fetches live signal data from GitHub Gist
   ============================================================ */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";

const CORRECT_PIN = "1331";

// GitHub Gist raw URL — will be set after Gist creation
// Using the Gist API endpoint for reliable latest content
const GIST_ID = "a490177229d88de297de0bf4746fdff8";
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/* ─── Types ─────────────────────────────────────────────────── */
interface Signal {
  ticker: string;
  signal: string;
  direction: string;
  score: number;
  ext: number;
  grade: string;
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
        <div className="container max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-[#00d4aa] animate-pulse" />
            <span className="font-mono text-sm text-[#00d4aa] tracking-wider animate-pulse">
              LOADING SCANNER DATA...
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#0d1520] border border-white/5 rounded-xl p-5 animate-pulse">
                <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                <div className="h-8 w-16 bg-white/10 rounded mb-2" />
                <div className="h-2 w-20 bg-white/5 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-[#0d1520] border border-white/5 rounded-2xl p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg mb-3 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
      setLastRefresh(new Date());
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

  const colorMap: Record<string, string> = {
    SLINGSHOT: "#22c55e",
    ELITE: "#22c55e",
    IDEAL: "#3b82f6",
    PRIME: "#a855f7",
    FIRE: "#f97316",
    PREP: "#f59e0b",
  };

  const gradeColors: Record<string, { bg: string; text: string }> = {
    A: { bg: "#22c55e", text: "#0a0e14" },
    B: { bg: "#3b82f6", text: "#fff" },
    C: { bg: "#f59e0b", text: "#0a0e14" },
    D: { bg: "#6b7280", text: "#fff" },
  };

  const signals = data?.signals || [];
  const timestamp = data?.timestamp && data.timestamp !== "--"
    ? new Date(data.timestamp).toLocaleString()
    : "Awaiting first scan...";

  const STATS = [
    {
      label: "Tickers Scanned",
      value: data?.tickers_scanned?.toString() || "—",
      sub: "S&P 500 + Nasdaq 100",
    },
    {
      label: "Actionable Signals",
      value: data?.actionable_count?.toString() || "0",
      sub: "Score ≥ 70",
    },
    {
      label: "System Win Rate",
      value: "46.1%",
      sub: "IDEAL (152 trades)",
    },
    {
      label: "Profit Factor",
      value: "1.43",
      sub: "Winners > Losers",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              <span className="font-mono text-xs text-[#00d4aa] tracking-wider">AI DASHBOARD — LIVE</span>
            </div>
            {lastRefresh && (
              <button
                onClick={fetchData}
                className="flex items-center gap-2 text-white/30 hover:text-[#00d4aa] text-xs font-mono transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7a6 6 0 0 1 10.89-3.5M13 7a6 6 0 0 1-10.89 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 1v3h-3M3 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh
              </button>
            )}
          </div>
          <h1
            className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Elastic Scanner<br />
            <span className="text-[#00d4aa]">Intelligence Feed</span>
          </h1>
          <p className="text-white/40 text-base max-w-2xl">
            Real-time signal output from the Elastic Scanner v3.0 engine. Weighted scoring with sector strength,
            relative strength, and market regime awareness.
          </p>
        </div>
      </section>

      {/* Stats Row */}
      <section className="pb-8 px-4">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[#0d1520] border border-white/5 rounded-xl p-5">
                <p className="text-white/30 text-xs font-mono tracking-wider mb-2 uppercase">{s.label}</p>
                <p className="text-2xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.value}
                </p>
                <p className="text-white/20 text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signals Table */}
      <section className="pb-16 px-4">
        <div className="container max-w-6xl">
          <div className="bg-[#0d1520] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Active Signals
              </h3>
              <span className="text-xs text-white/20 font-mono">Last scan: {timestamp}</span>
            </div>

            {/* Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-white/5 text-xs text-white/30 font-mono tracking-wider uppercase">
              <span>Ticker</span>
              <span>Signal</span>
              <span>Direction</span>
              <span className="text-right">Score</span>
              <span className="text-right">Extension</span>
              <span className="text-right">Grade</span>
            </div>

            {/* Empty State */}
            {signals.length === 0 && !error && (
              <div className="px-6 py-16 text-center">
                <p className="text-white/30 text-sm font-mono mb-2">No actionable signals</p>
                <p className="text-white/15 text-xs">Markets may be quiet or misaligned. Next scan runs at the top of the hour.</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="px-6 py-16 text-center">
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

            {/* Rows */}
            {signals.map((s, i) => {
              const gc = gradeColors[s.grade] || gradeColors["D"];
              return (
                <div
                  key={`${s.ticker}-${i}`}
                  className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors scan-row"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className="font-bold text-white text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.ticker}
                  </span>
                  <span
                    className="text-xs font-bold tracking-wider py-0.5"
                    style={{ color: colorMap[s.signal] || "#fff" }}
                  >
                    {s.signal}
                  </span>
                  <span className={`text-xs font-bold ${s.direction === "BULL" ? "text-green-400" : "text-red-400"}`}>
                    {s.direction === "BULL" ? "▲ BULL" : "▼ BEAR"}
                  </span>
                  <span className="text-right text-sm font-mono text-white/80">{s.score}</span>
                  <span className="text-right text-sm font-mono text-white/50">{s.ext}</span>
                  <div className="flex justify-end">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-md"
                      style={{ backgroundColor: gc.bg, color: gc.text }}
                    >
                      {s.grade}
                    </span>
                  </div>
                </div>
              );
            })}
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
