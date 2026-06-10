/* ============================================================
   WeeklyIncome.tsx — Weekly Income Scanner (Short Put/Call)
   Auth: Public — no login required
   Data: Fetches live scan data from GitHub Gist
   ============================================================ */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import ProtectedRoute from "@/components/ProtectedRoute";

// GitHub Gist — replace with real ID later
const GIST_ID = "2bd50c8183b50e72c3d52fd2c3dbf04f";
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/* ─── Market Hours Helper ──────────────────────────────────── */
function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  return minutes >= 570 && minutes <= 960;
}

function marketStatusLabel(): { text: string; color: string } {
  if (isMarketOpen()) return { text: "MARKET OPEN", color: "#28c840" };
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return { text: "WEEKEND", color: "#6b7280" };
  return { text: "AFTER HOURS", color: "#6b7280" };
}

/* ─── Types ─────────────────────────────────────────────────── */
interface Candidate {
  ticker: string;
  side: string;
  strike: number;
  expiration: string;
  credit: number;
  delta: number;
  stock_price: number;
  otm_pct: number;
  dte: number;
  open_interest: number;
  bid: number;
  ask: number;
  support_level: number;
  resistance_level: number;
  total_score: number;
  grade: string;
  contract_symbol: string;
  reasons: string[];
}

interface ScanData {
  scan_timestamp: string;
  tickers_scanned: number;
  candidates_found: number;
  unique_alerts: number;
  market_condition: string;
  candidates: Candidate[];
}

interface GistHistoryEntry {
  version: string;
  committed_at: string;
}

/* ─── Archive Panel ────────────────────────────────────────── */
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

  const entries = useMemo(
    () =>
      history.map((h) => {
        const d = new Date(h.committed_at);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        const label = `${dateStr} \u00b7 ${timeStr}`;
        return { ...h, label };
      }),
    [history]
  );

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
          {/* Search */}
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
                placeholder="Filter dates\u2026"
                className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-white/70 placeholder-white/15 focus:outline-none focus:border-[#00d4aa]/30 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors text-[10px]"
                >
                  \u2715
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="max-h-40 overflow-y-auto">
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
                  \u2190 Back to Live
                </span>
              </button>
            )}

            {filtered.length === 0 && (
              <div className="px-4 py-4 text-center">
                <span className="text-[10px] text-white/20 font-mono">No matching dates</span>
              </div>
            )}

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
                      backgroundColor: isActive || isHighlighted
                        ? "#00d4aa"
                        : "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    className="text-xs tracking-wide"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isActive || isHighlighted
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

/* ─── Loading Skeleton ─────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="bg-[#0d1520] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-green-500/40 animate-pulse" />
            </div>
            <div className="p-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-white/5 rounded-lg mb-3 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Grade helpers ─────────────────────────────────────────── */
function gradeFromScore(score: number): string {
  if (score >= 80) return "A";
  if (score >= 75) return "B";
  return "C";
}

function gradeStyle(grade: string): { bg: string; text: string } {
  if (grade === "A") return { bg: "#22c55e", text: "#fff" };
  if (grade === "B") return { bg: "#00d4aa", text: "#0a0e14" };
  return { bg: "#f59e0b", text: "#0a0e14" };
}

