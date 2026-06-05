"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { f1Api, LapData, LapDataDriver } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ── Constants ──────────────────────────────────────────────────

const SPEEDS = [1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];
const SPEED_MS: Record<Speed, number> = { 1: 180, 2: 90, 4: 40 };

// ── Custom tooltip ─────────────────────────────────────────────

function ReplayTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload]
    .filter((p) => p.value != null)
    .sort((a, b) => a.value - b.value);

  return (
    <div className="bg-gray-950/95 border border-white/10 rounded-lg px-3 py-2.5 text-xs shadow-2xl backdrop-blur-sm max-h-72 overflow-y-auto pointer-events-none">
      <p className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-[9px]">
        Lap {label}
      </p>
      {sorted.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-[2px]">
          <span className="text-gray-600 font-mono w-5 text-right shrink-0">
            P{entry.value}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: entry.stroke }}
          />
          <span
            style={{ color: entry.stroke }}
            className="font-bold tracking-wide"
          >
            {entry.dataKey}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Live standings sidebar entry ───────────────────────────────

function DriverRow({
  driver,
  position,
  isHighlighted,
  isDimmed,
  onEnter,
  onLeave,
}: {
  driver: LapDataDriver;
  position: number;
  isHighlighted: boolean;
  isDimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const color = getTeamColor(driver.team);
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex items-center gap-1.5 px-1.5 py-[3px] rounded cursor-pointer hover:bg-white/5 transition-all duration-150 group"
      style={{ opacity: isDimmed ? 0.3 : 1 }}
    >
      <span className="text-gray-700 text-[10px] font-mono w-4 text-right shrink-0 group-hover:text-gray-400 transition-colors">
        {position}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-150"
        style={{
          background: color,
          transform: isHighlighted ? "scale(1.4)" : "scale(1)",
        }}
      />
      <span
        className="text-[11px] font-bold tracking-wide"
        style={{ color }}
      >
        {driver.code}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

interface Props {
  season: string;
  round: string;
}

export default function RaceReplayChart({ season, round }: Props) {
  const [lapData, setLapData] = useState<LapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentLap, setCurrentLap] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentLap(0);
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    f1Api
      .getLapData(season, round)
      .then((data) => {
        setLapData(data);
        setCurrentLap(data.total_laps); // show full race by default
      })
      .catch(() =>
        setError("Lap-by-lap data is not available for this race.")
      )
      .finally(() => setLoading(false));
  }, [season, round]);

  // ── Playback interval ──────────────────────────────────────

  useEffect(() => {
    if (!isPlaying || !lapData) return;

    intervalRef.current = setInterval(() => {
      setCurrentLap((prev) => {
        if (prev >= lapData.total_laps) return prev;
        return prev + 1;
      });
    }, SPEED_MS[speed]);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, lapData]);

  // ── Auto-stop at end ───────────────────────────────────────

  useEffect(() => {
    if (lapData && currentLap >= lapData.total_laps && isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    }
  }, [currentLap, lapData, isPlaying]);

  // ── Controls ───────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    // Restart from beginning if at end
    if (lapData && currentLap >= lapData.total_laps) {
      setCurrentLap(0);
    }
    setIsPlaying(true);
  }, [isPlaying, lapData, currentLap, stopPlayback]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      stopPlayback();
      setCurrentLap(parseInt(e.target.value));
    },
    [stopPlayback]
  );

  // ── Derived data ───────────────────────────────────────────

  // Recharts data: [{lap, VER: 1, HAM: 3, ...}, ...]
  const chartData = useMemo(() => {
    if (!lapData) return [];
    return lapData.laps
      .filter((l) => l.lap <= currentLap)
      .map((l) => ({ lap: l.lap, ...l.positions }));
  }, [lapData, currentLap]);

  // Live standings sorted by current position
  const liveStandings = useMemo(() => {
    if (!lapData) return [] as LapDataDriver[];
    if (currentLap === 0) return lapData.drivers;
    const snap =
      lapData.laps.find((l) => l.lap === currentLap) ??
      lapData.laps[lapData.laps.length - 1];
    return [...lapData.drivers].sort((a, b) => {
      const pa = snap?.positions[a.code] ?? 99;
      const pb = snap?.positions[b.code] ?? 99;
      return pa - pb;
    });
  }, [lapData, currentLap]);

  const totalLaps = lapData?.total_laps ?? 0;
  const numDrivers = lapData?.drivers.length ?? 20;
  const atEnd = totalLaps > 0 && currentLap >= totalLaps;

  // Y-axis ticks: 1, 5, 10, 15, 20 (skip dense ones for small grids)
  const yTicks = useMemo(
    () =>
      Array.from({ length: numDrivers }, (_, i) => i + 1).filter(
        (t) => numDrivers <= 8 || t === 1 || t % 5 === 0
      ),
    [numDrivers]
  );

  // Progress percent for displaying on the scrubber label
  const progressPct =
    totalLaps > 0 ? Math.round((currentLap / totalLaps) * 100) : 0;

  // ── Render states ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="carbon-card p-10 flex items-center justify-center min-h-[160px]">
        <LoadingSpinner message="Loading lap data…" />
      </div>
    );
  }

  if (error || !lapData || lapData.laps.length === 0) {
    return (
      <div className="carbon-card p-6 text-center min-h-[80px] flex items-center justify-center">
        <p className="text-gray-600 text-sm">
          {error ?? "Lap data not available for this race."}
        </p>
      </div>
    );
  }

  return (
    <div className="carbon-card overflow-hidden animate-slide-up">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 flex-wrap">
        <span className="text-gray-500 text-[10px] uppercase tracking-widest">
          Race Replay
        </span>
        <span className="text-gray-700 mx-1">·</span>
        <span className="text-gray-400 text-xs truncate max-w-[240px]">
          {lapData.race_name}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-600 text-[10px] uppercase tracking-wider hidden sm:inline">
            {progressPct}% complete
          </span>
          <span className="text-gray-500 text-xs font-mono tabular-nums">
            Lap{" "}
            <span className="text-white font-bold">
              {Math.min(currentLap, totalLaps)}
            </span>{" "}
            / {totalLaps}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        {/* ── Playback controls ─────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Play / Pause / Replay */}
          <button
            onClick={handlePlayPause}
            className="btn-interactive flex items-center gap-2 bg-f1-red hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors min-w-[100px] justify-center"
          >
            <span className="text-base leading-none">
              {isPlaying ? "⏸" : atEnd ? "↺" : "▶"}
            </span>
            <span>{isPlaying ? "Pause" : atEnd ? "Replay" : "Play"}</span>
          </button>

          {/* Scrubber */}
          <div className="flex-1 min-w-[120px] flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={totalLaps}
              value={currentLap}
              step={1}
              onChange={handleScrub}
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#e10600]"
            />
          </div>

          {/* Speed buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={[
                  "text-xs font-bold px-2.5 py-1.5 rounded transition-all duration-150",
                  speed === s
                    ? "bg-f1-red/20 text-f1-red border border-f1-red/40"
                    : "bg-gray-800/60 text-gray-500 hover:text-gray-200 border border-transparent",
                ].join(" ")}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* ── Chart + live standings ─────────────────────── */}
        <div className="flex gap-3 min-w-0">
          {/* Chart area */}
          <div className="flex-1 min-w-0" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 20, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="lap"
                  type="number"
                  domain={[1, totalLaps]}
                  stroke="transparent"
                  tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Lap",
                    position: "insideBottomRight",
                    offset: -4,
                    fill: "#444",
                    fontSize: 10,
                  }}
                  allowDataOverflow
                />
                <YAxis
                  domain={[1, numDrivers]}
                  reversed
                  ticks={yTicks}
                  tick={{ fill: "#555", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `P${v}`}
                  width={34}
                />
                <Tooltip
                  content={<ReplayTooltip />}
                  cursor={{
                    stroke: "rgba(255,255,255,0.06)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  isAnimationActive={false}
                />
                {lapData.drivers.map((driver) => {
                  const isHovered = hoveredDriver === driver.code;
                  const isDimmed =
                    hoveredDriver !== null && hoveredDriver !== driver.code;
                  return (
                    <Line
                      key={driver.code}
                      type="monotone"
                      dataKey={driver.code}
                      stroke={getTeamColor(driver.team)}
                      strokeWidth={isHovered ? 3 : isDimmed ? 0.8 : 1.5}
                      strokeOpacity={isHovered ? 1 : isDimmed ? 0.12 : 0.82}
                      dot={false}
                      activeDot={{
                        r: isHovered ? 5 : isDimmed ? 0 : 3,
                        fill: getTeamColor(driver.team),
                        stroke: "transparent",
                      }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Live standings sidebar — visible on xl+ */}
          <div className="hidden xl:flex flex-col w-28 shrink-0">
            <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-2 px-1.5">
              {currentLap === 0 ? "Starting" : `Lap ${Math.min(currentLap, totalLaps)}`}
            </p>
            <div className="space-y-0.5 overflow-y-auto max-h-[380px]">
              {liveStandings.map((driver, idx) => (
                <DriverRow
                  key={driver.code}
                  driver={driver}
                  position={idx + 1}
                  isHighlighted={hoveredDriver === driver.code}
                  isDimmed={
                    hoveredDriver !== null && hoveredDriver !== driver.code
                  }
                  onEnter={() => setHoveredDriver(driver.code)}
                  onLeave={() => setHoveredDriver(null)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Legend hint ───────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <p className="text-gray-700 text-[10px]">
            Hover the chart to inspect a lap
          </p>
          <span className="text-gray-800 text-[10px] hidden xl:inline">·</span>
          <p className="text-gray-700 text-[10px] hidden xl:block">
            Hover a driver code to highlight their line
          </p>
          <span className="text-gray-800 text-[10px]">·</span>
          <p className="text-gray-700 text-[10px]">
            Drag the scrubber to jump to any lap
          </p>
        </div>
      </div>
    </div>
  );
}
