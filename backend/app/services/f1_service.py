import httpx
from app.core.config import settings
from app.services.cache import cache
import logging

logger = logging.getLogger(__name__)

# Cache TTLs (seconds)
TTL_CURRENT = 300        # 5 minutes for "current" season data
TTL_HISTORICAL = None    # Never expire historical data


def _is_historical(season: str) -> bool:
    """Determine if a season identifier is historical (not 'current')."""
    return season.isdigit() and int(season) < 2026


class F1Service:
    def __init__(self):
        self.base_url = settings.jolpica_base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _get_json(self, url: str, cache_key: str, ttl: int | None) -> dict:
        """Fetch JSON with caching."""
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        logger.info(f"Cache MISS — fetching {url}")
        response = await self.client.get(url)
        response.raise_for_status()
        data = response.json()

        cache.set(cache_key, data, ttl=ttl)
        return data

    # ─── SEASONS ──────────────────────────────────────────────

    async def get_season(self, season: str = "current") -> dict:
        try:
            url = f"{self.base_url}/{season}.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"season:{season}", ttl)

            races = data["MRData"]["RaceTable"]["Races"]

            def _session(r, key):
                s = r.get(key)
                if not s:
                    return None
                return {"date": s.get("date"), "time": s.get("time", "TBC")}

            return {
                "season": data["MRData"]["RaceTable"]["season"],
                "total_races": len(races),
                "races": [
                    {
                        "round": r["round"],
                        "race_name": r["raceName"],
                        "circuit": r["Circuit"]["circuitName"],
                        "country": r["Circuit"]["Location"]["country"],
                        "locality": r["Circuit"]["Location"]["locality"],
                        "date": r["date"],
                        "time": r.get("time", "TBC"),
                        "sessions": {
                            "fp1": _session(r, "FirstPractice"),
                            "fp2": _session(r, "SecondPractice"),
                            "fp3": _session(r, "ThirdPractice"),
                            "sprint_qualifying": _session(r, "SprintQualifying") or _session(r, "SprintShootout"),
                            "sprint": _session(r, "Sprint"),
                            "qualifying": _session(r, "Qualifying"),
                            "race": {"date": r["date"], "time": r.get("time", "TBC")},
                        },
                    }
                    for r in races
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching season {season}: {e}")
            raise

    async def get_current_season(self) -> dict:
        return await self.get_season("current")

    async def get_driver_standings(self, season: str = "current") -> dict:
        try:
            url = f"{self.base_url}/{season}/driverStandings.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"driverStandings:{season}", ttl)

            standings_list = data["MRData"]["StandingsTable"]["StandingsLists"]

            if not standings_list:
                return {"season": season, "standings": []}

            standings = standings_list[0]["DriverStandings"]
            return {
                "season": standings_list[0]["season"],
                "round": standings_list[0]["round"],
                "standings": [
                    {
                        "position": s["position"],
                        "points": s["points"],
                        "wins": s["wins"],
                        "driver_id": s["Driver"]["driverId"],
                        "driver_code": s["Driver"].get("code", s["Driver"]["driverId"][:3].upper()),
                        "driver_name": f"{s['Driver']['givenName']} {s['Driver']['familyName']}",
                        "driver_number": s["Driver"].get("permanentNumber", "N/A"),
                        "nationality": s["Driver"]["nationality"],
                        "team": s["Constructors"][0]["name"],
                    }
                    for s in standings
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise

    async def get_constructor_standings(self, season: str = "current") -> dict:
        try:
            url = f"{self.base_url}/{season}/constructorStandings.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"constructorStandings:{season}", ttl)

            standings_list = data["MRData"]["StandingsTable"]["StandingsLists"]
            if not standings_list:
                return {"season": season, "standings": []}

            standings = standings_list[0]["ConstructorStandings"]
            return {
                "season": standings_list[0]["season"],
                "round": standings_list[0]["round"],
                "standings": [
                    {
                        "position": s["position"],
                        "points": s["points"],
                        "wins": s["wins"],
                        "team": s["Constructor"]["name"],
                        "nationality": s["Constructor"]["nationality"],
                    }
                    for s in standings
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise

    async def get_race_results(self, season: str = "current", round: str = "last") -> dict:
        try:
            url = f"{self.base_url}/{season}/{round}/results.json"
            # "last" is current-ish, everything else with a numeric season is historical
            ttl = TTL_HISTORICAL if _is_historical(season) and round != "last" else TTL_CURRENT
            data = await self._get_json(url, f"results:{season}:{round}", ttl)

            races = data["MRData"]["RaceTable"]["Races"]
            if not races:
                return {"message": "No results found"}

            race = races[0]
            return {
                "season": race["season"],
                "round": race["round"],
                "race_name": race["raceName"],
                "circuit": race["Circuit"]["circuitName"],
                "country": race["Circuit"]["Location"]["country"],
                "date": race["date"],
                "results": [
                    {
                        "position": r["position"],
                        "driver_id": r["Driver"]["driverId"],
                        "driver_code": r["Driver"].get("code", r["Driver"]["driverId"][:3].upper()),
                        "driver_name": f"{r['Driver']['givenName']} {r['Driver']['familyName']}",
                        "team": r["Constructor"]["name"],
                        "laps": r["laps"],
                        "status": r["status"],
                        "points": r["points"],
                        "grid": r["grid"],
                        "fastest_lap": r.get("FastestLap", {}).get("Time", {}).get("time", "N/A"),
                    }
                    for r in race["Results"]
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise

        # ─── DRIVERS ──────────────────────────────────────────────

    async def get_driver(self, driver_id: str) -> dict:
        """Get a single driver's bio."""
        try:
            url = f"{self.base_url}/drivers/{driver_id}.json"
            data = await self._get_json(url, f"driver:{driver_id}", TTL_HISTORICAL)

            drivers = data["MRData"]["DriverTable"]["Drivers"]
            if not drivers:
                return None

            d = drivers[0]
            return {
                "driver_id": d["driverId"],
                "code": d.get("code", d["driverId"][:3].upper()),
                "number": d.get("permanentNumber"),
                "first_name": d["givenName"],
                "last_name": d["familyName"],
                "full_name": f"{d['givenName']} {d['familyName']}",
                "nationality": d["nationality"],
                "date_of_birth": d.get("dateOfBirth"),
                "wikipedia_url": d.get("url"),
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching driver {driver_id}: {e}")
            raise

    async def get_driver_seasons(self, driver_id: str) -> list[str]:
        """Get list of seasons a driver has competed in."""
        try:
            url = f"{self.base_url}/drivers/{driver_id}/seasons.json?limit=100"
            data = await self._get_json(url, f"driverSeasons:{driver_id}", TTL_CURRENT)

            seasons = data["MRData"]["SeasonTable"]["Seasons"]
            return [s["season"] for s in seasons]
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching seasons for {driver_id}: {e}")
            raise

    async def get_driver_season_summary(self, driver_id: str, season: str) -> dict:
        """Get a single season's summary for a driver (standings position + points)."""
        try:
            url = f"{self.base_url}/{season}/drivers/{driver_id}/driverStandings.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"driverSeasonStandings:{driver_id}:{season}", ttl)

            standings_lists = data["MRData"]["StandingsTable"]["StandingsLists"]
            if not standings_lists:
                return None

            entry = standings_lists[0]["DriverStandings"][0]
            return {
                "season": season,
                "position": entry["position"],
                "points": float(entry["points"]),
                "wins": int(entry["wins"]),
                "team": entry["Constructors"][0]["name"],
            }
        except httpx.HTTPError as e:
            logger.error(f"Error fetching season {season} for {driver_id}: {e}")
            return None

    async def get_driver_career(self, driver_id: str) -> dict:
        """
        Aggregate a driver's full career stats across all seasons.
        Combines: bio + per-season standings + race wins + poles + podiums.
        """
        import asyncio

        # 1. Bio + seasons in parallel
        bio_task = self.get_driver(driver_id)
        seasons_task = self.get_driver_seasons(driver_id)
        bio, seasons = await asyncio.gather(bio_task, seasons_task)

        if not bio:
            return None

        # 2. Fetch per-season standings in parallel
        season_tasks = [self.get_driver_season_summary(driver_id, s) for s in seasons]
        season_results = await asyncio.gather(*season_tasks)
        season_results = [s for s in season_results if s is not None]

        # 3. Fetch career totals (wins/poles/podiums) — single endpoints, much faster
        career_totals = await self._get_career_totals(driver_id)

        # 4. Sort and compute totals
        season_results.sort(key=lambda x: int(x["season"]))

        total_wins = sum(s["wins"] for s in season_results)
        total_points = sum(s["points"] for s in season_results)

        # Championships: any season where position == "1"
        championships = sum(1 for s in season_results if s["position"] == "1")

        # All teams driven for (deduplicated, in order)
        teams_seen = []
        for s in season_results:
            if s["team"] not in teams_seen:
                teams_seen.append(s["team"])

        return {
            "driver": bio,
            "career": {
                "seasons_count": len(season_results),
                "first_season": season_results[0]["season"] if season_results else None,
                "last_season": season_results[-1]["season"] if season_results else None,
                "championships": championships,
                "wins": total_wins,
                "podiums": career_totals["podiums"],
                "poles": career_totals["poles"],
                "points": round(total_points, 1),
                "teams": teams_seen,
            },
            "seasons": season_results,
        }

    async def _get_career_totals(self, driver_id: str) -> dict:
        """Fetch career podium and pole totals via dedicated endpoints."""
        try:
            # Podiums = finishes in positions 1, 2, or 3
            # Ergast doesn't have a single endpoint; we use total counts via results filter
            podiums_url = f"{self.base_url}/drivers/{driver_id}/results/1.json?limit=0"
            p2_url = f"{self.base_url}/drivers/{driver_id}/results/2.json?limit=0"
            p3_url = f"{self.base_url}/drivers/{driver_id}/results/3.json?limit=0"
            poles_url = f"{self.base_url}/drivers/{driver_id}/qualifying/1.json?limit=0"

            import asyncio
            p1, p2, p3, poles = await asyncio.gather(
                self._get_json(podiums_url, f"results1:{driver_id}", TTL_CURRENT),
                self._get_json(p2_url, f"results2:{driver_id}", TTL_CURRENT),
                self._get_json(p3_url, f"results3:{driver_id}", TTL_CURRENT),
                self._get_json(poles_url, f"poles:{driver_id}", TTL_CURRENT),
            )

            return {
                "podiums": (
                    int(p1["MRData"]["total"])
                    + int(p2["MRData"]["total"])
                    + int(p3["MRData"]["total"])
                ),
                "poles": int(poles["MRData"]["total"]),
            }
        except Exception as e:
            logger.warning(f"Could not fetch career totals for {driver_id}: {e}")
            return {"podiums": 0, "poles": 0}

    async def list_drivers_in_season(self, season: str = "current") -> list[dict]:
        """List all drivers in a given season."""
        try:
            url = f"{self.base_url}/{season}/drivers.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"drivers:{season}", ttl)

            drivers = data["MRData"]["DriverTable"]["Drivers"]
            return [
                {
                    "driver_id": d["driverId"],
                    "code": d.get("code", d["driverId"][:3].upper()),
                    "first_name": d["givenName"],
                    "last_name": d["familyName"],
                    "nationality": d["nationality"],
                    "number": d.get("permanentNumber"),
                }
                for d in drivers
            ]
        except httpx.HTTPError as e:
            logger.error(f"HTTP error listing drivers for {season}: {e}")
            raise

    async def get_qualifying_results(self, season: str, round: str) -> dict:
        """Get qualifying session results for a specific race."""
        try:
            url = f"{self.base_url}/{season}/{round}/qualifying.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"qualifying:{season}:{round}", ttl)

            races = data["MRData"]["RaceTable"]["Races"]
            if not races:
                return {"message": "No qualifying results found"}

            race = races[0]
            return {
                "season": race["season"],
                "round": race["round"],
                "race_name": race["raceName"],
                "results": [
                    {
                        "position": r["position"],
                        "driver_code": r["Driver"].get("code", r["Driver"]["driverId"][:3].upper()),
                        "driver_name": f"{r['Driver']['givenName']} {r['Driver']['familyName']}",
                        "team": r["Constructor"]["name"],
                        "q1": r.get("Q1", "—"),
                        "q2": r.get("Q2", "—"),
                        "q3": r.get("Q3", "—"),
                    }
                    for r in race["QualifyingResults"]
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching qualifying {season}/{round}: {e}")
            raise

    async def get_sprint_results(self, season: str, round: str) -> dict:
        """Get sprint race results for a specific race weekend."""
        try:
            url = f"{self.base_url}/{season}/{round}/sprint.json"
            ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT
            data = await self._get_json(url, f"sprint:{season}:{round}", ttl)

            races = data["MRData"]["RaceTable"]["Races"]
            if not races:
                return {"message": "No sprint results found"}

            race = races[0]
            return {
                "season": race["season"],
                "round": race["round"],
                "race_name": race["raceName"],
                "results": [
                    {
                        "position": r["position"],
                        "driver_code": r["Driver"].get("code", r["Driver"]["driverId"][:3].upper()),
                        "driver_name": f"{r['Driver']['givenName']} {r['Driver']['familyName']}",
                        "team": r["Constructor"]["name"],
                        "laps": r["laps"],
                        "status": r["status"],
                        "points": r["points"],
                        "grid": r["grid"],
                    }
                    for r in race["SprintResults"]
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching sprint {season}/{round}: {e}")
            raise

    async def get_lap_data(self, season: str, round: str) -> dict:
        """Get lap-by-lap position data for every driver in a race (paginated)."""
        import asyncio

        ttl = TTL_HISTORICAL if _is_historical(season) else TTL_CURRENT

        # ── Page 0 + race results in parallel ─────────────────
        # Jolpica caps limit at 100 regardless of what you request,
        # so we paginate using offset.
        first_laps_url = f"{self.base_url}/{season}/{round}/laps.json?limit=100&offset=0"
        results_url = f"{self.base_url}/{season}/{round}/results.json"

        first_resp, results_resp = await asyncio.gather(
            self._get_json(first_laps_url, f"laps:{season}:{round}:p0", ttl),
            self._get_json(results_url, f"results:{season}:{round}", ttl),
        )

        races = first_resp["MRData"]["RaceTable"]["Races"]
        if not races:
            return {"message": "No lap data found"}

        race_meta = races[0]
        total     = int(first_resp["MRData"]["total"])
        page_size = int(first_resp["MRData"]["limit"])   # actual cap enforced by server

        all_laps_raw = list(race_meta.get("Laps", []))

        # ── Remaining pages in parallel ───────────────────────
        if total > page_size:
            offsets = list(range(page_size, total, page_size))
            pages = await asyncio.gather(*[
                self._get_json(
                    f"{self.base_url}/{season}/{round}/laps.json?limit={page_size}&offset={off}",
                    f"laps:{season}:{round}:p{off}",
                    ttl,
                )
                for off in offsets
            ])
            for resp in pages:
                extra = resp["MRData"]["RaceTable"]["Races"]
                if extra:
                    all_laps_raw.extend(extra[0].get("Laps", []))

        # ── Build driverId → {code, team} from race results ───
        driver_map: dict[str, dict] = {}
        results_races = results_resp["MRData"]["RaceTable"]["Races"]
        if results_races:
            for r in results_races[0]["Results"]:
                did = r["Driver"]["driverId"]
                driver_map[did] = {
                    "code": r["Driver"].get("code", r["Driver"]["driverId"][:3].upper()),
                    "team": r["Constructor"]["name"],
                }

        raw_laps = sorted(all_laps_raw, key=lambda x: int(x["number"]))

        # ── Ordered driver list from lap-1 starting positions ─
        drivers_ordered: list[dict] = []
        seen_codes: set[str] = set()
        if raw_laps:
            for timing in sorted(raw_laps[0].get("Timings", []), key=lambda t: int(t["position"])):
                did = timing["driverId"]
                if did in driver_map and driver_map[did]["code"] not in seen_codes:
                    drivers_ordered.append(driver_map[did])
                    seen_codes.add(driver_map[did]["code"])
        for did, info in driver_map.items():
            if info["code"] not in seen_codes:
                drivers_ordered.append(info)
                seen_codes.add(info["code"])

        # ── Reshape into {lap, positions: {code: pos}} ────────
        lap_positions = []
        for lap in raw_laps:
            positions: dict[str, int] = {}
            for timing in lap.get("Timings", []):
                did = timing["driverId"]
                if did in driver_map:
                    positions[driver_map[did]["code"]] = int(timing["position"])
            lap_positions.append({"lap": int(lap["number"]), "positions": positions})

        total_laps = max((lp["lap"] for lp in lap_positions), default=0)

        return {
            "season": race_meta["season"],
            "round": race_meta["round"],
            "race_name": race_meta["raceName"],
            "total_laps": total_laps,
            "drivers": drivers_ordered,
            "laps": lap_positions,
        }


f1_service = F1Service()