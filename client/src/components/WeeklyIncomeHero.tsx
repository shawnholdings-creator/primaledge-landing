/* ============================================================
   WeeklyIncomeHero.tsx — Public tease hero for Weekly Income
   Design: dark bg #0a0a0a, accent #00ff96, amber #f0b429
   All styles inline — no external CSS files required.
   ============================================================ */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import Navbar from "./Navbar";
import { useLoginModal } from "../contexts/LoginModalContext";

/* ─── Design Tokens ─────────────────────────────────────────── */
const T = {
  bg: "#0a0a0a",
  accent: "#00ff96",
  amber: "#f0b429",
  cardBg: "#111",
  cardBorder: "1px solid rgba(255,255,255,0.08)",
  radius: "12px",
  white: "#fff",
  muted: "#666",
  dimmed: "#555",
  faint: "#444",
  ghost: "#333",
  fontMono: "'Space Mono', 'Fira Code', 'Courier New', monospace",
  fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
  fontBody: "'Inter', sans-serif",
} as const;

/* ─── Keyframe injection (once) ─────────────────────────────── */
const STYLE_ID = "weekly-income-hero-keyframes";
function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes wih-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    @keyframes wih-fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Reusable primitives ───────────────────────────────────── */
const pulsingDot = (size = 8, color = T.accent): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: "50%",
  backgroundColor: color,
  display: "inline-block",
  animation: "wih-pulse 2s ease-in-out infinite",
  flexShrink: 0,
});

const cardStyle: React.CSSProperties = {
  background: T.cardBg,
  border: T.cardBorder,
  borderRadius: T.radius,
};

const sectionGap: React.CSSProperties = {
  marginTop: 56,
};

