# backend/app/api/routes/f1.py

from fastapi import APIRouter, HTTPException
from app.services.f1_service import f1_service
from app.services.cache import cache


router = APIRouter(prefix="/f1", tags=["F1 Data"])


# ══════════════════════════════════════════════════
# SEASON ENDPOINTS
# ══════════════════════════════════════════════════

@router.get("/season/current")
async def get_current_season():
    """Get the current F1 season race calendar."""
    try:
        data = await f1_service.get_season("current")
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch season data: {str(e)}")


@router.get("/season/{season}")
async def get_season(season: str):
    """
    Get race calendar for any season.
    Path parameter:
    - season: year e.g. "2024", "2023", or "current"
    Example: /api/v1/f1/season/2023
    """
    try:
        data = await f1_service.get_season(season)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch season {season}: {str(e)}")


# ══════════════════════════════════════════════════
# STANDINGS ENDPOINTS
# ══════════════════════════════════════════════════

@router.get("/standings/drivers")
async def get_driver_standings(season: str = "current"):
    """
    Get driver championship standings.
    Query parameter:
    - season: "current" (default) or year e.g. "2023"
    """
    try:
        data = await f1_service.get_driver_standings(season)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch driver standings: {str(e)}"
        )


@router.get("/standings/constructors")
async def get_constructor_standings(season: str = "current"):
    """
    Get constructor championship standings.
    Query parameter:
    - season: "current" (default) or year e.g. "2023"
    """
    try:
        data = await f1_service.get_constructor_standings(season)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch constructor standings: {str(e)}"
        )


# ══════════════════════════════════════════════════
# RACE RESULTS ENDPOINTS
# ══════════════════════════════════════════════════

@router.get("/results/last")
async def get_last_race_results():
    """Get results from the most recent race."""
    try:
        data = await f1_service.get_race_results(
            season="current",
            round="last"
        )
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch race results: {str(e)}"
        )


@router.get("/results/{season}/{round}")
async def get_race_results(season: str, round: str):
    """
    Get race results for a specific season and round.
    Path parameters:
    - season: e.g. "2024", "2023"
    - round:  e.g. "1", "5", "last"
    Example: /api/v1/f1/results/2024/1
    """
    try:
        data = await f1_service.get_race_results(season, round)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch results: {str(e)}"
        )


@router.get("/qualifying/{season}/{round}")
async def get_qualifying_results(season: str, round: str):
    """
    Get qualifying results for a specific race.
    Path parameters:
    - season: e.g. "2024", "2023"
    - round:  e.g. "1", "5"
    Example: /api/v1/f1/qualifying/2024/1
    """
    try:
        data = await f1_service.get_qualifying_results(season, round)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch qualifying results: {str(e)}"
        )


@router.get("/sprint/{season}/{round}")
async def get_sprint_results(season: str, round: str):
    """
    Get sprint race results for a specific race weekend.
    Path parameters:
    - season: e.g. "2024", "2023"
    - round:  e.g. "1", "5"
    Example: /api/v1/f1/sprint/2024/5
    """
    try:
        data = await f1_service.get_sprint_results(season, round)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch sprint results: {str(e)}"
        )


@router.get("/laps/{season}/{round}")
async def get_lap_data(season: str, round: str):
    """
    Get lap-by-lap position data for every driver in a race.
    Path parameters:
    - season: e.g. "2024", "2023"
    - round:  e.g. "1", "5"
    Example: /api/v1/f1/laps/2024/1
    """
    try:
        data = await f1_service.get_lap_data(season, round)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch lap data: {str(e)}"
        )


# ══════════════════════════════════════════════════
# ADMIN / DEV UTILITIES
# ══════════════════════════════════════════════════

@router.api_route("/admin/cache/clear", methods=["GET", "POST"])
async def clear_cache():
    """Clear all cached data. Dev utility."""
    count = cache.clear()
    return {"success": True, "cleared": count}


# ══════════════════════════════════════════════════
# DRIVER ENDPOINTS
# ══════════════════════════════════════════════════

@router.get("/drivers")
async def list_drivers(season: str = "current"):
    """
    List all drivers in a season.
    Query parameter:
    - season: "current" (default) or year e.g. "2023"
    """
    try:
        data = await f1_service.list_drivers_in_season(season)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to list drivers: {str(e)}")


@router.get("/drivers/{driver_id}")
async def get_driver(driver_id: str):
    """
    Get a driver's bio.
    Path parameter:
    - driver_id: Ergast driver ID, e.g. "max_verstappen", "hamilton", "leclerc"
    """
    try:
        data = await f1_service.get_driver(driver_id)
        if not data:
            raise HTTPException(status_code=404, detail=f"Driver '{driver_id}' not found")
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch driver: {str(e)}")


@router.get("/drivers/{driver_id}/career")
async def get_driver_career(driver_id: str):
    """
    Get a driver's full career stats across all seasons.
    Includes: bio, totals (championships, wins, podiums, poles, points),
    teams driven for, season-by-season breakdown.
    """
    try:
        data = await f1_service.get_driver_career(driver_id)
        if not data:
            raise HTTPException(status_code=404, detail=f"Driver '{driver_id}' not found")
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch career: {str(e)}")