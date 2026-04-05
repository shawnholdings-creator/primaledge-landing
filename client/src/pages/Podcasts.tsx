import ComingSoonPage from "./ComingSoonPage";

export default function Podcasts() {
  return (
    <ComingSoonPage
      title="Primal Edge Podcasts"
      subtitle="Unfiltered. Unscripted. Uncompromising."
      description="Real conversations about trading, market structure, AI-driven analysis, and the mindset it takes to find consistent edge. No fluff, no hype — just signal."
      icon={
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="18" y="4" width="12" height="24" rx="6" stroke="#00d4aa" strokeWidth="3"/>
          <path d="M10 24c0 7.7 6.3 14 14 14s14-6.3 14-14" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round"/>
          <line x1="24" y1="38" x2="24" y2="44" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round"/>
          <line x1="18" y1="44" x2="30" y2="44" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      }
      teaserItems={[
        { label: "Weekly Market Breakdown", desc: "A weekly deep-dive into the signals, setups, and macro themes shaping the market — straight from the Primal Edge engine." },
        { label: "Trader Interviews", desc: "Conversations with professional traders, quants, and market structure experts sharing what actually works." },
        { label: "AI & Algo Trading", desc: "How machine learning is reshaping retail trading — and how to position yourself ahead of the curve." },
        { label: "Live Trade Reviews", desc: "Real trade walkthroughs — what the signal said, how the trade was managed, and what was learned." },
        { label: "Options Strategies Deep Dive", desc: "Episode series breaking down specific options strategies with real P&L data and probability analysis." },
        { label: "Market Psychology", desc: "Why markets move the way they do — behavioral finance, sentiment cycles, and crowd psychology." },
      ]}
    />
  );
}
