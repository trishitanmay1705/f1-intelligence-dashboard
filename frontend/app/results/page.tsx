"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { f1Api, RaceResult } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Shape of the full race data response
interface RaceData {
  season: string;
  round: string;
  race_name: string;
  circuit: string;
  country: string;
  date: string;
  results: RaceResult[];
}

// Map finishing status to a readable label
// Some drivers don't finish due to crashes, DNF etc.
const getStatusBadge = (status: string) => {
  if (status === "Finished") {
    return (
      <span className="text-green-400 text-xs font-medium">
        ✅ Finished
      </span>
    );
  }
  if (status.startsWith("+")) {
    // Lapped drivers e.g. "+1 Lap"
    return (
      <span className="text-yellow-400 text-xs">
        {status}
      </span>
    );
  }
  // DNF, DNS, DSQ etc.
  return (
    <span className="text-red-400 text-xs font-medium">
      ❌ {status}
    </span>
  );
};

export default function ResultsPage() {
  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await f1Api.getLastRaceResults();
        setRaceData(data);
      } catch (err) {
        setError("Failed to load race results");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner />
    </div>
  );

  if (error || !raceData) return (
    <div className="flex items-center justify-center min-h-96">
      <p className="text-red-500">⚠️ {error}</p>
    </div>
  );

  // Find race winner (position 1)
  const winner = raceData.results.find(r => r.position === "1");
  // Find fastest lap
  const fastestLap = raceData.results.find(
    r => r.fastest_lap && r.fastest_lap !== "N/A"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* Race Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>→</span>
              <span className="text-white">Results</span>
            </div>

            <h1 className="text-2xl font-bold text-white">
              {raceData.race_name}
            </h1>
            <p className="text-gray-400 mt-1">
              📍 {raceData.circuit} • Round {raceData.round}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              📅 {new Date(raceData.date).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>

          {/* Season badge */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-center">
            <p className="text-red-400 text-xs font-medium uppercase">Season</p>
            <p className="text-white text-2xl font-bold">{raceData.season}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {winner && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs uppercase mb-1">🏆 Winner</p>
              <p className="font-bold text-white">{winner.driver_name}</p>
              <p className="text-sm mt-0.5" style={{
                color: getTeamColor(winner.team)
              }}>
                {winner.team}
              </p>
            </div>
          )}

          {fastestLap && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs uppercase mb-1">
                ⚡ Fastest Lap
              </p>
              <p className="font-bold text-white font-mono">
                {fastestLap.fastest_lap}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">
                {fastestLap.driver_name}
              </p>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase mb-1">
              🏎️ Classified
            </p>
            <p className="font-bold text-white">
              {raceData.results.filter(r => r.status === "Finished" || r.status.startsWith("+")).length}
              <span className="text-gray-400 font-normal text-sm">
                /{raceData.results.length} drivers
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">Race Classification</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
                <th className="px-4 py-3 text-left">Pos</th>
                <th className="px-4 py-3 text-left">Driver</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-center">Grid</th>
                <th className="px-4 py-3 text-center">Laps</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Pts</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">
                  Fastest Lap
                </th>
              </tr>
            </thead>
            <tbody>
              {raceData.results.map((result, index) => {
                // Calculate position change (grid vs finish)
                const gridPos = parseInt(result.grid);
                const finishPos = parseInt(result.position);
                const posChange = gridPos - finishPos;

                return (
                  <tr
                    key={result.driver_code}
                    className={`
                      border-b border-gray-800/50
                      hover:bg-gray-800/50 transition-colors
                      ${index === 0 ? "bg-yellow-500/5" : ""}
                    `}
                  >
                    {/* Position */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`
                          font-bold font-mono w-6 text-center
                          ${index === 0 ? "text-yellow-400" : ""}
                          ${index === 1 ? "text-gray-300" : ""}
                          ${index === 2 ? "text-amber-600" : ""}
                          ${index > 2 ? "text-gray-400" : ""}
                        `}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : result.position}
                        </span>
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-sm text-white">
                          {result.driver_code}
                        </span>
                        <span className="text-gray-400 text-sm hidden sm:block">
                          {result.driver_name}
                        </span>
                      </div>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: getTeamColor(result.team) }}
                        />
                        <span className="text-gray-300 text-sm">
                          {result.team}
                        </span>
                      </div>
                    </td>

                    {/* Grid position */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-sm font-mono">
                          P{result.grid}
                        </span>
                        {/* Position gained/lost indicator */}
                        {posChange !== 0 && result.grid !== "0" && (
                          <span className={`text-xs font-medium ${
                            posChange > 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            {posChange > 0 ? `▲${posChange}` : `▼${Math.abs(posChange)}`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Laps */}
                    <td className="px-4 py-3 text-center text-gray-400 text-sm font-mono">
                      {result.laps}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(result.status)}
                    </td>

                    {/* Points */}
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${
                        parseFloat(result.points) > 0
                          ? "text-white"
                          : "text-gray-600"
                      }`}>
                        {result.points}
                      </span>
                    </td>

                    {/* Fastest Lap */}
                    <td className="px-4 py-3 text-right text-gray-400 text-sm font-mono hidden md:table-cell">
                      {result.fastest_lap !== "N/A"
                        ? result.fastest_lap
                        : "—"
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}