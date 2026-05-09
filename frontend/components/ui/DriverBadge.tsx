import { getTeamColor } from "@/lib/teamColors";

interface DriverBadgeProps {
  driverCode: string;
  driverName: string;
  driverNumber?: string;
  team: string;
  // "full"    → number + code + surname
  // "compact" → code only (colored)
  // "number"  → just the number badge
  variant?: "full" | "compact" | "number";
  isLeader?: boolean;
}

export default function DriverBadge({
  driverCode,
  driverName,
  driverNumber = "",
  team,
  variant = "full",
  isLeader = false,
}: DriverBadgeProps) {
  const color = getTeamColor(team);
  // Get just the last name
  const surname = driverName.split(" ").pop() ?? driverName;

  if (variant === "number") {
    return (
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
        style={{
          backgroundColor: color + "22",
          color: color,
          border: `1px solid ${color}44`,
        }}
      >
        {driverNumber}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className="font-black text-sm tracking-wide"
        style={{ color: isLeader ? color : "white" }}
      >
        {driverCode}
      </span>
    );
  }

  // Default: full
  return (
    <div className="flex items-center gap-2.5">
      {/* Driver number badge */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-xs font-black shrink-0"
        style={{
          backgroundColor: color + "18",
          color: color,
          border: `1px solid ${color}33`,
        }}
      >
        {driverNumber}
      </div>

      {/* Driver text */}
      <div>
        <span
          className="font-black text-sm tracking-wide block"
          style={{ color: isLeader ? color : "white" }}
        >
          {driverCode}
        </span>
        <span className="text-gray-500 text-xs hidden sm:block">
          {surname}
        </span>
      </div>
    </div>
  );
}