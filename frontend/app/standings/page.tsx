"use client";

import { useEffect, useState } from "react";
import { f1Api, DriverStanding, ConstructorStanding } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function StandingsPage() {
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [season, setSeason] = useState("current");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"drivers" | "constructors">("drivers");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [drivers, constructors] = await Promise.all([
          f1Api.getDriverStandings(season),
          f1Api.getConstructorStandings(season),
        ]);
        setDriverStandings(drivers.standings);
        setConstructorStandings(constructors.standings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [season]);

  // Max points for progress bar calculation
  const maxDriverPoints = parseFloat(driverStandings[0]?.points || "1");
  const maxConstructorPoints = parseFloat(constructorStandings[0]?.points || "1");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Championship Standings</h1>
          <p className="text-gray-400 text-sm mt-1">
            2026 Formula 1 World Championship
          </p>
        </div>

        {/* Season Selector */}
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500"
        >
          <option value="current">2026 (Current)</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "drivers"
              ? "border-red-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          🏎️ Drivers
        </button>
        <button
          onClick={() => setActiveTab("constructors")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "constructors"
              ? "border-red-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          🏆 Constructors
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Driver Standings */}
          {activeTab === "drivers" && (
            <div className="space-y-2">
              {driverStandings.map((driver, index) => {
                const points = parseFloat(driver.points);
                const percentage = (points / maxDriverPoints) * 100;

                return (
                  <div
                    key={driver.driver_code}
                    className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Position */}
                      <div className="w-8 text-center shrink-0">
                        <span className={`text-lg font-bold ${
                          index === 0 ? "text-yellow-400" :
                          index === 1 ? "text-gray-300" :
                          index === 2 ? "text-amber-600" :
                          "text-gray-500"
                        }`}>
                          {index < 3
                            ? ["🥇","🥈","🥉"][index]
                            : driver.position
                          }
                        </span>
                      </div>

                      {/* Driver number */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: getTeamColor(driver.team) + "33",
                                 color: getTeamColor(driver.team) }}
                      >
                        {driver.driver_number}
                      </div>

                      {/* Driver info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">
                            {driver.driver_name}
                          </span>
                          <span className="font-mono text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                            {driver.driver_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getTeamColor(driver.team) }}
                          />
                          <span className="text-gray-400 text-sm">
                            {driver.team}
                          </span>
                          <span className="text-gray-600 text-sm">•</span>
                          <span className="text-gray-500 text-sm">
                            {driver.nationality}
                          </span>
                        </div>

                        {/* Points progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getTeamColor(driver.team)
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-white">
                          {driver.points}
                          <span className="text-gray-500 text-sm font-normal ml-1">pts</span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          {driver.wins} {parseInt(driver.wins) === 1 ? "win" : "wins"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Constructor Standings */}
          {activeTab === "constructors" && (
            <div className="space-y-2">
              {constructorStandings.map((team, index) => {
                const points = parseFloat(team.points);
                const percentage = (points / maxConstructorPoints) * 100;

                return (
                  <div
                    key={team.team}
                    className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Position */}
                      <div className="w-8 text-center shrink-0">
                        <span className={`text-lg font-bold ${
                          index === 0 ? "text-yellow-400" :
                          index === 1 ? "text-gray-300" :
                          index === 2 ? "text-amber-600" :
                          "text-gray-500"
                        }`}>
                          {index < 3
                            ? ["🥇","🥈","🥉"][index]
                            : team.position
                          }
                        </span>
                      </div>

                      {/* Team color dot */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: getTeamColor(team.team) + "33" }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getTeamColor(team.team) }}
                        />
                      </div>

                      {/* Team info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">{team.team}</p>
                        <p className="text-gray-400 text-sm">{team.nationality}</p>

                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getTeamColor(team.team)
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-white">
                          {team.points}
                          <span className="text-gray-500 text-sm font-normal ml-1">pts</span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          {team.wins} {parseInt(team.wins) === 1 ? "win" : "wins"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}