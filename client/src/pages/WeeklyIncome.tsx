/* ============================================================
   WeeklyIncome.tsx â€” Weekly Income Scanner (Short Put/Call)
   Auth: Public â€” no login required
   Data: Fetches live scan data from GitHub Gist
   ============================================================ */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import ProtectedRoute from "@/components/ProtectedRoute";

// GitHub Gist â€” replace with real ID later
const GIST_ID = "2bd50c8183b50e72c3d52fd2c3dbf04f";
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/* â”€â”€â”€ Market Hours Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface ScoreCategory {
  name: string;
  score: number;
  max: number;
  status: string;
  explanation: string;
}

interface ScoreDetails {
  categories: ScoreCategory[];
  gates: { label: string; passed: boolean }[];
  warnings: string[];
  final_summary: string;
  indicators: {
    sma20?: number;
    sma50?: number;
    rsi?: number;
    atr?: number;
    avg_volume?: number;
    compression?: boolean;
    bb_width?: number;
  };
}

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
  score_details?: ScoreDetails;
  setup_type?: string;
  premium_label?: string;
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

/* â”€â”€â”€ Archive Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Loading Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Grade helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function gradeFromScore(score: number): string {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  return "D";
}

function gradeStyle(grade: string): { bg: string; text: string } {
  if (grade === "A") return { bg: "#22c55e", text: "#fff" };
  if (grade === "B") return { bg: "#00d4aa", text: "#0a0e14" };
  return { bg: "#f59e0b", text: "#0a0e14" };
}

/* â”€â”€â”€ Status Badge Color â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function statusColor(status: string): string {
  switch (status) {
    case "Strong":     return "#22c55e";
    case "Good":       return "#00d4aa";
    case "Acceptable": return "#3b82f6";
    case "Moderate":   return "#f59e0b";
    case "Weak":       return "#ef4444";
    case "Review":     return "#f97316";
    default:           return "#6b7280";
  }
}

/* â”€â”€â”€ Premium Label Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function premiumLabel(credit: number): { text: string; color: string; bg: string } | null {
  const contractValue = credit * 100;
  if (contractValue >= 500) return { text: "Juicy Premium", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (contractValue >= 250) return { text: "Strong Premium", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  if (contractValue >= 150) return { text: "Meets Minimum", color: "#00d4aa", bg: "rgba(0,212,170,0.12)" };
  return null;
}

function setupTypeColor(setupType: string): string {
  if (setupType.includes("Juicy")) return "#22c55e";
  if (setupType.includes("Balanced")) return "#3b82f6";
  if (setupType.includes("Conservative")) return "#00d4aa";
  return "#6b7280";
}

/* â”€â”€â”€ Score Detail Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ScoreDetailPanel({ candidate }: { candidate: Candidate & { _grade: string } }) {
  const sd = candidate.score_details;

  /* Fallback: no score_details â€” show reasons list */
  if (!sd) {
    return (
      <div
        className="px-4 sm:px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]"
      >
        <div
          className="text-[10px] text-white/25 tracking-widest uppercase mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Scoring Reasons
        </div>
        <ul className="space-y-1">
          {candidate.reasons.map((r, i) => (
            <li
              key={i}
              className="text-xs text-white/40 flex items-start gap-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-[#00d4aa] mt-px">â€¢</span>
              {r}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const hasIndicators = sd.indicators && Object.values(sd.indicators).some((v) => v != null);

  return (
    <div className="px-4 sm:px-6 py-5 bg-white/[0.02] border-t border-white/[0.06] space-y-5">

      {/* â”€â”€ Score Breakdown â”€â”€ */}
      <div>
        <div
          className="text-[10px] text-white/25 tracking-widest uppercase mb-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Score Breakdown
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {sd.categories.map((cat) => {
            const pct = cat.max > 0 ? cat.score / cat.max : 0;
            const barColor = pct >= 0.8 ? "#00d4aa" : pct >= 0.6 ? "#f59e0b" : "#ef4444";
            const sc = statusColor(cat.status);
            return (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[11px] text-white/50"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] text-white/60"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {cat.score}/{cat.max}
                    </span>
                    <span
                      className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: sc,
                        backgroundColor: `${sc}15`,
                        border: `1px solid ${sc}25`,
                      }}
                    >
                      {cat.status}
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: barColor }}
                  />
                </div>
                <p
                  className="text-[10px] text-white/25 leading-snug"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {cat.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ Hard Gates â”€â”€ */}
      {sd.gates.length > 0 && (
        <div>
          <div
            className="text-[10px] text-white/25 tracking-widest uppercase mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Hard Gates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {sd.gates.map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[11px]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span style={{ color: g.passed ? "#22c55e" : "#ef4444" }}>
                  {g.passed ? "âœ“" : "âœ—"}
                </span>
                <span className={g.passed ? "text-white/40" : "text-red-400/70"}>
                  {g.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€ Warnings â”€â”€ */}
      {sd.warnings.length > 0 && (
        <div className="space-y-1">
          {sd.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f59e0b" }}
            >
              <span className="mt-px">âš </span>
              <span className="text-amber-400/70">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ Technical Indicators â”€â”€ */}
      {hasIndicators && (
        <div className="flex flex-wrap gap-2">
          {sd.indicators.sma20 != null && (
            <span
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              SMA20 {sd.indicators.sma20.toFixed(2)}
            </span>
          )}
          {sd.indicators.sma50 != null && (
            <span
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              SMA50 {sd.indicators.sma50.toFixed(2)}
            </span>
          )}
          {sd.indicators.rsi != null && (
            <span
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              RSI {sd.indicators.rsi.toFixed(1)}
            </span>
          )}
          {sd.indicators.atr != null && (
            <span
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ATR {sd.indicators.atr.toFixed(2)}
            </span>
          )}
          {sd.indicators.avg_volume != null && (
            <span
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              AvgVol {(sd.indicators.avg_volume / 1e6).toFixed(1)}M
            </span>
          )}
          {sd.indicators.compression && (
            <span
              className="text-[10px] font-bold tracking-wider bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}
            >
              âš¡ COMPRESSION
            </span>
          )}
          {sd.indicators.bb_width != null && (
            <span
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              BB Width {(sd.indicators.bb_width * 100).toFixed(1)}%
            </span>
          )}
        </div>
      )}

      {/* â”€â”€ Final Summary â”€â”€ */}
      {sd.final_summary && (
        <div
          className="text-xs text-white/40 leading-relaxed border-l-2 border-[#00d4aa]/30 pl-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {sd.final_summary}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ Dashboard Content (shown after auth + approval) â”€â”€â”€â”€â”€â”€â”€â”€ */
function WeeklyIncomeContent() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GistHistoryEntry[]>([]);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = useCallback((idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

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
    : "â€”";
  const scanDate = data?.scan_timestamp
    ? new Date(data.scan_timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "â€”";

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 relative z-10">
        <div className="container max-w-5xl mx-auto">

          {/* â”€â”€â”€ Command Header â”€â”€â”€ */}
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
                  SHORT PUT / CALL SCANNER Â· PREMIUM SETUPS
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-[10px] tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#00d4aa",
                      background: "rgba(0,212,170,0.08)",
                      border: "1px solid rgba(0,212,170,0.15)",
                    }}
                  >
                    MIN PREMIUM: $150/contract
                  </span>
                  <span
                    className="text-[10px] tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#6b7280",
                      background: "rgba(107,114,128,0.08)",
                      border: "1px solid rgba(107,114,128,0.15)",
                    }}
                  >
                    PUTS + CALLS
                  </span>
                </div>
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
                  {data?.tickers_scanned || "â€”"}
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
                  {data?.unique_alerts ?? "â€”"}
                </div>
              </div>
              <div className="bg-[#0d1520] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Market</div>
                <div
                  className="text-lg font-bold text-white/40 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {data?.market_condition || "â€”"}
                </div>
              </div>
            </div>
          </div>

          {/* â”€â”€ PRODUCT INTRO COPY â”€â”€ */}
          <section className="pb-8 sm:pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] text-[#00d4aa]/70 tracking-widest bg-[#00d4aa]/8 border border-[#00d4aa]/15 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                PRIVATE ACCESS Â· INCOME INTELLIGENCE
              </div>

              <p className="font-['Space_Grotesk'] text-lg sm:text-xl text-[#00d4aa]/80 mb-6">
                Find the premium. Measure the risk. Trade with discipline.
              </p>

              <p className="text-white/45 text-base sm:text-lg leading-relaxed mb-4 max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Weekly Income Scanner is a private-access income intelligence layer built to surface high-quality option-selling opportunities from a curated universe of liquid, premium names. It evaluates credit quality, delta, distance from price, liquidity, trend condition, event risk, and risk-adjusted reward so traders can focus on the contracts that deserve review.
              </p>

              <p className="text-white/35 text-sm leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                For weekly income traders, this creates a more disciplined workflow: identify juicy premium, avoid low-quality traps, understand why a setup qualifies, and review only the candidates with the strongest balance of income and risk control.
              </p>
            </div>
          </section>


          {/* â”€â”€ INCOME INTELLIGENCE DIMENSIONS â”€â”€ */}
          <section className="pb-12 sm:pb-16">
            <div className="text-center mb-10">
              <p className="font-mono text-xs text-[#00d4aa] tracking-widest mb-3">INTELLIGENCE DIMENSIONS</p>
              <h2 className="font-['Space_Grotesk'] font-bold text-2xl sm:text-3xl text-white">
                Six Layers of<br />Income Intelligence
              </h2>
            </div>

            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { tag: "PREMIUM", title: "Premium Strength", desc: "Prioritizes contracts that meet or exceed the minimum income threshold. No contract below $150 per contract is surfaced as tradable." },
                { tag: "DELTA", title: "Conservative Delta", desc: "Filters for controlled probability exposure instead of reckless premium chasing. Preferred range: -0.18 to -0.25 delta." },
                { tag: "LIQUIDITY", title: "Liquidity Quality", desc: "Checks spread, open interest, and tradability before a contract is surfaced. Wide spreads are flagged or rejected." },
                { tag: "RISK", title: "Risk Cushion", desc: "Evaluates OTM distance, ATR buffer, support location, and price cushion before any contract qualifies." },
                { tag: "EVENT", title: "Event Awareness", desc: "Flags earnings and known risk events before expiration. No candidate with confirmed earnings before expiry is marked tradable." },
                { tag: "SCORE", title: "Score Explanation", desc: "Shows why a candidate qualifies, where it is strong, what still needs review, and the final conviction read." },
              ].map((item, i) => (
                <div key={i} className="relative bg-[#111820] border border-white/5 rounded-xl p-6 hover:border-[#00d4aa]/20 transition-all group">
                  <span className="font-mono text-[9px] text-[#00d4aa]/50 tracking-widest bg-[#00d4aa]/5 border border-[#00d4aa]/10 rounded px-2 py-0.5 mb-4 inline-block">{item.tag}</span>
                  <div className="absolute top-5 right-5 font-['Space_Grotesk'] text-4xl font-bold text-white/[0.03]">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-['Space_Grotesk'] font-semibold text-base text-white mb-3 group-hover:text-[#00d4aa] transition-colors">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* â•â•â• MAIN TERMINAL CARD â•â•â• */}
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

            {/* â”€â”€ Table â”€â”€ */}
            <div className="px-2 sm:px-4 py-2">

              {/* Header Row â€” desktop */}
              <div
                className="hidden sm:grid gap-3 px-4 py-3 text-xs text-white/30 tracking-widest uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  gridTemplateColumns: "0.5fr 0.7fr 0.8fr 0.9fr 0.6fr 0.5fr 0.5fr 1fr auto",
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
                <span className="w-5" />
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
                    Retry â†’
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

                const isExpanded = expandedRows.has(i);

                return (
                  <div key={`${c.contract_symbol}-${i}`}>
                    {/* Desktop row */}
                    <div
                      className="hidden sm:grid gap-3 px-4 py-4 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
                      style={{
                        animationDelay: `${i * 0.06}s`,
                        gridTemplateColumns: "0.5fr 0.7fr 0.8fr 0.9fr 0.6fr 0.5fr 0.5fr 1fr auto",
                      }}
                      onClick={() => toggleRow(i)}
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
                      <div>
                        <span
                          className="text-base font-black text-white"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {c.ticker}
                        </span>
                        {c.setup_type && (
                          <span
                            className="text-[8px] tracking-wider opacity-60 block mt-0.5"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: setupTypeColor(c.setup_type),
                            }}
                          >
                            {c.setup_type}
                          </span>
                        )}
                      </div>

                      {/* Strike */}
                      <span
                        className="text-sm text-white/70"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {strikeLabel}
                      </span>

                      {/* Credit */}
                      <div>
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
                        {(() => {
                          const pl = premiumLabel(c.credit);
                          return pl ? (
                            <span
                              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                color: pl.color,
                                background: pl.bg,
                                border: `1px solid ${pl.color}25`,
                              }}
                            >
                              {pl.text}
                            </span>
                          ) : null;
                        })()}
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

                      {/* Chevron */}
                      <div className="flex items-center justify-center w-5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white/20 transition-transform duration-200"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Desktop expansion panel */}
                    <div
                      className="hidden sm:block overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: isExpanded ? "1200px" : "0px",
                        opacity: isExpanded ? 1 : 0,
                      }}
                    >
                      {isExpanded && <ScoreDetailPanel candidate={c} />}
                    </div>

                    {/* Mobile card */}
                    <div
                      className="sm:hidden border-b border-white/[0.04] cursor-pointer select-none"
                      style={{ animationDelay: `${i * 0.06}s` }}
                      onClick={() => toggleRow(i)}
                    >
                      <div className="px-4 py-4">
                        {/* Top row: side dot + ticker + grade + price + chevron */}
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
                          <div className="flex items-center gap-2">
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
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white/20 transition-transform duration-200 ml-1"
                              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
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
                            {(() => {
                              const pl = premiumLabel(c.credit);
                              return pl ? (
                                <span
                                  className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full inline-block"
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: pl.color,
                                    background: pl.bg,
                                    border: `1px solid ${pl.color}25`,
                                  }}
                                >
                                  {pl.text}
                                </span>
                              ) : null;
                            })()}
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
                              Î”{c.delta.toFixed(2)}
                            </span>
                            <span
                              className="text-xs text-white/40"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              Score {c.total_score}
                            </span>
                          </div>
                        </div>
                        {c.setup_type && (
                          <span
                            className="text-[8px] tracking-wider opacity-60 block mt-1"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: setupTypeColor(c.setup_type),
                            }}
                          >
                            {c.setup_type}
                          </span>
                        )}
                      </div>

                      {/* Mobile expansion panel */}
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: isExpanded ? "1200px" : "0px",
                          opacity: isExpanded ? 1 : 0,
                        }}
                      >
                        {isExpanded && <ScoreDetailPanel candidate={c} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* â”€â”€ Info Footer â”€â”€ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-3 border-t border-white/5 gap-1">
              <span
                className="text-xs text-white/20"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Prices as of {scanTimestamp} Â· Scanned {scanDate}
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

            {/* â”€â”€ LEGEND: Conviction â”€â”€ */}
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
                  { grade: "A", label: "Strong", score: "85+", bg: "#22c55e", text: "#fff", where: "ENTRY" },
                  { grade: "B", label: "Good", score: "75â€“84", bg: "#00d4aa", text: "#0a0e14", where: "ENTRY" },
                  { grade: "C", label: "Moderate", score: "65â€“74", bg: "#f59e0b", text: "#0a0e14", where: "FORMING" },
                  { grade: "D", label: "Weak", score: "<65", bg: "#ef4444", text: "#fff", where: "AVOID" },
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

            {/* â”€â”€ LEGEND: Strategy â”€â”€ */}
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

          {/* â”€â”€ DISCLAIMER â”€â”€ */}
          <div className="mt-12 mb-8 max-w-4xl mx-auto bg-[#111820] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
              <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <p className="text-white/35 text-xs leading-relaxed">
              <span className="text-white/55 font-semibold">Research Disclosure:</span> AI Cockpit and Weekly Income Scanner are educational and analytical intelligence tools. Signals, scores, candidate lists, premiums, directional labels, and all visual readouts are derived from data analysis and may be delayed, incomplete, or inaccurate depending on source availability. They are provided for informational purposes only and do not constitute financial advice or a recommendation to buy, sell, hold, or trade any security or derivative. Every trade idea must be independently reviewed before action.
            </p>
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
            Â© {new Date().getFullYear()} Primal Edge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* â”€â”€â”€ Main Export â€” Auth Protected â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function WeeklyIncome() {
  return (
    <ProtectedRoute product="income">
      <WeeklyIncomeContent />
    </ProtectedRoute>
  );
}
