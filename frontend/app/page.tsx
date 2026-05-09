"use client";

import { useEffect, useState } from "react";
import { f1Api, DriverStanding, ConstructorStanding, Race } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatCard from "@/components/ui/StatCard";

export default function Dashboard() {

  
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [season, setSeason] = useState<{ season: string; total_races: number; races: Race[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        
        const [drivers, constructors, seasonData] = await Promise.all([
          f1Api.getDriverStandings(),
          f1Api.getConstructorStandings(),
          f1Api.getCurrentSeason(),
        ]);

        setDriverStandings(drivers.standings);
        setConstructorStandings(constructors.standings);
        setSeason(seasonData);

      } catch (err) {
        setError("Failed to load F1 data. Is the backend running?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-red-500 text-center">
        <p className="text-xl">⚠️ {error}</p>
        <p className="text-gray-400 mt-2">Make sure backend is running on port 8000</p>
      </div>
    </div>
  );

  // Find championship leaders
  const driverLeader = driverStandings[0];
  const constructorLeader = constructorStandings[0];

  return (
    <div className="text-white">

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* ── STAT CARDS ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Races"
            value={season?.total_races ?? 0}
            icon="🏁"
            color="red"
          />
          <StatCard
            label="Driver Leader"
            value={driverLeader?.driver_code ?? "-"}
            icon="👑"
            color="yellow"
          />
          <StatCard
            label="Leader Points"
            value={driverLeader?.points ?? "-"}
            icon="⭐"
            color="yellow"
          />
          <StatCard
            label="Top Constructor"
            value={constructorLeader?.team ?? "-"}
            icon="🏆"
            color="blue"
          />
        </section>

        {/* ── STANDINGS GRID ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Driver Standings */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
              <span className="text-xl">🏎️</span>
              <h2 className="text-lg font-bold">Driver Standings</h2>
              <span className="ml-auto text-gray-400 text-sm">
                {season?.season}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
                    <th className="px-4 py-3 text-left">Pos</th>
                    <th className="px-4 py-3 text-left">Driver</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-right">Pts</th>
                    <th className="px-4 py-3 text-right">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {driverStandings.slice(0, 10).map((driver, index) => (
                    <tr
                      key={driver.driver_code}
                      className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono">
                        {index === 0 ? "👑" : driver.position}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm">
                            {driver.driver_code}
                          </span>
                          <span className="text-gray-400 text-sm hidden sm:block">
                            {driver.driver_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1 h-4 rounded-full"
                            style={{
                              backgroundColor: getTeamColor(driver.team)
                            }}
                          />
                          <span className="text-gray-300 text-sm">
                            {driver.team}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {driver.points}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {driver.wins}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Constructor Standings */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-lg font-bold">Constructor Standings</h2>
              <span className="ml-auto text-gray-400 text-sm">
                {season?.season}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
                    <th className="px-4 py-3 text-left">Pos</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-right">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {constructorStandings.map((team, index) => (
                    <tr
                      key={team.team}
                      className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {index === 0 ? "👑" : team.position}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getTeamColor(team.team)
                            }}
                          />
                          <span className="font-semibold">
                            {team.team}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {team.points}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {team.wins}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── RACE CALENDAR ── */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-bold">
              {season?.season} Race Calendar
            </h2>
            <span className="ml-auto text-gray-400 text-sm">
              {season?.total_races} Races
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {season?.races.map((race) => {
              const raceDate = new Date(race.date);
              const isPast = raceDate < new Date();

              return (
                <div
                  key={race.round}
                  className={`
                    p-4 border-b border-r border-gray-800
                    hover:bg-gray-800/50 transition-colors
                    ${isPast ? "opacity-50" : ""}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-red-500 text-xs font-bold">
                        ROUND {race.round}
                      </span>
                      <p className="font-semibold text-sm mt-1">
                        {race.race_name}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        📍 {race.locality}, {race.country}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-mono">
                        {raceDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {isPast && (
                        <span className="text-xs text-gray-500">
                          Completed
                        </span>
                      )}
                      {!isPast && (
                        <span className="text-xs text-green-400">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-800 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          F1 Intelligence Dashboard • Data from Jolpica API • Built with FastAPI + Next.js
        </div>
      </footer>

    </div>
  );
}