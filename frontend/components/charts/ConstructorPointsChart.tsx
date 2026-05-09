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
import { ConstructorStanding } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";

interface Props {
  standings: ConstructorStanding[];
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{
    payload: ConstructorStanding & { points_num: number };
  }>;
}) => {
  if (active && payload && payload.length) {
    const team = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getTeamColor(team.team) }}
          />
          <p className="text-white font-bold">{team.team}</p>
        </div>
        <p className="text-gray-400 text-sm">{team.nationality}</p>
        <p className="text-white mt-1">
          <span className="font-bold text-lg">{team.points}</span>
          <span className="text-gray-400 text-sm ml-1">points</span>
        </p>
        <p className="text-gray-400 text-sm">
          {team.wins} {parseInt(team.wins) === 1 ? "win" : "wins"}
        </p>
      </div>
    );
  }
  return null;
};

export default function ConstructorPointsChart({ standings }: Props) {

  const data = standings.map((team) => ({
    ...team,
    points_num: parseFloat(team.points),
    // Shorten long team names for X axis
    label: team.team
      .replace("F1 Team", "")
      .replace("Racing", "")
      .trim(),
  }));

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h3 className="text-lg font-bold text-white mb-6">
        Constructor Championship Points
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
        >
          <XAxis
            dataKey="label"
            tick={{
              fill: "#9ca3af",
              fontSize: 11,
            }}
            axisLine={{ stroke: "#374151" }}
            tickLine={false}
            angle={-35}           // Tilt labels so they don't overlap
            textAnchor="end"
            interval={0}          // Show ALL labels
          />

          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />

          <Bar
            dataKey="points_num"
            radius={[4, 4, 0, 0]}   // Rounded top corners
            maxBarSize={60}
          >
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