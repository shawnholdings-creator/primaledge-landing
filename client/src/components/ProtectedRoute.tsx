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

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
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
    </div>
  );
}
