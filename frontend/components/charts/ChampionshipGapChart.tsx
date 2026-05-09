"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { DriverStanding } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";

interface Props {
  standings: DriverStanding[];
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{
    payload: {
      driver_name: string;
      team: string;
      points: string;
      gap: number;
      driver_code: string;
    };
  }>;
}) => {
  if (active && payload && payload.length) {
    const driver = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-bold">{driver.driver_name}</p>
        <p className="text-gray-400 text-sm">{driver.team}</p>
        <p className="text-white mt-1">
          <span className="font-bold">{driver.points}</span>
          <span className="text-gray-400 text-sm ml-1">pts</span>
        </p>
        {driver.gap === 0 ? (
          <p className="text-yellow-400 text-sm font-bold mt-1">
            CHAMPIONSHIP LEADER
          </p>
        ) : (
          <p className="text-red-400 text-sm mt-1">
            {driver.gap} pts behind leader
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ChampionshipGapChart({ standings }: Props) {

  // Leader's points = maximum points
  const leaderPoints = parseFloat(standings[0]?.points || "0");

  const data = standings.slice(0, 15).map((driver) => ({
    ...driver,
    label: driver.driver_code,
    // Gap = how far behind the leader (negative number)
    // Leader has gap of 0
    gap: parseFloat(driver.points) - leaderPoints,
  }));

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">
          Championship Gap to Leader
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Points deficit from {standings[0]?.driver_name} ({standings[0]?.points} pts)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={false}
            // Format: show "0" for 0, "-50" for -50
            tickFormatter={(value) => value === 0 ? "Leader" : `${value}`}
          />

          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />

          {/* Vertical line at 0 = leader's points */}
          <ReferenceLine
            x={0}
            stroke="#e10600"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />

          <Bar
            dataKey="gap"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                // Leader = yellow, everyone else = team color at lower opacity
                fill={index === 0
                  ? "#eab308"
                  : getTeamColor(entry.team)
                }
                fillOpacity={index === 0 ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}