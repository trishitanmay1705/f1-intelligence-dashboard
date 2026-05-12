"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DriverStanding } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";

interface Props {
  standings: DriverStanding[];
}

// Custom tooltip that shows when you hover over a bar
// Much nicer than the default recharts tooltip
const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{
    payload: DriverStanding & { points_num: number };
    value: number;
  }>;
}) => {
  if (active && payload && payload.length) {
    const driver = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-bold">{driver.driver_name}</p>
        <p className="text-gray-400 text-sm">{driver.team}</p>
        <p className="text-white mt-1">
          <span className="font-bold text-lg">{driver.points}</span>
          <span className="text-gray-400 text-sm ml-1">points</span>
        </p>
        <p className="text-gray-400 text-sm">
          {driver.wins} {parseInt(driver.wins) === 1 ? "win" : "wins"}
        </p>
      </div>
    );
  }
  return null;
};

export default function DriverPointsChart({ standings }: Props) {

  // Transform data for recharts
  // recharts needs an array of plain objects
  // We reverse() so highest points is at the TOP
  const data = [...standings]
    .reverse()
    .map((driver) => ({
      ...driver,
      // recharts needs a number, not a string
      points_num: parseFloat(driver.points),
      // Short label for Y axis
      label: driver.driver_code,
    }));

  return (
    <div className="carbon-card p-4">
      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Points Breakdown</p>
      <h3 className="text-sm font-black text-white uppercase tracking-wide mb-4">
        Driver Championship
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"    // Horizontal bars
          margin={{ top: 0, right: 60, left: 40, bottom: 0 }}
        >
          {/* X axis = points (numbers) */}
          <XAxis
            type="number"
            dataKey="points_num"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={false}
          />

          {/* Y axis = driver codes */}
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />

          <Bar
            dataKey="points_num"
            radius={[0, 4, 4, 0]}  // Rounded right corners
            maxBarSize={24}
          >
            {/* Color each bar by team color */}
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getTeamColor(entry.team)}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}