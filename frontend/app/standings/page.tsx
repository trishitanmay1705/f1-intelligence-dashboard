"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { f1Api, DriverStanding, ConstructorStanding } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TeamBadge from "@/components/ui/TeamBadge";
import DriverBadge from "@/components/ui/DriverBadge";
import F1Logo from "@/components/ui/F1Logo";
import DriverPointsChart from "@/components/charts/DriverPointsChart";
import ConstructorPointsChart from "@/components/charts/ConstructorPointsChart";
import ChampionshipGapChart from "@/components/charts/ChampionshipGapChart";


type Tab = "drivers" | "constructors";

export default function StandingsPage() {
  const [driverStandings,      setDriverStandings]      = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [season,    setSeason]    = useState("current");
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("drivers");

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

  const maxDriverPoints      = parseFloat(driverStandings[0]?.points      || "1");
  const maxConstructorPoints = parseFloat(constructorStandings[0]?.points || "1");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "drivers",      label: "Drivers",      icon: "🏎️" },
    { id: "constructors", label: "Constructors",  icon: "🏆" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <F1Logo size="md" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Championship Standings
            </h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">
              Formula 1 World Championship
            </p>
          </div>
        </div>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="bg-gray-800/80 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-f1-red cursor-pointer transition-colors duration-200 hover:border-gray-500"
        >
          <option value="current">2026 (Current)</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
        </select>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex items-center gap-2 px-5 py-3 text-sm font-semibold",
              "border-b-2 transition-all duration-200 uppercase tracking-wide",
              "btn-interactive",
              activeTab === tab.id
                ? "border-f1-red text-white"
                : "border-transparent text-gray-500 hover:text-white",
            ].join(" ")}
          >
            <span className="transition-transform duration-200 group-hover:scale-110">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════
              DRIVERS — standings list + charts side by side
              ═══════════════════════════════════════════════════ */}
          {activeTab === "drivers" && (
            <div key="drivers" className="space-y-4 tab-panel-enter">

              {/* Quick-stat strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="carbon-card p-3 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Championship Leader</p>
                    <p className="text-white font-bold text-base mt-0.5 truncate">
                      {driverStandings[0]?.driver_name}
                    </p>
                  </div>
                  <p className="ml-auto text-f1-gold font-black text-xl f1-number shrink-0">
                    {driverStandings[0]?.points}
                    <span className="text-gray-500 text-xs font-normal ml-0.5">pts</span>
                  </p>
                </div>
                <div className="carbon-card p-3 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Gap to Leader</p>
                    <p className="text-white font-bold text-base mt-0.5 truncate">
                      {driverStandings[1]?.driver_name}
                    </p>
                  </div>
                  <p className="ml-auto text-f1-red font-black text-xl f1-number shrink-0">
                    -{(
                      parseFloat(driverStandings[0]?.points || "0") -
                      parseFloat(driverStandings[1]?.points || "0")
                    ).toFixed(0)}
                    <span className="text-gray-500 text-xs font-normal ml-0.5">pts</span>
                  </p>
                </div>
              </div>

              {/* Two-column: standings left, charts right */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5 items-start">

                {/* Standings list */}
                <div className="space-y-2">
                  {driverStandings.map((driver, index) => {
                    const points     = parseFloat(driver.points);
                    const percentage = (points / maxDriverPoints) * 100;
                    return (
                      <Link
                        key={driver.driver_id || driver.driver_code}
                        href={`/drivers/${driver.driver_id}`}
                        className="block carbon-card card-hover p-4 group cursor-pointer
                                   hover:border-f1-red/40 transition-colors animate-pop-in"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 text-center shrink-0">
                            <span className={[
                              "text-lg font-black f1-number",
                              index === 0 ? "pos-1" : "",
                              index === 1 ? "pos-2" : "",
                              index === 2 ? "pos-3" : "",
                              index  > 2  ? "text-gray-600" : "",
                            ].join(" ")}>
                              P{driver.position}
                            </span>
                          </div>
                          <DriverBadge
                            driverCode={driver.driver_code}
                            driverName={driver.driver_name}
                            driverNumber={driver.driver_number}
                            team={driver.team}
                            variant="number"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white group-hover:text-f1-red transition-colors">
                                {driver.driver_name}
                              </span>
                              <TeamBadge team={driver.team} variant="pill" />
                              <span className="ml-auto text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                View career →
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm">{driver.nationality}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: getTeamColor(driver.team),
                                  }}
                                />
                              </div>
                              <span className="text-gray-600 text-xs w-8 text-right">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-black text-white f1-number">
                              {driver.points}
                              <span className="text-gray-500 text-sm font-normal ml-1">pts</span>
                            </p>
                            <p className="text-gray-500 text-sm">
                              {driver.wins} {parseInt(driver.wins) === 1 ? "win" : "wins"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Chart panel */}
                <div className="space-y-4">
                  <DriverPointsChart standings={driverStandings} />
                  <ChampionshipGapChart standings={driverStandings} />
                </div>

              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              CONSTRUCTORS — standings list + chart side by side
              ═══════════════════════════════════════════════════ */}
          {activeTab === "constructors" && (
            <div key="constructors" className="space-y-4 tab-panel-enter">

              {/* Quick-stat strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="carbon-card p-3 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Top Constructor</p>
                    <p className="text-white font-bold text-base mt-0.5 truncate">
                      {constructorStandings[0]?.team}
                    </p>
                  </div>
                  <p
                    className="ml-auto font-black text-xl f1-number shrink-0"
                    style={{ color: getTeamColor(constructorStandings[0]?.team) }}
                  >
                    {constructorStandings[0]?.points}
                    <span className="text-gray-500 text-xs font-normal ml-0.5">pts</span>
                  </p>
                </div>
                <div className="carbon-card p-3 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Gap to Leader</p>
                    <p className="text-white font-bold text-base mt-0.5 truncate">
                      {constructorStandings[1]?.team}
                    </p>
                  </div>
                  <p className="ml-auto text-f1-red font-black text-xl f1-number shrink-0">
                    -{(
                      parseFloat(constructorStandings[0]?.points || "0") -
                      parseFloat(constructorStandings[1]?.points || "0")
                    ).toFixed(0)}
                    <span className="text-gray-500 text-xs font-normal ml-0.5">pts</span>
                  </p>
                </div>
              </div>

              {/* Two-column: standings left, chart right */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5 items-start">

                {/* Standings list */}
                <div className="space-y-2">
                  {constructorStandings.map((team, index) => {
                    const points     = parseFloat(team.points);
                    const percentage = (points / maxConstructorPoints) * 100;
                    return (
                      <div
                        key={team.team}
                        className="carbon-card card-hover p-4 animate-pop-in"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 text-center shrink-0">
                            <span className={[
                              "text-lg font-black f1-number",
                              index === 0 ? "pos-1" : "",
                              index === 1 ? "pos-2" : "",
                              index === 2 ? "pos-3" : "",
                              index  > 2  ? "text-gray-600" : "",
                            ].join(" ")}>
                              P{team.position}
                            </span>
                          </div>
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-black tracking-wider shrink-0"
                            style={{
                              backgroundColor: getTeamColor(team.team) + "22",
                              color:           getTeamColor(team.team),
                              border:         `1px solid ${getTeamColor(team.team)}33`,
                            }}
                          >
                            {team.team.slice(0, 3).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white">{team.team}</p>
                            <p className="text-gray-500 text-sm">{team.nationality}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: getTeamColor(team.team),
                                  }}
                                />
                              </div>
                              <span className="text-gray-600 text-xs w-8 text-right">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-black text-white f1-number">
                              {team.points}
                              <span className="text-gray-500 text-sm font-normal ml-1">pts</span>
                            </p>
                            <p className="text-gray-500 text-sm">
                              {team.wins} {parseInt(team.wins) === 1 ? "win" : "wins"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chart */}
                <div>
                  <ConstructorPointsChart standings={constructorStandings} />
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}