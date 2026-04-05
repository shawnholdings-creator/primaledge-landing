import ComingSoonPage from "./ComingSoonPage";

export default function Charts() {
  return (
    <ComingSoonPage
      title="Charts & Indicators"
      subtitle="Read the Market. See What Others Miss."
      description="A comprehensive library of chart pattern guides, technical indicator breakdowns, and setup tutorials — built specifically for traders who want to understand the signals behind the signals."
      icon={
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M6 36L18 22l8 8 16-20" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M34 16h8v8" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="6" y1="42" x2="42" y2="42" stroke="#00d4aa" strokeWidth="2" strokeOpacity="0.3"/>
          <line x1="6" y1="6" x2="6" y2="42" stroke="#00d4aa" strokeWidth="2" strokeOpacity="0.3"/>
        </svg>
      }
      teaserItems={[
        { label: "Candlestick Patterns", desc: "Master the 20 most powerful candlestick formations with real-market examples and probability data." },
        { label: "Momentum Indicators", desc: "Deep dives into RSI, MACD, Stochastics, and how adaptive systems use them differently than retail traders." },
        { label: "Trend Structure", desc: "How to identify higher highs, higher lows, and trend continuation setups across multiple timeframes." },
        { label: "Volume Analysis", desc: "Why volume is the only leading indicator — and how to read it like institutional traders do." },
        { label: "Support & Resistance", desc: "Dynamic vs. static levels, how to draw them correctly, and why most traders get them wrong." },
        { label: "Multi-Timeframe Analysis", desc: "Aligning signals across 4H, daily, and weekly charts to find the highest-conviction setups." },
      ]}
    />
  );
}
