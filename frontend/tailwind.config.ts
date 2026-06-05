import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── F1 Color Palette ──
      colors: {
        f1: {
          red:    "#e10600",
          dark:   "#15151e",
          carbon: "#1a1a2e",
          silver: "#c0c0c0",
          gold:   "#ffd700",
        },
      },

      // ── Custom Animations ──
      animation: {
        "slide-up":       "slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in":       "slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in":        "fadeIn 0.4s ease-out both",
        "race-in":        "raceIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "stripe-flow":    "stripeFlow 3s linear infinite",
        "live-pulse":     "livePulse 2s ease-in-out infinite",
        "car-drive":      "carDrive 1.5s ease-in-out infinite",
        "count-up":       "countUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pop-in":         "popIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "tab-enter":      "tabPanelEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        // F1 logo & component animations
        "wheel-spin":     "wheelSpin 0.85s linear infinite",
        "speed-line":     "speedLine 1.8s ease-in infinite",
        "f1-glow-pulse":  "f1GlowPulse 2s ease-in-out infinite",
      },

      // ── Keyframes ──
      keyframes: {
        slideUp: {
          "0%":   { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        slideIn: {
          "0%":   { transform: "translateX(-24px)", opacity: "0" },
          "100%": { transform: "translateX(0)",     opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        raceIn: {
          "0%":   { transform: "translateX(-60px) scaleX(0.95)", opacity: "0" },
          "100%": { transform: "translateX(0) scaleX(1)",         opacity: "1" },
        },
        stripeFlow: {
          "0%":   { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1",   transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(0.9)" },
        },
        carDrive: {
          "0%":   { transform: "translateX(-10px)" },
          "50%":  { transform: "translateX(10px)" },
          "100%": { transform: "translateX(-10px)" },
        },
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%":   { opacity: "0", transform: "scale(0.96) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        tabPanelEnter: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      // ── Background Patterns ──
      backgroundImage: {
        "carbon": `
          repeating-linear-gradient(
            45deg,
            transparent, transparent 2px,
            rgba(255,255,255,0.015) 2px,
            rgba(255,255,255,0.015) 4px
          )
        `,
        "racing-gradient":
          "linear-gradient(90deg, #e10600, #ff6600, #e10600)",
        "hero-gradient":
          "linear-gradient(135deg, #1a1a2e 0%, #15151e 50%, #1a0a0a 100%)",
      },

      // ── F1 Font ──
      fontFamily: {
        f1: ["var(--font-titillium)", "Titillium Web", "sans-serif"],
      },

      // ── Box Shadows ──
      boxShadow: {
        "f1-card":  "0 4px 24px rgba(0,0,0,0.4)",
        "f1-glow":  "0 0 20px rgba(225,6,0,0.25)",
        "f1-hover": "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;