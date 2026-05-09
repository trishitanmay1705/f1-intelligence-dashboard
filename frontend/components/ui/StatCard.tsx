// components/ui/StatCard.tsx

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: "red" | "blue" | "green" | "yellow";
  subtitle?: string;
}

// Color configs for each variant
const colorConfig = {
  red: {
    border:    "border-f1-red",
    glow:      "shadow-f1-glow",
    text:      "text-f1-red",
    bg:        "bg-f1-red/5",
    indicator: "bg-f1-red",
  },
  blue: {
    border:    "border-blue-500",
    glow:      "shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    text:      "text-blue-400",
    bg:        "bg-blue-500/5",
    indicator: "bg-blue-500",
  },
  green: {
    border:    "border-green-500",
    glow:      "shadow-[0_0_20px_rgba(34,197,94,0.2)]",
    text:      "text-green-400",
    bg:        "bg-green-500/5",
    indicator: "bg-green-500",
  },
  yellow: {
    border:    "border-yellow-500",
    glow:      "shadow-[0_0_20px_rgba(234,179,8,0.2)]",
    text:      "text-yellow-400",
    bg:        "bg-yellow-500/5",
    indicator: "bg-yellow-500",
  },
};

export default function StatCard({
  label,
  value,
  icon,
  color = "red",
  subtitle,
}: StatCardProps) {
  const c = colorConfig[color];

  return (
    <div
      className={`
        relative overflow-hidden
        carbon-card card-hover
        border-l-4 ${c.border}
        ${c.bg} ${c.glow}
        p-5 animate-slide-up
      `}
    >
      {/* Top label */}
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
        {label}
      </p>

      {/* Value row */}
      <div className="flex items-end gap-3">
        {icon && (
          <span className="text-2xl leading-none mb-0.5">{icon}</span>
        )}
        <span className={`f1-number text-3xl font-black ${c.text} animate-count-up`}>
          {value}
        </span>
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
      )}

      {/* Decorative corner accent */}
      <div
        className={`
          absolute top-0 right-0
          w-16 h-16 opacity-5
          ${c.indicator}
          rounded-bl-full
        `}
      />
    </div>
  );
}