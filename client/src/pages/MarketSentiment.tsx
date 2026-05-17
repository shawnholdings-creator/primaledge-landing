import ComingSoonPage from "./ComingSoonPage";

export default function MarketSentiment() {
  return (
    <ComingSoonPage
      title="Market Sentiment"
      subtitle="Know the Mood Before the Move."
      description="Real-time and historical sentiment analysis across equities, options flow, social signals, and macro indicators — giving you a quantified read on where institutional and retail money is positioned right now."
      icon={
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M6 34 C10 20, 16 28, 24 16 C32 4, 38 22, 42 14" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <circle cx="24" cy="16" r="3" fill="#00d4aa"/>
          <path d="M6 42h36" stroke="#00d4aa" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round"/>
          <path d="M6 6v36" stroke="#00d4aa" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round"/>
          <rect x="8" y="36" width="6" height="6" rx="1" fill="#00d4aa" opacity="0.3"/>
          <rect x="18" y="30" width="6" height="12" rx="1" fill="#00d4aa" opacity="0.5"/>
          <rect x="28" y="24" width="6" height="18" rx="1" fill="#00d4aa" opacity="0.7"/>
          <rect x="38" y="18" width="6" height="24" rx="1" fill="#00d4aa"/>
        </svg>
      }
      teaserItems={[
        { label: "Fear & Greed Index", desc: "A composite AI-weighted sentiment score across volatility, momentum, breadth, and options data — updated in real time." },
        { label: "Put/Call Ratio Analysis", desc: "Track the put/call ratio across indices and individual names to gauge institutional hedging and directional bias." },
        { label: "Options Flow Heatmap", desc: "Visualize where the smart money is positioning — unusual options activity mapped by sector, size, and conviction." },
        { label: "Short Interest Tracker", desc: "Monitor short interest levels and changes across the premium universe to identify potential squeeze candidates." },
        { label: "Breadth Indicators", desc: "Advance/decline lines, new highs vs. new lows, and percentage of stocks above key moving averages — the market's internal health." },
        { label: "Macro Sentiment Dashboard", desc: "Fed policy signals, yield curve dynamics, and dollar strength — how macro forces are shaping equity market sentiment." },
      ]}
    />
  );
}
