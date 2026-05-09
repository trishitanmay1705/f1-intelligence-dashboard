"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { f1Api, Race } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface SeasonData {
  season: string;
  total_races: number;
  races: Race[];
}

export default function CalendarPage() {
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await f1Api.getCurrentSeason();
        setSeasonData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner />
    </div>
  );

  const today = new Date();
  const completedRaces = seasonData?.races.filter(
    r => new Date(r.date) < today
  ).length ?? 0;
  const upcomingRaces = (seasonData?.total_races ?? 0) - completedRaces;
  const nextRace = seasonData?.races.find(r => new Date(r.date) >= today);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-white">
          {seasonData?.season} Race Calendar
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Formula 1 World Championship Season
        </p>

        {/* Season progress */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {seasonData?.total_races}
            </p>
            <p className="text-gray-400 text-sm">Total Races</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {completedRaces}
            </p>
            <p className="text-gray-400 text-sm">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {upcomingRaces}
            </p>
            <p className="text-gray-400 text-sm">Remaining</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="bg-gray-800 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{
                width: `${(completedRaces / (seasonData?.total_races ?? 1)) * 100}%`
              }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1 text-right">
            {Math.round((completedRaces / (seasonData?.total_races ?? 1)) * 100)}% complete
          </p>
        </div>

        {/* Next race highlight */}
        {nextRace && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase mb-1">
                🔜 Next Race
              </p>
              <p className="text-white font-bold">{nextRace.race_name}</p>
              <p className="text-gray-400 text-sm">
                📍 {nextRace.locality}, {nextRace.country}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-mono font-bold">
                {new Date(nextRace.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
              <p className="text-gray-400 text-sm">Round {nextRace.round}</p>
            </div>
          </div>
        )}
      </div>

      {/* Race List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">All Races</h2>
        </div>

        <div className="divide-y divide-gray-800">
          {seasonData?.races.map((race) => {
            const raceDate = new Date(race.date);
            const isPast = raceDate < today;
            const isNext = nextRace?.round === race.round;

            return (
              <div
                key={race.round}
                className={`
                  flex items-center justify-between p-4
                  hover:bg-gray-800/50 transition-colors
                  ${isNext ? "bg-blue-500/5 border-l-2 border-blue-500" : ""}
                  ${isPast ? "opacity-60" : ""}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Round number */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-sm font-bold shrink-0
                    ${isPast ? "bg-gray-800 text-gray-500" : ""}
                    ${isNext ? "bg-blue-500/20 text-blue-400" : ""}
                    ${!isPast && !isNext ? "bg-red-500/10 text-red-400" : ""}
                  `}>
                    {race.round}
                  </div>

                  {/* Race info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">
                        {race.race_name}
                      </p>
                      {isNext && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          Next Race
                        </span>
                      )}
                      {isPast && (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      📍 {race.circuit} • {race.locality}, {race.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-white font-mono text-sm">
                      {raceDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {race.time !== "TBC" ? race.time : "Time TBC"}
                    </p>
                  </div>

                  {/* Link to results for completed races */}
                  {isPast && (
                    <Link
                      href={`/results/${seasonData.season}/${race.round}`}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Results →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}