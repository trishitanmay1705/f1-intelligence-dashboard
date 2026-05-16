interface CareerStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  accent?: "red" | "gold" | "blue" | "green" | "white";
}

const ACCENT_CLASSES: Record<string, string> = {
  red: "text-f1-red",
  gold: "text-yellow-400",
  blue: "text-blue-400",
  green: "text-green-400",
  white: "text-white",
};

export default function CareerStatCard({
  label,
  value,
  icon,
  accent = "white",
}: CareerStatCardProps) {
  return (
    <div className="carbon-card p-4 card-hover animate-pop-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">
          {label}
        </span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`f1-number text-3xl font-black ${ACCENT_CLASSES[accent]}`}>
        {value}
      </div>
    </div>
  );
}