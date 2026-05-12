"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { f1Api, RaceResult } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface RaceData {
  season: string;
  round: string;
  race_name: string;
  circuit: string;
  country: string;
  date: string;
  results: RaceResult[];
}

const getStatusBadge = (status: string) => {
  if (status === "Finished") return (
    <span className="text-green-400 text-xs">Finished</span>
  );
  if (status.startsWith("+")) return (
    <span className="text-yellow-400 text-xs">{status}</span>
  );
  return <span className="text-red-400 text-xs">DNF: {status}</span>;
};

export default function RaceResultPage() {
  const params = useParams();
  const season = params.season as string;
  const round = params.round as string;

  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await f1Api.getRaceResults(season, round);
        setRaceData(data);
      } catch (err) {
        setError("Failed to load race results");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [season, round]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner />
    </div>
  );

  if (error || !raceData) return (
    <div className="flex items-center justify-center min-h-96">
      <p className="text-red-500">Could not load race data</p>
    </div>
  );

  const winner = raceData.results.find(r => r.position === "1");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>-</span>
          <Link href="/calendar" className="hover:text-white">Calendar</Link>
          <span>-</span>
          <span className="text-white">{raceData.race_name}</span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {raceData.race_name}
            </h1>
            <p className="text-gray-400 mt-1">
              {raceData.circuit} - Season {raceData.season} - Round {raceData.round}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {new Date(raceData.date).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>

          {winner && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
              <p className="text-yellow-400 text-xs font-bold uppercase mb-1">
                Winner
              </p>
              <p className="text-white font-bold">{winner.driver_name}</p>
              <p
                className="text-sm"
                style={{ color: getTeamColor(winner.team) }}
              >
                {winner.team}
              </p>
            </div>
          )}
        </div>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {raceData.results.map((result, index) => (
                <tr
                  key={result.driver_code}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-bold font-mono text-gray-400">
                    {result.position}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm">
                        {result.driver_code}
                      </span>
                      <span className="text-gray-400 text-sm hidden sm:block">
                        {result.driver_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ backgroundColor: getTeamColor(result.team) }}
                      />
                      <span className="text-gray-300 text-sm">
                        {result.team}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-sm font-mono">
                    P{result.grid}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-sm font-mono">
                    {result.laps}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(result.status)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {result.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}