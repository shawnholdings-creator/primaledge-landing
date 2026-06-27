/* ============================================================
   MarketSentimentHero.tsx — Public tease hero for Market Sentiment
   Shown to visitors who are NOT authenticated/approved.
   ============================================================ */

import { useEffect, useRef } from "react";
import Navbar from "./Navbar";
import { useLoginModal } from "../contexts/LoginModalContext";
import { Link } from "wouter";

/* ─── Design Tokens ──────────────────────────────────────────── */
const T = {
  bg: "#0a0a0a",
  accent: "#00ff96",
  amber: "#f0b429",
  card: "#111",
  border: "1px solid rgba(255,255,255,0.08)",
  radius: 12,
  mono: "'JetBrains Mono', monospace",
  heading: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
};

/* ─── Keyframes injected once ────────────────────────────────── */
const KEYFRAMES = `
@keyframes msh-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes msh-fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

/* ─── Reusable Styles ────────────────────────────────────────── */
const cardStyle: React.CSSProperties = {
  background: T.card,
  border: T.border,
  borderRadius: T.radius,
};

const sectionGap: React.CSSProperties = { marginTop: 56 };

/* ────────────────────────────────────────────────────────────── */
export default function MarketSentimentHero() {
  const { openLoginModal } = useLoginModal();
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: "#fff", overflowX: "hidden" }}>
      {/* ═══ 1. Navbar ═══ */}
      <Navbar />

      {/* ═══ 2. Eyebrow + Headline + Sub ═══ */}
      <section style={{ paddingTop: 160, paddingBottom: 0, textAlign: "center", padding: "160px 20px 0" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: T.accent,
            boxShadow: `0 0 8px ${T.accent}`,
            animation: "msh-pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.18em", color: T.accent, textTransform: "uppercase" as const }}>
            MARKET SENTIMENT ENGINE
          </span>
        </div>

        {/* H1 */}
        <h1 style={{
          fontFamily: T.heading, fontSize: "clamp(28px, 5vw, 40px)", lineHeight: "1.35",
          fontWeight: 900, margin: "0 auto 20px", maxWidth: 640,
        }}>
          <span style={{ color: "#fff" }}>The market is telling you something.</span>
          <br />
          <span style={{ color: T.accent }}>Are you listening?</span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontFamily: T.body, fontSize: 15, color: "#666", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
          AI reads the pulse of 80+ symbols across multiple timeframes and distills it into one actionable reading.
        </p>
      </section>

      {/* ═══ 3. Live Insight Card ═══ */}
      <section style={{ ...sectionGap, padding: "0 20px" }}>
        <div style={{
          ...cardStyle, maxWidth: 560, margin: "0 auto", padding: 28, position: "relative",
        }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: T.accent,
                animation: "msh-pulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.accent }}>Live Insight</span>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: "#555" }}>Updated 14 minutes ago</span>
          </div>

          {/* Visible partial text */}
          <p style={{ fontFamily: T.body, fontSize: 15, color: "#aaa", margin: "0 0 8px" }}>
            Current market posture is showing signs of
          </p>

          {/* Blurred fake text */}
          <div style={{ filter: "blur(6px)", userSelect: "none", lineHeight: 1.8 }}>
            <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
              ████████████████ ██████████ ████████████████████ ██████████████ ████████████
            </p>
          </div>

          {/* CTA inside card */}
          <Link href="/subscribe">
            <button style={{
              marginTop: 16, background: T.accent, color: T.bg, fontWeight: 700,
              border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14,
              cursor: "pointer", fontFamily: T.body,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${T.accent}40`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              Unlock Full Analysis →
            </button>
          </Link>
        </div>
      </section>

      {/* ═══ 4. Sentiment Gauge ═══ */}
      <section style={{ ...sectionGap, padding: "0 20px" }}>
        <SentimentGauge />
      </section>

      {/* ═══ 5. Feature Grid ═══ */}
      <section style={{ ...sectionGap, padding: "0 20px" }}>
        <FeatureGrid />
      </section>

      {/* ═══ 6. Regime Timeline ═══ */}
      <section style={{ ...sectionGap, padding: "0 20px" }}>
        <RegimeTimeline />
      </section>

      {/* ═══ 7. Sector Heatmap ═══ */}
      <section style={{ ...sectionGap, padding: "0 20px" }}>
        <SectorHeatmap />
      </section>

      {/* ═══ 8. Final CTA ═══ */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: T.heading, fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700,
          color: "#fff", margin: "0 0 28px",
        }}>
          Stop guessing what the market is doing.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Link href="/subscribe">
            <button style={{
              background: T.accent, color: T.bg, fontWeight: 700,
              border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15,
              cursor: "pointer", fontFamily: T.body,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${T.accent}40`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              Request Sentiment Access →
            </button>
          </Link>

          <button
            onClick={() => openLoginModal("/market-sentiment")}
            style={{
              background: "none", border: "none", color: "#888", fontSize: 13,
              cursor: "pointer", fontFamily: T.body,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
          >
            Already a member? Sign in →
          </button>
        </div>

        <p style={{ fontFamily: T.mono, fontSize: 10, color: "#333", marginTop: 24, maxWidth: 460, margin: "24px auto 0" }}>
          Based on backtesting. Past results do not guarantee future performance.
        </p>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─── 4a. Semicircle Gauge ───────────────────────────────────── */
function SentimentGauge() {
  const zones = [
    { label: "Extreme Fear", color: "#ef4444", desc: "High panic selling. Markets tend to be oversold." },
    { label: "Fear", color: "#f97316", desc: "Negative sentiment dominates. Caution is warranted." },
    { label: "Neutral", color: "#eab308", desc: "Balanced conditions. No strong directional bias." },
    { label: "Greed", color: "#84cc16", desc: "Positive sentiment. Markets trending higher." },
    { label: "Extreme Greed", color: "#22c55e", desc: "Euphoria detected. Markets may be overbought." },
  ];

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      {/* Gauge arc */}
      <div style={{ position: "relative", width: 280, height: 156, margin: "0 auto" }}>
        {/* Outer semi ring */}
        <div style={{
          width: 280, height: 140, borderRadius: "140px 140px 0 0",
          border: "3px solid rgba(255,255,255,0.1)", borderBottom: "none",
          overflow: "hidden", position: "relative",
          background: `conic-gradient(from 180deg at 50% 100%, #ef4444 0deg, #f97316 36deg, #eab308 72deg, #84cc16 108deg, #22c55e 144deg, #22c55e 180deg, transparent 180deg)`,
        }} />

        {/* Center frosted overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 100, borderRadius: "100px 100px 0 0",
          background: "rgba(10,10,10,0.92)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 4,
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: "#aaa", textAlign: "center", padding: "0 12px" }}>
            Today's reading is members only
          </span>
        </div>
      </div>

      {/* Zone labels */}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 4px",
      }}>
        {zones.map(z => (
          <span key={z.label} style={{ fontFamily: T.mono, fontSize: 9, color: "#555", textAlign: "center", flex: 1 }}>
            {z.label}
          </span>
        ))}
      </div>

      {/* Zone Description Table */}
      <div style={{ marginTop: 24 }}>
        {zones.map(z => (
          <div key={z.label} style={{
            ...cardStyle, borderRadius: 8, padding: "12px 16px", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{z.label}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{z.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 5a. Feature Grid ───────────────────────────────────────── */
const FEATURES = [
  { icon: "📊", title: "Price Structure", desc: "Multi-timeframe trend and momentum analysis" },
  { icon: "📈", title: "Market Breadth", desc: "How many symbols are participating in the move" },
  { icon: "🌊", title: "Volatility Conditions", desc: "Current volatility regime and VIX context" },
  { icon: "🔗", title: "Cross-Asset Signals", desc: "Bond, commodity, and currency confirmation" },
  { icon: "⚡", title: "Real-Time Delivery", desc: "Updated every 15 minutes during market hours" },
  { icon: "🎯", title: "Conviction Threshold", desc: "Only signals above the confidence bar are surfaced" },
];

function FeatureGrid() {
  return (
    <div style={{
      maxWidth: 600, margin: "0 auto",
      display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
    }}>
      {FEATURES.map(f => (
        <div key={f.title} style={{ ...cardStyle, padding: 20 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{f.title}</div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{f.desc}</div>
        </div>
      ))}

      {/* Mobile single-col override */}
      <style>{`
        @media (max-width: 480px) {
          /* target the feature grid via its parent section */
          section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── 6a. Regime Timeline ────────────────────────────────────── */
const REGIME_ROWS = [
  { date: "Jun 12", regime: "CAUTIOUS", regimeColor: "#f0b429", regimeBg: "rgba(240,180,41,0.15)", outcome: "Market pulled back 3.2%" },
  { date: "May 28", regime: "BULLISH", regimeColor: "#22c55e", regimeBg: "rgba(34,197,94,0.15)", outcome: "Market gained 4.1%" },
  { date: "May 14", regime: "CAUTIOUS", regimeColor: "#f0b429", regimeBg: "rgba(240,180,41,0.15)", outcome: "Market pulled back 1.8%" },
  { date: "Apr 30", regime: "BULLISH", regimeColor: "#22c55e", regimeBg: "rgba(34,197,94,0.15)", outcome: "Market gained 2.9%" },
];

function RegimeTimeline() {
  return (
    <div style={{ ...cardStyle, maxWidth: 560, margin: "0 auto", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Historical Regime Calls</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: "#555" }}>Verified against S&P 500</span>
      </div>

      {/* Rows */}
      {REGIME_ROWS.map((r, i) => (
        <div key={i} style={{
          padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: "#555", minWidth: 48 }}>{r.date}</span>
          <span style={{
            fontFamily: T.mono, fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
            padding: "3px 10px", borderRadius: 999, color: r.regimeColor, background: r.regimeBg,
          }}>
            {r.regime}
          </span>
          <span style={{ fontSize: 12, color: "#aaa", flex: 1 }}>{r.outcome}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, filter: "blur(5px)", userSelect: "none", color: "#888" }}>██/100</span>
        </div>
      ))}

      {/* Current — fully blurred with lock */}
      <div style={{
        padding: "14px 20px", position: "relative",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: "#555" }}>[Current]</span>
        <span style={{ filter: "blur(5px)", userSelect: "none", fontFamily: T.mono, fontSize: 10, color: "#888" }}>████████</span>
        <span style={{ fontSize: 12, color: "#aaa", flex: 1 }}>Members only</span>
        <span style={{ fontFamily: T.mono, fontSize: 12, filter: "blur(5px)", userSelect: "none", color: "#888" }}>██/100</span>
        {/* Lock overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "0 0 12px 12px",
          background: "rgba(10,10,10,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
        </div>
      </div>
    </div>
  );
}

/* ─── 7a. Sector Heatmap ─────────────────────────────────────── */
const HEATMAP_CELLS = [
  { name: "Tech", bg: "#22c55e30" }, { name: "Health", bg: "#ef444430" }, { name: "Energy", bg: "#22c55e20" },
  { name: "Finance", bg: "#ef444420" }, { name: "Consumer", bg: "#22c55e40" }, { name: "Industry", bg: "#ef444430" },
  { name: "Materials", bg: "#22c55e30" }, { name: "Utils", bg: "#22c55e20" }, { name: "RE", bg: "#ef444420" },
];

function SectorHeatmap() {
  return (
    <div style={{ ...cardStyle, maxWidth: 400, margin: "0 auto", padding: 20, position: "relative" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
      }}>
        {HEATMAP_CELLS.map(c => (
          <div key={c.name} style={{
            background: c.bg, borderRadius: 6,
            height: 50, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: T.mono, fontSize: 10, color: "#ccc",
              filter: "blur(5px)", userSelect: "none",
            }}>
              {c.name}
            </span>
          </div>
        ))}
      </div>

      {/* Full lock overlay */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: T.radius,
        background: "rgba(10,10,10,0.6)", backdropFilter: "blur(2px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <span style={{ fontSize: 22 }}>🔒</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: "#aaa" }}>Sector breakdown is members only</span>
      </div>
    </div>
  );
}
