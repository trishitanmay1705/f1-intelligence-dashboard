const SIZE_CLASS: Record<string, string> = {
  xs: "text-base",
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

interface F1LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Race-in entrance animation from the left */
  animated?: boolean;
  /** Pulsing red glow behind the logo */
  glow?: boolean;
  /** Speed lines appear on the left on hover, logo scales slightly */
  hover?: boolean;
}

export default function F1Logo({
  size = "md",
  animated = false,
  glow = false,
  hover = false,
}: F1LogoProps) {
  return (
    <div
      className={[
        "inline-flex items-center select-none relative",
        animated ? "animate-race-in" : "",
        hover ? "group cursor-default" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="F1"
    >
      {/* Pulsing glow layer */}
      {glow && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 animate-f1-glow-pulse rounded-sm"
          style={{ filter: "blur(14px)", background: "#e10600" }}
        />
      )}

      {/* Speed lines on hover */}
      {hover && (
        <div
          aria-hidden="true"
          className="absolute right-full top-1/2 -translate-y-1/2 pr-2 flex flex-col gap-[3px] items-end opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        >
          {([14, 8, 12, 6, 10] as const).map((len, i) => (
            <div
              key={i}
              className="h-px bg-f1-red rounded-full"
              style={{ width: len, opacity: 0.25 + i * 0.15 }}
            />
          ))}
        </div>
      )}

      <span
        className={[
          SIZE_CLASS[size],
          "font-black italic tracking-tighter leading-none text-f1-red",
          hover
            ? "transition-transform duration-200 group-hover:scale-105"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        F1
      </span>
    </div>
  );
}