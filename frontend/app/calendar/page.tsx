"use client";

import { useEffect, useState, useCallback } from "react";
import { f1Api, Race, RaceSessions, QualifyingData, SprintData } from "@/lib/api";
import { getTeamColor } from "@/lib/teamColors";
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

// Sessions for which we can load results
const RESULT_SESSIONS = new Set<keyof RaceSessions>(["race", "qualifying", "sprint"]);

type SessionResultType =
  | { type: "race";        data: Awaited<ReturnType<typeof f1Api.getRaceResults>> }
  | { type: "qualifying";  data: QualifyingData }
  | { type: "sprint";      data: SprintData };

function SessionResultsTable({ result }: { result: SessionResultType }) {
  if (result.type === "qualifying") {
    const rows = result.data.results ?? [];
    return (
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#0d0d15]">
            <tr className="text-gray-600 uppercase tracking-widest border-b border-white/5">
              <th className="px-4 py-2 text-left w-10">Pos</th>
              <th className="px-4 py-2 text-left">Driver</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Team</th>
              <th className="px-4 py-2 text-right">Q1</th>
              <th className="px-4 py-2 text-right">Q2</th>
              <th className="px-4 py-2 text-right text-purple-400">Q3</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const teamColor = getTeamColor(r.team);
              return (
                <tr key={r.driver_code} className="border-b border-white/[0.03] hover:bg-white/[0.03]">
                  <td className="px-4 py-2 font-black f1-number">
                    <span className={i === 0 ? "pos-1" : i === 1 ? "pos-2" : i === 2 ? "pos-3" : "text-gray-600"}>
                      {r.position}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-black text-sm" style={{ color: i < 3 ? teamColor : "white" }}>
                      {r.driver_code}
                    </span>
                    <span className="text-gray-500 text-[11px] hidden sm:inline ml-1">
                      {r.driver_name.split(" ").slice(1).join(" ")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 hidden sm:table-cell text-[11px]">{r.team}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-400">{r.q1 || "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-400">{r.q2 || "—"}</td>
                  <td className="px-4 py-2 text-right font-mono sector-purple">{r.q3 || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Race or Sprint
  const rows = result.data.results ?? [];
  return (
    <div className="overflow-x-auto max-h-64 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#0d0d15]">
          <tr className="text-gray-600 uppercase tracking-widest border-b border-white/5">
            <th className="px-4 py-2 text-left w-10">Pos</th>
            <th className="px-4 py-2 text-left">Driver</th>
            <th className="px-4 py-2 text-left hidden sm:table-cell">Team</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const teamColor = getTeamColor(r.team);
            const isDNF = r.status !== "Finished" && !r.status.startsWith("+");
            return (
              <tr key={r.driver_code} className="border-b border-white/[0.03] hover:bg-white/[0.03]">
                <td className="px-4 py-2 font-black f1-number">
                  <span className={i === 0 ? "pos-1" : i === 1 ? "pos-2" : i === 2 ? "pos-3" : "text-gray-600"}>
                    {r.position}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="font-black text-sm" style={{ color: i < 3 ? teamColor : "white" }}>
                    {r.driver_code}
                  </span>
                  <span className="text-gray-500 text-[11px] hidden sm:inline ml-1">
                    {r.driver_name.split(" ").slice(1).join(" ")}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500 hidden sm:table-cell text-[11px]">{r.team}</td>
                <td className="px-4 py-2">
                  {isDNF
                    ? <span className="text-red-400 font-semibold">DNF</span>
                    : <span className="text-green-400">{r.status}</span>
                  }
                </td>
                <td className="px-4 py-2 text-right font-black f1-number text-white">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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
  const [activeSession, setActiveSession] = useState<keyof RaceSessions | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResultType | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const handleSessionClick = useCallback(async (key: keyof RaceSessions) => {
    if (!isPast || !RESULT_SESSIONS.has(key)) return;

    // Toggle off
    if (activeSession === key) {
      setActiveSession(null);
      setSessionResult(null);
      return;
    }

    setActiveSession(key);
    setLoadingSession(true);
    setSessionError(null);
    setSessionResult(null);

    try {
      if (key === "race") {
        const data = await f1Api.getRaceResults(season, round);
        setSessionResult({ type: "race", data });
      } else if (key === "qualifying") {
        const data = await f1Api.getQualifyingResults(season, round);
        setSessionResult({ type: "qualifying", data });
      } else if (key === "sprint") {
        const data = await f1Api.getSprintResults(season, round);
        setSessionResult({ type: "sprint", data });
      }
    } catch {
      setSessionError("Results not available for this session.");
    } finally {
      setLoadingSession(false);
    }
  }, [isPast, activeSession, season, round]);

  const rows = SESSION_LABELS.filter(({ key }) => sessions[key] !== null);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="divide-y divide-white/5">
        {rows.map(({ key, label, color }) => {
          const s = sessions[key];
          if (!s) return null;
          const isClickable = isPast && RESULT_SESSIONS.has(key);
          const isActive = activeSession === key;

          return (
            <div key={key}>
              {/* Session row */}
              <div
                className={[
                  "flex items-center justify-between px-5 py-3 transition-colors duration-150",
                  isClickable ? "cursor-pointer hover:bg-white/[0.05] select-none" : "",
                  isActive ? "bg-white/[0.04]" : "",
                ].join(" ")}
                onClick={() => handleSessionClick(key)}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>
                    {label}
                  </span>
                  {isClickable && (
                    <span className={[
                      "text-[10px] uppercase tracking-wide transition-colors duration-150",
                      isActive ? "text-gray-400" : "text-gray-600",
                    ].join(" ")}>
                      {isActive ? "▲ hide" : "▼ results"}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-white text-sm font-mono">{fmtDate(s.date)}</span>
                  <span className="text-gray-500 text-xs ml-3">{fmtTime(s.time)}</span>
                </div>
              </div>

              {/* Inline results panel — animated with expand-grid */}
              <div className={`expand-grid${isActive ? " open" : ""}`}>
                <div>
                  <div className="border-t border-white/5 bg-black/20">
                    {loadingSession && activeSession === key && (
                      <div className="px-5 py-5 flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-f1-red border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500 text-xs uppercase tracking-widest">Loading results…</span>
                      </div>
                    )}
                    {sessionError && activeSession === key && !loadingSession && (
                      <div className="px-5 py-4 text-center">
                        <p className="text-red-400 text-xs">{sessionError}</p>
                      </div>
                    )}
                    {sessionResult && activeSession === key && !loadingSession && (
                      <SessionResultsTable result={sessionResult} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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

        // Check for ?round=X in URL (coming from the home page calendar)
        const params = new URLSearchParams(window.location.search);
        const roundParam = params.get("round");

        if (roundParam) {
          setExpandedRound(roundParam);
          // Smooth scroll to the race row after a brief render delay
          setTimeout(() => {
            document.getElementById(`race-round-${roundParam}`)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 300);
        } else {
          const today = new Date();
          const next = data.races.find((r: Race) => new Date(r.date) >= today);
          if (next) setExpandedRound(next.round);
        }
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
          <p className="text-xs text-gray-600 mt-1">Click a race to expand the schedule · Click Race, Qualifying or Sprint to view session results</p>
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
                id={`race-round-${race.round}`}
                className={[
                  "transition-colors duration-200",
                  isNext ? "bg-blue-500/5 border-l-2 border-blue-500" : "",
                  isPast && !isNext ? "opacity-70" : "",
                ].join(" ")}
              >
                <button
                  className="w-full text-left px-5 py-4 hover:bg-white/[0.04] transition-colors duration-150 flex items-center gap-4 btn-interactive"
                  onClick={() => setExpandedRound(isExpanded ? null : race.round)}
                >
                  <div
                    className={[
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-transform duration-200",
                      isExpanded ? "scale-110" : "",
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
                        "text-gray-500 text-xs transition-transform duration-300 inline-block",
                        isExpanded ? "rotate-180" : "",
                      ].join(" ")}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {/* Smooth expand / collapse using CSS grid trick */}
                <div className={`expand-grid${isExpanded ? " open" : ""}`}>
                  <div>
                    {race.sessions && (
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
