import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // bumped to 30s for slow career endpoint on cold cache
  headers: { "Content-Type": "application/json" },
});

export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  driver_id: string;
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
  driver_id: string;
  driver_code: string;
  driver_name: string;
  team: string;
  laps: string;
  status: string;
  points: string;
  grid: string;
  fastest_lap: string;
}

export interface QualifyingResult {
  position: string;
  driver_code: string;
  driver_name: string;
  team: string;
  q1: string;
  q2: string;
  q3: string;
}

export interface QualifyingData {
  season: string;
  round: string;
  race_name: string;
  results: QualifyingResult[];
}

export interface SprintResult {
  position: string;
  driver_code: string;
  driver_name: string;
  team: string;
  laps: string;
  status: string;
  points: string;
  grid: string;
}

export interface SprintData {
  season: string;
  round: string;
  race_name: string;
  results: SprintResult[];
}

// ─── Lap-by-Lap Types ────────────────────────────────

export interface LapDataDriver {
  code: string;
  team: string;
}

export interface LapEntry {
  lap: number;
  positions: Record<string, number>;
}

export interface LapData {
  season: string;
  round: string;
  race_name: string;
  total_laps: number;
  drivers: LapDataDriver[];
  laps: LapEntry[];
}

// ─── Driver Career Types ─────────────────────────────

export interface DriverBio {
  driver_id: string;
  code: string;
  number: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  nationality: string;
  date_of_birth: string | null;
  wikipedia_url: string | null;
}

export interface DriverSeasonSummary {
  season: string;
  position: string;
  points: number;
  wins: number;
  team: string;
}

export interface DriverCareerTotals {
  seasons_count: number;
  first_season: string | null;
  last_season: string | null;
  championships: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  teams: string[];
}

export interface DriverCareer {
  driver: DriverBio;
  career: DriverCareerTotals;
  seasons: DriverSeasonSummary[];
}

export interface DriverListEntry {
  driver_id: string;
  code: string;
  first_name: string;
  last_name: string;
  nationality: string;
  number: string | null;
}

// ─── API client ─────────────────────────────

export const f1Api = {
  getDriverStandings: async (season = "current") => {
    const response = await apiClient.get(`/api/v1/f1/standings/drivers?season=${season}`);
    return response.data.data;
  },
  getConstructorStandings: async (season = "current") => {
    const response = await apiClient.get(`/api/v1/f1/standings/constructors?season=${season}`);
    return response.data.data;
  },
  getCurrentSeason: async () => {
    const response = await apiClient.get(`/api/v1/f1/season/current`);
    return response.data.data;
  },
  getSeason: async (season: string) => {
    const response = await apiClient.get(`/api/v1/f1/season/${season}`);
    return response.data.data;
  },
  getLastRaceResults: async () => {
    const response = await apiClient.get(`/api/v1/f1/results/last`);
    return response.data.data;
  },
  getRaceResults: async (season: string, round: string) => {
    const response = await apiClient.get(`/api/v1/f1/results/${season}/${round}`);
    return response.data.data;
  },
  getQualifyingResults: async (season: string, round: string): Promise<QualifyingData> => {
    const response = await apiClient.get(`/api/v1/f1/qualifying/${season}/${round}`);
    return response.data.data;
  },
  getSprintResults: async (season: string, round: string): Promise<SprintData> => {
    const response = await apiClient.get(`/api/v1/f1/sprint/${season}/${round}`);
    return response.data.data;
  },
  getLapData: async (season: string, round: string): Promise<LapData> => {
    const response = await apiClient.get(`/api/v1/f1/laps/${season}/${round}`);
    return response.data.data;
  },
  // ─── Driver endpoints ─────────────────────────────
  getDriver: async (driverId: string): Promise<DriverBio> => {
    const response = await apiClient.get(`/api/v1/f1/drivers/${driverId}`);
    return response.data.data;
  },
  getDriverCareer: async (driverId: string): Promise<DriverCareer> => {
    const response = await apiClient.get(`/api/v1/f1/drivers/${driverId}/career`);
    return response.data.data;
  },
  listDrivers: async (season = "current"): Promise<DriverListEntry[]> => {
    const response = await apiClient.get(`/api/v1/f1/drivers?season=${season}`);
    return response.data.data;
  },
};