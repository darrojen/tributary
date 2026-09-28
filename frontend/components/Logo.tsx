/**
 * Tributary mark — branching flow logo.
 * One flow entering from below, forking into four bounded channels:
 * a river branching into tributaries. Monochrome, scales to any color.
 */
export function TributaryMark({
  size = 40,
  color = "currentColor",
  title = "Tributary",
}: {
  size?: number;
  color?: string;
  title?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title} style={{ display: "block" }}>
      <g fill={color}>
        {/* stem */}
        <polygon points="85,128 115,128 115,188 85,188" />
        {/* left outer band */}
        <polygon points="91.3,144.7 100.5,135.5 46,81 46,99.4" />
        {/* left inner band */}
        <polygon points="105.5,130.5 114.7,121.3 88,94.6 88,113" />
        {/* right inner band */}
        <polygon points="94.5,130.5 85.3,121.3 112,94.6 112,113" />
        {/* right outer band */}
        <polygon points="108.7,144.7 99.5,135.5 154,81 154,99.4" />
      </g>
    </svg>
  );
}

export function TributaryLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="lockup">
      <div className="lockup-mark">
        <TributaryMark size={compact ? 30 : 38} />
      </div>
      <div className="lockup-text">
        <span className="lockup-name">TRIBUTARY</span>
        {!compact && <span className="lockup-sub">PROGRAMMABLE USDC FLOWS</span>}
      </div>
    </div>
  );
}
