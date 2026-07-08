/* ============================================================
   AIDashboardHero.tsx — Public tease hero for the AI Cockpit
   Shown to unauthenticated / non-approved visitors.
   Design: dark #0a0a0a, accent #00ff96, amber #f0b429
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Navbar from "./Navbar";
import { useLoginModal } from "../contexts/LoginModalContext";

/* ─── Design tokens ─────────────────────────────────────────── */
const T = {
  bg: "#0a0a0a",
  accent: "#00ff96",
  amber: "#f0b429",
  cardBg: "#111",
  cardBorder: "1px solid rgba(255,255,255,0.08)",
  radius: "12px",
  white: "#ffffff",
  gray: "#666",
  grayDark: "#555",
  grayDarker: "#333",
  red: "#ef4444",
  blue: "#3b82f6",
} as const;

/* ─── Reusable tiny components ──────────────────────────────── */
const PulsingDot = ({ color = T.accent, size = 6 }: { color?: string; size?: number }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color,
      display: "inline-block",
      animation: "pulse-dot 2s ease-in-out infinite",
      flexShrink: 0,
    }}
  />
);

/* ─── Animated counter hook ─────────────────────────────────── */
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          if (prefersReduced) {
            setValue(target);
            return;
          }
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, started]);

  return { ref, value };
}

