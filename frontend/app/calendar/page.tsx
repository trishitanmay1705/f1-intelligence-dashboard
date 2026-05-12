"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { f1Api, Race, RaceSessions } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import F1Logo from "@/components/ui/F1Logo";

interface SeasonData {
  season: string;
  total_races: number;
  races: Race[];
}

function fmtDate(date: string | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function fmtTime(time: string | undefined) {
  if (!time || time === "TBC") return "TBC";
  return time.replace(/:00Z$/, "").replace(/Z$/, "") + " UTC";
}

const SESSION_LABELS: { key: keyof RaceSessions; label: string; color: string }[] = [
  { key: "fp1",               label: "Practice 1",        color: "text-blue-400"   },
  { key: "fp2",               label: "Practice 2",        color: "text-blue-400"   },
  { key: "fp3",               label: "Practice 3",        color: "text-blue-400"   },
  { key: "sprint_qualifying", label: "Sprint Qualifying", color: "text-yellow-400" },
  { key: "sprint",            label: "Sprint Race",       color: "text-orange-400" },
  { key: "qualifying",        label: "Qualifying",        color: "text-purple-400" },
  { key: "race",              label: "Race",              color: "text-f1-red"     },
];

function SessionPanel({
  sessions,
  isPast,
  season,
  round,
}: {
  sessions: RaceSessions;
  isPast: boolean;
  season: string;
  round: string;
}) {
  const rows = SESSION_LABELS.filter(({ key }) => sessions[key] !== null);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="grid divide-y divide-white/5">
        {rows.map(({ key, label, color }) => {
          const s = sessions[key];
          if (!s) return null;
          return (
            <div
              key={key}
              className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>
                {label}
              </span>
              <div className="text-right">
                <span className="text-white text-sm font-mono">{fmtDate(s.date)}</span>
                <span className="text-gray-500 text-xs ml-3">{fmtTime(s.time)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {isPast && (
        <div className="px-5 py-3 border-t border-white/5 flex justify-end">
          <Link
            href={`/results/${season}/${round}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-f1-red hover:text-red-400 transition-colors"
          >
            View Race Results →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await f1Api.getCurrentSeason();
        setSeasonData(data);
        const today = new Date();
        const next = data.races.find((r: Race) => new Date(r.date) >= today);
        if (next) setExpandedRound(next.round);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );

  const today = new Date();
  const completedRaces =
    seasonData?.races.filter((r) => new Date(r.date) < today).length ?? 0;
  const upcomingRaces = (seasonData?.total_races ?? 0) - completedRaces;
  const nextRace = seasonData?.races.find((r) => new Date(r.date) >= today);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <F1Logo size="md" />
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            {seasonData?.season} Race Calendar
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">
            Formula 1 World Championship
          </p>
        </div>
      </div>

      <div className="carbon-card p-5">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-2xl font-black f1-number text-white">{seasonData?.total_races}</p>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Total Races</p>
          </div>
          <div>
            <p className="text-2xl font-black f1-number text-green-400">{completedRaces}</p>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-black f1-number text-blue-400">{upcomingRaces}</p>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Remaining</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-f1-red h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${(completedRaces / (seasonData?.total_races ?? 1)) * 100}%` }}
          />
        </div>
        <p className="text-gray-600 text-xs mt-1.5 text-right">
          {Math.round((completedRaces / (seasonData?.total_races ?? 1)) * 100)}% complete
        </p>

        {nextRace && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">Next Race</p>
              <p className="text-white font-black text-base">{nextRace.race_name}</p>
              <p className="text-gray-400 text-sm mt-0.5">{nextRace.locality}, {nextRace.country}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white font-mono font-bold">
                {new Date(nextRace.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-gray-500 text-xs mt-1">Round {nextRace.round}</p>
            </div>
          </div>
        )}
      </div>

      <div className="carbon-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">All Races</p>
          <p className="text-xs text-gray-600 mt-1">Click a race to view the weekend schedule</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {seasonData?.races.map((race) => {
            const raceDate = new Date(race.date);
            const isPast = raceDate < today;
            const isNext = nextRace?.round === race.round;
            const isExpanded = expandedRound === race.round;
            const isSprintWeekend = !!race.sessions?.sprint;

            return (
              <div
                key={race.round}
                className={[
                  "transition-colors",
                  isNext ? "bg-blue-500/5 border-l-2 border-blue-500" : "",
                  isPast && !isNext ? "opacity-70" : "",
                ].join(" ")}
              >
                <button
                  className="w-full text-left px-5 py-4 hover:bg-white/[0.03] transition-colors flex items-center gap-4"
                  onClick={() => setExpandedRound(isExpanded ? null : race.round)}
                >
                  <div
                    className={[
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0",
                      isPast ? "bg-gray-800 text-gray-500"
                      : isNext ? "bg-blue-500/20 text-blue-400"
                      : "bg-f1-red/10 text-f1-red",
                    ].join(" ")}
                  >
                    {race.round}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white">{race.race_name}</span>
                      {isSprintWeekend && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          Sprint
                        </span>
                      )}
                      {isNext && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          Next
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          ✓ Done
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {race.circuit} · {race.locality}, {race.country}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="text-white font-mono text-sm">
                        {raceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-gray-500 text-xs">{fmtTime(race.time)}</p>
                    </div>
                    <span
                      className={[
                        "text-gray-600 text-xs transition-transform duration-200 inline-block",
                        isExpanded ? "rotate-180" : "",
                      ].join(" ")}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {isExpanded && race.sessions && (
                  <div className="px-5 pb-4">
                    <SessionPanel
                      sessions={race.sessions}
                      isPast={isPast}
                      season={seasonData.season}
                      round={race.round}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
