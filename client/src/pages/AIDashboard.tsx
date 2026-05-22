/* ============================================================
   AIDashboard.tsx — Primal Edge AI Cockpit (Live Feed)
   Auth: Protected by Supabase auth + user_access approval
   Data: Fetches live signal data from GitHub Gist
   Prices: Real-time via /api/prices (FMP, server-side key)
   ============================================================ */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

// GitHub Gist raw URL
const GIST_ID = "a490177229d88de297de0bf4746fdff8";
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes during market hours

/* ─── Market Hours Helper ──────────────────────────────────── */
function isMarketOpen(): boolean {
  const now = new Date();
  // Convert to ET (handles DST automatically)
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  // 9:30 AM = 570, 4:00 PM = 960
  return minutes >= 570 && minutes <= 960;
}

function marketStatusLabel(): { text: string; color: string; subtext: string } {
  if (isMarketOpen()) {
    return { text: "MARKET OPEN", color: "#28c840", subtext: "Scanning every 15 min" };
  }
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const hours = et.getHours();
  if (day === 0 || day === 6) {
    return { text: "WEEKEND", color: "#6b7280", subtext: "Markets reopen Monday" };
  }
  if (hours < 9 || (hours === 9 && et.getMinutes() < 30)) {
    return { text: "PRE-MARKET", color: "#f59e0b", subtext: "Open scan at 9:35 AM ET" };
  }
  return { text: "AFTER HOURS", color: "#6b7280", subtext: "Next scan at open" };
}

/* ─── Types ─────────────────────────────────────────────────── */
interface Signal {
  ticker: string;
  signal: string;
  verdict: string;
  direction: string;
  score: number;
  ext: number;
  grade: string;
  quality?: string;
  price: number;
  struct?: number;
  momt?: number;
  rs?: number;
}

interface DashboardData {
  timestamp: string;
  tickers_scanned: number;
  actionable_count: number;
  signals: Signal[];
}

interface GistHistoryEntry {
  version: string;
  committed_at: string;
}

