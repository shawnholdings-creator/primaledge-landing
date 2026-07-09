/* ============================================================
   WeeklyIncome.tsx — Weekly Options Income Dashboard (Income Intelligence)
   Auth: Public — no login required
   Data: Fetches live scan data from GitHub Gist
   ============================================================ */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import PrimalEdgeLogo from "@/components/PrimalEdgeLogo";
import ProtectedRoute from "@/components/ProtectedRoute";
import WeeklyIncomeHero from "../components/WeeklyIncomeHero";
import BacktestSignalLog from "../components/BacktestSignalLog";
import { useAuth } from "../contexts/AuthContext";


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
  thesis?: string;
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

interface Position {
  id: string;
  ticker: string;
  side: "PUT" | "CALL";
  strike: number;
  expiration: string;
  entryCredit: number;
  entryDate: string;
  status: "open" | "closed";
  exitAlertFired: boolean;
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
          className="mt-2 bg-[#0d1118] border border-white/10 rounded-xl overflow-hidden"
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
                className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-white/70 placeholder-white/15 focus:outline-none focus:border-[#00e5a0]/30 transition-colors"
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
                  } ${isHighlighted ? "bg-[#00e5a0]/[0.04]" : ""}`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isActive || isHighlighted
                        ? "#00e5a0"
                        : "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    className="text-xs tracking-wide"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isActive || isHighlighted
                        ? "#00e5a0"
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
    <div className="min-h-screen bg-[#0a0d12] text-white">
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="bg-[#0d1118] border border-white/10 rounded-2xl overflow-hidden">
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
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  return "D";
}

function gradeStyle(grade: string): { bg: string; text: string } {
  if (grade === "A") return { bg: "#22c55e", text: "#fff" };
  if (grade === "B") return { bg: "#00e5a0", text: "#0a0d12" };
  return { bg: "#f59e0b", text: "#0a0d12" };
}

/* ─── Status Badge Color ───────────────────────────────────── */
function statusColor(status: string): string {
  switch (status) {
    case "Strong":     return "#22c55e";
    case "Good":       return "#00e5a0";
    case "Acceptable": return "#3b82f6";
    case "Moderate":   return "#f59e0b";
    case "Weak":       return "#ef4444";
    case "Review":     return "#f97316";
    default:           return "#6b7280";
  }
}

/* ─── Premium Label Helper ─────────────────────────────────── */
function premiumLabel(credit: number): { text: string; color: string; bg: string } | null {
  const contractValue = credit * 100;
  if (contractValue >= 500) return { text: "Juicy Premium", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (contractValue >= 250) return { text: "Strong Premium", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  if (contractValue >= 1) return { text: "Qualifying", color: "#00e5a0", bg: "rgba(0,229,160,0.12)" };
  return null;
}

function setupTypeColor(setupType: string): string {
  if (setupType.includes("Juicy")) return "#22c55e";
  if (setupType.includes("Balanced")) return "#3b82f6";
  if (setupType.includes("Conservative")) return "#00e5a0";
  return "#6b7280";
}

/* ─── Copy Protection: sanitize score explanations ─────────── */
function sanitizeExplanation(text: string): string {
  if (!text) return text;
  let s = text;
  // Strip dollar amounts: $123.45, $1,234
  s = s.replace(/\$[\d,]+\.?\d*/g, "");
  // Strip percentages: 22%, ~22%, 3.6%
  s = s.replace(/~?\d+\.?\d*%/g, "");
  // Strip parenthetical numbers: (55), (5,668), (14), ($722)
  s = s.replace(/\(\$?[\d,.]+\)/g, "");
  // Strip indicator references: RSI, ATR, SMA, MA with values
  s = s.replace(/\bRSI\s*\(?[\d.]*\)?/gi, "momentum indicator");
  s = s.replace(/\bATR\s*(buffer:?)?\s*[\d.x]*\s*\(?\$?[\d,.]*\)?/gi, "volatility buffer");
  s = s.replace(/\b\d+-day\s*MA/gi, "moving average");
  s = s.replace(/\bSMA\d+/gi, "trend average");
  // Strip OTM references
  s = s.replace(/\d+\.?\d*\s*OTM/gi, "out-of-the-money");
  // Strip DTE references
  s = s.replace(/\bDTE\s*\(?\d*\)?\s*(is)?/gi, "Time window");
  // Strip volume/OI numbers
  s = s.replace(/\b\d{1,3}(,\d{3})*(\.\d+)?\s*(M|K|shares|contracts)?\b/g, "");
  // Strip bid/ask spread values
  s = s.replace(/\$\d+\.\d+\/\$\d+\.\d+/g, "");
  // Strip "verify manually"
  s = s.replace(/verify manually/gi, "review before acting");
  // Strip annualized return references
  s = s.replace(/annualized return/gi, "income potential");
  // Clean up double spaces and orphaned punctuation
  s = s.replace(/\s*—\s*—/g, " —");
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/\s+\./g, ".");
  s = s.replace(/\s+,/g, ",");
  s = s.replace(/^\s+|\s+$/g, "");
  return s;
}

/* ─── Qualitative delta label ──────────────────────────────── */
function deltaLabel(delta: number): { text: string; color: string } {
  const d = Math.abs(delta);
  if (d >= 0.30) return { text: "Wide", color: "#22c55e" };
  if (d >= 0.20) return { text: "Adequate", color: "#00e5a0" };
  return { text: "Tight", color: "#f59e0b" };
}

/* ─── Qualitative OTM label ────────────────────────────────── */
function otmLabel(otmPct: number): string {
  const pct = Math.abs(otmPct * 100);
  if (pct >= 5) return "Wide cushion";
  if (pct >= 3) return "Good room";
  if (pct >= 1.5) return "Adequate";
  return "Tight";
}

/* ─── Plain-English Score Descriptions ─────────────────────── */
function getPlainDescription(categoryName: string, status: string, side?: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("premium")) {
    return "The premium collected on this trade is meaningful relative to the capital at risk. A strong premium score means the income potential justifies entering the position.";
  }
  if (name.includes("liquidity")) {
    return "This option trades actively with strong participation from other market players. You can enter and exit this position cleanly without giving up significant edge to the spread.";
  }
  if (name.includes("cushion") || name.includes("risk cushion")) {
    return "The strike sits comfortably below the current price with a meaningful buffer zone. Even if the stock pulls back moderately, the trade has room to breathe before reaching the strike.";
  }
  if (name.includes("technical")) {
    const sideText = side?.toLowerCase() === "call" ? "short call" : "short put";
    return `The stock's recent price behavior looks constructive and supports the direction of this trade. Current conditions appear favorable for a ${sideText} position based on price structure alone.`;
  }
  if (name.includes("event")) {
    if (status === "Weak" || status === "Review") {
      return "A scheduled company announcement may occur before this trade expires. This adds an element of uncertainty — consider reducing position size or waiting for the event to pass.";
    }
    return "No scheduled company announcements are expected before this trade expires. This removes a major source of uncertainty and supports a cleaner hold to expiry.";
  }
  if (name.includes("underlying") || name.includes("quality")) {
    return "This is a well-established, highly liquid instrument with consistent market participation. Premium collected on names like this tends to be reliable and fills are straightforward.";
  }
  // Fallback — generic
  return "This dimension contributes to the overall conviction score for this setup.";
}

