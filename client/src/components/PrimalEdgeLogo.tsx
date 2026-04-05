/**
 * PrimalEdgeLogo — Inline logo component
 * Design: Elastic Signal — dark charcoal, teal #00d4aa accent
 * Uses the P-icon image alongside crisp HTML text so the wordmark
 * and byline are always fully legible at any size.
 */

interface PrimalEdgeLogoProps {
  /** Size variant: "sm" for navbar, "md" for footer, "lg" for hero */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PrimalEdgeLogo({ size = "sm", className = "" }: PrimalEdgeLogoProps) {
  const iconSize = size === "lg" ? "h-16 w-16" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  const titleSize = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base";
  const bylineSize = size === "lg" ? "text-[11px]" : size === "md" ? "text-[9px]" : "text-[8px]";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* P-icon image — only the icon portion */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512345692/KvRThKXVvSJuMZkgYyw4Zk/primal-edge-logo-cropped_d23b007c.webp"
        alt="Primal Edge icon"
        className={`${iconSize} object-contain flex-shrink-0`}
        style={{ objectPosition: "left center" }}
      />
      {/* Text lockup */}
      <div className="flex flex-col leading-none">
        <span
          className={`${titleSize} font-bold text-white tracking-wider`}
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.08em" }}
        >
          PRIMAL EDGE
        </span>
        <span
          className={`${bylineSize} font-medium tracking-widest mt-0.5`}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "0.12em",
            color: "#00d4aa",
          }}
        >
          ADAPTIVE INTELLIGENCE. DECISIVE SIGNALS.
        </span>
      </div>
    </div>
  );
}