interface LivePrice {
  price: number;
  change: number;
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

/* ─── Archive Panel (with search) ──────────────────────────── */
function ArchivePanel({
  history,
  activeVersion,
  onSelect,
  onReset,
}: {
  history: GistHistoryEntry[];
  activeVersion: string | null;
  onSelect: (version: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (history.length === 0) return null;

  // Format each entry for display + search
  const entries = useMemo(() =>
    history.map((h) => {
      const d = new Date(h.committed_at);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const label = `${dateStr} · ${timeStr}`;
      return { ...h, label };
    }),
    [history]
  );

  // Filter by search query
  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm
    ? entries.filter((e) => e.label.toLowerCase().includes(searchTerm))
    : entries;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors ml-auto"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <path d="M10 12h4" />
        </svg>
        {open ? "Close Archive" : "Scan Archive"}
        <span className="text-white/15">({history.length})</span>
      </button>

      {open && (
        <div
          className="mt-2 bg-[#0d1520] border border-white/10 rounded-xl overflow-hidden"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
        >
          {/* Archive Search */}
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter dates…"
                className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-white/70 placeholder-white/15 focus:outline-none focus:border-[#00d4aa]/30 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="max-h-40 overflow-y-auto">
            {/* Reset to live */}
            {activeVersion && !searchTerm && (
              <button
                onClick={onReset}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b border-white/5"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28c840] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28c840]" />
                </span>
                <span
                  className="text-xs text-[#28c840] tracking-wide"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  ← Back to Live
                </span>
              </button>
            )}

            {/* No results */}
            {filtered.length === 0 && (
              <div className="px-4 py-4 text-center">
                <span className="text-[10px] text-white/20 font-mono">No matching dates</span>
              </div>
            )}

            {/* Date rows */}
            {filtered.map((h) => {
              const isActive = h.version === activeVersion;
              const isHighlighted = searchTerm && h.label.toLowerCase().includes(searchTerm);

              return (
                <button
                  key={h.version}
                  onClick={() => onSelect(h.version)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-b-0 ${
                    isActive ? "bg-white/[0.04]" : ""
                  } ${isHighlighted ? "bg-[#00d4aa]/[0.04]" : ""}`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isActive
                        ? "#00d4aa"
                        : isHighlighted
                        ? "#00d4aa"
                        : "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    className="text-xs tracking-wide"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isActive
                        ? "#00d4aa"
                        : isHighlighted
                        ? "#00d4aa"
                        : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {h.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard Content (shown after auth + approval) ──────── */
function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GistHistoryEntry[]>([]);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [priceTimestamp, setPriceTimestamp] = useState<string | null>(null);
  const [showMobileWatchlist, setShowMobileWatchlist] = useState(false);

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

      // Extract history entries for archive
      if (gist.history && Array.isArray(gist.history)) {
        setHistory(
          gist.history.map((h: any) => ({
            version: h.version,
            committed_at: h.committed_at,
          }))
        );
      }
    } catch (e: any) {
      console.error("Failed to fetch dashboard data:", e);
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch live prices when signal tickers change
  const fetchPrices = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    try {
      const resp = await fetch(`/api/prices?tickers=${tickers.join(",")}`);
      if (!resp.ok) return; // silently fail — scan-time prices remain
      const result = await resp.json();
      if (result.prices) {
        setLivePrices(result.prices);
        setPriceTimestamp(result.updated);
      }
    } catch {
      // Price fetch is best-effort; scan-time prices are the fallback
    }
  }, []);

  // Load a specific historical version
  const loadVersion = useCallback(async (version: string) => {
    setArchiveLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${GIST_API}/${version}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (resp.status === 403) {
        setError("GitHub API rate limit reached. Try again in a minute.");
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const gist = await resp.json();
      const content = gist.files?.["dashboard.json"]?.content;
      if (!content) throw new Error("dashboard.json not found in archive");
      const parsed: DashboardData = JSON.parse(content);
      setData(parsed);
      setActiveVersion(version);
      setError(null);
      // Clear live prices when viewing archive (show scan-time prices)
      setLivePrices({});
      setPriceTimestamp(null);
    } catch (e: any) {
      console.error("Failed to load archive:", e);
      setError(e.message || "Failed to load archive");
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  // Reset to live data
  const resetToLive = useCallback(() => {
    setActiveVersion(null);
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      // Only auto-refresh if viewing live (not archive)
      if (!activeVersion) fetchData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData, activeVersion]);

  // Fetch live prices whenever signals change (live mode only)
  useEffect(() => {
    if (activeVersion) return; // skip price fetch for archived data
    const tickers = data?.signals?.map((s) => s.ticker) || [];
    if (tickers.length > 0) fetchPrices(tickers);
  }, [data?.signals, activeVersion, fetchPrices]);

  if (loading) return <LoadingSkeleton />;

  const allSignals = data?.signals || [];
  const timestamp = data?.timestamp && data.timestamp !== "--"
    ? new Date(data.timestamp).toLocaleString()
    : "Awaiting first scan...";

  // Split: A+B (score≥55) in main table, C+D (score 20-54) in watchlist
  const tradable = allSignals
    .filter((s) => s.score >= 55)
    .sort((a, b) => b.score - a.score);
  const watchlist = allSignals
    .filter((s) => s.score < 55)
    .sort((a, b) => b.score - a.score);

  // Display verdict: READY → WATCH, COIL stays
  const displayVerdict = (v: string) => (v === "READY" ? "WATCH" : v);

  // Near-tradable count (score 45-54, close to B threshold)
  const nearCount = watchlist.filter((s) => s.score >= 45).length;

  // Next scan time helper
  const nextScanTime = (): string => {
    if (isMarketOpen()) {
      const now = new Date();
      const min = now.getMinutes();
      const nextQ = Math.ceil((min + 1) / 15) * 15;
      return `~${nextQ - min} min`;
    }
    const et = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = et.getDay();
    if (day === 0 || day === 6) return "Mon 9:35 AM";
    if (et.getHours() >= 16) return "Tomorrow 9:35 AM";
    return "9:35 AM ET";
  };

  // Grade badge colors (circle style)
  const gradeStyle: Record<string, { bg: string; text: string }> = {
    A: { bg: "#22c55e", text: "#fff" },
    B: { bg: "#3b82f6", text: "#fff" },
    C: { bg: "#f59e0b", text: "#0a0e14" },
    D: { bg: "#ff6b35", text: "#fff" },
  };

  // Direction colors (traffic light)
  const directionStyle = (dir: string): { dot: string; text: string; glow: string } => {
    if (dir === "BULL") return { dot: "#22c55e", text: "#22c55e", glow: "0 0 8px rgba(34,197,94,0.4)" };
    if (dir === "BEAR") return { dot: "#ef4444", text: "#ef4444", glow: "0 0 8px rgba(239,68,68,0.4)" };
    return { dot: "#f59e0b", text: "#f59e0b", glow: "0 0 8px rgba(245,158,11,0.3)" };
  };

  // Verdict color map
  const verdictColor = (verdict: string): string => {
    if (verdict.includes("SLINGSHOT")) return "#22c55e";
    if (verdict.includes("ELITE")) return "#22c55e";
    if (verdict.includes("TRIGGER")) return "#f97316";
    if (verdict.includes("FIRE")) return "#f97316";
    if (verdict === "COIL") return "#3b82f6";
    if (verdict === "READY" || verdict === "WATCH") return "#3b82f6";
    return "#a78bfa";
  };


  return (
    <div className="min-h-screen cockpit-bg text-white flex flex-col">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 relative z-10">
        <div className="container max-w-6xl mx-auto">

          {/* ─── Command Header ─── */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight gradient-text leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI COCKPIT</h1>
                <p className="text-white/20 text-[10px] font-mono tracking-[0.35em] uppercase mt-1.5">ADAPTIVE INTELLIGENCE · DECISIVE SIGNALS</p>
              </div>
              {/* Market status pill */}
              {(() => {
                const ms = marketStatusLabel();
                return (
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full" style={{ background: `${ms.color}08`, border: `1px solid ${ms.color}18`, boxShadow: `0 0 20px ${ms.color}08` }}>
                    <span className="relative flex h-2 w-2">
                      {isMarketOpen() && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ms.color }} />}
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: ms.color }} />
                    </span>
                    <span className="text-[10px] font-bold tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", color: ms.color }}>{ms.text}</span>
                  </div>
                );
              })()}
            </div>

            {/* Stat pills row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="cmd-stat text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Scanned</div>
                <div className="text-lg font-bold text-white/60 font-mono leading-none">{data?.tickers_scanned || '—'}</div>
              </div>
              <div className={`cmd-stat text-center ${tradable.length > 0 ? 'cmd-stat-active' : ''}`}>
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Active</div>
                <div className="text-lg font-bold font-mono leading-none" style={{ color: tradable.length > 0 ? '#00d4aa' : 'rgba(255,255,255,0.2)', textShadow: tradable.length > 0 ? '0 0 12px rgba(0,212,170,0.3)' : 'none' }}>{tradable.length}</div>
              </div>
              <div className={`cmd-stat text-center ${nearCount > 0 ? 'cmd-stat-warn' : ''}`}>
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Near Trade</div>
                <div className="text-lg font-bold font-mono leading-none" style={{ color: nearCount > 0 ? '#f59e0b' : 'rgba(255,255,255,0.2)', textShadow: nearCount > 0 ? '0 0 12px rgba(245,158,11,0.3)' : 'none' }}>{nearCount}</div>
              </div>
              <div className="cmd-stat text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Watchlist</div>
                <div className="text-lg font-bold text-white/30 font-mono leading-none">{watchlist.length}</div>
              </div>
              <div className="cmd-stat text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Next Scan</div>
                <div className="text-lg font-bold text-white/30 font-mono leading-none">{nextScanTime()}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

          {/* ═══ LEFT: Active Signals ═══ */}
          <div className="animated-border">
          <div className="glass-card-accent rounded-2xl overflow-hidden relative">
            {/* Scan sweep line */}
            {!activeVersion && isMarketOpen() && <div className="scan-sweep" />}

            {/* Title Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span
                  className="text-xs text-white/40 tracking-[0.2em] uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Active Signals
                </span>
              </div>
              {/* Live / Archive indicator */}
              <div className="flex items-center gap-2">
                {activeVersion ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8v13H3V8" />
                      <path d="M1 3h22v5H1z" />
                    </svg>
                    <span
                      className="text-xs text-[#f59e0b] tracking-wider uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Viewing Archive
                    </span>
                  </>
                ) : (() => {
                  const ms = marketStatusLabel();
                  return (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        {isMarketOpen() && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ms.color }} />
                        )}
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: ms.color }} />
                      </span>
                      <span
                        className="text-[10px] tracking-wider uppercase"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: ms.color }}
                      >
                        {ms.text}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Archive loading overlay */}
            {archiveLoading && (
              <div className="flex items-center justify-center py-3 bg-[#f59e0b]/5 border-b border-[#f59e0b]/10">
                <div className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-xs text-[#f59e0b]/60 font-mono">Loading archive…</span>
              </div>
            )}

            {/* Table */}
            <div className="px-2 sm:px-4 py-2">
              {/* Header Row — hidden on mobile, shown on sm+ */}
              <div
                className="hidden sm:grid gap-4 px-4 py-3 text-xs text-white/30 tracking-widest uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  gridTemplateColumns: "0.4fr 1fr 1.5fr 0.7fr 0.7fr 1fr",
                }}
              >
                <span className="text-center">Trend</span>
                <span>Ticker</span>
                <span>Setup</span>
                <span className="text-center">Score</span>
                <span className="text-center">Conviction</span>
                <span className="text-right">Price</span>
              </div>

              {/* Divider */}
              <div className="border-b border-white/5 mx-2" />

              {/* Empty State — Market Standby */}
              {tradable.length === 0 && !error && (
                <div className="px-4 py-20 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p
                    className="text-white/25 text-sm font-semibold mb-1.5 tracking-wide"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Market Standby
                  </p>
                  <p className="text-white/12 text-xs max-w-xs mx-auto leading-relaxed">
                    {watchlist.length > 0
                      ? `${watchlist.length} developing setup${watchlist.length > 1 ? "s" : ""} in the Watchlist — monitoring for breakout conditions.`
                      : "No actionable setups detected. The scanner will re-evaluate at the next interval."
                    }
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
              {tradable.map((s, i) => {
                const gc = gradeStyle[s.grade] || gradeStyle["D"];
                const vc = verdictColor(s.verdict || s.signal || "");
                const dc = directionStyle(s.direction || "MIXED");
                const lp = livePrices[s.ticker];
                const displayPrice = lp?.price ?? s.price;
                const priceChange = lp?.change;

                return (
                  <>
                    {/* Desktop row — hidden on mobile */}
                    <div
                      key={`${s.ticker}-${i}`}
                      className="hidden sm:grid gap-4 px-4 py-5 border-b border-white/[0.04] items-center scan-row signal-row"
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        gridTemplateColumns: "0.4fr 1fr 1.5fr 0.7fr 0.7fr 1fr",
                      }}
                    >
                      {/* Direction — Traffic Light */}
                      <div className="flex justify-center">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: dc.dot,
                            boxShadow: dc.glow,
                          }}
                          title={s.direction || "MIXED"}
                        />
                      </div>

                      {/* Ticker — colored by direction */}
                      <span
                        className="text-base font-bold"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: dc.text,
                          textShadow: dc.glow,
                        }}
                      >
                        {s.ticker}
                      </span>

                      {/* Setup */}
                      <span
                        className="text-sm font-bold tracking-wide leading-tight"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: vc,
                        }}
                      >
                        {displayVerdict(s.verdict || s.signal)}
                      </span>

                      {/* Score */}
                      <span
                        className="text-center text-base text-white/80"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {s.score}
                      </span>

                      {/* Conviction */}
                      <div className="flex justify-center">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
                          style={{ backgroundColor: gc.bg, color: gc.text }}
                        >
                          {s.grade}
                        </div>
                      </div>

                      {/* Price — live or scan-time */}
                      <div className="text-right">
                        <span
                          className="text-base text-white/70"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {displayPrice
                            ? `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </span>
                        {priceChange != null && (
                          <span
                            className="block text-[10px] mt-0.5"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: priceChange >= 0 ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mobile card — shown on small screens only */}
                    <div
                      key={`m-${s.ticker}-${i}`}
                      className="sm:hidden px-4 py-4 border-b border-white/[0.04] scan-row signal-row"
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: dc.dot, boxShadow: dc.glow }}
                          />
                          <span
                            className="text-lg font-bold"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: dc.text, textShadow: dc.glow }}
                          >
                            {s.ticker}
                          </span>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                            style={{ backgroundColor: gc.bg, color: gc.text }}
                          >
                            {s.grade}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-white/70 block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {displayPrice ? `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </span>
                          {priceChange != null && (
                            <span className="text-[10px] block" style={{ fontFamily: "'JetBrains Mono', monospace", color: priceChange >= 0 ? "#22c55e" : "#ef4444" }}>
                              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace", color: vc }}>
                          {displayVerdict(s.verdict || s.signal)}
                        </span>
                        <span className="text-xs text-white/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Score {s.score}</span>
                      </div>
                    </div>
                  </>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
              <span
                className="text-xs text-white/20"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {priceTimestamp && !activeVersion
                  ? `Prices as of ${new Date(priceTimestamp).toLocaleTimeString()} • Scanned ${timestamp}`
                  : `Premium universe scanned • ${timestamp}`
                }
              </span>
              <span
                className="text-xs"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: tradable.length > 0 ? "#00d4aa" : "rgba(255,255,255,0.2)",
                }}
              >
                {tradable.length > 0 ? `${tradable.length} tradable` : "0 tradable"}
              </span>
            </div>

            {/* ── LEGEND: Conviction Grade ── */}
            <div className="px-4 sm:px-6 py-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] text-[#00d4aa] tracking-widest uppercase font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CONVICTION</span>
                <span className="text-[8px] text-white/35" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Quality score from STRUCT + MOMT + RS pillars</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { grade: "A", label: "Elite", score: "75+", bg: "#22c55e", text: "#fff", where: "MAIN" },
                  { grade: "B", label: "Good", score: "55–74", bg: "#3b82f6", text: "#fff", where: "MAIN" },
                  { grade: "C", label: "Early", score: "35–54", bg: "#f59e0b", text: "#0a0e14", where: "FORMING" },
                  { grade: "D", label: "Hot", score: "20–34", bg: "#ff6b35", text: "#fff", where: "FORMING" },
                ].map((g) => (
                  <div key={g.grade} className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: `${g.bg}08`, border: `1px solid ${g.bg}15` }}>
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ backgroundColor: g.bg, color: g.text }}
                    >
                      {g.grade}
                    </div>
                    <span className="text-[9px] text-white/30 tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {g.score}
                    </span>
                    <span className="text-[8px] text-white/15" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {g.label}
                    </span>
                    <span
                      className="text-[7px] font-bold tracking-wider px-1 py-px rounded"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: g.where === "MAIN" ? "#00d4aa" : "#f59e0b",
                        background: g.where === "MAIN" ? "rgba(0,212,170,0.08)" : "rgba(245,158,11,0.08)",
                      }}
                    >
                      {g.where}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── LEGEND: Setup Type ── */}
            <div className="px-4 sm:px-6 py-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] text-[#00d4aa] tracking-widest uppercase font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SETUP</span>
                <span className="text-[8px] text-white/35" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Pattern detected by the AI Cockpit engine</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "SLINGSHOT", color: "#22c55e", desc: "Coil → breakout + MTF aligned" },
                  { label: "FIRE",      color: "#f97316", desc: "Triple aligned + expanding" },
                  { label: "TRIGGER",   color: "#f97316", desc: "Fresh flip + 3+ TFs agree" },
                  { label: "COIL",      color: "#f59e0b", desc: "Compressed near ALMA21" },
                  { label: "ACTIVE",    color: "#3b82f6", desc: "Trending but extended" },
                  { label: "WATCH",     color: "#6b7280", desc: "Developing — not ready" },
                ].map((v) => (
                  <div key={v.label} className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: `${v.color}08`, border: `1px solid ${v.color}12` }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                    <span
                      className="text-[9px] font-bold tracking-wide"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: v.color }}
                    >
                      {v.label}
                    </span>
                    <span className="text-[8px] text-white/15 hidden sm:inline" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Watchlist toggle */}
            {watchlist.length > 0 && (
              <button
                onClick={() => setShowMobileWatchlist(!showMobileWatchlist)}
                className="lg:hidden w-full flex items-center justify-center gap-2 px-6 py-3 border-t border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-xs text-[#f59e0b]/70 tracking-wide font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {showMobileWatchlist ? "Hide" : "Show"} Forming Setups ({watchlist.length})
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showMobileWatchlist ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </div>
          </div>

          {/* ═══ RIGHT: Developing Watchlist ═══ */}
          <div className={`${showMobileWatchlist ? "block" : "hidden"} lg:block`} id="watchlist">
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Watchlist Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] text-white/40 tracking-widest uppercase"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Forming
                  </span>
                  <span className="text-[8px] text-white/15 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>C+D</span>
                </div>
                <span
                  className="text-[11px] text-white/20"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {watchlist.length}
                </span>
              </div>

              {/* Watchlist rows */}
              {watchlist.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-white/20 text-[11px] font-mono">No developing setups</p>
                </div>
              ) : (
                watchlist.map((s, i) => {
                  const dc = directionStyle(s.direction || "MIXED");
                  const gc = gradeStyle[s.grade] || gradeStyle["D"];
                  const lp = livePrices[s.ticker];
                  const displayPrice = lp?.price ?? s.price;
                  const v = s.verdict || s.signal || "";
                  // Near B threshold (score 45-54) = close to promotion
                  const nearTradable = s.score >= 45;

                  return (
                    <div
                      key={`w-${s.ticker}-${i}`}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 ${nearTradable ? 'watchlist-near' : 'watchlist-row'}`}
                    >
                      {/* Trend dot */}
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: dc.dot,
                          boxShadow: nearTradable ? "0 0 8px rgba(245,158,11,0.5)" : dc.glow,
                        }}
                      />
                      {/* Ticker */}
                      <span
                        className="text-sm font-bold flex-1"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: nearTradable ? "#f59e0b" : dc.text,
                          textShadow: nearTradable ? "0 0 10px rgba(245,158,11,0.3)" : undefined,
                        }}
                      >
                        {s.ticker}
                      </span>
                      {/* Verdict + Near Tradable badge */}
                      <div className="flex items-center gap-1.5">
                        {nearTradable && (
                          <span
                            className="text-[7px] font-bold tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              background: "rgba(245,158,11,0.12)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245,158,11,0.25)",
                              boxShadow: "0 0 6px rgba(245,158,11,0.15)",
                            }}
                          >
                            NEAR TRADE
                          </span>
                        )}
                        <span
                          className="text-[10px] font-bold tracking-wide"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: verdictColor(displayVerdict(v)) }}
                        >
                          {displayVerdict(v)}
                        </span>
                      </div>
                      {/* Price */}
                      <div className="text-right ml-auto" style={{ minWidth: "60px" }}>
                        <span
                          className="text-[11px] text-white/50 block"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {displayPrice
                            ? `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </span>
                        {lp?.change != null && (
                          <span
                            className="text-[9px] block"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: lp.change >= 0 ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {lp.change >= 0 ? "+" : ""}{lp.change.toFixed(2)}%
                          </span>
                        )}
                      </div>
                      {/* Grade dot */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                        style={{ backgroundColor: gc.bg, color: gc.text }}
                      >
                        {s.grade}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          </div> {/* end grid */}

          {/* Archive Panel — below terminal, right-aligned */}
          <div className="flex justify-end mt-1">
            <ArchivePanel
              history={history}
              activeVersion={activeVersion}
              onSelect={loadVersion}
              onReset={resetToLive}
            />
          </div>

          {/* Disclaimer */}
          <p className="text-center text-white/15 text-xs mt-4 font-mono tracking-wide">
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

/* ─── Main Export — Auth Protected ─────────────────────────── */
export default function AIDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
