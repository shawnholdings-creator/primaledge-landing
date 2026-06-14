/* ============================================================
   MobileCTA.tsx — Sticky bottom bar for mobile
   Visible only on mobile (<lg), fixed bottom-0
   ============================================================ */

import { Link, useLocation } from "wouter";

export default function MobileCTA() {
  const [location] = useLocation();

  // Hide on subscribe/access page
  if (location === "/subscribe") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden" style={{ zIndex: 9999 }}>
      <div
        className="flex items-center justify-center gap-3 px-4"
        style={{
          background: "linear-gradient(180deg, rgba(10,13,18,0) 0%, #0a0d12 20%)",
          paddingTop: "20px",
          paddingBottom: "8px",
        }}
      >
        <Link href="/subscribe" className="w-full max-w-md">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all"
            style={{
              background: "#00e5a0",
              color: "#0a0d12",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
              height: "52px",
              minHeight: "52px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 7V5a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Get Access
          </button>
        </Link>
      </div>
    </div>
  );
}