/* ─── Gate Label Translation ───────────────────────────────── */
function translateGateLabel(rawLabel: string): { label: string; isEarnings: boolean } {
  const lower = rawLabel.toLowerCase();
  if (lower.includes("credit") && (lower.includes("≥") || lower.includes(">=")))
    return { label: "Premium Worth Collecting", isEarnings: false };
  if (lower.includes("time") || lower.includes("-14d") || lower.includes("dte"))
    return { label: "Ideal Expiry Timing", isEarnings: false };
  if (lower.includes("otm") || lower.includes("cushion"))
    return { label: "Strike Has Breathing Room", isEarnings: false };
  if (lower.includes("spread"))
    return { label: "Clean Entry & Exit", isEarnings: false };
  if (lower.includes("delta"))
    return { label: "Low Directional Risk", isEarnings: false };
  if (lower.includes("strike") && lower.includes("below"))
    return { label: "Strike Safely Below Price", isEarnings: false };
  if (lower.includes("liquidity") || lower.includes("oi"))
    return { label: "Highly Liquid Market", isEarnings: false };
  if (lower.includes("earning"))
    return { label: "No Surprise Events Before Expiry", isEarnings: true };
  // Fallback — clean up and return as-is
  return { label: rawLabel.replace(/[≥≤<>]/g, "").trim(), isEarnings: false };
}