/* ─── Dashboard Content (shown after auth + approval) ──────── */
function WeeklyIncomeContent() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GistHistoryEntry[]>([]);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(GIST_API, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const gist = await resp.json();
      const content = gist.files?.["weekly_income_scan.json"]?.content;
      if (!content) throw new Error("weekly_income_scan.json not found in Gist");
      const parsed: ScanData = JSON.parse(content);
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
      console.error("Failed to fetch weekly income data:", e);
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load a specific historical version
  const loadVersion = useCallback(async (version: string) => {
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
      const content = gist.files?.["weekly_income_scan.json"]?.content;
      if (!content) throw new Error("weekly_income_scan.json not found in archive");
      const parsed: ScanData = JSON.parse(content);
      setData(parsed);
      setActiveVersion(version);
      setError(null);
    } catch (e: any) {
      console.error("Failed to load archive version:", e);
      setError(e.message || "Failed to load archive");
    }
  }, []);

  const resetToLive = useCallback(() => {
    setActiveVersion(null);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (isMarketOpen()) fetchData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <LoadingSkeleton />;

  const candidates = (data?.candidates || [])
    .map((c) => ({ ...c, _grade: gradeFromScore(c.total_score) }))
    .sort((a, b) => b.total_score - a.total_score);

  const tradableCount = candidates.length;
  const ms = marketStatusLabel();
  const scanTimestamp = data?.scan_timestamp
    ? new Date(data.scan_timestamp).toLocaleString()
    : "—";
  const scanDate = data?.scan_timestamp
    ? new Date(data.scan_timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 relative z-10">
        <div className="container max-w-5xl mx-auto">

          {/* ─── Command Header ─── */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="text-center sm:text-left">
                <h1
                  className="text-3xl sm:text-4xl font-black tracking-tight leading-none"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: "linear-gradient(135deg, #00d4aa, #00b894)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  WEEKLY INCOME
                </h1>
                <p
                  className="text-white/20 text-[10px] tracking-[0.35em] uppercase mt-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  SHORT PUT / CALL SCANNER · PREMIUM SETUPS
                </p>
              </div>
              {/* Market status pill */}
              <div
                className="flex items-center gap-2.5 px-4 py-2 rounded-full"
                style={{
                  background: `${ms.color}08`,
                  border: `1px solid ${ms.color}18`,
                  boxShadow: `0 0 20px ${ms.color}08`,
                }}
              >
                <span className="relative flex h-2 w-2">
                  {isMarketOpen() && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: ms.color }}
                    />
                  )}
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: ms.color }}
                  />
                </span>
                <span
                  className="text-[10px] font-bold tracking-wider"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: ms.color,
                  }}
                >
                  {ms.text}
                </span>
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#0d1520] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Scanned</div>
                <div
                  className="text-lg font-bold text-white/60 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {data?.tickers_scanned || "—"}
                </div>
              </div>
              <div className="bg-[#0d1520] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Candidates</div>
                <div
                  className="text-lg font-bold leading-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: tradableCount > 0 ? "#00d4aa" : "rgba(255,255,255,0.2)",
                    textShadow: tradableCount > 0 ? "0 0 12px rgba(0,212,170,0.3)" : "none",
                  }}
                >
                  {tradableCount}
                </div>
              </div>
              <div className="bg-[#0d1520] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Unique Alerts</div>
                <div
                  className="text-lg font-bold text-white/60 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {data?.unique_alerts ?? "—"}
                </div>
              </div>
              <div className="bg-[#0d1520] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Market</div>
                <div
                  className="text-lg font-bold text-white/40 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {data?.market_condition || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ MAIN TERMINAL CARD ═══ */}
          <div className="animated-border">
          <div className="bg-[#0d1520] border border-white/10 rounded-2xl overflow-hidden relative">
            {/* Scan sweep line */}
            {!activeVersion && isMarketOpen() && <div className="scan-sweep" />}

            {/* Terminal title bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span
                  className="text-xs text-[#00d4aa] tracking-[0.2em] uppercase font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  WEEKLY INCOME SCANNER
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeVersion ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8v13H3V8" />
                      <path d="M1 3h22v5H1z" />
                      <path d="M10 12h4" />
                    </svg>
                    <span
                      className="text-[10px] tracking-wider uppercase font-bold"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f59e0b" }}
                    >
                      ARCHIVE
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      {isMarketOpen() && (
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: ms.color }}
                        />
                      )}
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ backgroundColor: ms.color }}
                      />
                    </span>
                    <span
                      className="text-[10px] tracking-wider uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: ms.color }}
                    >
                      {ms.text}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Table ── */}
            <div className="px-2 sm:px-4 py-2">

              {/* Header Row — desktop */}
              <div
                className="hidden sm:grid gap-3 px-4 py-3 text-xs text-white/30 tracking-widest uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  gridTemplateColumns: "0.5fr 0.7fr 0.8fr 0.9fr 0.6fr 0.5fr 0.5fr 1fr",
                }}
              >
                <span>Side</span>
                <span>Ticker</span>
                <span>Strike</span>
                <span>Credit</span>
                <span className="text-center">Score</span>
                <span className="text-center">DTE</span>
                <span className="text-center">Delta</span>
                <span className="text-right">Price</span>
              </div>

              <div className="border-b border-white/5 mx-2" />

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

              {/* Empty State */}
              {!error && candidates.length === 0 && (
                <div className="px-4 py-20 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p
                    className="text-white/25 text-sm font-semibold mb-1.5 tracking-wide"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    No Active Candidates
                  </p>
                  <p className="text-white/[0.12] text-xs max-w-xs mx-auto leading-relaxed">
                    The scanner will refresh at the next interval. Check back during market hours for new setups.
                  </p>
                </div>
              )}

              {/* Signal Rows */}
              {candidates.map((c, i) => {
                const isPut = c.side.toLowerCase() === "put";
                const sideColor = isPut ? "#00d4aa" : "#ef4444";
                const grade = c._grade;
                const gs = gradeStyle(grade);
                const otmDisplay = (c.otm_pct * 100).toFixed(1);
                const strikeLabel = `$${c.strike.toFixed(1)}${isPut ? "P" : "C"}`;
                const creditPer100 = (c.credit * 100).toFixed(0);

                return (
                  <div key={`${c.contract_symbol}-${i}`}>
                    {/* Desktop row */}
                    <div
                      className="hidden sm:grid gap-3 px-4 py-4 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors"
                      style={{
                        animationDelay: `${i * 0.06}s`,
                        gridTemplateColumns: "0.5fr 0.7fr 0.8fr 0.9fr 0.6fr 0.5fr 0.5fr 1fr",
                      }}
                    >
                      {/* Side */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sideColor, boxShadow: `0 0 8px ${sideColor}60` }}
                        />
                        <span
                          className="text-xs font-bold tracking-wider"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: sideColor }}
                        >
                          {c.side.toUpperCase()}
                        </span>
                      </div>

                      {/* Ticker */}
                      <span
                        className="text-base font-black text-white"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.ticker}
                      </span>

                      {/* Strike */}
                      <span
                        className="text-sm text-white/70"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {strikeLabel}
                      </span>

                      {/* Credit */}
                      <div>
                        <span
                          className="text-sm font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00d4aa" }}
                        >
                          ${c.credit.toFixed(2)}
                        </span>
                        <span
                          className="text-xs text-white/30 ml-1.5"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          / ${creditPer100}
                        </span>
                      </div>

                      {/* Score + Grade */}
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="text-sm text-white/80"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {c.total_score}
                        </span>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                          style={{ backgroundColor: gs.bg, color: gs.text }}
                        >
                          {grade}
                        </div>
                      </div>

                      {/* DTE */}
                      <span
                        className="text-center text-sm text-white/60"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.dte}d
                      </span>

                      {/* Delta */}
                      <span
                        className="text-center text-sm text-white/50"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.delta.toFixed(2)}
                      </span>

                      {/* Price + OTM */}
                      <div className="text-right">
                        <span
                          className="text-sm text-white/70"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          ${c.stock_price.toFixed(2)}
                        </span>
                        <span
                          className="block text-[10px] mt-0.5"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "#00d4aa",
                          }}
                        >
                          {otmDisplay}% OTM
                        </span>
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div
                      className="sm:hidden px-4 py-4 border-b border-white/[0.04]"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      {/* Top row: side dot + ticker + grade + price */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sideColor, boxShadow: `0 0 8px ${sideColor}60` }}
                          />
                          <span
                            className="text-lg font-black text-white"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {c.ticker}
                          </span>
                          <span
                            className="text-[10px] font-bold tracking-wider"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: sideColor }}
                          >
                            {c.side.toUpperCase()}
                          </span>
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ backgroundColor: gs.bg, color: gs.text }}
                          >
                            {grade}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="text-sm text-white/70 block"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            ${c.stock_price.toFixed(2)}
                          </span>
                          <span
                            className="text-[10px] block"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00d4aa" }}
                          >
                            {otmDisplay}% OTM
                          </span>
                        </div>
                      </div>
                      {/* Bottom row: strike, credit, dte, delta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs text-white/50"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {strikeLabel}
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00d4aa" }}
                          >
                            ${c.credit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs text-white/40"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {c.dte}d
                          </span>
                          <span
                            className="text-xs text-white/40"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            Δ{c.delta.toFixed(2)}
                          </span>
                          <span
                            className="text-xs text-white/40"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            Score {c.total_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Info Footer ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-3 border-t border-white/5 gap-1">
              <span
                className="text-xs text-white/20"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Prices as of {scanTimestamp} · Scanned {scanDate}
              </span>
              <span
                className="text-xs"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: tradableCount > 0 ? "#00d4aa" : "rgba(255,255,255,0.2)",
                }}
              >
                {tradableCount > 0 ? `${tradableCount} tradable` : "0 tradable"}
              </span>
            </div>

            {/* ── LEGEND: Conviction ── */}
            <div className="px-4 sm:px-6 py-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[9px] text-[#00d4aa] tracking-widest uppercase font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  CONVICTION
                </span>
                <span
                  className="text-[8px] text-white/35"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Quality score from scanner analysis
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { grade: "A", label: "Strong", score: "80+", bg: "#22c55e", text: "#fff", where: "ENTRY" },
                  { grade: "B", label: "Good", score: "75–79", bg: "#00d4aa", text: "#0a0e14", where: "ENTRY" },
                  { grade: "C", label: "Marginal", score: "70–74", bg: "#f59e0b", text: "#0a0e14", where: "FORMING" },
                ].map((g) => (
                  <div
                    key={g.grade}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                    style={{ background: `${g.bg}08`, border: `1px solid ${g.bg}15` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ backgroundColor: g.bg, color: g.text }}
                    >
                      {g.grade}
                    </div>
                    <span
                      className="text-[9px] text-white/30 tracking-wide"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {g.score}
                    </span>
                    <span
                      className="text-[8px] text-white/15"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {g.label}
                    </span>
                    <span
                      className="text-[7px] font-bold tracking-wider px-1 py-px rounded"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: g.where === "ENTRY" ? "#00d4aa" : "#f59e0b",
                        background:
                          g.where === "ENTRY"
                            ? "rgba(0,212,170,0.08)"
                            : "rgba(245,158,11,0.08)",
                      }}
                    >
                      {g.where}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── LEGEND: Strategy ── */}
            <div className="px-4 sm:px-6 py-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[9px] text-[#00d4aa] tracking-widest uppercase font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  STRATEGY
                </span>
                <span
                  className="text-[8px] text-white/35"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Short premium approach based on directional bias
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "PUT",
                    color: "#00d4aa",
                    desc: "Sell OTM put on bullish names",
                  },
                  {
                    label: "CALL",
                    color: "#ef4444",
                    desc: "Sell OTM call on bearish names",
                  },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                    style={{
                      background: `${v.color}08`,
                      border: `1px solid ${v.color}12`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: v.color }}
                    />
                    <span
                      className="text-[9px] font-bold tracking-wide"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: v.color }}
                    >
                      {v.label}
                    </span>
                    <span
                      className="text-[8px] text-white/15 hidden sm:inline"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {v.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

          {/* Disclaimer */}
          <p
            className="text-center text-white/15 text-xs mt-6 leading-relaxed max-w-2xl mx-auto"
            style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.03em" }}
          >
            OPTIONS TRADING INVOLVES SUBSTANTIAL RISK. This is not financial advice.
            Review all setups manually before trading.
          </p>

          {/* Archive Panel */}
          <ArchivePanel
            history={history}
            activeVersion={activeVersion}
            onSelect={loadVersion}
            onReset={resetToLive}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1520] border-t border-white/5 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <PrimalEdgeLogo size="md" />
          </Link>
          <p className="text-white/20 text-sm">
            © {new Date().getFullYear()} Primal Edge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Main Export — Auth Protected ───────────────────── */
export default function WeeklyIncome() {
  return (
    <ProtectedRoute>
      <WeeklyIncomeContent />
    </ProtectedRoute>
  );
}
