"use client";

import { useEffect, useState, useCallback } from "react";
import { f1Api, Race, RaceResult } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TeamBadge from "@/components/ui/TeamBadge";
import DriverBadge from "@/components/ui/DriverBadge";
import F1Logo from "@/components/ui/F1Logo";

interface SeasonData {
  season: string;
  total_races: number;
  races: Race[];
}

interface RaceData {
  season: string;
  round: string;
  race_name: string;
  circuit: string;
  country: string;
  date: string;
  results: RaceResult[];
}

const SEASONS: string[] = Array.from(
  { length: 2026 - 2021 + 1 },
  (_, i) => String(2026 - i)
);

function StatusBadge({ status }: { status: string }) {
  if (status === "Finished")
    return <span className="text-green-400 text-xs font-semibold">Finished</span>;
  if (status.startsWith("+"))
    return <span className="text-yellow-400 text-xs">{status}</span>;
  return <span className="text-red-400 text-xs font-semibold">DNF · {status}</span>;
}

export default function ResultsPage() {
  const currentYear = String(new Date().getFullYear());

  const [selectedSeason, setSelectedSeason] = useState<string>(currentYear);
  const [seasonData,     setSeasonData]     = useState<SeasonData | null>(null);
  const [seasonsLoading, setSeasonsLoading] = useState(false);

  const [selectedRound,   setSelectedRound]   = useState<string>("");
  const [raceData,        setRaceData]         = useState<RaceData | null>(null);
  const [resultsLoading,  setResultsLoading]   = useState(false);
  const [error,           setError]            = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSeason) return;
    const fetchSeason = async () => {
      try {
        setSeasonsLoading(true);
        setSeasonData(null);
        setRaceData(null);
        setSelectedRound("");
        const data = await f1Api.getSeason(selectedSeason);
        setSeasonData(data);
        const today = new Date();
        const completed = data.races.filter(
          (r: Race) => new Date(r.date) < today
        );
        if (completed.length > 0) {
          setSelectedRound(completed[completed.length - 1].round);
        } else if (data.races.length > 0) {
          setSelectedRound(data.races[0].round);
        }
      } catch {
        setError("Failed to load season calendar");
      } finally {
        setSeasonsLoading(false);
      }
    };
    fetchSeason();
  }, [selectedSeason]);

  const fetchResults = useCallback(async () => {
    if (!selectedSeason || !selectedRound) return;
    try {
      setResultsLoading(true);
      setError(null);
      const data = await f1Api.getRaceResults(selectedSeason, selectedRound);
      setRaceData(data);
    } catch {
      setError("Failed to load race results. The race may not have taken place yet.");
      setRaceData(null);
    } finally {
      setResultsLoading(false);
    }
  }, [selectedSeason, selectedRound]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const winner     = raceData?.results.find(r => r.position === "1");
  const fastestLap = raceData?.results.find(r => r.fastest_lap && r.fastest_lap !== "N/A");
  const classified = raceData?.results.filter(
    r => r.status === "Finished" || r.status.startsWith("+")
  ).length ?? 0;
  const selectedRace = seasonData?.races.find(r => r.round === selectedRound);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-4">
        <F1Logo size="md" />
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Race Results</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">Formula 1 World Championship</p>
        </div>
      </div>

      {/* Season + Round pickers */}
      <div className="carbon-card p-4">
        <div className="flex flex-wrap gap-4 items-end">

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest">Season</label>
            <select
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-f1-red cursor-pointer min-w-[130px]"
            >
              {SEASONS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest">
              Race {seasonsLoading && <span className="text-gray-600">— loading…</span>}
            </label>
            <select
              value={selectedRound}
              onChange={e => setSelectedRound(e.target.value)}
              disabled={!seasonData || seasonsLoading}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-f1-red cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-full"
            >
              {!seasonData && <option value="">— select a season first —</option>}
              {seasonData?.races.map(race => {
                const isPast = new Date(race.date) < new Date();
                return (
                  <option key={race.round} value={race.round}>
                    R{race.round.padStart(2, "0")} · {race.race_name}{!isPast ? " 🔜" : ""}
                  </option>
                );
              })}
            </select>
          </div>

        </div>

        {selectedRace && (
          <div className="mt-4 flex flex-wrap gap-4 items-start border-t border-white/5 pt-4">
            <div>
              <span className="text-f1-red text-xs font-bold uppercase tracking-wider">
                Round {selectedRace.round}
              </span>
              <p className="text-white font-black text-lg mt-0.5">{selectedRace.race_name}</p>
              <p className="text-gray-500 text-sm">
                {selectedRace.locality}, {selectedRace.country} · {selectedRace.circuit}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Date</p>
              <p className="text-white font-bold mt-0.5">
                {new Date(selectedRace.date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {resultsLoading && (
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner message="Loading race results…" />
        </div>
      )}

      {/* Error */}
      {!resultsLoading && error && (
        <div className="carbon-card p-8 text-center">
          <p className="text-red-400 text-lg">⚠️ {error}</p>
          <p className="text-gray-600 text-sm mt-2">Results may not be available yet for this race.</p>
        </div>
      )}

      {/* Results */}
      {!resultsLoading && !error && raceData && (
        <div className="space-y-4">

          {/* Quick-stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {winner && (
              <div className="carbon-card p-4">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Winner</p>
                <p className="text-white font-black text-base">{winner.driver_name}</p>
                <p className="text-xs mt-1" style={{ color: getTeamColor(winner.team) }}>{winner.team}</p>
              </div>
            )}
            {fastestLap && (
              <div className="carbon-card p-4">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Fastest Lap</p>
                <p className="sector-purple font-black text-base font-mono">{fastestLap.fastest_lap}</p>
                <p className="text-gray-500 text-xs mt-1">{fastestLap.driver_name}</p>
              </div>
            )}
            <div className="carbon-card p-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Classified</p>
              <p className="text-white font-black text-base f1-number">
                {classified}
                <span className="text-gray-500 text-xs font-normal ml-1">/ {raceData.results.length} drivers</span>
              </p>
            </div>
          </div>

          {/* Classification table */}
          <div className="carbon-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center">
              <span className="text-gray-500 text-[10px] uppercase tracking-widest">Race Classification</span>
              <span className="ml-auto text-gray-600 text-xs">{raceData.season} · Round {raceData.round}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                    <th className="px-4 py-3 text-left w-12">Pos</th>
                    <th className="px-4 py-3 text-left">Driver</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Team</th>
                    <th className="px-4 py-3 text-center">Grid</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Laps</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Pts</th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">Fastest Lap</th>
                  </tr>
                </thead>
                <tbody>
                  {raceData.results.map((result, index) => {
                    const gridPos   = parseInt(result.grid);
                    const finishPos = parseInt(result.position);
                    const posChange = isNaN(gridPos) || gridPos === 0 ? null : gridPos - finishPos;

                    return (
                      <tr
                        key={result.driver_code}
                        className={[
                          "border-b border-white/[0.04] table-row-hover",
                          index === 0 ? "bg-yellow-500/5" : "",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3">
                          <span className={[
                            "font-black f1-number text-base",
                            index === 0 ? "pos-1" : "",
                            index === 1 ? "pos-2" : "",
                            index === 2 ? "pos-3" : "",
                            index  > 2  ? "text-gray-600" : "",
                          ].join(" ")}>
                            {result.position}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <DriverBadge
                            driverCode={result.driver_code}
                            driverName={result.driver_name}
                            team={result.team}
                            variant="full"
                          />
                        </td>

                        <td className="px-4 py-3 hidden sm:table-cell">
                          <TeamBadge team={result.team} variant="compact" />
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-500 text-sm font-mono">P{result.grid}</span>
                          {posChange !== null && posChange !== 0 && (
                            <span className={[
                              "block text-[10px] font-bold mt-0.5",
                              posChange > 0 ? "text-green-400" : "text-red-400",
                            ].join(" ")}>
                              {posChange > 0 ? `▲${posChange}` : `▼${Math.abs(posChange)}`}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center text-gray-500 text-sm font-mono hidden md:table-cell">
                          {result.laps}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={result.status} />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <span className={[
                            "font-black f1-number",
                            parseFloat(result.points) > 0 ? "text-white" : "text-gray-700",
                          ].join(" ")}>
                            {result.points}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-xs hidden lg:table-cell">
                          {result.fastest_lap !== "N/A" ? (
                            <span className="sector-purple font-semibold">{result.fastest_lap}</span>
                          ) : (
                            <span className="text-gray-700">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
