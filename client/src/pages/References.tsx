import ComingSoonPage from "./ComingSoonPage";

export default function References() {
  return (
    <ComingSoonPage
      title="Trading References"
      subtitle="The Trader's Definitive Resource Library."
      description="A curated, always-updated reference library covering trading terminology, market structure definitions, indicator formulas, options Greeks, and the quantitative concepts behind the Primal Edge signal engine."
      icon={
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="4" width="26" height="36" rx="3" stroke="#00d4aa" strokeWidth="3"/>
          <path d="M34 8h4a2 2 0 0 1 2 2v30a2 2 0 0 1-2 2H14" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round"/>
          <line x1="14" y1="14" x2="28" y2="14" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
          <line x1="14" y1="20" x2="28" y2="20" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
          <line x1="14" y1="26" x2="22" y2="26" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
        </svg>
      }
      teaserItems={[
        { label: "Glossary of Terms", desc: "Every trading term, defined precisely — from basic market structure to advanced derivatives vocabulary." },
        { label: "Options Greeks Reference", desc: "Delta, Gamma, Theta, Vega, Rho — formulas, interpretations, and how each Greek affects your position." },
        { label: "Indicator Formulas", desc: "The exact mathematical formulas behind ATR, RSI, MACD, Bollinger Bands, and every indicator in the Primal Edge engine." },
        { label: "Market Hours & Sessions", desc: "Global market sessions, pre/post-market hours, key economic release times, and their impact on volatility." },
        { label: "Order Types Guide", desc: "Market, limit, stop, stop-limit, trailing stop, and conditional orders — when to use each and why it matters." },
        { label: "Earnings Calendar Integration", desc: "How to use the earnings calendar as a signal filter — including expected move calculations and IV crush timing." },
      ]}
    />
  );
}
