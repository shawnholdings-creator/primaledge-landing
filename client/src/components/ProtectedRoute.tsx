/* ============================================================
   ProtectedRoute.tsx — Auth gate for protected pages
   States: loading → login form → pending approval → children
   Supports per-product access: product="cockpit" | "income"
   ============================================================ */

import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import type { ProductAccess } from "../contexts/AuthContext";
import Navbar from "./Navbar";
import PushNotificationMockup from "./PushNotificationMockup";
import SharedLoginForm from "./LoginForm";
import type { ReactNode } from "react";

/** Product display names for copy */
const PRODUCT_LABELS: Record<keyof ProductAccess, { title: string; subtitle: string }> = {
  cockpit: {
    title: "Primal Edge AI Cockpit",
    subtitle: "Sign in to access the live signal engine.",
  },
  income: {
    title: "Weekly Income Dashboard",
    subtitle: "Sign in to access the income intelligence layer.",
  },
  sentiment: {
    title: "Market Sentiment Engine",
    subtitle: "Sign in to access the live sentiment intelligence.",
  },
};

interface ProtectedRouteProps {
  children: ReactNode;
  /** Which product this route guards. Defaults to "cockpit" for backward compat. */
  product?: keyof ProductAccess;
}

export default function ProtectedRoute({ children, product = "cockpit" }: ProtectedRouteProps) {
  const { user, loading, productAccess, signIn, signUp, signOut } = useAuth();

  const isApproved = productAccess[product];
  const label = PRODUCT_LABELS[product];

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/30 text-sm font-mono">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Authenticated → Login/Register Form ───────────────
  if (!user) {
    return <LoginForm product={product} />;
  }

  // ─── Authenticated but NOT approved for this product ───────
  if (isApproved === false) {
    return (
      <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full">
            {/* Pending icon */}
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#f59e0b" strokeWidth="2.5" />
                  <path d="M24 14v12" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="24" cy="32" r="2" fill="#f59e0b" />
                </svg>
              </div>
            </div>

            <h1
              className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Access Pending
            </h1>
            <p className="text-white/40 text-sm mb-1">
              <span className="text-[#00e5a0]">{label.title}</span>
            </p>
            <p className="text-white/40 text-sm mb-3">
              Your account <span className="text-[#00e5a0]">{user.email}</span> has been registered successfully.
            </p>
            <p className="text-white/30 text-sm mb-8">
              Your access to {label.title} is currently under review. You'll receive a confirmation email once approved. This typically takes less than 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/subscribe">
                <button className="bg-[#00e5a0] text-[#0a0d12] font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#00e5a0]/90 transition-all">
                  Request Priority Access →
                </button>
              </Link>
              <button
                onClick={signOut}
                className="text-white/30 hover:text-white/60 text-sm font-mono transition-colors"
              >
                Sign out
              </button>
            </div>

            <p className="text-white/20 text-xs mt-8">
              Need help?{" "}
              <a href="mailto:support@primaledge.io" className="text-[#00e5a0]/50 hover:text-[#00e5a0] transition-colors">
                support@primaledge.io
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Approved → Render children ─────────────────────────────
  return <>{children}</>;
}

/* ─── Login / Register Form ─────────────────────────────────── */
function LoginForm({ product }: { product: keyof ProductAccess }) {
  const label = PRODUCT_LABELS[product];

  /* Pre-login curiosity message copy per product */
  const curiosity: Record<keyof ProductAccess, {
    badge: string; headline: string; body: string;
    detail?: string; tags?: string[];
  }> = {
    sentiment: {
      badge: "● MARKET INTELLIGENCE — DAILY",
      headline: "What if the first thing you saw every morning told you exactly what kind of day the market is setting up for?",
      body: "That is what the Market Sentiment Engine does.",
    },
    income: {
      badge: "● INCOME INTELLIGENCE — PRIVATE ACCESS",
      headline: "Know exactly when to exit. Before it costs you.",
      body: "Most traders exit too late — or not at all. The Weekly Income Dashboard doesn't just find entries. It watches your open positions and tells you when conditions have shifted enough to act.",
      detail: "Members receive the exact ticker, expiry, and strike to evaluate — not a vague signal. No interpretation required. No chart hunting. Works with any broker, any platform.",
      tags: ["EXACT STRIKE", "EXACT EXPIRY", "PLATFORM INDEPENDENT"],
    },
    cockpit: {
      badge: "● AI COCKPIT — PRIVATE ACCESS",
      headline: "What if every signal came pre-ranked, pre-scored, and ready to review in seconds?",
      body: "The AI Cockpit evaluates the full market so you can focus on the setups that matter most.",
    },
  };

  const cm = curiosity[product];

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4">

        {/* ── Pre-Login Curiosity Message ── */}
        {product === "income" ? (
          <div className="w-full text-center" style={{ maxWidth: "680px", padding: "48px 24px 0" }}>
            {/* 1. Eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full mb-8"
              style={{
                border: "1px solid rgba(0,229,160,0.2)",
                padding: "6px 16px",
                borderRadius: "20px",
                animation: "preFadeIn 0.4s ease-out 0.1s both",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "#00e5a0",
                  letterSpacing: "0.2em",
                }}
              >
                INCOME INTELLIGENCE · PRIVATE ACCESS
              </span>
            </div>

            {/* 2. Headline */}
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)",
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                animation: "preSlideUp 0.5s ease-out 0.2s both",
              }}
            >
              The week's best income setup.
              <br />
              Already ranked. Already waiting.
            </h1>

            {/* 3. Subheadline */}
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.7,
                maxWidth: "540px",
                margin: "24px auto 0",
                animation: "preFadeIn 0.4s ease-out 0.3s both",
              }}
            >
              The Weekly Income Dashboard surfaces the exact ticker, strike, and expiry
              worth your attention this week — ranked by conviction, not opinion. No chart
              hunting. No guesswork. No noise.
            </p>

            {/* 4. Push Notification Mockup */}
            <PushNotificationMockup
              ticker="NVDA"
              grade="A"
              setupType="INCOME ALERT $850"
              strike="$850P"
              expiry="Jul 5"
              credit="$2.40"
              score="91"
              animDelay={0.33}
            />

            {/* 5. Blurred Dashboard Card */}
            <div
              style={{
                margin: "36px auto",
                maxWidth: "640px",
                background: "#0d1118",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                animation: "preFadeIn 0.5s ease-out 0.4s both",
              }}
            >
              {/* Terminal title bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", gap: "5px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    color: "#00e5a0",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  WEEKLY INCOME DASHBOARD
                </span>
              </div>

              {/* Column headers (unblurred) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.5fr 0.7fr 0.7fr 0.8fr 0.6fr 0.5fr 0.5fr",
                  gap: "8px",
                  padding: "10px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.55rem",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span>Side</span>
                <span>Ticker</span>
                <span>Strike</span>
                <span>Credit</span>
                <span>Score</span>
                <span>Timing</span>
                <span>Buffer</span>
              </div>

              {/* Blurred data rows + lock overlay */}
              <div style={{ position: "relative" }}>
                <div style={{ filter: "blur(5px)", padding: "4px 0", userSelect: "none" }}>
                  {[
                    { side: "PUT", ticker: "NVDA", strike: "$148", credit: "$2.85", score: "91 (A)", timing: "✓", buffer: "4.2%" },
                    { side: "PUT", ticker: "QQQ", strike: "$485", credit: "$3.10", score: "87 (A)", timing: "✓", buffer: "3.8%" },
                    { side: "PUT", ticker: "TSLA", strike: "$265", credit: "$4.20", score: "82 (B)", timing: "✓", buffer: "5.1%" },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "0.5fr 0.7fr 0.7fr 0.8fr 0.6fr 0.5fr 0.5fr",
                        gap: "8px",
                        padding: "10px 16px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.7rem",
                        color: "rgba(255,255,255,0.7)",
                        borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      }}
                    >
                      <span style={{ color: "#00e5a0" }}>{row.side}</span>
                      <span style={{ fontWeight: 700 }}>{row.ticker}</span>
                      <span>{row.strike}</span>
                      <span style={{ color: "#00e5a0" }}>{row.credit}</span>
                      <span>{row.score}</span>
                      <span>{row.timing}</span>
                      <span>{row.buffer}</span>
                    </div>
                  ))}
                </div>

                {/* Lock overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(10,13,18,0.4)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔒</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Members only — Sign in to access your dashboard
                  </span>
                </div>
              </div>
            </div>

            {/* 5b. Performance Strip */}
            <div
              style={{
                background: "#0d1118",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "20px",
                maxWidth: "600px",
                margin: "24px auto",
                textAlign: "center",
                animation: "preFadeIn 0.4s ease-out 0.43s both",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
                {["81% A-Grade Probability of Success*", "Top 12% of Scanned Setups Qualify*", "Elite Liquidity Universe"].map((stat) => (
                  <span
                    key={stat}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {stat}
                  </span>
                ))}
              </div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.58rem",
                  color: "rgba(255,255,255,0.25)",
                  margin: "12px 0 0",
                  lineHeight: 1.5,
                }}
              >
                *Based on backtesting across 1,200+ qualifying setups over 18 months. Past results do not guarantee future performance.
              </p>
            </div>

            {/* 5c. This Week Live Status Bar */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(0,229,160,0.04)",
                border: "1px solid rgba(0,229,160,0.15)",
                borderRadius: "9999px",
                padding: "8px 20px",
                margin: "0 auto",
                animation: "preFadeIn 0.4s ease-out 0.46s both",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.62rem",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Dashboard Active · This Week: Setups Identified · Next Update: Friday Close
              </span>
            </div>

            {/* 5d. Methodology Pillars */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                maxWidth: "640px",
                margin: "24px auto",
                justifyContent: "center",
                animation: "preFadeIn 0.4s ease-out 0.48s both",
              }}
            >
              {[
                { icon: "⚡", label: "Multi-Timeframe Confluence", desc: "Cross-referencing signals across daily, weekly, and intraday structure" },
                { icon: "📊", label: "Volatility Structure Analysis", desc: "Reading implied vs realized vol to identify mispriced opportunity" },
                { icon: "🏆", label: "Conviction Scoring Engine", desc: "Quantifying setup quality on a 0–100 scale with letter grades" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    minWidth: "170px",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.8)",
                      margin: "0 0 6px",
                    }}
                  >
                    {tile.icon} {tile.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.35)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {tile.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* 6. Stat Pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
                margin: "28px 0",
                animation: "preFadeIn 0.4s ease-out 0.5s both",
              }}
            >
              {["PREMIUM NAMES ONLY", "WEEKLY DELIVERY", "ANY BROKER · ANY PLATFORM"].map((pill) => (
                <span
                  key={pill}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.62rem",
                    letterSpacing: "0.1em",
                    color: "#00e5a0",
                    border: "1px solid rgba(0,229,160,0.25)",
                    background: "rgba(0,229,160,0.06)",
                    padding: "6px 14px",
                    borderRadius: "4px",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* 6b. Social Proof Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "20px",
                margin: "16px auto",
                animation: "preFadeIn 0.4s ease-out 0.52s both",
              }}
            >
              {["120 Active Members", "22 Countries", "By Invitation Only"].map((item) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", display: "inline-block" }} />
                  {item}
                </span>
              ))}
            </div>

            {/* Mock Position Table */}
            {product === "income" && (
              <div
                style={{
                  marginTop: 28,
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "rgba(13,17,24,0.8)",
                  animation: "preFadeIn 0.5s ease-out 0.4s both",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1.4fr",
                    padding: "10px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {["TICKER", "STRIKE", "ENTRY Δ", "CURRENT Δ", "STATUS"].map((h, i) => (
                    <span
                      key={h}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.25)",
                      }}
                      className={i === 2 || i === 3 ? "hide-mobile-delta" : undefined}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* Data rows */}
                {[
                  { ticker: "AAPL", strike: "$182.50P", entryD: "0.18", curD: "0.31", status: "Monitoring", blur: true, highlight: false },
                  { ticker: "NVDA", strike: "$118.00P", entryD: "0.22", curD: "0.51", status: "Exit Signal Sent", blur: false, highlight: true },
                  { ticker: "MSFT", strike: "$415.00C", entryD: "0.19", curD: "0.27", status: "Monitoring", blur: true, highlight: false },
                  { ticker: "META", strike: "$490.00P", entryD: "0.21", curD: "0.38", status: "Monitoring", blur: true, highlight: false },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1.4fr",
                      padding: "10px 16px",
                      borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      alignItems: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.7)",
                      ...(row.blur
                        ? { filter: "blur(4px)", userSelect: "none" as const, pointerEvents: "none" as const }
                        : {}),
                      ...(row.highlight
                        ? { borderLeft: "3px solid #f59e0b", background: "rgba(245,158,11,0.06)" }
                        : {}),
                    }}
                  >
                    <span>{row.ticker}</span>
                    <span>{row.strike}</span>
                    <span className="hide-mobile-delta">{row.entryD}</span>
                    <span className="hide-mobile-delta">{row.curD}</span>
                    <span>
                      {row.status === "Exit Signal Sent" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "rgba(245,158,11,0.15)",
                            border: "1px solid rgba(245,158,11,0.4)",
                            color: "#f59e0b",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                              animation: "prePulse 2s ease-in-out infinite",
                              flexShrink: 0,
                            }}
                          />
                          Exit Signal Sent
                        </span>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>{row.status}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Three-Step Flow */}
            {product === "income" && (
              <div
                style={{
                  marginTop: 28,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  gap: 0,
                  flexWrap: "wrap",
                  animation: "preFadeIn 0.5s ease-out 0.5s both",
                }}
              >
                {[
                  { num: "01", title: "Receive Alert", desc: "Push notification when conditions shift" },
                  { num: "02", title: "Log Your Entry", desc: "Record the position in your personal tracker" },
                  { num: "03", title: "Engine Monitors", desc: "AI watches for changes so you don't have to" },
                ].map((step, i) => (
                  <div key={step.num} style={{ display: "flex", alignItems: "flex-start" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        width: 120,
                        padding: "0 8px",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1.5px solid #00e5a0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "#00e5a0",
                          marginBottom: 8,
                        }}
                      >
                        {step.num}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "white",
                          marginBottom: 4,
                        }}
                      >
                        {step.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.7rem",
                          color: "rgba(255,255,255,0.4)",
                          lineHeight: 1.4,
                        }}
                      >
                        {step.desc}
                      </div>
                    </div>
                    {i < 2 && (
                      <div
                        style={{
                          width: 32,
                          height: 1,
                          backgroundColor: "rgba(255,255,255,0.1)",
                          alignSelf: "center",
                          marginTop: 14,
                          flexShrink: 0,
                        }}
                        className="hide-mobile-connector"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Stat Callout */}
            {product === "income" && (
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 24,
                  marginBottom: 8,
                  animation: "preFadeIn 0.5s ease-out 0.55s both",
                }}
              >
                up to <span style={{ color: "#00e5a0", fontWeight: 700 }}>168</span> hours of manual monitoring — or one push notification
              </p>
            )}

            {/* 7. Primary CTA */}
            <div style={{ marginTop: "24px", animation: "preFadeIn 0.4s ease-out 0.55s both" }}>
              <Link href="/subscribe">
                <button
                  className="transition-all"
                  style={{
                    background: "#00e5a0",
                    color: "#0a0d12",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    padding: "16px 40px",
                    borderRadius: "8px",
                    width: "100%",
                    maxWidth: "320px",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#00ffb3";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#00e5a0";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Request Access →
                </button>
              </Link>
            </div>

            {/* 8. Secondary CTA */}
            <div style={{ marginTop: "16px", animation: "preFadeIn 0.4s ease-out 0.6s both" }}>
              <button
                onClick={() =>
                  document.getElementById("income-login-form")?.scrollIntoView({ behavior: "smooth" })
                }
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00e5a0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >
                Already a member? Sign In →
              </button>
            </div>

            {/* 9. Scarcity Line */}
            <div
              className="inline-flex items-center gap-2"
              style={{
                marginTop: "28px",
                animation: "preFadeIn 0.4s ease-out 0.65s both",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0]/60" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.12em",
                }}
              >
                Private access · Limited seats · By invitation only
              </span>
            </div>

            {/* Separator */}
            <div style={{ margin: "40px 0 32px", height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

        ) : product === "sentiment" ? (
          <div className="w-full text-center" style={{ maxWidth: "680px", padding: "48px 24px 0" }}>
            {/* 1. Eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full mb-8"
              style={{
                border: "1px solid rgba(0,229,160,0.2)",
                padding: "6px 16px",
                borderRadius: "20px",
                animation: "preFadeIn 0.4s ease-out 0.1s both",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "#00e5a0",
                  letterSpacing: "0.2em",
                }}
              >
                MARKET INTELLIGENCE · DAILY
              </span>
            </div>

            {/* 2. Headline */}
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)",
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                animation: "preSlideUp 0.5s ease-out 0.2s both",
              }}
            >
              Know what kind of day it is
              <br />
              before you place a single trade.
            </h1>

            {/* 3. Subheadline */}
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.7,
                maxWidth: "540px",
                margin: "24px auto 0",
                animation: "preFadeIn 0.4s ease-out 0.3s both",
              }}
            >
              The Market Sentiment Dashboard reads the full market structure every morning
              — sectors, volatility, signal strength, and regime — and tells you exactly
              how to size and approach the day.
            </p>

            {/* 4. Push Notification Mockup */}
            <PushNotificationMockup
              ticker="SPY"
              grade="B"
              setupType="BEARISH — REDUCE SIZE"
              strike="—"
              expiry="Today"
              credit="—"
              score="34"
              line2Override="Signal Strength 34 · Regime: Mixed · Reduce size today"
              animDelay={0.33}
            />

            {/* 5. Blurred Dashboard Card */}
            <div
              style={{
                margin: "36px auto",
                maxWidth: "640px",
                background: "#0d1118",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                animation: "preFadeIn 0.5s ease-out 0.4s both",
              }}
            >
              {/* Terminal title bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", gap: "5px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    color: "#00e5a0",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  MARKET SENTIMENT DASHBOARD
                </span>
              </div>

              {/* Column headers (unblurred) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1.2fr 0.8fr",
                  gap: "8px",
                  padding: "10px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.55rem",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span>Sector</span>
                <span>Direction</span>
                <span>Strength</span>
                <span>Verdict</span>
              </div>

              {/* Blurred data rows + lock overlay */}
              <div style={{ position: "relative" }}>
                <div style={{ filter: "blur(5px)", padding: "4px 0", userSelect: "none" }}>
                  {[
                    { sector: "Technology", direction: "BULLISH", strength: "████ 87%", verdict: "STRONG", dirColor: "#00e5a0" },
                    { sector: "Financials", direction: "NEUTRAL", strength: "███░ 62%", verdict: "HOLD", dirColor: "rgba(255,255,255,0.6)" },
                    { sector: "Energy", direction: "BEARISH", strength: "██░░ 41%", verdict: "WEAK", dirColor: "#ff5f57" },
                    { sector: "Healthcare", direction: "BULLISH", strength: "████ 79%", verdict: "READY", dirColor: "#00e5a0" },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1.2fr 0.8fr",
                        gap: "8px",
                        padding: "10px 16px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.7rem",
                        color: "rgba(255,255,255,0.7)",
                        borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{row.sector}</span>
                      <span style={{ color: row.dirColor }}>{row.direction}</span>
                      <span>{row.strength}</span>
                      <span>{row.verdict}</span>
                    </div>
                  ))}
                </div>

                {/* Lock overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(10,13,18,0.4)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔒</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Members only — Sign in to access your dashboard
                  </span>
                </div>
              </div>
            </div>

            {/* 5b. Performance Strip */}
            <div
              style={{
                background: "#0d1118",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "20px",
                maxWidth: "600px",
                margin: "24px auto",
                textAlign: "center",
                animation: "preFadeIn 0.4s ease-out 0.43s both",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
                {["Daily Regime Accuracy: 71%*", "11 Market Sectors Tracked", "Pre-Market + Post-Market Updates"].map((stat) => (
                  <span
                    key={stat}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {stat}
                  </span>
                ))}
              </div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.58rem",
                  color: "rgba(255,255,255,0.25)",
                  margin: "12px 0 0",
                  lineHeight: 1.5,
                }}
              >
                *Based on backtesting across 1,200+ qualifying setups over 18 months. Past results do not guarantee future performance.
              </p>
            </div>

            {/* 5c. Regime Awareness Callout */}
            <div
              style={{
                borderLeft: "3px solid rgba(0,229,160,0.4)",
                background: "rgba(0,229,160,0.04)",
                borderRadius: "0 8px 8px 0",
                padding: "16px 20px",
                maxWidth: "560px",
                margin: "24px auto",
                textAlign: "left",
                animation: "preFadeIn 0.4s ease-out 0.46s both",
              }}
            >
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.5)",
                  fontStyle: "italic",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                The engine tightens its filters in bearish regimes and widens them in bull trends — adapting to market conditions automatically.
              </p>
            </div>

            {/* 5d. Methodology Pillars */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                maxWidth: "640px",
                margin: "24px auto",
                justifyContent: "center",
                animation: "preFadeIn 0.4s ease-out 0.48s both",
              }}
            >
              {[
                { icon: "⚡", label: "Multi-Timeframe Confluence", desc: "Cross-referencing signals across daily, weekly, and intraday structure" },
                { icon: "📊", label: "Volatility Structure Analysis", desc: "Reading implied vs realized vol to identify mispriced opportunity" },
                { icon: "🏆", label: "Conviction Scoring Engine", desc: "Quantifying setup quality on a 0–100 scale with letter grades" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    minWidth: "170px",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.8)",
                      margin: "0 0 6px",
                    }}
                  >
                    {tile.icon} {tile.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.35)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {tile.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* 6. Stat Pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
                margin: "28px 0",
                animation: "preFadeIn 0.4s ease-out 0.5s both",
              }}
            >
              {["DAILY BRIEF", "PRE-MARKET READY", "ANY BROKER · ANY PLATFORM"].map((pill) => (
                <span
                  key={pill}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.62rem",
                    letterSpacing: "0.1em",
                    color: "#00e5a0",
                    border: "1px solid rgba(0,229,160,0.25)",
                    background: "rgba(0,229,160,0.06)",
                    padding: "6px 14px",
                    borderRadius: "4px",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* 6b. Social Proof Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "20px",
                margin: "16px auto",
                animation: "preFadeIn 0.4s ease-out 0.52s both",
              }}
            >
              {["120 Active Members", "22 Countries", "By Invitation Only"].map((item) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", display: "inline-block" }} />
                  {item}
                </span>
              ))}
            </div>

            {/* 7. Primary CTA */}
            <div style={{ marginTop: "24px", animation: "preFadeIn 0.4s ease-out 0.55s both" }}>
              <Link href="/subscribe">
                <button
                  className="transition-all"
                  style={{
                    background: "#00e5a0",
                    color: "#0a0d12",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    padding: "16px 40px",
                    borderRadius: "8px",
                    width: "100%",
                    maxWidth: "320px",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#00ffb3";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#00e5a0";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Request Access →
                </button>
              </Link>
            </div>

            {/* 8. Secondary CTA */}
            <div style={{ marginTop: "16px", animation: "preFadeIn 0.4s ease-out 0.6s both" }}>
              <button
                onClick={() =>
                  document.getElementById("income-login-form")?.scrollIntoView({ behavior: "smooth" })
                }
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00e5a0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >
                Already a member? Sign In →
              </button>
            </div>

            {/* 9. Scarcity Line */}
            <div
              className="inline-flex items-center gap-2"
              style={{
                marginTop: "28px",
                animation: "preFadeIn 0.4s ease-out 0.65s both",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0]/60" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.12em",
                }}
              >
                Private access · Limited seats · By invitation only
              </span>
            </div>

            {/* Separator */}
            <div style={{ margin: "40px 0 32px", height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

        ) : (
        <div
          className="w-full text-center"
          style={{ maxWidth: "560px", padding: "48px 24px 0" }}
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full mb-6"
            style={{
              border: "1px solid rgba(0,229,160,0.3)",
              padding: "4px 12px",
              borderRadius: "20px",
              animation: "preFadeIn 0.4s ease-out 0.1s both",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "#00e5a0",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {cm.badge}
            </span>
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              whiteSpace: "pre-line",
              animation: "preSlideUp 0.5s ease-out 0.2s both",
            }}
          >
            {cm.headline}
          </h2>

          {/* Subline */}
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.7,
              maxWidth: "480px",
              margin: "20px auto 0",
              animation: "preFadeIn 0.4s ease-out 0.3s both",
            }}
          >
            {cm.body}
          </p>

          {/* Push Notification Mockup */}
          <PushNotificationMockup
            ticker="META"
            grade="A"
            setupType="BULLISH SLINGSHOT"
            strike="$540"
            expiry="Jun 27"
            credit="—"
            score="88"
            animDelay={0.33}
          />

          {/* Detail Block (income-specific) */}
          {cm.detail && (
            <div
              style={{
                maxWidth: "520px",
                margin: "24px auto 32px",
                borderLeft: "2px solid rgba(0,229,160,0.35)",
                padding: "16px 20px",
                background: "rgba(0,229,160,0.04)",
                borderRadius: "0 8px 8px 0",
                textAlign: "left",
                animation: "preFadeIn 0.4s ease-out 0.35s both",
              }}
            >
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 400,
                  fontSize: "0.92rem",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {cm.detail}
              </p>
              {cm.tags && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
                  {cm.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.62rem",
                        letterSpacing: "0.1em",
                        color: "#00e5a0",
                        border: "1px solid rgba(0,229,160,0.25)",
                        background: "rgba(0,229,160,0.06)",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Methodology Pillars */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              maxWidth: "640px",
              margin: "24px auto",
              justifyContent: "center",
              animation: "preFadeIn 0.4s ease-out 0.38s both",
            }}
          >
            {[
              { icon: "⚡", label: "Multi-Timeframe Confluence", desc: "Cross-referencing signals across daily, weekly, and intraday structure" },
              { icon: "📊", label: "Volatility Structure Analysis", desc: "Reading implied vs realized vol to identify mispriced opportunity" },
              { icon: "🏆", label: "Conviction Scoring Engine", desc: "Quantifying setup quality on a 0–100 scale with letter grades" },
            ].map((tile) => (
              <div
                key={tile.label}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  minWidth: "170px",
                  flex: 1,
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.8)",
                    margin: "0 0 6px",
                  }}
                >
                  {tile.icon} {tile.label}
                </p>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.35)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {tile.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Social Proof Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "20px",
              margin: "16px auto",
              animation: "preFadeIn 0.4s ease-out 0.39s both",
            }}
          >
            {["120 Active Members", "22 Countries", "By Invitation Only"].map((item) => (
              <span
                key={item}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", display: "inline-block" }} />
                {item}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: "32px", animation: "preFadeIn 0.4s ease-out 0.4s both" }}>
            <Link href="/subscribe">
              <button
                className="transition-all"
                style={{
                  background: "#00e5a0",
                  color: "#0a0d12",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  padding: "14px 36px",
                  borderRadius: "6px",
                  minHeight: "48px",
                  width: "100%",
                  maxWidth: "280px",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#00ffb3";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#00e5a0";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Request Access
              </button>
            </Link>
          </div>

          {/* Separator */}
          <div style={{ margin: "40px 0 32px", height: "1px", background: "rgba(255,255,255,0.08)" }} />
        </div>
        )}

        {/* ── Login Form ── */}
        <div id="income-login-form" style={{ paddingBottom: "48px" }}>
          <SharedLoginForm
            title={label.title}
            subtitle={label.subtitle}
          />
        </div>
      </div>

      {/* Pre-message animation keyframes */}
      <style>{`
        @keyframes preFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes preSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes prePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hide-mobile-delta { }
        .hide-mobile-connector { }
        @media (max-width: 480px) {
          .hide-mobile-delta { display: none !important; }
          .hide-mobile-connector { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