/* ─── Score Detail Panel ───────────────────────────────────── */
function ScoreDetailPanel({ candidate }: { candidate: Candidate & { _grade: string } }) {
  const sd = candidate.score_details;

  /* Fallback: no score_details — show reasons list */
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
              <span className="text-[#00e5a0] mt-px">•</span>
              {sanitizeExplanation(r)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const hasIndicators = sd.indicators && Object.values(sd.indicators).some((v) => v != null);

  return (
    <div className="px-4 sm:px-6 py-5 bg-white/[0.02] border-t border-white/[0.06] space-y-5">

      {/* ── AI Thesis ── */}
      {candidate.thesis && (
        <div
          style={{
            padding: "14px 16px",
            marginBottom: "20px",
            background: "rgba(0,255,150,0.04)",
            borderLeft: "3px solid rgba(0,255,150,0.4)",
            borderRadius: "0 8px 8px 0",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "'Space Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.18em",
              color: "#00ff96",
              opacity: 0.5,
              textTransform: "uppercase" as const,
              marginBottom: "6px",
            }}
          >
            Why This Setup
          </span>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "#aaa",
              lineHeight: 1.55,
              margin: 0,
              wordBreak: "break-word" as const,
            }}
          >
            {candidate.thesis}
          </p>
        </div>
      )}
      {/* ── Recommended Trade ── */}
      {(() => {
        const isPut = candidate.side.toLowerCase() === "put";
        const sideLabel = isPut ? "PUT" : "CALL";
        const sideColor = isPut ? "#00e5a0" : "#ef4444";
        const creditPer100 = Math.round(candidate.credit * 100);
        const probOfProfit = Math.round((1 - Math.abs(candidate.delta)) * 100);
        const maxRisk = Math.round((candidate.strike - candidate.credit) * 100);
        const maxReward = Math.round(candidate.credit * 100);
        const rrRatio = maxReward > 0 ? (maxRisk / maxReward).toFixed(1) : "—";
        const expirationDisplay = candidate.expiration
          ? new Date(candidate.expiration + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—";
        return (
          <div style={{ marginBottom: "20px" }}>
            <div
              className="text-[10px] tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Space Mono', 'Space Grotesk', monospace", letterSpacing: "0.18em", color: "#555" }}
            >
              Recommended Trade
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Stock Price */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Stock Price</span>
                <span className="text-white font-black text-base mt-0.5">${candidate.stock_price.toFixed(2)}</span>
              </div>
              {/* Strike */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Strike</span>
                <span className="text-white font-black text-base mt-0.5">${candidate.strike.toFixed(1)} <span style={{ color: sideColor, fontSize: "11px" }}>{sideLabel}</span></span>
              </div>
              {/* Expiration */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Expiration</span>
                <span className="text-white font-black text-base mt-0.5">{expirationDisplay}</span>
              </div>
              {/* DTE */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">DTE</span>
                <span className="text-white font-black text-base mt-0.5">{candidate.dte} days</span>
              </div>
              {/* Credit */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Credit</span>
                <span className="font-black text-base mt-0.5" style={{ color: "#00e5a0" }}>${candidate.credit.toFixed(2)} <span className="text-xs text-white/30">/ ${creditPer100}</span></span>
              </div>
              {/* Bid / Ask */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Bid / Ask</span>
                <span className="text-white font-black text-base mt-0.5">${candidate.bid.toFixed(2)} / ${candidate.ask.toFixed(2)}</span>
              </div>
              {/* OTM Buffer */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Strike vs Stock</span>
                <span className="font-black text-base mt-0.5" style={{ color: "#00e5a0" }}>{(candidate.otm_pct * 100).toFixed(1)}% OTM</span>
              </div>
              {/* Est. Probability of Profit */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Est. Probability of Profit</span>
                <span className={`font-black text-base mt-0.5 ${probOfProfit >= 80 ? "text-green-400" : probOfProfit >= 65 ? "text-yellow-400" : "text-red-400"}`}>
                  {probOfProfit}%
                </span>
                <span className="text-xs text-gray-600 mt-0.5">Chance of expiring worthless</span>
              </div>
              {/* Risk / Reward */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Risk / Reward</span>
                <span className="text-white font-black text-base mt-0.5">{rrRatio}:1</span>
                <span className="text-xs text-gray-600 mt-0.5">Max risk ${maxRisk.toLocaleString()} · Max reward ${maxReward}</span>
              </div>
              {/* Contract Symbol */}
              <div className="flex flex-col sm:col-span-3 col-span-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Contract Symbol</span>
                <span className="text-white/60 text-xs mt-0.5 font-mono">{candidate.contract_symbol}</span>
              </div>
            </div>
            {/* How to place this trade */}
            <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'Space Mono', monospace" }}>How to place this trade</span>
              <p className="text-xs text-white/45 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Sell to open 1× <span className="text-white/70 font-semibold">{candidate.ticker} ${candidate.strike.toFixed(1)} {sideLabel}</span> expiring <span className="text-white/70 font-semibold">{expirationDisplay}</span> for a credit of <span className="text-white/70 font-semibold">${candidate.credit.toFixed(2)}</span> per share (${creditPer100} per contract).{" "}
                The scanner estimates a <span className={`font-semibold ${probOfProfit >= 80 ? "text-green-400" : "text-yellow-400"}`}>{probOfProfit}% probability</span> of this contract expiring worthless and keeping the full credit.
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Score Breakdown ── */}
      <div>
        <div
          className="text-[10px] tracking-widest uppercase mb-3"
          style={{ fontFamily: "'Space Mono', 'Space Grotesk', monospace", letterSpacing: "0.18em", color: "#555" }}
        >
          Score Breakdown
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {sd.categories.map((cat) => {
            const pct = cat.max > 0 ? cat.score / cat.max : 0;
            const barColor = pct >= 0.8 ? "#00e5a0" : pct >= 0.6 ? "#f59e0b" : "#ef4444";
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
                  className="leading-snug"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    color: "#666",
                    lineHeight: 1.65,
                    marginTop: "8px",
                  }}
                >
                  {getPlainDescription(cat.name, cat.status, candidate.side)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Why This Made The Cut ── */}
      {sd.gates.length > 0 && (
        <div>
          <div
            className="text-[10px] tracking-widest uppercase mb-2"
            style={{ fontFamily: "'Space Mono', 'Space Grotesk', monospace", letterSpacing: "0.18em", color: "#555" }}
          >
            Why This Made The Cut
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
            {sd.gates.map((g, i) => {
              const translated = translateGateLabel(g.label);
              const isEarnings = translated.isEarnings;
              // Earnings gate uses WARNING state when failed, never red
              const state: "pass" | "fail" | "warning" = g.passed
                ? "pass"
                : isEarnings
                  ? "warning"
                  : "fail";
              const styles = {
                pass: {
                  background: "rgba(0,255,150,0.08)",
                  border: "1px solid rgba(0,255,150,0.3)",
                  color: "#00ff96",
                  icon: "✓",
                },
                fail: {
                  background: "rgba(255,68,68,0.08)",
                  border: "1px solid rgba(255,68,68,0.3)",
                  color: "#ff6b6b",
                  icon: "✗",
                },
                warning: {
                  background: "rgba(255,180,0,0.08)",
                  border: "1px solid rgba(255,180,0,0.3)",
                  color: "#ffb400",
                  icon: "⚠",
                },
              }[state];
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                      background: styles.background,
                      border: styles.border,
                      color: styles.color,
                    }}
                  >
                    <span>{styles.icon}</span>
                    {translated.label}
                  </span>
                  {state === "warning" && isEarnings && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#ffb400",
                        opacity: 0.7,
                        marginTop: "4px",
                        paddingLeft: "4px",
                      }}
                    >
                      An announcement may fall before expiry — factor this into your sizing.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Warnings ── */}
      {sd.warnings.length > 0 && (
        <div className="space-y-1">
          {sd.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f59e0b" }}
            >
              <span className="mt-px">⚠</span>
              <span className="text-amber-400/70">{sanitizeExplanation(w)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Technical Indicators (qualitative only) ── */}
      {hasIndicators && (
        <div className="flex flex-wrap gap-2">
          {sd.indicators.compression && (
            <span
              className="text-[10px] font-bold tracking-wider bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}
            >
              ⚡ COMPRESSION
            </span>
          )}
          <span
            className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            This setup has cleared all platform quality gates required for member review.
          </span>
        </div>
      )}

      {/* ── Final Summary ── */}
      {sd.final_summary && (
        <div
          className="text-xs text-white/40 leading-relaxed border-l-2 border-[#00e5a0]/30 pl-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {sanitizeExplanation(sd.final_summary)}
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard Content (shown after auth + approval) ──────── */
function WeeklyIncomeContent() {
  const { signOut } = useAuth();
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GistHistoryEntry[]>([]);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"scanner" | "positions">("scanner");
  const [mode, setMode] = useState<"standard" | "micro">("standard");
  const [positions, setPositions] = useState<Position[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    ticker: "",
    side: "PUT" as "PUT" | "CALL",
    strike: "",
    expiration: "",
    entryCredit: "",
  });

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

  // Load positions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pe_positions");
      if (saved) setPositions(JSON.parse(saved));
    } catch {}
  }, []);

  // Save positions to localStorage
  useEffect(() => {
    localStorage.setItem("pe_positions", JSON.stringify(positions));
  }, [positions]);

  const addPosition = () => {
    if (!formData.ticker) return;
    const newPos: Position = {
      id: Date.now().toString(),
      ticker: formData.ticker.toUpperCase(),
      side: formData.side,
      strike: parseFloat(formData.strike) || 0,
      expiration: formData.expiration,
      entryCredit: parseFloat(formData.entryCredit) || 0,
      entryDate: new Date().toISOString().split("T")[0],
      status: "open",
      exitAlertFired: false,
    };
    setPositions((prev) => [...prev, newPos]);
    setFormData({ ticker: "", side: "PUT", strike: "", expiration: "", entryCredit: "" });
    setShowAddForm(false);
  };

  const markClosed = (id: string) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "closed" as const, exitAlertFired: false } : p))
    );
  };

  const removePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const openCount = positions.filter((p) => p.status === "open").length;

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
    <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col">
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
                    background: "linear-gradient(135deg, #00e5a0, #00b894)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  WEEKLY OPTIONS INCOME
                </h1>
                <p
                  className="text-white/20 text-[10px] tracking-[0.35em] uppercase mt-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  INCOME INTELLIGENCE · PRIVATE ACCESS
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="text-[10px] tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#6b7280",
                      background: "rgba(107,114,128,0.08)",
                      border: "1px solid rgba(107,114,128,0.15)",
                    }}
                  >
                    PRIVATE ACCESS
                  </span>
                  <button
                    onClick={() => signOut()}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 20,
                      padding: "4px 12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    Sign Out
                  </button>
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

            {/* ─── Standard / Micro Toggle ─── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "12px 0 8px" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "rgba(13,17,24,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  padding: 3,
                }}
              >
                {(["standard", "micro"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                      fontWeight: mode === m ? 700 : 400,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "5px 16px",
                      borderRadius: 16,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: mode === m ? "#00e5a0" : "transparent",
                      color: mode === m ? "#0a0d12" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {m === "standard" ? "Standard" : "Micro"}
                  </button>
                ))}
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.05em",
                }}
              >
                {mode === "standard"
                  ? "Full watchlist \u00b7 All qualifying setups"
                  : "Sized for accounts under $10K \u00b7 1 contract at a time"}
              </span>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
              <div className="bg-[#0d1118] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Scanned</div>
                <div
                  className="text-lg font-bold text-white/60 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {data?.tickers_scanned || "—"}
                </div>
              </div>
              <div className="bg-[#0d1118] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">
                  {mode === "micro" && tradableCount === 0 ? "Next Scan" : "Candidates"}
                </div>
                <div
                  className={mode === "micro" && tradableCount === 0 ? "text-xs font-bold leading-none mt-1" : "text-lg font-bold leading-none"}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: tradableCount > 0 ? "#00e5a0" : "rgba(255,255,255,0.3)",
                    textShadow: tradableCount > 0 ? "0 0 12px rgba(0,229,160,0.3)" : "none",
                  }}
                >
                  {mode === "micro" && tradableCount === 0 ? "Check Back Soon" : tradableCount}
                </div>
              </div>
              <div className="bg-[#0d1118] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">
                  {mode === "micro" ? "Probability of Success" : "Unique Alerts"}
                </div>
                <div
                  className="text-lg font-bold text-white/60 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {mode === "micro" ? "92%*" : (data?.unique_alerts ?? "—")}
                </div>
              </div>
              <div className="bg-[#0d1118] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">
                  {mode === "micro" ? "Avg Time to Target" : "Market"}
                </div>
                <div
                  className="text-lg font-bold text-white/40 leading-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {mode === "micro" ? "5 days" : (data?.market_condition || "—")}
                </div>
              </div>
              {candidates.filter(c => c.side?.toLowerCase() === "call").length > 0 && (
                <div className="bg-[#0d1118] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                  <div className="text-[10px] text-white/15 tracking-widest uppercase mb-1">Call Setups</div>
                  <div
                    className="text-lg font-bold leading-none"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#ef4444",
                      textShadow: "0 0 12px rgba(239,68,68,0.3)",
                    }}
                  >
                    {candidates.filter(c => c.side?.toLowerCase() === "call").length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
            {(["scanner", "positions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "6px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                  border: activeTab === tab
                    ? "1px solid rgba(0,229,160,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: activeTab === tab
                    ? "rgba(0,229,160,0.1)"
                    : "transparent",
                  color: activeTab === tab
                    ? "#00e5a0"
                    : "rgba(255,255,255,0.35)",
                  fontWeight: activeTab === tab ? 700 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {tab === "scanner" ? "Dashboard" : "My Positions"}
                {tab === "positions" && openCount > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: "rgba(0,229,160,0.15)",
                      color: "#00e5a0",
                      fontSize: "0.6rem",
                      padding: "1px 6px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "scanner" && (
          <>
          {/* ═══ MAIN TERMINAL CARD ═══ */}
          <div className="animated-border">
          <div className="bg-[#0d1118] border border-white/10 rounded-2xl overflow-hidden relative">
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
                  className="text-xs text-[#00e5a0] tracking-[0.2em] uppercase font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {mode === "micro" ? "MICRO OPTIONS INCOME DASHBOARD" : "WEEKLY OPTIONS INCOME DASHBOARD"}
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
                className="hidden md:grid gap-3 px-4 py-3 text-xs text-white/30 tracking-widest uppercase"
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
                <span className="text-center">TIMING</span>
                <span className="text-center">Buffer</span>
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
                    className="mt-4 text-xs text-[#00e5a0] font-mono hover:underline"
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
                    {mode === "micro" ? "No setups this cycle." : "No Active Candidates"}
                  </p>
                  <p className="text-white/[0.12] text-xs max-w-xs mx-auto leading-relaxed">
                    {mode === "micro"
                      ? "Check back at the next scan."
                      : "The scanner will refresh at the next interval. Check back during market hours for new setups."}
                  </p>
                </div>
              )}

              {/* Signal Rows */}
              {(() => {
                const sortedCandidates = [
                  ...candidates.filter(c => c.side?.toLowerCase() === "put"),
                  ...candidates.filter(c => c.side?.toLowerCase() === "call"),
                ];
                return sortedCandidates.map((c, i) => {
                const isPut = c.side.toLowerCase() === "put";
                const sideColor = isPut ? "#00e5a0" : "#ef4444";
                const grade = c._grade;
                const gs = gradeStyle(grade);
                const otmDisplay = (c.otm_pct * 100).toFixed(1);
                const strikeLabel = `$${c.strike.toFixed(1)}${isPut ? "P" : "C"}`;
                const creditPer100 = (c.credit * 100).toFixed(0);

                const isExpanded = expandedRows.has(i);

                return (
                  <React.Fragment key={`${c.contract_symbol}-${i}`}>
                  {i > 0 && sortedCandidates[i].side?.toLowerCase() === "call" && sortedCandidates[i-1].side?.toLowerCase() === "put" && (
                    <div
                      className="mx-4 my-2 flex items-center gap-3"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.12)" }} />
                      <span className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(239,68,68,0.4)" }}>
                        A-Grade Call Setups
                      </span>
                      <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.12)" }} />
                    </div>
                  )}
                  <div>
                    {/* Desktop row */}
                    <div
                      className="hidden md:grid gap-3 px-4 py-4 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
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
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}
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

                      {/* Timing */}
                      <span
                        className="text-center text-sm text-white/60"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.dte}d
                      </span>

                      {/* Buffer */}
                      <span
                        className="text-center text-sm"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: deltaLabel(c.delta).color }}
                      >
                        {deltaLabel(c.delta).text}
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
                            color: "#00e5a0",
                          }}
                        >
                          {otmLabel(c.otm_pct)}
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
                      className="hidden md:block overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: isExpanded ? "1200px" : "0px",
                        opacity: isExpanded ? 1 : 0,
                      }}
                    >
                      {isExpanded && <ScoreDetailPanel candidate={c} />}
                      {isExpanded && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingBottom: 8, paddingRight: 16 }}>
                          <button
                            onClick={() => {
                              setFormData({
                                ticker: c.ticker,
                                side: (c.side?.toUpperCase() === "CALL" ? "CALL" : "PUT") as "PUT" | "CALL",
                                strike: String(c.strike),
                                expiration: c.expiration,
                                entryCredit: String(c.credit ?? ""),
                              });
                              setActiveTab("positions");
                              setShowAddForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "#0a0d12",
                              background: "#00e5a0",
                              border: "none",
                              borderRadius: 8,
                              padding: "10px 20px",
                              cursor: "pointer",
                            }}
                          >
                            Log This Trade →
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Micro max risk — desktop */}
                    {mode === "micro" && (
                      <div
                        className="hidden md:flex gap-4 px-6 pb-2"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.65rem",
                          color: "rgba(255,255,255,0.25)",
                        }}
                      >
                        <span>Max risk: {(c.strike * 100).toLocaleString('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0})}</span>
                        <span>Suggested: 1 contract</span>
                      </div>
                    )}

                    {/* Mobile card */}
                    <div
                      className="md:hidden border-b border-white/[0.04] cursor-pointer select-none"
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
                                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}
                              >
                                {otmLabel(c.otm_pct)}
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
                        {/* Bottom row: strike, credit, timing, quality */}
                        <div className="flex flex-wrap items-center justify-between gap-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-xs text-white/50"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {strikeLabel}
                            </span>
                            <span
                              className="text-xs font-bold"
                              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00e5a0" }}
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
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs text-white/40"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {c.dte}d
                            </span>
                            <span
                              className="text-xs"
                              style={{ fontFamily: "'JetBrains Mono', monospace", color: deltaLabel(c.delta).color }}
                            >
                              {deltaLabel(c.delta).text}
                            </span>
                            <span
                              className="text-xs text-white/40"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              Quality {c.total_score}
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
                        {isExpanded && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingBottom: 8, paddingRight: 16 }}>
                            <button
                              onClick={() => {
                                setFormData({
                                  ticker: c.ticker,
                                  side: (c.side?.toUpperCase() === "CALL" ? "CALL" : "PUT") as "PUT" | "CALL",
                                  strike: String(c.strike),
                                  expiration: c.expiration,
                                  entryCredit: String(c.credit ?? ""),
                                });
                                setActiveTab("positions");
                                setShowAddForm(true);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#0a0d12",
                                background: "#00e5a0",
                                border: "none",
                                borderRadius: 8,
                                padding: "10px 20px",
                                cursor: "pointer",
                              }}
                            >
                              Log This Trade →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Micro max risk — mobile */}
                      {mode === "micro" && (
                        <div
                          className="px-4 pb-2 flex gap-3"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.65rem",
                            color: "rgba(255,255,255,0.25)",
                          }}
                        >
                          <span>Max risk: {(c.strike * 100).toLocaleString('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0})}</span>
                          <span>Suggested: 1 contract</span>
                        </div>
                      )}
                    </div>
                  </div>
                  </React.Fragment>
                );
              }); })()}
            </div>

            {/* ── Recent Backtest Performance ── */}
            <div className="mt-10 mb-2 px-4 sm:px-0">
              <p className="text-xs font-mono text-green-400/70 uppercase tracking-widest">Reference</p>
              <h3 className="text-white font-bold text-base mt-0.5">Recent Backtest Performance</h3>
              <p className="text-gray-500 text-xs mt-0.5 mb-4">How the scanner performed over the last 3 weeks of backtesting — for reference only.</p>
              <BacktestSignalLog />
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
                  color: tradableCount > 0 ? "#00e5a0" : "rgba(255,255,255,0.2)",
                }}
              >
                {tradableCount > 0 ? `${tradableCount} tradable` : "0 tradable"}
              </span>
            </div>

            {/* ── LEGEND: Conviction ── */}
            <div className="px-4 sm:px-6 py-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[9px] text-[#00e5a0] tracking-widest uppercase font-bold"
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
                  { grade: "B", label: "Good", score: "75–84", bg: "#00e5a0", text: "#0a0d12", where: "ENTRY" },
                  { grade: "C", label: "Moderate", score: "65–74", bg: "#f59e0b", text: "#0a0d12", where: "FORMING" },
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
                        color: g.where === "ENTRY" ? "#00e5a0" : "#f59e0b",
                        background:
                          g.where === "ENTRY"
                            ? "rgba(0,229,160,0.08)"
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
                  className="text-[9px] text-[#00e5a0] tracking-widest uppercase font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  STRATEGY
                </span>
                <span
                  className="text-[8px] text-white/35"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Income approach based on directional bias
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "PUT",
                    color: "#00e5a0",
                    desc: "Bullish income setup on strong names",
                  },
                  {
                    label: "CALL",
                    color: "#ef4444",
                    desc: "Bearish income setup on weak names",
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

          {/* ── PRODUCT INTRO COPY ── */}
          <section className="pt-12 pb-8 sm:pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] text-[#00e5a0]/70 tracking-widest bg-[#00e5a0]/8 border border-[#00e5a0]/15 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
                PRIVATE ACCESS · INCOME INTELLIGENCE
              </div>

              <p className="font-['Space_Grotesk'] text-lg sm:text-xl text-[#00e5a0]/80 mb-6">
                Find the premium. Measure the risk. Trade with discipline.
              </p>

              <p className="text-white/45 text-base sm:text-lg leading-relaxed mb-4 max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Weekly Options Income Dashboard is a private-access income intelligence layer built to surface high-quality option-selling opportunities from a curated universe of liquid, premium names. It evaluates credit quality, opportunity quality, risk cushion, and timing conditions, trend condition, event risk, and risk-adjusted reward so traders can focus on the contracts that deserve review.
              </p>

              <p className="text-white/35 text-sm leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                For weekly income traders, this creates a more disciplined workflow: identify juicy premium, avoid low-quality traps, understand why a setup qualifies, and review only the candidates with the strongest balance of income and risk control.
              </p>
            </div>
          </section>

          {/* ── INCOME INTELLIGENCE DIMENSIONS ── */}
          <section className="pb-12 sm:pb-16">
            <div className="text-center mb-10">
              <p className="font-mono text-xs text-[#00e5a0] tracking-widest mb-3">INTELLIGENCE DIMENSIONS</p>
              <h2 className="font-['Space_Grotesk'] font-bold text-2xl sm:text-3xl text-white">
                Six Layers of<br />Income Intelligence
              </h2>
            </div>

            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { tag: "PREMIUM", title: "Premium Strength", desc: "Prioritizes contracts that meet or exceed a meaningful income quality threshold before being surfaced as tradable." },
                { tag: "QUALITY", title: "Opportunity Quality", desc: "Filters for high-probability setups with favorable risk-reward characteristics and appropriate directional cushion." },
                { tag: "LIQUIDITY", title: "Liquidity Quality", desc: "Evaluates participation depth and execution quality before a contract is surfaced. Illiquid contracts are flagged or excluded." },
                { tag: "RISK", title: "Risk Cushion", desc: "Measures directional buffer, volatility context, and structural support before any contract qualifies for review." },
                { tag: "EVENT", title: "Event Awareness", desc: "Identifies scheduled market events within the trade window. Elevated-risk setups are flagged for additional review." },
                { tag: "SCORE", title: "Score Explanation", desc: "Shows why a candidate qualifies, where it is strong, what still needs review, and the final conviction read." },
              ].map((item, i) => (
                <div key={i} className="relative bg-[#10151d] border border-white/5 rounded-xl p-6 hover:border-[#00e5a0]/20 transition-all group">
                  <span className="font-mono text-[9px] text-[#00e5a0]/50 tracking-widest bg-[#00e5a0]/5 border border-[#00e5a0]/10 rounded px-2 py-0.5 mb-4 inline-block">{item.tag}</span>
                  <div className="absolute top-5 right-5 font-['Space_Grotesk'] text-4xl font-bold text-white/[0.03]">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-['Space_Grotesk'] font-semibold text-base text-white mb-3 group-hover:text-[#00e5a0] transition-colors">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── DISCLAIMER ── */}
          <div className="mt-12 mb-8 max-w-4xl mx-auto bg-[#10151d] border border-white/5 rounded-xl px-5 sm:px-6 py-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
              <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <p className="text-white/35 text-xs leading-relaxed">
              <span className="text-white/55 font-semibold">Research Disclosure:</span> AI Cockpit and Weekly Options Income Dashboard are educational and analytical intelligence tools. Signals, scores, candidate lists, premiums, directional labels, and all visual readouts are derived from data analysis and may be delayed, incomplete, or inaccurate depending on source availability. They are provided for informational purposes only and do not constitute financial advice or a recommendation to buy, sell, hold, or trade any security or derivative. Every trade idea must be independently reviewed before action.
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
          </>
          )}

          {activeTab === "positions" && (
            <div style={{ padding: "16px" }}>
              {/* Section Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase",
                  }}
                >
                  MY POSITIONS
                </span>
                {openCount > 0 && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.6rem",
                      background: "rgba(0,229,160,0.1)",
                      color: "#00e5a0",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {openCount} open
                  </span>
                )}
              </div>

              {/* Add Position Toggle */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  color: "#00e5a0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: showAddForm ? 16 : 0,
                }}
              >
                {showAddForm ? "− Cancel" : "+ Log Position"}
              </button>

              {/* Add Position Form */}
              {showAddForm && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: window.innerWidth < 640 ? "1fr" : "1fr 1fr",
                    gap: 12,
                    marginBottom: 20,
                    padding: 16,
                    background: "rgba(13,17,24,0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                  }}
                >
                  {/* Ticker */}
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Ticker</label>
                    <input
                      type="text"
                      placeholder="NVDA"
                      value={formData.ticker}
                      onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                      style={{ width: "100%", background: "#0d1118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
                    />
                  </div>
                  {/* Side */}
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Side</label>
                    <select
                      value={formData.side}
                      onChange={(e) => setFormData({ ...formData, side: e.target.value as "PUT" | "CALL" })}
                      style={{ width: "100%", background: "#0d1118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
                    >
                      <option value="PUT">Short Put</option>
                      <option value="CALL">Short Call</option>
                    </select>
                  </div>
                  {/* Strike */}
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Strike</label>
                    <input
                      type="number"
                      placeholder="118.00"
                      value={formData.strike}
                      onChange={(e) => setFormData({ ...formData, strike: e.target.value })}
                      style={{ width: "100%", background: "#0d1118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
                    />
                  </div>
                  {/* Expiration */}
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Expiration</label>
                    <input
                      type="date"
                      value={formData.expiration}
                      onChange={(e) => setFormData({ ...formData, expiration: e.target.value })}
                      style={{ width: "100%", background: "#0d1118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", outline: "none", colorScheme: "dark" }}
                    />
                  </div>
                  {/* Entry Credit */}
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Entry Credit (per share)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1.45"
                      value={formData.entryCredit}
                      onChange={(e) => setFormData({ ...formData, entryCredit: e.target.value })}
                      style={{ width: "100%", background: "#0d1118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
                    />
                  </div>
                  {/* Submit */}
                  <div style={{ gridColumn: window.innerWidth < 640 ? "1" : "1 / -1", marginTop: 4 }}>
                    <button
                      onClick={addPosition}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#0a0d12",
                        background: "#00e5a0",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 24px",
                        cursor: "pointer",
                      }}
                    >
                      Log Position →
                    </button>
                  </div>
                </div>
              )}

              {/* Positions List */}
              {positions.length === 0 && !showAddForm ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}>
                    No positions logged yet.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "#00e5a0", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}
                  >
                    + Log Position
                  </button>
                </div>
              ) : positions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {/* Table Header (desktop) */}
                  <div
                    className="hidden sm:grid"
                    style={{
                      gridTemplateColumns: "0.8fr 0.5fr 0.7fr 0.8fr 0.7fr 1.2fr 0.8fr",
                      padding: "8px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {["TICKER", "SIDE", "STRIKE", "EXPIRY", "CREDIT", "STATUS", "ACTION"].map((h) => (
                      <span
                        key={h}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.55rem",
                          letterSpacing: "0.12em",
                          color: "rgba(255,255,255,0.2)",
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Rows / Cards */}
                  {positions.map((pos) => (
                    <div key={pos.id}>
                      {/* Desktop Row */}
                      <div
                        className="hidden sm:grid"
                        style={{
                          gridTemplateColumns: "0.8fr 0.5fr 0.7fr 0.8fr 0.7fr 1.2fr 0.8fr",
                          padding: "10px 12px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          alignItems: "center",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.75rem",
                          color: pos.status === "closed" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{pos.ticker}</span>
                        <span>{pos.side}</span>
                        <span>${pos.strike.toFixed(2)}</span>
                        <span>{pos.expiration}</span>
                        <span>${pos.entryCredit.toFixed(2)}</span>
                        <span>
                          {pos.status === "closed" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(107,114,128,0.15)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>Closed</span>
                          ) : pos.exitAlertFired ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 12 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#f59e0b", animation: "pulse 2s ease-in-out infinite", flexShrink: 0 }} />
                              Exit Signal
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.15)", color: "rgba(0,229,160,0.5)", fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>Monitoring</span>
                          )}
                        </span>
                        <span>
                          {pos.status === "open" ? (
                            <button
                              onClick={() => markClosed(pos.id)}
                              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "none", padding: 0 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.textDecoration = "underline"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.textDecoration = "none"; }}
                            >
                              Mark Closed
                            </button>
                          ) : (
                            <button
                              onClick={() => removePosition(pos.id)}
                              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(239,68,68,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "none", padding: 0 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(239,68,68,0.6)"; e.currentTarget.style.textDecoration = "underline"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(239,68,68,0.3)"; e.currentTarget.style.textDecoration = "none"; }}
                            >
                              Remove
                            </button>
                          )}
                        </span>
                      </div>

                      {/* Mobile Card */}
                      <div
                        className="sm:hidden"
                        style={{
                          padding: 14,
                          marginBottom: 8,
                          background: "rgba(17,24,32,0.6)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: pos.status === "closed" ? "rgba(255,255,255,0.3)" : "white" }}>{pos.ticker} {pos.side} ${pos.strike.toFixed(2)}</span>
                          {pos.status === "closed" ? (
                            <span style={{ background: "rgba(107,114,128,0.15)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>Closed</span>
                          ) : pos.exitAlertFired ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />
                              Exit Signal
                            </span>
                          ) : (
                            <span style={{ background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.15)", color: "rgba(0,229,160,0.5)", fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>Monitoring</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 16, color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", marginBottom: 8 }}>
                          <span>Exp: {pos.expiration}</span>
                          <span>Credit: ${pos.entryCredit.toFixed(2)}</span>
                        </div>
                        <div>
                          {pos.status === "open" ? (
                            <button onClick={() => markClosed(pos.id)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Mark Closed</button>
                          ) : (
                            <button onClick={() => removePosition(pos.id)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(239,68,68,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Note */}
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.2)",
                  fontStyle: "italic",
                  marginTop: 16,
                }}
              >
                Exit alerts are delivered to your personal notification channel. Mark positions closed to silence future alerts.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1118] border-t border-white/5 py-10">
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
  const { user, loading, productAccess } = useAuth();
  const hasAccess = user && productAccess.income === true;

  useEffect(() => {
    document.title = "Weekly Options Income Dashboard | Primal Edge";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm font-mono">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return (
      <ProtectedRoute product="income">
        <WeeklyIncomeContent />
      </ProtectedRoute>
    );
  }

  return <WeeklyIncomeHero />;
}
