"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { f1Api, DriverCareer } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
import { nationalityToFlag } from "@/lib/nationality";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CareerStatCard from "@/components/ui/CareerStatCard";
import CareerPointsChart from "@/components/charts/CareerPointsChart";

export default function DriverCareerPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.driverId as string;

  const [data, setData] = useState<DriverCareer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    f1Api
      .getDriverCareer(driverId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? `Driver "${driverId}" not found`
              : "Failed to load career data. The first request may take 5-15 seconds while we aggregate data across all seasons."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner message={`Loading ${driverId.replace(/_/g, " ")} career data...`} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="carbon-card p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Could not load driver
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-f1-red text-white rounded font-bold"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const { driver, career, seasons } = data;
  const currentTeam = seasons[seasons.length - 1]?.team ?? career.teams[career.teams.length - 1];
  const currentTeamColor = getTeamColor(currentTeam);

  // Best season (most points)
  const bestSeason = [...seasons].sort((a, b) => b.points - a.points)[0];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/standings" className="hover:text-white transition-colors">
          Standings
        </Link>
        <span>/</span>
        <span className="text-white">{driver.full_name}</span>
      </nav>

      {/* Hero */}
      <div
        className="carbon-card p-6 sm:p-8 border-l-4 animate-race-in"
        style={{ borderLeftColor: currentTeamColor }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{nationalityToFlag(driver.nationality)}</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                {driver.nationality}
              </span>
              {driver.number && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-black f1-number"
                  style={{
                    backgroundColor: currentTeamColor + "33",
                    color: currentTeamColor,
                  }}
                >
                  #{driver.number}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1">
              {driver.first_name}{" "}
              <span style={{ color: currentTeamColor }}>{driver.last_name}</span>
            </h1>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-3">
              {driver.code && (
                <span>
                  <span className="text-gray-500">Code:</span>{" "}
                  <span className="text-white font-bold f1-number">{driver.code}</span>
                </span>
              )}
              {driver.date_of_birth && (
                <span>
                  <span className="text-gray-500">Born:</span>{" "}
                  <span className="text-white">{driver.date_of_birth}</span>
                </span>
              )}
              <span>
                <span className="text-gray-500">Active:</span>{" "}
                <span className="text-white f1-number">
                  {career.first_season}–{career.last_season}
                </span>
              </span>
            </div>
          </div>

          {driver.wikipedia_url && (
            <a
              href={driver.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all duration-200 btn-interactive"
            >
              Wikipedia ↗
            </a>
          )}
        </div>
      </div>

      {/* Career stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger">
        <CareerStatCard
          label="Championships"
          value={career.championships}
          icon="🏆"
          accent={career.championships > 0 ? "gold" : "white"}
        />
        <CareerStatCard label="Race Wins" value={career.wins} icon="🥇" accent="red" />
        <CareerStatCard label="Podiums" value={career.podiums} icon="🍾" accent="white" />
        <CareerStatCard label="Pole Positions" value={career.poles} icon="🎯" accent="blue" />
        <CareerStatCard
          label="Career Points"
          value={career.points.toLocaleString()}
          icon="⚡"
          accent="white"
        />
        <CareerStatCard label="Seasons" value={career.seasons_count} icon="📅" accent="white" />
      </div>

      {/* Best season + Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestSeason && (
          <div className="carbon-card p-5 border-l-4 border-yellow-500/50 animate-slide-in">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Career-Best Season</div>
            <div className="flex items-baseline gap-3">
              <span className="f1-number text-4xl font-black text-white">{bestSeason.season}</span>
              <span className="text-xl text-gray-300">P{bestSeason.position}</span>
              <span className="text-yellow-400 font-bold">{bestSeason.points} pts</span>
              <span className="text-gray-400 text-sm">· {bestSeason.wins} wins</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 font-semibold">{bestSeason.team}</div>
          </div>
        )}

        <div className="carbon-card p-5 animate-slide-up">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Teams Driven For</div>
          <div className="flex flex-wrap gap-2">
            {career.teams.map((team) => (
              <span
                key={team}
                className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: getTeamColor(team) + "1a",
                  color: getTeamColor(team),
                  border: `1px solid ${getTeamColor(team)}44`,
                  boxShadow: `0 0 12px ${getTeamColor(team)}18`,
                }}
              >
                {team}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <CareerPointsChart seasons={seasons} />

      {/* Season-by-season table */}
      <div className="carbon-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Full Career</p>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Season Breakdown</h3>
          </div>
          <span className="text-gray-600 text-xs f1-number">{seasons.length} seasons</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4">Pos</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-right">Wins</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {[...seasons].reverse().map((s, index) => {
                const teamColor = getTeamColor(s.team);
                const isChampion = s.position === "1";
                const pct = Math.round((s.points / (bestSeason?.points || 1)) * 100);
                return (
                  <tr
                    key={s.season}
                    className="border-b border-white/[0.04] table-row-hover animate-fade-in"
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="f1-number font-black text-white">{s.season}</span>
                        {isChampion && (
                          <span className="text-yellow-400 text-xs" title="World Champion">★</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center justify-center w-9 h-7 rounded text-xs font-black f1-number"
                        style={{
                          backgroundColor:
                            s.position === "1" ? "rgba(255,215,0,0.15)"
                          : s.position === "2" ? "rgba(192,192,192,0.12)"
                          : s.position === "3" ? "rgba(205,127,50,0.12)"
                          : "rgba(255,255,255,0.05)",
                          color:
                            s.position === "1" ? "#ffd700"
                          : s.position === "2" ? "#c0c0c0"
                          : s.position === "3" ? "#cd7f32"
                          : "#9ca3af",
                        }}
                      >
                        P{s.position}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1 h-5 rounded-sm shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span className="text-white text-sm">{s.team}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="f1-number font-bold text-white">{s.wins}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-3">
                        {/* Relative points bar */}
                        <div className="w-20 bg-gray-800/60 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: teamColor }}
                          />
                        </div>
                        <span className="f1-number font-black text-white w-12 text-right">{s.points}</span>
                      </div>
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