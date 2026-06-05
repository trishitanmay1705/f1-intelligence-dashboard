"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import { DriverSeasonSummary } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";

interface Props {
  seasons: DriverSeasonSummary[];
}

type DataPoint = { season: string; points: number; team: string; position: string; wins: number };

// ── Custom tooltip ────────────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = getTeamColor(d.team);
  const isChamp = d.position === "1";

  return (
    <div
      className="rounded-xl p-4 shadow-2xl"
      style={{
        background: "rgba(15,15,22,0.97)",
        border: `1px solid ${color}55`,
        backdropFilter: "blur(8px)",
        minWidth: 192,
      }}
    >
      <div
        className="flex items-center gap-2.5 mb-3 pb-2.5"
        style={{ borderBottom: `1px solid ${color}28` }}
      >
        <div
          className="w-1.5 h-8 rounded-full shrink-0"
          style={{ background: `linear-gradient(to bottom, ${color}, ${color}44)` }}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-xl f1-number">{label}</span>
            {isChamp && (
              <span className="text-yellow-400 text-sm font-black tracking-wide">★ WDC</span>
            )}
          </div>
          <span className="text-xs font-bold" style={{ color }}>{d.team}</span>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center gap-8">
          <span className="text-gray-500">Points</span>
          <span className="text-white font-black f1-number text-base">{d.points}</span>
        </div>
        <div className="flex justify-between items-center gap-8">
          <span className="text-gray-500">Position</span>
          <span
            className="font-black f1-number"
            style={{
              color: d.position === "1" ? "#ffd700"
                   : d.position === "2" ? "#c0c0c0"
                   : d.position === "3" ? "#cd7f32"
                   : "white",
            }}
          >
            P{d.position}
          </span>
        </div>
        <div className="flex justify-between items-center gap-8">
          <span className="text-gray-500">Wins</span>
          <span className="text-white font-bold">{d.wins}</span>
        </div>
      </div>
    </div>
  );
}

// ── Championship star rendered above the bar ─────────────────────────────────
function ChampLabel({ x = 0, y = 0, width = 0, index = 0, data }: {
  x?: number; y?: number; width?: number; index?: number; data: DataPoint[];
}) {
  if (data[index]?.position !== "1") return null;
  return (
    <text
      x={x + width / 2}
      y={y - 7}
      textAnchor="middle"
      fill="#ffd700"
      fontSize={13}
      fontWeight="900"
      style={{ filter: "drop-shadow(0 0 5px rgba(255,215,0,0.65))" }}
    >
      ★
    </text>
  );
}

// ── Gradient ID helper ─────────────────────────────────────────────────────────────────
const gid = (team: string) => `cpg-${team.replace(/[^a-zA-Z0-9]/g, "")}`;

// ── Main component ─────────────────────────────────────────────────────────────────
export default function CareerPointsChart({ seasons }: Props) {
  const data = useMemo(
    () => seasons.map((s) => ({ season: s.season, points: s.points, team: s.team, position: s.position, wins: s.wins })),
    [seasons]
  );

  const avgPoints = useMemo(
    () => Math.round(data.reduce((s, d) => s + d.points, 0) / (data.length || 1)),
    [data]
  );

  const maxPoints = useMemo(() => Math.max(...data.map((d) => d.points)), [data]);

  const uniqueTeams = useMemo(() => [...new Set(data.map((d) => d.team))], [data]);

  const champCount = data.filter((d) => d.position === "1").length;

  return (
    <div className="carbon-card p-6 space-y-5">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Career Overview</p>
          <h3 className="text-lg font-black uppercase tracking-wider text-white">Points by Season</h3>
          <p className="text-xs text-gray-500 mt-1">
            Colour-coded by constructor
            {champCount > 0 && " · ★ marks championship season"}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest">Season avg</p>
            <p className="text-white font-black text-2xl f1-number mt-0.5">{avgPoints}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest">Best season</p>
            <p className="text-f1-red font-black text-2xl f1-number mt-0.5">{maxPoints}</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 28, right: 12, left: -8, bottom: 6 }} barCategoryGap="22%">

          {/* Per-team gradient defs */}
          <defs>
            {uniqueTeams.map((team) => {
              const color = getTeamColor(team);
              return (
                <linearGradient key={team} id={gid(team)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.93} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.26} />
                </linearGradient>
              );
            })}
          </defs>

          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />

          {/* Average reference line */}
          <ReferenceLine
            y={avgPoints}
            stroke="rgba(255,255,255,0.16)"
            strokeDasharray="6 4"
            label={{
              value: `avg · ${avgPoints} pts`,
              position: "insideTopRight",
              fill: "rgba(255,255,255,0.25)",
              fontSize: 10,
              fontFamily: "var(--font-titillium)",
              fontWeight: 600,
            }}
          />

          <XAxis
            dataKey="season"
            tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "var(--font-titillium)", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={data.length > 10 ? -40 : 0}
            textAnchor={data.length > 10 ? "end" : "middle"}
            height={data.length > 10 ? 52 : 28}
          />

          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "var(--font-titillium)" }}
            axisLine={false}
            tickLine={false}
            width={42}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }}
          />

          <Bar
            dataKey="points"
            radius={[5, 5, 0, 0]}
            isAnimationActive
            animationBegin={200}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={`url(#${gid(entry.team)})`}
                stroke={getTeamColor(entry.team) + "55"}
                strokeWidth={1}
              />
            ))}
            {/* Championship star labels */}
            <LabelList
              content={(props) => (
                <ChampLabel
                  x={(props as { x?: number }).x}
                  y={(props as { y?: number }).y}
                  width={(props as { width?: number }).width}
                  index={(props as { index?: number }).index}
                  data={data}
                />
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Teams legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2.5 pt-4 border-t border-white/5">
        {uniqueTeams.map((team) => {
          const color = getTeamColor(team);
          const teamSeasons = data.filter((d) => d.team === team);
          const first = teamSeasons[0]?.season;
          const last  = teamSeasons[teamSeasons.length - 1]?.season;
          const range = first === last ? first : `${first}–${last}`;
          const pts   = teamSeasons.reduce((s, d) => s + d.points, 0);
          return (
            <div key={team} className="flex items-center gap-2 group">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}66)`,
                  boxShadow: `0 0 6px ${color}44`,
                }}
              />
              <span className="text-gray-300 text-xs font-semibold">{team}</span>
              <span className="text-gray-600 text-[10px]">{range}</span>
              <span className="text-gray-600 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                · {pts} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}