/* ─── Component ─────────────────────────────────────────────── */
export default function WeeklyIncomeHero() {
  const { openLoginModal } = useLoginModal();
  const [isMobile, setIsMobile] = useState(false);
  const [teaserMode, setTeaserMode] = useState<'standard' | 'micro'>('standard');
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    injectKeyframes();
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setTeaserMode(prev => prev === 'standard' ? 'micro' : 'standard');
        setFadeIn(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.white }}>
      {/* ─── 1. Navbar ──────────────────────────────────────── */}
      <Navbar />

      {/* ─── Page Container ─────────────────────────────────── */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: isMobile ? "160px 16px 0" : "160px 24px 0",
        }}
      >
        {/* ─── 2. Eyebrow + Headline + Sub ────────────────── */}
        <section
          style={{
            textAlign: "center",
            animation: "wih-fadeUp 0.7s ease-out both",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <span style={pulsingDot(6)} />
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.accent,
              }}
            >
              WEEKLY INCOME DASHBOARD
            </span>
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 40 : 56,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            <span style={{ color: T.white }}>The engine finds the setups.</span>
            <br />
            <span style={{ color: T.accent }}>You collect the premium.</span>
          </h1>

          {/* Sub */}
          <p
            style={{
              color: T.muted,
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "20px auto 0",
            }}
          >
            AI-powered conviction model scans 80+ symbols. Only the top 12%
            qualify. Delivered in under 3 seconds.
          </p>
        </section>

        {/* ─── 3. Stat Strip 1 ────────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.1s both" }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
            }}
          >
            <StatTile value="91%" label="Average Win Rate" color={T.accent} />
            <StatTile value="71%" label="Weekly Confidence" color={T.accent} />
            <StatTile value="Top 12%" label="Income Efficiency" color={T.white} />
          </div>
          <p
            style={{
              fontSize: 10,
              fontStyle: "italic",
              color: T.faint,
              textAlign: "center",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            *Based on backtesting across 1,200+ setups over 18 months. Past
            results do not guarantee future performance.
          </p>
        </section>

        {/* ─── 4. Blurred Recommendation Card ─────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.2s both" }}>
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {/* Blurred content */}
            <div style={{ filter: "blur(5px)", padding: 20 }}>
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    background: "rgba(0,255,150,0.1)",
                    color: T.accent,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontFamily: T.fontMono,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  QQQ
                </span>
                <span
                  style={{
                    background: "rgba(0,255,150,0.1)",
                    color: T.accent,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontFamily: T.fontMono,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Grade A
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    color: T.muted,
                    fontSize: 12,
                  }}
                >
                  Score: 89/100
                </span>
              </div>

              {/* Data grid 2x2 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {[
                  ["Strike", "$685"],
                  ["Credit", "$3.65"],
                  ["Expiry", "Jul 02"],
                  ["Cushion", "5.2%"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: T.dimmed }}>{label}</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.white,
                        marginTop: 2,
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Score bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "89%",
                    height: "100%",
                    borderRadius: 3,
                    background: T.accent,
                  }}
                />
              </div>
            </div>

            {/* Lock overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>🔒</span>
              <span
                style={{ fontSize: 13, color: "#ccc", marginTop: 8 }}
              >
                Members only
              </span>
              <button
                onClick={() => openLoginModal("/weekly-income")}
                style={{
                  marginTop: 16,
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Unlock This Setup →
              </button>
            </div>
          </div>
        </section>

        {/* ─── 5. Alert Feed Tease ────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.3s both" }}>
          <div
            style={{
              ...cardStyle,
              maxWidth: 560,
              margin: "0 auto",
              padding: 20,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.white,
                }}
              >
                Recent Alerts
              </span>
              <span style={pulsingDot(6)} />
            </div>

            {/* Rows */}
            {[
              "Alert sent · 2h ago · Grade A · Score 89 · [REDACTED] · $█.██",
              "Alert sent · 4h ago · Grade B · Score 76 · [REDACTED] · $█.██",
              "Alert sent · Yesterday · Grade A · Score 91 · [REDACTED] · $█.██",
              "Alert sent · 2 days ago · Grade A · Score 84 · [REDACTED] · $█.██",
              "Alert sent · 3 days ago · Grade B · Score 78 · [REDACTED] · $█.██",
            ].map((text, i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                <span style={pulsingDot(6)} />
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 12,
                    color: T.muted,
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5b. Trade Management ──────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.35s both" }}>
          {/* A. Eyebrow + Headline + Subtext */}
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              TRADE MANAGEMENT
            </div>
            <h2
              style={{
                fontFamily: T.fontDisplay,
                fontSize: isMobile ? 28 : 36,
                fontWeight: 900,
                color: T.white,
                lineHeight: 1.15,
                margin: "0 0 14px",
              }}
            >
              Know exactly when to exit.
              <br />
              <span style={{ color: T.accent }}>Before it costs you.</span>
            </h2>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 15,
                color: T.muted,
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 560,
              }}
            >
              Finding the setup is only half the job. The engine watches your open
              trades around the clock and sends you a single notification the moment
              it's time to get out — no spreadsheets, no checking prices every hour.
            </p>
          </div>

          {/* B. 3-Step Flow */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              marginTop: 32,
              maxWidth: 600,
              margin: "32px auto 0",
            }}
          >
            {[
              {
                num: "01",
                title: "You get the signal",
                desc: "The engine surfaces a qualifying setup and sends an alert to your phone.",
              },
              {
                num: "02",
                title: "You log the trade",
                desc: "Add it to your personal tracker in the dashboard. Takes 10 seconds.",
              },
              {
                num: "03",
                title: "We watch it for you",
                desc: "The engine monitors the trade continuously and pushes one notification when it's time to exit.",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  ...cardStyle,
                  flex: 1,
                  padding: "20px 20px 20px 18px",
                  borderLeft: `3px solid ${T.accent}`,
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.accent,
                    marginBottom: 6,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.white,
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 13,
                    color: T.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          {/* C. Stat Callout */}
          <div
            style={{
              marginTop: 32,
              maxWidth: 400,
              margin: "32px auto 0",
              borderLeft: `3px solid ${T.amber}`,
              background: "rgba(240,180,41,0.04)",
              padding: "20px 24px",
              borderRadius: "0 10px 10px 0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 32,
                fontWeight: 700,
                color: T.amber,
                lineHeight: 1.1,
              }}
            >
              168 hours
            </div>
            <div
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: T.muted,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              of manual price-checking a week — replaced by one push notification
            </div>
          </div>

          {/* D. Blurred Position Table Tease */}
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              maxWidth: 560,
              margin: "32px auto 0",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.4fr 1fr",
                padding: "12px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {["TRADE", "STATUS", "ACTION"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: T.dimmed,
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Data rows (blurred) */}
            <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
              {[
                {
                  trade: "████ PUT",
                  status: "Monitoring",
                  statusColor: T.accent,
                  statusBg: "rgba(0,255,150,0.08)",
                  statusBorder: "rgba(0,255,150,0.15)",
                  action: "—",
                  highlight: false,
                },
                {
                  trade: "████ PUT",
                  status: "⚠ Exit Signal Sent",
                  statusColor: T.amber,
                  statusBg: "rgba(240,180,41,0.15)",
                  statusBorder: "rgba(240,180,41,0.4)",
                  action: "Mark Closed",
                  highlight: true,
                },
                {
                  trade: "████ CALL",
                  status: "Monitoring",
                  statusColor: T.accent,
                  statusBg: "rgba(0,255,150,0.08)",
                  statusBorder: "rgba(0,255,150,0.15)",
                  action: "—",
                  highlight: false,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.4fr 1fr",
                    padding: "11px 20px",
                    borderBottom:
                      i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    alignItems: "center",
                    background: row.highlight
                      ? "rgba(240,180,41,0.06)"
                      : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {row.trade}
                  </span>
                  <span>
                    <span
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 10,
                        fontWeight: 600,
                        color: row.statusColor,
                        background: row.statusBg,
                        border: `1px solid ${row.statusBorder}`,
                        padding: "3px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {row.status}
                    </span>
                  </span>
                  <span
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {row.action}
                  </span>
                </div>
              ))}
            </div>

            {/* Lock overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>🔒</span>
              <span style={{ fontSize: 13, color: "#ccc", marginTop: 8 }}>
                Members only
              </span>
              <button
                onClick={() => openLoginModal("/weekly-income")}
                style={{
                  marginTop: 16,
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Sign In to Track Your Trades →
              </button>
            </div>
          </div>
        </section>

        {/* ─── 6. Stat Strip 2 ────────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.35s both" }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
            }}
          >
            <StatTile value="1,200+" label="Setups Backtested" color={T.white} />
            <StatTile value="18 Months" label="Validation Period" color={T.white} />
            <StatTile value="1:2.4" label="Avg Risk/Reward" color={T.white} />
          </div>
        </section>

        {/* ─── 7. Callout Block ───────────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.4s both" }}>
          <div
            style={{
              borderLeft: "3px solid rgba(0,255,150,0.4)",
              background: "rgba(0,255,150,0.04)",
              padding: "16px 20px",
              borderRadius: "0 8px 8px 0",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: "#aaa",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              A-grade setups showed an average risk/reward of 1:2.4 in
              backtesting.
            </p>
          </div>
        </section>

        {/* ─── 8. Blurred Results Table ───────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.45s both" }}>
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {/* Table content */}
            <div style={{ padding: 0 }}>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 0.6fr 0.6fr 1.4fr",
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {["Ticker", "Grade", "Score", "Outcome"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: T.dimmed,
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Data rows */}
              {[
                { ticker: "████", grade: "A", score: "89", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "A", score: "84", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "B", score: "77", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "A", score: "91", outcome: "✓ Reached target", outcomeColor: T.accent },
                { ticker: "████", grade: "B", score: "73", outcome: "— Still open", outcomeColor: T.amber },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 0.6fr 0.6fr 1.4fr",
                    padding: "10px 20px",
                    borderBottom:
                      i < 4
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    fontSize: 13,
                  }}
                >
                  <span style={{ filter: "blur(5px)", color: T.white }}>
                    {row.ticker}
                  </span>
                  <span style={{ color: T.white }}>{row.grade}</span>
                  <span style={{ color: T.white }}>{row.score}</span>
                  <span style={{ color: row.outcomeColor }}>
                    {row.outcome}
                  </span>
                </div>
              ))}
            </div>

            {/* Caption */}
            <p
              style={{
                fontSize: 11,
                color: T.dimmed,
                textAlign: "center",
                padding: "12px 20px 16px",
                margin: 0,
              }}
            >
              4 of 5 last week's qualifying setups reached their target.
              Tickers visible to members only.
            </p>

            {/* Lock overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>🔒</span>
              <span style={{ fontSize: 13, color: "#ccc", marginTop: 8 }}>
                Members only
              </span>
              <button
                onClick={() => openLoginModal("/weekly-income")}
                style={{
                  marginTop: 16,
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Unlock This Setup →
              </button>
            </div>
          </div>
        </section>

        {/* ─── A. Founder Statement ──────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.5s both" }}>
          <div
            style={{
              borderLeft: "2px solid #00ff96",
              paddingLeft: 20,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 15,
                color: "#ccc",
                fontStyle: "italic",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              &ldquo;I built this because I was spending 3 hours every Sunday scanning charts
              to find 2 setups worth trading. The engine now does that in seconds and
              delivers only the setups that meet a strict conviction threshold.&rdquo;
            </p>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 13,
                color: "#00ff96",
                fontStyle: "normal",
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              — Shawn, Primal Edge
            </p>
          </div>
        </section>

        {/* ─── B. Transparency Block ─────────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.55s both" }}>
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "28px 32px",
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              HONEST ABOUT THE DOWNSIDE
            </div>
            <h3
              style={{
                fontFamily: T.fontBody,
                fontSize: 18,
                fontWeight: 600,
                color: T.white,
                margin: "0 0 14px",
              }}
            >
              Not every setup reaches its target. Here is what that looks like.
            </h3>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: "#888",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              In backtesting, B-grade setups missed their target 29% of the time.
              A-grade setups missed 19% of the time. When a setup misses, the defined
              risk level established before entry is the maximum loss — there are no
              surprises and no unlimited downside. The engine does not predict market
              direction. It identifies setups with favorable historical probability
              profiles and lets you decide whether to act.
            </p>
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
                marginTop: 20,
              }}
            />
            <p
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: "#555",
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              *Based on backtesting across 1,200+ qualifying setups over 18 months.
              Past results do not guarantee future performance.
            </p>
          </div>
        </section>

        {/* ─── C. What You Get On Day One ────────────────── */}
        <section style={{ ...sectionGap, animation: "wih-fadeUp 0.7s ease-out 0.6s both" }}>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 11,
              color: T.accent,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            WHAT HAPPENS AFTER YOU JOIN
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            {[
              {
                step: "DAY 1",
                title: "Dashboard Access Activated",
                desc: "Your Weekly Income Dashboard goes live immediately. No setup required.",
              },
              {
                step: "DAY 1",
                title: "Alert Delivery Configured",
                desc: "Push alerts are routed to your phone within minutes of joining. You will not miss a signal.",
              },
              {
                step: "DAY 1",
                title: "Full Setup Archive Unlocked",
                desc: "Browse every qualifying setup the engine has surfaced since launch — with scores, grades, and outcomes.",
              },
              {
                step: "NEXT SCAN",
                title: "Your First Qualifying Setup",
                desc: "The engine runs multiple times daily. Your first alert arrives within the next scan cycle after joining.",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: T.accent,
                  }}
                >
                  {card.step}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 15,
                    fontWeight: 600,
                    color: T.white,
                    marginTop: 6,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 13,
                    color: "#888",
                    lineHeight: 1.6,
                    marginTop: 4,
                  }}
                >
                  {card.desc}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: 14,
              color: "#555",
              textAlign: "center",
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Cancel anytime. No contracts, no lock-in.
          </p>
        </section>

        {/* ─── Mode Tease Toggle (animated, display-only) ──── */}
        <div className="flex flex-col items-center gap-3 mt-8 mb-8">
          <div className="flex gap-2">
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ${teaserMode === 'standard' ? 'bg-green-400 text-black border-green-400' : 'bg-transparent text-gray-400 border-gray-600'}`}>
              Standard
            </span>
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ${teaserMode === 'micro' ? 'bg-green-400 text-black border-green-400' : 'bg-transparent text-gray-400 border-gray-600'}`}>
              Micro
            </span>
          </div>
          <p className={`text-xs text-gray-400 font-mono tracking-wide transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
            {teaserMode === 'standard'
              ? 'Full watchlist \u00b7 Accounts $10K and above'
              : 'Sized for accounts under $10K \u00b7 1 contract at a time'}
          </p>
        </div>

        {/* ─── 9. Final CTA ───────────────────────────────── */}
        <section
          style={{
            textAlign: "center",
            padding: "80px 0",
            animation: "wih-fadeUp 0.7s ease-out 0.5s both",
          }}
        >
          <h2
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 28,
              fontWeight: 700,
              color: T.white,
              margin: "0 0 32px",
            }}
          >
            Start collecting income this week.
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link href="/subscribe">
              <button
                style={{
                  background: T.accent,
                  color: T.bg,
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 32px",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Request Access →
              </button>
            </Link>
            <button
              onClick={() => openLoginModal("/weekly-income")}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ccc",
                fontWeight: 600,
                fontSize: 14,
                padding: "14px 28px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Already a member? Sign in →
            </button>
          </div>
        </section>

        {/* ─── 10. Footer Disclaimer ──────────────────────── */}
        <footer
          style={{
            textAlign: "center",
            paddingBottom: 40,
            fontSize: 10,
            color: T.ghost,
          }}
        >
          Based on backtesting. Past results do not guarantee future
          performance.
        </footer>
      </div>
    </div>
  );
}

/* ─── StatTile sub-component ────────────────────────────────── */
function StatTile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        flex: 1,
        padding: "24px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color,
          fontFamily: T.fontDisplay,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}
