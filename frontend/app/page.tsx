"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { f1Api, DriverStanding, ConstructorStanding, Race } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatCard from "@/components/ui/StatCard";
import TeamBadge from "@/components/ui/TeamBadge";
import DriverBadge from "@/components/ui/DriverBadge";
import F1Logo from "@/components/ui/F1Logo";

export default function Dashboard() {
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [season, setSeason] = useState<{
    season: string;
    total_races: number;
    races: Race[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <F1Logo size="lg" />
        <p className="text-f1-red text-xl font-bold mt-4">Backend Offline</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  const driverLeader      = driverStandings[0];
  const constructorLeader = constructorStandings[0];

  return (
    <div className="text-white">

      {/* ── HERO SECTION ── */}
      {driverLeader && (
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-carbon opacity-30" />
          <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-f1-red/5 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between flex-wrap gap-6">

              {/* Left: title */}
              <div className="animate-slide-in">
                <div className="flex items-center gap-3 mb-3">
                  <F1Logo size="md" />
                  <span className="text-gray-600 text-sm uppercase tracking-widest font-semibold">
                    Intelligence
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="f1-badge">{season?.season} World Championship</span>
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight">
                  Championship
                </h2>
                <h2 className="text-4xl font-black gradient-text uppercase tracking-tight">
                  Leader
                </h2>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">
                  {season?.total_races} races scheduled
                </p>
              </div>

              {/* Right: leader card */}
              <div
                className="carbon-card border-l-4 p-6 min-w-64 animate-race-in"
                style={{ borderLeftColor: getTeamColor(driverLeader.team) }}
              >
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                  Drivers Champion Leader
                </p>
                <p
                  className="text-5xl font-black tracking-tight"
                  style={{ color: getTeamColor(driverLeader.team) }}
                >
                  {driverLeader.driver_code}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {driverLeader.driver_name}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                  <div>
                    <p className="text-2xl font-black text-white f1-number">
                      {driverLeader.points}
                    </p>
                    <p className="text-gray-600 text-xs uppercase">Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white f1-number">
                      {driverLeader.wins}
                    </p>
                    <p className="text-gray-600 text-xs uppercase">Wins</p>
                  </div>
                  <div>
                    <TeamBadge team={driverLeader.team} variant="pill" />
                    <p className="text-gray-600 text-xs uppercase mt-1">Team</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* ── STAT CARDS ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <StatCard
            label="Total Races"
            value={season?.total_races ?? 0}
            icon="🏁"
            color="red"
            subtitle="2026 Season"
          />
          <StatCard
            label="Championship Leader"
            value={driverLeader?.driver_code ?? "-"}
            icon="👑"
            color="yellow"
            subtitle={`${driverLeader?.points ?? 0} points`}
          />
          <StatCard
            label="Leader Wins"
            value={driverLeader?.wins ?? 0}
            icon="🏆"
            color="yellow"
            subtitle="Race victories"
          />
          <StatCard
            label="Top Constructor"
            value={constructorLeader?.team?.split(" ")[0] ?? "-"}
            icon="⚙️"
            color="blue"
            subtitle={`${constructorLeader?.points ?? 0} points`}
          />
        </section>

        {/* ── STANDINGS TABLES ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Driver Standings */}
          <div className="carbon-card overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <F1Logo size="sm" />
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    Driver Standings
                  </h2>
                  <p className="text-gray-600 text-xs">Top 10 • {season?.season}</p>
                </div>
              </div>
              <span className="f1-badge">Live</span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs uppercase tracking-widest border-b border-white/5">
                  <th className="px-4 py-3 text-left w-12">Pos</th>
                  <th className="px-4 py-3 text-left">Driver</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-right">Pts</th>
                  <th className="px-4 py-3 text-right">W</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.slice(0, 10).map((driver, index) => (
                  <tr
                    key={driver.driver_code}
                    className="table-row-hover border-b border-white/3 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <span className={`
                        font-black text-sm f1-number
                        ${index === 0 ? "pos-1" : ""}
                        ${index === 1 ? "pos-2" : ""}
                        ${index === 2 ? "pos-3" : ""}
                        ${index  > 2  ? "text-gray-600" : ""}
                      `}>
                        P{driver.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DriverBadge
                        driverCode={driver.driver_code}
                        driverName={driver.driver_name}
                        driverNumber={driver.driver_number}
                        team={driver.team}
                        isLeader={index === 0}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TeamBadge team={driver.team} variant="full" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black f1-number text-white">
                        {driver.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-sm f1-number">
                      {driver.wins}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Constructor Standings */}
          <div className="carbon-card overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <F1Logo size="sm" />
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    Constructor Standings
                  </h2>
                  <p className="text-gray-600 text-xs">All teams • {season?.season}</p>
                </div>
              </div>
              <span className="f1-badge">Live</span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs uppercase tracking-widest border-b border-white/5">
                  <th className="px-4 py-3 text-left w-12">Pos</th>
                  <th className="px-4 py-3 text-left">Constructor</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right">Wins</th>
                </tr>
              </thead>
              <tbody>
                {constructorStandings.map((team, index) => (
                  <tr
                    key={team.team}
                    className="table-row-hover border-b border-white/3 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <span className={`
                        font-black text-sm f1-number
                        ${index === 0 ? "pos-1" : ""}
                        ${index === 1 ? "pos-2" : ""}
                        ${index === 2 ? "pos-3" : ""}
                        ${index  > 2  ? "text-gray-600" : ""}
                      `}>
                        P{team.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TeamBadge team={team.team} variant="dot" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black f1-number text-white">
                        {team.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-sm f1-number">
                      {team.wins}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── RACE CALENDAR ── */}
        <section className="carbon-card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <F1Logo size="sm" />
              <div>
                <h2 className="text-base font-bold uppercase tracking-wide">
                  Race Calendar
                </h2>
                <p className="text-gray-600 text-xs">
                  {season?.total_races} rounds • {season?.season} season
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {season?.races.map((race, index) => {
              const raceDate = new Date(race.date);
              const isPast   = raceDate < new Date();
              return (
                <Link
                  key={race.round}
                  href={`/calendar?round=${race.round}`}
                  className={`
                    block p-4 border-b border-r border-white/3 group
                    hover:bg-white/[0.06] transition-colors duration-150
                    animate-fade-in cursor-pointer
                    ${isPast ? "opacity-40 hover:opacity-70" : ""}
                  `}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-f1-red text-xs font-black uppercase tracking-widest">
                          R{race.round}
                        </span>
                        {!isPast && (
                          <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm text-white group-hover:text-f1-red transition-colors duration-200 truncate">
                        {race.race_name}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {race.country}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-bold f1-number">
                        {raceDate.toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                      <p className="text-gray-600 text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        View details →
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <F1Logo size="sm" />
            <span className="text-gray-600 text-sm">Intelligence Dashboard</span>
          </div>
          <p className="text-gray-700 text-xs uppercase tracking-widest">
            Data: Jolpica API • Stack: FastAPI + Next.js
          </p>
        </div>
      </footer>

    </div>
  );
}