from fastapi import APIRouter, HTTPException
from app.services.f1_service import f1_service


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

    Example calls:
    - /api/v1/f1/standings/drivers
    - /api/v1/f1/standings/drivers?season=2023
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