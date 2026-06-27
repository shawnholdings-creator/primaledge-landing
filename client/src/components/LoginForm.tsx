/**
 * LoginForm — Shared email/password login form extracted from ProtectedRoute.
 *
 * Used by both ProtectedRoute (inline gate) and LoginModal (overlay).
 */
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface LoginFormProps {
  /** Heading displayed above the form */
  title?: string;
  /** Sub-heading displayed below the title */
  subtitle?: string;
  /** Called after a successful sign-in (not sign-up, since sign-up requires approval) */
  onSuccess?: () => void;
  /** Hide the "Request Access →" link below the form */
  hideRequestAccess?: boolean;
}

export default function LoginForm({
  title = "Member Access",
  subtitle = "Sign in to access your dashboard.",
  onSuccess,
  hideRequestAccess = false,
}: LoginFormProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else if (mode === "register") {
      toast.success("Account created! Your access is now pending approval.");
    } else {
      // Successful login
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <div className="text-center max-w-md w-full">
      {/* Lock Icon */}
      <div className="flex justify-center mb-8">
        <div className="p-6 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-2xl">
          <svg
            className="w-8 h-8 text-[#00e5a0]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
      </div>

      {/* Title + subtitle */}
      <h1
        className="text-3xl md:text-4xl font-black text-white mb-3"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h1>
      <p className="text-white/40 text-sm mb-8">
        {mode === "login" ? subtitle : "Create an account to request access."}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-white/50 text-xs font-mono tracking-wider mb-1.5 uppercase">
            Email
          </label>
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
          <label className="block text-white/50 text-xs font-mono tracking-wider mb-1.5 uppercase">
            Password
          </label>
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
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
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

      {/* Toggle login/register */}
      <p className="text-white/30 text-sm mt-6">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className="text-[#00e5a0] hover:underline"
            >
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="text-[#00e5a0] hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      {/* Request Access link */}
      {!hideRequestAccess && (
        <div className="mt-8">
          <Link href="/subscribe">
            <button className="text-white/30 hover:text-white/50 text-xs font-mono transition-colors">
              Request Access →
            </button>
          </Link>
        </div>
      )}

      {/* Help email */}
      <p className="text-white/20 text-xs mt-6">
        Need help?{" "}
        <a
          href="mailto:support@primaledge.io"
          className="text-[#00e5a0]/50 hover:text-[#00e5a0]"
        >
          support@primaledge.io
        </a>
      </p>
    </div>
  );
}
