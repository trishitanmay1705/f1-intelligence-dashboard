interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;        // ? means optional
  color?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color = "red"
}: StatCardProps) {

  const colorMap: Record<string, string> = {
    red:    "border-red-500 text-red-500",
    blue:   "border-blue-500 text-blue-500",
    green:  "border-green-500 text-green-500",
    yellow: "border-yellow-500 text-yellow-500",
  };

  return (
    <div className={`
      bg-gray-900 border-l-4 ${colorMap[color]}
      rounded-lg p-4 flex flex-col gap-1
    `}>
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className={`text-2xl font-bold ${colorMap[color].split(' ')[1]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}