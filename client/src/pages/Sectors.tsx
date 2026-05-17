import ComingSoonPage from "./ComingSoonPage";

export default function Sectors() {
  return (
    <ComingSoonPage
      title="Sector Intelligence"
      subtitle="Trade the Rotation. Own the Cycle."
      description="AI-powered sector rotation analysis and relative strength rankings across all 11 GICS sectors. Know which sectors are leading, which are lagging, and where the next wave of institutional capital is flowing."
      icon={
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" stroke="#00d4aa" strokeWidth="3" fill="none"/>
          <path d="M24 6 L24 24 L38 14" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M24 24 L6 24" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
          <path d="M24 24 L30 40" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.3"/>
          <circle cx="24" cy="24" r="3" fill="#00d4aa"/>
        </svg>
      }
      teaserItems={[
        { label: "Sector Rotation Dashboard", desc: "Real-time relative strength rankings across all 11 GICS sectors — visualized as a rotation cycle map." },
        { label: "Leading vs. Lagging Sectors", desc: "AI-ranked sector momentum scores updated daily, showing which sectors are accelerating and which are fading." },
        { label: "Sector Signal Alerts", desc: "Get notified when the Primal Edge engine detects a significant shift in sector leadership or institutional rotation." },
        { label: "Top Stocks by Sector", desc: "The highest-scoring Elastic Slingshot setups filtered by sector — find the best setups within the strongest sectors." },
        { label: "Sector ETF Analysis", desc: "XLK, XLF, XLE, XLV and all major sector ETFs — technical structure, volume profile, and AI signal grade." },
        { label: "Macro Sector Correlation", desc: "How interest rates, inflation, and economic cycles historically impact each sector — and what the current macro regime implies." },
      ]}
    />
  );
}
