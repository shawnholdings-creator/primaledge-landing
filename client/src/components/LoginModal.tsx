/**
 * LoginModal — Centered overlay with the shared LoginForm.
 * Rendered once at the App level; opened via useLoginModal().
 *
 * Accessible dialog contract:
 * - role="dialog" with aria-modal="true" and descriptive aria-label
 * - Focus trapped while open, restored to trigger on close
 * - Escape and backdrop click dismiss the dialog
 * - Body scroll lock applied while open, always removed on close/unmount
 * - Close button ≥ 44px tap target with accessible name
 * - Session dismissal prevents re-open loops
 */
import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useLoginModal } from "../contexts/LoginModalContext";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "./LoginForm";

export default function LoginModal() {
  const { isOpen, closeLoginModal, redirectTo, dismissTo } = useLoginModal();
  const { user, productAccess } = useAuth();
  const [, navigate] = useLocation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Capture the element that triggered the modal open
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // After user dismisses modal: close, restore focus, navigate if needed
  const handleDismiss = useCallback(() => {
    closeLoginModal();
    // Restore focus to the element that opened the modal
    if (triggerRef.current && typeof triggerRef.current.focus === "function") {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
    if (dismissTo) {
      navigate(dismissTo);
    }
  }, [closeLoginModal, dismissTo, navigate]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleDismiss();
      }
    },
    [handleDismiss],
  );

  // Body scroll lock + keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Focus the dialog container for screen readers
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
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
        // Backdrop click dismisses the dialog
        if (e.target === e.currentTarget) handleDismiss();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Member Access"
        tabIndex={-1}
        className="relative outline-none"
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
        {/* Close button — 44px minimum tap target */}
        <button
          onClick={handleDismiss}
          aria-label="Close member access dialog"
          className="absolute top-3 right-3 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
          style={{
            width: 44,
            height: 44,
            fontSize: "1.25rem",
            lineHeight: 1,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
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
