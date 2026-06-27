/* ============================================================
   PushNotificationMockup.tsx — Phone push alert visual mockup
   Renders a realistic-looking mobile notification card with
   pulsing green border glow. Fully self-contained with inline
   styles and a <style> block for the keyframe animation.
   ============================================================ */

interface PushNotificationMockupProps {
  /** Ticker symbol, e.g. "NVDA" */
  ticker?: string;
  /** Letter grade, e.g. "A" */
  grade?: string;
  /** Setup type label, e.g. "INCOME ALERT $850" */
  setupType?: string;
  /** Strike price, e.g. "$850P" */
  strike?: string;
  /** Expiration date, e.g. "Jul 5" */
  expiry?: string;
  /** Credit received, e.g. "$2.40" — pass "—" for non-income */
  credit?: string;
  /** Numeric score, e.g. "91" */
  score?: string;
  /** Override Line 2 entirely (e.g. for sentiment context) */
  line2Override?: string;
  /** Animation delay for fade-in (seconds) */
  animDelay?: number;
}

export default function PushNotificationMockup({
  ticker = "NVDA",
  grade = "A",
  setupType = "INCOME ALERT $850",
  strike: _strike = "$850P",
  expiry = "Jul 5",
  credit = "$2.40",
  score = "91",
  line2Override,
  animDelay = 0.35,
}: PushNotificationMockupProps) {
  const line1 = `${ticker} · ${grade} Grade · ${setupType}`;
  const line2 =
    line2Override ??
    `Expiry ${expiry} · Credit ${credit} · Score ${score}`;

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "28px auto",
        animation: `preFadeIn 0.4s ease-out ${animDelay}s both, pushNotifSlideUp 0.5s ease-out ${animDelay}s both`,
      }}
    >
      {/* Notification Card */}
      <div
        className="push-notif-card"
        style={{
          background: "#1a1a2e",
          border: "1px solid rgba(0,255,150,0.2)",
          borderRadius: "12px",
          padding: "14px 18px",
          maxWidth: "380px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Top row: app name + "now" */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem" }}>🔔</span>
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
              Primal Edge
            </span>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.55rem",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.05em",
            }}
          >
            now
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            marginBottom: "10px",
          }}
        />

        {/* Content — blurred with lock overlay */}
        <div style={{ position: "relative" }}>
          <div style={{ filter: "blur(5px)", userSelect: "none" }}>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#ffffff",
                margin: "0 0 4px",
                lineHeight: 1.4,
              }}
            >
              {line1}
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 400,
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.45)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {line2}
            </p>
          </div>
          {/* Lock overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "rgba(26,26,46,0.3)",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>🔒</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.08em",
              }}
            >
              Members only
            </span>
          </div>
        </div>
      </div>

      {/* Supporting text line */}
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "0.82rem",
          color: "rgba(0,229,160,0.6)",
          textAlign: "center",
          margin: "14px auto 0",
          maxWidth: "380px",
          lineHeight: 1.5,
        }}
      >
        📱 Real-time push alert to your phone — ticker, grade, strike, and
        expiry. Nothing else.
      </p>

      {/* Platform independence line */}
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          margin: "8px auto 0",
          maxWidth: "420px",
          lineHeight: 1.5,
        }}
      >
        🔁 Platform independent — execute on Thinkorswim, Robinhood, Tastytrade,
        Alpaca, or any broker you already use.
      </p>

      {/* Keyframe animations */}
      <style>{`
        .push-notif-card {
          animation: pushNotifGlow 2.5s ease-in-out infinite;
        }
        @keyframes pushNotifGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(0,255,150,0.08); }
          50% { box-shadow: 0 0 18px rgba(0,255,150,0.18), 0 0 4px rgba(0,255,150,0.1); }
        }
        @keyframes pushNotifSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
