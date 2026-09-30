/**
 * Tributary mark — vectorized from the brand reference (aspect 2:3).
 * One flow rising from the stem, forking into four nested channels.
 * Monochrome; `size` sets the HEIGHT, width = size * 2/3.
 */
const PATHS = [
  "M0.5,0.0 L0.5,32.2 Q0.5,34.4 2.1,35.8 L51.0,78.6 Q52.6,80.1 54.2,81.6 L59.1,86.5 Q60.0,87.3 60.4,88.4 L60.8,89.4 Q61.3,90.5 61.8,91.6 L64.1,97.1 Q65.0,99.1 65.2,101.3 L65.7,107.3 Q65.9,109.5 67.5,111.0 L93.8,134.8 L93.4,99.0 Q93.4,96.8 92.7,94.7 L89.9,85.4 Q89.2,83.3 88.0,81.4 L82.7,73.3 Q81.5,71.5 79.8,70.0 L39.6,33.6 Q38.0,32.1 36.3,30.7 L0.5,0.0 Z",
  "M199.5,0.0 L120.6,70.5 Q119.0,71.9 117.8,73.8 L112.4,82.3 Q111.2,84.2 110.6,86.3 L107.7,96.1 Q107.1,98.2 107.1,100.4 L106.6,135.3 L133.4,111.0 Q135.0,109.5 135.2,107.3 L135.7,100.8 Q135.9,98.6 136.8,96.6 L138.3,93.0 Q139.1,91.0 140.4,89.1 L142.5,86.0 Q143.7,84.2 145.4,82.7 L198.4,35.8 Q200.0,34.4 200.0,32.2 L199.5,0.0 Z",
  "M0.5,59.3 L0.5,94.6 Q0.5,96.8 2.1,98.3 L73.0,165.0 Q74.6,166.5 76.0,168.2 L79.6,172.5 Q81.0,174.2 82.0,176.2 L84.5,180.9 Q85.6,182.8 86.2,184.9 L86.8,187.0 Q87.4,189.1 87.4,191.3 L87.4,299.5 L113.0,300.0 L113.0,285.0 Q113.0,282.8 113.0,280.6 L113.0,191.8 Q113.0,189.6 113.7,187.5 L114.7,184.5 Q115.3,182.4 116.6,180.5 L123.3,170.6 Q124.5,168.8 126.1,167.3 L198.4,98.8 Q200.0,97.3 200.0,95.1 L200.0,59.3 L167.8,87.7 Q166.1,89.1 164.5,90.6 L154.1,99.5 Q152.4,100.9 152.4,103.1 L152.4,105.5 Q152.4,107.7 150.8,109.2 L111.0,146.0 Q109.4,147.5 108.4,149.5 L104.9,156.8 Q103.9,158.8 103.5,161.0 L100.2,178.7 L97.8,163.3 Q97.5,161.1 96.7,159.0 L95.5,155.5 Q94.7,153.4 93.6,151.5 L90.9,147.1 Q89.7,145.2 88.1,143.8 L53.9,112.0 Q52.6,110.9 51.2,109.9 L50.0,109.1 Q48.5,108.1 48.5,106.4 L48.5,102.5 Q48.5,100.9 47.4,99.8 L46.4,98.8 Q45.3,97.7 44.1,96.7 L0.5,59.3 Z",
];

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
    <svg
      width={(size * 2) / 3}
      height={size}
      viewBox="0 0 200 300"
      role="img"
      aria-label={title}
      style={{ display: "block" }}
    >
      <g fill={color}>
        {PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

export function TributaryLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="lockup">
      <div className="lockup-mark">
        <TributaryMark size={compact ? 30 : 40} />
      </div>
      <div className="lockup-text">
        <span className="lockup-name">TRIBUTARY</span>
        {!compact && <span className="lockup-sub">PROGRAMMABLE USDC FLOWS</span>}
      </div>
    </div>
  );
}
