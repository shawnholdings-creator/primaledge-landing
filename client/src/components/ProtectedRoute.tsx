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
import type { ReactNode } from "react";

/** Product display names for copy */
const PRODUCT_LABELS: Record<keyof ProductAccess, { title: string; subtitle: string }> = {
  cockpit: {
    title: "Primal Edge AI Cockpit",
    subtitle: "Sign in to access the live signal engine.",
  },
  income: {
    title: "Weekly Income Scanner",
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
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = PRODUCT_LABELS[product];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = mode === "login" ? await signIn(email, password) : await signUp(email, password);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else if (mode === "register") {
      toast.success("Account created! Your access is now pending approval.");
    }

    setLoading(false);
  };

  /* Pre-login curiosity message copy per product */
  const curiosity: Record<keyof ProductAccess, { badge: string; headline: string; body: string }> = {
    sentiment: {
      badge: "● MARKET INTELLIGENCE — DAILY",
      headline: "What if the first thing you saw every morning told you exactly what kind of day the market is setting up for?",
      body: "That is what the Market Sentiment Engine does.",
    },
    income: {
      badge: "● INCOME INTELLIGENCE — PRIVATE ACCESS",
      headline: "Not every income opportunity is worth the same attention.",
      body: "The Weekly Income Scanner ranks what deserves your time this week — and keeps everything else out of your way.",
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
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              animation: "preSlideUp 0.5s ease-out 0.2s both",
            }}
          >
            {cm.headline}
          </h2>

          {/* Body */}
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.58)",
              lineHeight: 1.7,
              maxWidth: "480px",
              margin: "20px auto 0",
              animation: "preFadeIn 0.4s ease-out 0.3s both",
            }}
          >
            {cm.body}
          </p>

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

        {/* ── Login Form ── */}
        <div className="text-center max-w-md w-full" style={{ paddingBottom: "48px" }}>
          {/* Lock Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-2xl">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="22" width="32" height="22" rx="4" stroke="#00e5a0" strokeWidth="2.5" />
                <path d="M16 22V14a8 8 0 0 1 16 0v8" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="33" r="3" fill="#00e5a0" />
                <path d="M24 36v3" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <h1
            className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {label.title}
          </h1>
          <p className="text-white/40 text-sm mb-8">
            {mode === "login" ? label.subtitle : "Create an account to request access."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-white/50 text-xs font-mono tracking-wider mb-1.5 uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0d1118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-mono tracking-wider mb-1.5 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0d1118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-mono text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00e5a0] text-[#0a0d12] font-bold text-base py-3.5 rounded-xl hover:bg-[#00e5a0]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? (
                "Sign In →"
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-white/30 text-sm mt-6">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => { setMode("register"); setError(null); }} className="text-[#00e5a0] hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(null); }} className="text-[#00e5a0] hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>

          {/* Request Access CTA */}
          <div className="mt-8">
            <Link href="/subscribe">
              <button className="text-white/30 hover:text-white/50 text-xs font-mono transition-colors">
                Request Access →
              </button>
            </Link>
          </div>

          <p className="text-white/20 text-xs mt-6">
            Need help?{" "}
            <a href="mailto:support@primaledge.io" className="text-[#00e5a0]/50 hover:text-[#00e5a0] transition-colors">
              support@primaledge.io
            </a>
          </p>
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
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
