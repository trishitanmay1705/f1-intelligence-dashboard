import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class F1Service:
    def __init__(self):
        self.base_url = settings.jolpica_base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    ''' SEASONS '''

    async def get_season(self, season: str = "current") -> dict:
        ''' Get races for any season (year or "current") '''
        try:
            url = f"{self.base_url}/{season}.json"
            logger.info(f"Fetching season {season} from {url}")

            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
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
        ''' Get current season races (alias for get_season("current")) '''
        return await self.get_season("current")

    async def get_driver_standings(self, season: str = "current") -> dict:
        try:
            url = f"{self.base_url}/{season}/driverStandings.json"
            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
            standings_list = (
                data["MRData"]
                ["StandingsTable"]
                ["StandingsLists"]
            )

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
                        "driver_code": s["Driver"]["code"],
                        "driver_name": (
                            f"{s['Driver']['givenName']} "
                            f"{s['Driver']['familyName']}"
                        ),
                        "driver_number": s["Driver"].get(
                            "permanentNumber", "N/A"
                        ),
                        "nationality": s["Driver"]["nationality"],
                        "team": s["Constructors"][0]["name"],
                    }
                    for s in standings
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise

    async def get_constructor_standings(
        self, season: str = "current"
    ) -> dict:
        try:
            url = (
                f"{self.base_url}/{season}"
                f"/constructorStandings.json"
            )
            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
            standings_list = (
                data["MRData"]
                ["StandingsTable"]
                ["StandingsLists"]
            )

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
                        "nationality": (
                            s["Constructor"]["nationality"]
                        ),
                    }
                    for s in standings
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise

    async def get_race_results(
        self, season: str = "current", round: str = "last"
    ) -> dict:
        try:
            url = (
                f"{self.base_url}/{season}/{round}/results.json"
            )
            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
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
                        "driver_code": r["Driver"]["code"],
                        "driver_name": (
                            f"{r['Driver']['givenName']} "
                            f"{r['Driver']['familyName']}"
                        ),
                        "team": r["Constructor"]["name"],
                        "laps": r["laps"],
                        "status": r["status"],
                        "points": r["points"],
                        "grid": r["grid"],
                        "fastest_lap": r.get(
                            "FastestLap", {}
                        ).get("Time", {}).get("time", "N/A"),
                    }
                    for r in race["Results"]
                ],
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise


f1_service = F1Service()
