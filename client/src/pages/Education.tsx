import ComingSoonPage from "./ComingSoonPage";

export default function Education() {
  return (
    <ComingSoonPage
      title="Primal Edge Education"
      subtitle="The Knowledge Behind the Edge."
      description="Structured trading education from the ground up — covering market mechanics, risk management, trade psychology, and the quantitative frameworks that power the Primal Edge signal engine."
      icon={
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 6L44 16l-20 10L4 16 24 6z" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22v10c0 4 5.4 8 12 8s12-4 12-8V22" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="44" y1="16" x2="44" y2="28" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      }
      teaserItems={[
        { label: "Market Mechanics", desc: "How price discovery, liquidity, and order flow actually work — the foundation every serious trader needs." },
        { label: "Risk Management", desc: "Position sizing, stop placement, and portfolio heat — the math that separates professionals from gamblers." },
        { label: "Trade Psychology", desc: "Cognitive biases, emotional discipline, and the mental frameworks used by consistently profitable traders." },
        { label: "Quantitative Thinking", desc: "How to think in probabilities, expected value, and edge — the mindset behind algorithmic trading." },
        { label: "Options Fundamentals", desc: "From calls and puts to Greeks and volatility — a structured curriculum for options traders at every level." },
        { label: "Strategy Development", desc: "How to build, test, and validate a trading strategy with statistical rigor before risking real capital." },
      ]}
    />
  );
}
