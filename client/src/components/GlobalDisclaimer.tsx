/* ============================================================
   GlobalDisclaimer.tsx — Fixed red disclaimer bar at bottom of every page
   Appears on all routes as a persistent footer disclaimer
   ============================================================ */

export default function GlobalDisclaimer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e14]/95 backdrop-blur-sm border-t border-red-500/20">
      <p
        className="text-center text-red-400/90 text-[10px] sm:text-xs py-2 px-4 tracking-wide"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        Educational &amp; analysis purposes only. Not financial advice or a recommendation to buy, sell, or hold any security.
      </p>
    </div>
  );
}
