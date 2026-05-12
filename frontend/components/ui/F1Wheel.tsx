// F1Wheel — realistic 5-spoke F1 wheel / tire SVG
// Spins via CSS wheelSpin keyframe defined in globals.css

interface F1WheelProps {
  /** Outer diameter in px */
  size?: number;
  /** Enable spinning animation */
  spinning?: boolean;
  /** Rim color (defaults to brushed-silver) */
  rimColor?: string;
  className?: string;
}

export default function F1Wheel({
  size = 80,
  spinning = true,
  rimColor = "#9ca3af",
  className = "",
}: F1WheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2;

  // Radii
  const tireOuterR  = r - 1;
  const tireWidth   = r * 0.22;          // thick rubber wall
  const rimR        = tireOuterR - tireWidth;
  const spokeLenR   = rimR * 0.88;       // spokes reach close to rim edge
  const hubR        = rimR * 0.18;
  const hubInnerR   = hubR * 0.5;
  const spokeWidth  = size * 0.055;

  // 5 spokes at 72° apart, first spoke pointing up
  const spokes = [0, 72, 144, 216, 288].map((deg) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      x1: cx + hubR        * Math.cos(rad),
      y1: cy + hubR        * Math.sin(rad),
      x2: cx + spokeLenR   * Math.cos(rad),
      y2: cy + spokeLenR   * Math.sin(rad),
    };
  });

  return (
    <div
      className={`inline-block shrink-0 ${className}`}
      style={{
        width:  size,
        height: size,
        animation: spinning ? "wheelSpin 0.85s linear infinite" : undefined,
      }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Outer tire (black rubber) ── */}
        <circle
          cx={cx} cy={cy} r={tireOuterR}
          fill="#111"
          stroke="#222"
          strokeWidth={tireWidth}
        />

        {/* ── Tire tread dashes (subtle) ── */}
        <circle
          cx={cx} cy={cy}
          r={tireOuterR - tireWidth * 0.35}
          fill="none"
          stroke="#1c1c1c"
          strokeWidth={1}
          strokeDasharray="5 7"
        />

        {/* ── Rim face ── */}
        <circle
          cx={cx} cy={cy} r={rimR}
          fill="#1f2937"
          stroke={rimColor}
          strokeWidth={0.8}
          fillOpacity="0.9"
        />

        {/* ── 5 Spokes ── */}
        {spokes.map((s, i) => (
          <line
            key={i}
            x1={s.x1} y1={s.y1}
            x2={s.x2} y2={s.y2}
            stroke={rimColor}
            strokeWidth={spokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* ── Between-spoke cutouts (darker triangle segments) ── */}
        {spokes.map((s, i) => {
          const next = spokes[(i + 1) % 5];
          // Midpoint angle for the cutout arc — just darken the area between spokes
          return (
            <line
              key={`c-${i}`}
              x1={(s.x2 + next.x2) / 2}
              y1={(s.y2 + next.y2) / 2}
              x2={cx}
              y2={cy}
              stroke="#111"
              strokeWidth={spokeWidth * 0.6}
              strokeOpacity={0.4}
            />
          );
        })}

        {/* ── Hub cap ── */}
        <circle cx={cx} cy={cy} r={hubR}       fill={rimColor} />
        <circle cx={cx} cy={cy} r={hubInnerR}  fill="#111" />

        {/* ── Hub center dot (brake disc visible through center) ── */}
        <circle cx={cx} cy={cy} r={hubInnerR * 0.45} fill="#e10600" />
      </svg>
    </div>
  );
}
