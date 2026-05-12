import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});


export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  driver_code: string;
  driver_name: string;
  driver_number: string;
  nationality: string;
  team: string;
}

export interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  team: string;
  nationality: string;
}

export interface SessionTime {
  date: string;
  time: string;
}

export interface RaceSessions {
  fp1: SessionTime | null;
  fp2: SessionTime | null;
  fp3: SessionTime | null;
  sprint_qualifying: SessionTime | null;
  sprint: SessionTime | null;
  qualifying: SessionTime | null;
  race: SessionTime;
}

export interface Race {
  round: string;
  race_name: string;
  circuit: string;
  country: string;
  locality: string;
  date: string;
  time: string;
  sessions?: RaceSessions;
}

export interface RaceResult {
  position: string;
  driver_code: string;
  driver_name: string;
  team: string;
  laps: string;
  status: string;
  points: string;
  grid: string;
  fastest_lap: string;
}

// ─────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────

export const f1Api = {

  // Get driver championship standings
  getDriverStandings: async (season = "current") => {
    const response = await apiClient.get(
      `/api/v1/f1/standings/drivers?season=${season}`
    );
    return response.data.data;
  },

  // Get constructor championship standings
  getConstructorStandings: async (season = "current") => {
    const response = await apiClient.get(
      `/api/v1/f1/standings/constructors?season=${season}`
    );
    return response.data.data;
  },

  // Get current season race calendar
  getCurrentSeason: async () => {
    const response = await apiClient.get(`/api/v1/f1/season/current`);
    return response.data.data;
  },

  // Get race calendar for any season
  getSeason: async (season: string) => {
    const response = await apiClient.get(`/api/v1/f1/season/${season}`);
    return response.data.data;
  },

  // Get last race results
  getLastRaceResults: async () => {
    const response = await apiClient.get(
      `/api/v1/f1/results/last`
    );
    return response.data.data;
  },

  // Get specific race results
  getRaceResults: async (season: string, round: string) => {
    const response = await apiClient.get(
      `/api/v1/f1/results/${season}/${round}`
    );
    return response.data.data;
  },
};