interface F1LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function F1Logo({ size = "md" }: F1LogoProps) {
  const sizeMap = {
    sm: { text: "text-xl",  stripe: { width: "7px",  height: "18px" } },
    md: { text: "text-3xl", stripe: { width: "9px",  height: "24px" } },
    lg: { text: "text-5xl", stripe: { width: "13px", height: "34px" } },
  };

  const s = sizeMap[size];

  return (
    <div
      className={`
        inline-flex items-center select-none
        font-black tracking-tighter ${s.text}
      `}
      aria-label="F1"
    >
      {/* ── F (red) ── */}
      <span className="text-f1-red leading-none">F</span>

      {/* ── Speed Stripe (the iconic arrow in the logo) ── */}
      <div
        className="relative mx-0.5 shrink-0"
        style={s.stripe}
      >
        <div
          className="absolute inset-0 bg-f1-red"
          style={{
            // Creates the parallelogram/arrow shape
            clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)",
          }}
        />
      </div>

      {/* ── 1 (white) ── */}
      <span className="text-white leading-none">1</span>
    </div>
  );
}