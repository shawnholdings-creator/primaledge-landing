/**
 * LoginModal — Centered overlay with the shared LoginForm.
 * Rendered once at the App level; opened via useLoginModal().
 */
import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useLoginModal } from "../contexts/LoginModalContext";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "./LoginForm";

export default function LoginModal() {
  const { isOpen, closeLoginModal, redirectTo, dismissTo } = useLoginModal();
  const { user, productAccess } = useAuth();
  const [, navigate] = useLocation();

  // After user dismisses modal (X, backdrop, Escape): close and navigate to hero page
  const handleDismiss = useCallback(() => {
    closeLoginModal();
    if (dismissTo) {
      navigate(dismissTo);
    }
  }, [closeLoginModal, dismissTo, navigate]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    },
    [handleDismiss],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // After successful login: close modal, optionally navigate
  const handleSuccess = () => {
    closeLoginModal();
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  // If user is logged in but no product access, show pending state
  const isApproved =
    productAccess.cockpit === true ||
    productAccess.income === true ||
    productAccess.sentiment === true;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className="relative"
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(0,255,150,0.15)",
          borderRadius: "12px",
          padding: "40px",
          maxWidth: "420px",
          width: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {user && !isApproved ? (
          /* Authenticated but not approved for any product */
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <svg
                  className="w-8 h-8 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2
              className="text-2xl font-bold text-white mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Access Pending
            </h2>
            <p className="text-white/40 text-sm mb-2">
              Signed in as{" "}
              <span className="text-[#00e5a0]">{user.email}</span>
            </p>
            <p className="text-white/30 text-xs max-w-xs mx-auto">
              Your account is awaiting approval. You&apos;ll receive an email
              when your access is activated.
            </p>
          </div>
        ) : (
          /* Login form */
          <LoginForm
            title="Member Access"
            subtitle="Sign in to access your dashboard."
            onSuccess={handleSuccess}
            hideRequestAccess
          />
        )}
      </div>
    </div>
  );
}
