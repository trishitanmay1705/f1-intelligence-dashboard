// SpeedLines — animated horizontal speed lines that shoot right-to-left
// Use as an absolute-positioned overlay inside a `relative overflow-hidden` container.
// Values are hardcoded (no Math.random) to avoid SSR hydration mismatches.

interface SpeedLinesProps {
  className?: string;
}

// [top %, width px, opacity, delay s, duration s]
const LINES: [number, number, number, number, number][] = [
  [10, 55, 0.13, 0.00, 1.8],
  [22, 85, 0.18, 0.22, 2.1],
  [33, 40, 0.10, 0.45, 1.6],
  [44, 70, 0.15, 0.10, 2.0],
  [56, 50, 0.12, 0.33, 1.9],
  [67, 95, 0.20, 0.18, 2.3],
  [78, 35, 0.09, 0.55, 1.7],
  [88, 60, 0.14, 0.08, 2.2],
];

export default function SpeedLines({ className = "" }: SpeedLinesProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {LINES.map(([top, width, opacity, delay, duration], i) => (
        <div
          key={i}
          className="absolute h-px bg-f1-red rounded-full"
          style={{
            top:      `${top}%`,
            right:    0,
            width:    width,
            opacity:  opacity,
            animation: `speedLine ${duration}s ease-in ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
