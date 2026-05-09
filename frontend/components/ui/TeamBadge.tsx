import { getTeamColor } from "@/lib/teamColors";

// Official F1 3-letter team codes used in broadcasts
const TEAM_CODES: Record<string, string> = {
  "Red Bull":       "RBR",
  "Ferrari":        "FER",
  "Mercedes":       "MER",
  "McLaren":        "MCL",
  "Aston Martin":   "AMR",
  "Alpine":         "ALP",
  "Williams":       "WIL",
  "RB":             "VCR",
  "Kick Sauber":    "SAU",
  "Haas F1 Team":   "HAA",
  "Alpine F1 Team": "ALP",
  "RB F1 Team":     "VCR",
};

interface TeamBadgeProps {
  team: string;
  // "full"    → colored bar + code + name  (tables)
  // "compact" → colored bar + code only    (small spaces)
  // "dot"     → colored circle + name      (charts)
  // "pill"    → colored pill with code     (standings cards)
  variant?: "full" | "compact" | "dot" | "pill";
}

export default function TeamBadge({
  team,
  variant = "full",
}: TeamBadgeProps) {
  const color = getTeamColor(team);
  const code  = TEAM_CODES[team] ?? team.slice(0, 3).toUpperCase();

  if (variant === "pill") {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black tracking-wider"
        style={{
          backgroundColor: color + "22",
          color: color,
          border: `1px solid ${color}44`,
        }}
      >
        {code}
      </span>
    );
  }

  if (variant === "dot") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-gray-950"
          style={{ backgroundColor: color }}
        />
        <span className="text-gray-300 text-sm">{team}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5">
        {/* Colored left bar — like F1 TV broadcast */}
        <div
          className="w-0.5 h-4 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className="font-black text-xs tracking-wider"
          style={{ color }}
        >
          {code}
        </span>
      </div>
    );
  }

  // Default: full variant
  return (
    <div className="flex items-center gap-2">
      {/* Colored left bar */}
      <div
        className="w-1 h-5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {/* 3-letter code */}
      <span
        className="font-black text-xs tracking-wider shrink-0"
        style={{ color }}
      >
        {code}
      </span>
      {/* Full name */}
      <span className="text-gray-400 text-sm hidden sm:block truncate">
        {team}
      </span>
    </div>
  );
}