/* ─── Lock overlay reusable ─────────────────────────────────── */
function LockOverlay({
  label,
  ctaLabel,
  onClick,
}: {
  label: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, transparent 10%, rgba(10,10,10,0.92) 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "32px 20px",
        borderRadius: T.radius,
        zIndex: 2,
      }}
    >
      <p style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>{label}</p>
      <button
        onClick={onClick}
        style={{
          background: T.accent,
          color: T.bg,
          fontWeight: 700,
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: 12,
          cursor: "pointer",
          letterSpacing: 0.3,
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function AIDashboardHero() {
  const { openLoginModal } = useLoginModal();

  /* Animated counters */
  const symbolsCounter = useAnimatedCounter(2847);
  const flagsCounter = useAnimatedCounter(12);
  const reviewCounter = useAnimatedCounter(4);
  const convictionCounter = useAnimatedCounter(84);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.white }}>
      {/* ─── Global keyframes ───────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&display=swap');
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes typing-bounce {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Eyebrow + Headline + Sub */}
      <section
        style={{
          paddingTop: 160,
          textAlign: "center",
          maxWidth: 720,
          margin: "0 auto",
          padding: "160px 20px 0",
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
          <PulsingDot />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 2,
              color: T.accent,
              textTransform: "uppercase",
            }}
          >
            AI Cockpit
          </span>
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 40,
            lineHeight: "56px",
            fontWeight: 900,
            margin: "0 0 20px",
          }}
        >
          There is an AI analyzing the market
          <br />
          <span style={{ color: T.accent }}>right now. Do you have access?</span>
        </h1>

        {/* Sub */}
        <p
          style={{
            color: T.gray,
            fontSize: 15,
            lineHeight: 1.7,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          Live intelligence layer across 80+ symbols. Surfaces highest conviction
          setups. Answers your questions in plain English.
        </p>
      </section>

      {/* 3. Live Scan Counter Card */}
      <section style={{ maxWidth: 480, margin: "56px auto 0", padding: "0 20px" }}>
        <div
          ref={symbolsCounter.ref}
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: T.radius,
            padding: 32,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 28,
            }}
          >
            <PulsingDot />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: T.accent,
              }}
            >
              Live Scan
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: T.grayDark,
                marginLeft: "auto",
              }}
            >
              Updated 8 minutes ago
            </span>
          </div>

          {/* Stat rows */}
          {[
            { label: "Symbols analyzed this session", counter: symbolsCounter },
            { label: "High conviction flags raised", counter: flagsCounter },
            { label: "Currently under active review", counter: reviewCounter },
            { label: "Average conviction score", counter: convictionCounter },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <span style={{ fontSize: 12, color: T.gray }}>{row.label}</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 700,
                  color: T.accent,
                }}
              >
                {row.counter.value.toLocaleString()}
              </span>
            </div>
          ))}

          {/* CTA */}
          <button
            onClick={() => openLoginModal("/ai-dashboard")}
            style={{
              width: "100%",
              marginTop: 20,
              background: "transparent",
              border: "1px solid rgba(0,255,150,0.3)",
              color: T.accent,
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Sign in to see what it found →
          </button>
        </div>
      </section>

      {/* 4. AI Chat Tease */}
      <section style={{ maxWidth: 520, margin: "56px auto 0", padding: "0 20px" }}>
        <div
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: T.radius,
            overflow: "hidden",
          }}
        >
          {/* Header bar */}
          <div
            style={{
              background: "#0d0d0d",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>
              AI Cockpit
            </span>
            <PulsingDot />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: T.accent,
              }}
            >
              Live
            </span>
          </div>

          {/* Chat body */}
          <div style={{ padding: 20 }}>
            {/* User bubble */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "16px 16px 4px 16px",
                  padding: "12px 16px",
                  maxWidth: "85%",
                }}
              >
                <p style={{ fontSize: 13, color: T.white, margin: 0 }}>
                  What is the highest conviction setup in the market right now?
                </p>
              </div>
            </div>

            {/* AI bubble */}
            <div style={{ marginTop: 16, maxWidth: "85%" }}>
              <div
                style={{
                  background: "rgba(0,255,150,0.06)",
                  border: "1px solid rgba(0,255,150,0.1)",
                  borderRadius: "16px 16px 16px 4px",
                  padding: 16,
                }}
              >
                <p style={{ fontSize: 13, color: "#ccc", margin: 0, lineHeight: 1.6 }}>
                  Based on current price structure and momentum conditions across
                  the market, the highest conviction opportunity I'm seeing is in
                  <span style={{ filter: "blur(6px)", userSelect: "none" }}>
                    {" "}████████████ with a conviction score of ██/100. The
                    ████████████████████████████████████████
                  </span>
                </p>
                <button
                  onClick={() => openLoginModal("/ai-dashboard")}
                  style={{
                    marginTop: 12,
                    background: T.accent,
                    color: T.bg,
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Unlock this answer →
                </button>
              </div>
            </div>

            {/* Typing indicator */}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: T.grayDark,
                    animation: `typing-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Ranked List Tease */}
      <section style={{ maxWidth: 520, margin: "56px auto 0", padding: "0 20px" }}>
        <div
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: T.radius,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 20px 16px",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: T.white }}>
              Today's Ranked Setups
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: T.accent,
                background: "rgba(0,255,150,0.1)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              5 qualifying
            </span>
          </div>

          {/* Rows */}
          {[
            { rank: 1, score: 94, grade: "A" as const },
            { rank: 2, score: 88, grade: "A" as const },
            { rank: 3, score: 82, grade: "B" as const },
            { rank: 4, score: 79, grade: "B" as const },
            { rank: 5, score: 75, grade: "B" as const },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderBottom:
                  i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: T.grayDark, minWidth: 20 }}>
                #{row.rank}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  filter: "blur(5px)",
                  color: T.white,
                  userSelect: "none",
                }}
              >
                ████
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "#aaa",
                }}
              >
                Score {row.score}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background:
                    row.grade === "A"
                      ? "rgba(0,255,150,0.15)"
                      : "rgba(59,130,246,0.15)",
                  color: row.grade === "A" ? T.accent : T.blue,
                }}
              >
                {row.grade}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: T.gray,
                  filter: "blur(5px)",
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                ████████████████████████████
              </span>
            </div>
          ))}

          {/* Lock overlay */}
          <LockOverlay
            label="Rankings visible to members only"
            ctaLabel="Sign in to view rankings →"
            onClick={() => openLoginModal("/ai-dashboard")}
          />
        </div>
      </section>

      {/* 6. With / Without Comparison */}
      <section style={{ maxWidth: 600, margin: "56px auto 0", padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {/* Without */}
          <div
            style={{
              flex: "1 1 260px",
              border: `1px solid rgba(239,68,68,0.2)`,
              background: "rgba(239,68,68,0.03)",
              borderRadius: T.radius,
              padding: 24,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: T.red, margin: "0 0 16px" }}>
              Without the Cockpit
            </p>
            {[
              "Scroll 80+ charts manually",
              "Guess which setups matter",
              "Miss alerts while at work",
              "Hours of pre-market research",
              "No context on why a setup qualifies",
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ color: T.red, fontSize: 14, lineHeight: "20px" }}>✗</span>
                <span style={{ fontSize: 13, color: "#999", lineHeight: "20px" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* With */}
          <div
            style={{
              flex: "1 1 260px",
              border: `1px solid rgba(0,255,150,0.2)`,
              background: "rgba(0,255,150,0.03)",
              borderRadius: T.radius,
              padding: 24,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: T.accent, margin: "0 0 16px" }}>
              With the Cockpit
            </p>
            {[
              "80+ symbols ranked in seconds",
              "Highest conviction surfaced automatically",
              "Push alert in under 3 seconds",
              "Plain-English morning brief",
              "Ask the AI why any setup qualifies",
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ color: T.accent, fontSize: 14, lineHeight: "20px" }}>✓</span>
                <span style={{ fontSize: 13, color: "#999", lineHeight: "20px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Morning Brief Tease */}
      <section style={{ maxWidth: 520, margin: "56px auto 0", padding: "0 20px" }}>
        <div
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: T.radius,
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: T.white }}>
              Today's Morning Brief
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: T.grayDark,
              }}
            >
              Jun 26, 2026 · 9:02 AM ET
            </span>
          </div>

          {/* Separator */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.05)",
              margin: "16px 0",
            }}
          />

          {/* Key-value rows */}
          {[
            {
              label: "Market posture:",
              value: "████████████",
              blurred: true,
              valueColor: T.white,
            },
            {
              label: "Top sector:",
              value: "████████████",
              blurred: true,
              valueColor: T.white,
            },
            {
              label: "Highest conviction:",
              value: (
                <>
                  <span style={{ filter: "blur(5px)", userSelect: "none" }}>████████████</span>
                  {" "}
                  <span style={{ color: T.accent }}>Score 91 / A</span>
                </>
              ),
              blurred: false,
              valueColor: T.white,
            },
            {
              label: "Risk flag:",
              value: "████████████████████████",
              blurred: true,
              valueColor: T.white,
            },
            {
              label: "Overnight qualifiers:",
              value: "3 setups qualified overnight. Members received alerts.",
              blurred: false,
              valueColor: "#aaa",
            },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 12, color: T.gray, whiteSpace: "nowrap" }}>
                {row.label}
              </span>
              <span
                style={{
                  fontSize: typeof row.value === "string" && !row.blurred ? 13 : 14,
                  color: row.valueColor,
                  filter: row.blurred ? "blur(5px)" : "none",
                  userSelect: row.blurred ? "none" : "auto",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}

          {/* Lock overlay */}
          <LockOverlay
            label="Morning brief available to members"
            ctaLabel="Sign in to read the brief →"
            onClick={() => openLoginModal("/ai-dashboard")}
          />
        </div>
      </section>

      {/* 8. Final CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 20px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: T.white,
            margin: "0 0 28px",
            lineHeight: 1.35,
          }}
        >
          The AI is working. Are you in the room?
        </h2>

        {/* Primary CTA */}
        <Link href="/subscribe">
          <a
            style={{
              display: "inline-block",
              background: T.accent,
              color: T.bg,
              fontWeight: 700,
              border: "none",
              borderRadius: 10,
              padding: "14px 32px",
              fontSize: 14,
              cursor: "pointer",
              textDecoration: "none",
              marginBottom: 16,
            }}
          >
            Request AI Cockpit Access →
          </a>
        </Link>

        <br />

        {/* Secondary CTA */}
        <button
          onClick={() => openLoginModal("/ai-dashboard")}
          style={{
            background: "transparent",
            border: "none",
            color: T.gray,
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Already a member? Sign in →
        </button>

        {/* Disclaimer */}
        <p
          style={{
            color: T.grayDarker,
            fontSize: 10,
            marginTop: 32,
            lineHeight: 1.5,
          }}
        >
          Based on backtesting. Past results do not guarantee future performance.
        </p>
      </section>
    </div>
  );
}
