"""
Backend API smoke tests.

These tests use FastAPI's built-in TestClient (Starlette) so they run
entirely in-process — no network calls to Jolpica are made.
External HTTP calls are mocked where necessary.
"""

from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Root / health ──────────────────────────────────────────────

def test_root_returns_200():
    """The root endpoint should identify the API."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "F1" in data["message"]
    assert "version" in data


def test_docs_accessible():
    """Swagger UI should be served at /api/docs."""
    response = client.get("/api/docs")
    assert response.status_code == 200


# ── Cache admin ────────────────────────────────────────────────

def test_cache_clear_returns_success():
    """Cache clear endpoint should respond with success=True."""
    response = client.get("/api/v1/f1/admin/cache/clear")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "cleared" in data


# ── Standings ──────────────────────────────────────────────────

def test_standings_drivers_service_error_returns_503():
    """If the upstream service throws, the endpoint returns 503 (not 500)."""
    with patch(
        "app.services.f1_service.f1_service.get_driver_standings",
        side_effect=Exception("upstream down"),
    ):
        response = client.get("/api/v1/f1/standings/drivers?season=current")
    assert response.status_code == 503


def test_standings_constructors_service_error_returns_503():
    with patch(
        "app.services.f1_service.f1_service.get_constructor_standings",
        side_effect=Exception("upstream down"),
    ):
        response = client.get("/api/v1/f1/standings/constructors?season=current")
    assert response.status_code == 503


# ── Race results ───────────────────────────────────────────────

def test_race_results_service_error_returns_503():
    with patch(
        "app.services.f1_service.f1_service.get_race_results",
        side_effect=Exception("upstream down"),
    ):
        response = client.get("/api/v1/f1/results/2024/1")
    assert response.status_code == 503


def test_race_results_success_shape():
    """A successful race results response wraps data under 'data' key."""
    mock_payload = {
        "season": "2024",
        "round": "1",
        "race_name": "Bahrain Grand Prix",
        "circuit": "Bahrain International Circuit",
        "country": "Bahrain",
        "date": "2024-03-02",
        "results": [],
    }
    with patch(
        "app.services.f1_service.f1_service.get_race_results",
        return_value=mock_payload,
    ):
        response = client.get("/api/v1/f1/results/2024/1")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["season"] == "2024"
    assert body["data"]["race_name"] == "Bahrain Grand Prix"


# ── Laps ───────────────────────────────────────────────────────

def test_laps_service_error_returns_503():
    with patch(
        "app.services.f1_service.f1_service.get_lap_data",
        side_effect=Exception("upstream down"),
    ):
        response = client.get("/api/v1/f1/laps/2024/1")
    assert response.status_code == 503


def test_laps_success_shape():
    mock_payload = {
        "season": "2024",
        "round": "1",
        "race_name": "Bahrain Grand Prix",
        "total_laps": 57,
        "drivers": [{"code": "VER", "team": "Red Bull"}],
        "laps": [{"lap": 1, "positions": {"VER": 1}}],
    }
    with patch(
        "app.services.f1_service.f1_service.get_lap_data",
        return_value=mock_payload,
    ):
        response = client.get("/api/v1/f1/laps/2024/1")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total_laps"] == 57
    assert len(body["data"]["laps"]) == 1


# ── Season calendar ────────────────────────────────────────────

def test_season_service_error_returns_503():
    with patch(
        "app.services.f1_service.f1_service.get_season",
        side_effect=Exception("upstream down"),
    ):
        response = client.get("/api/v1/f1/season/2024")
    assert response.status_code == 503


def test_season_success_shape():
    mock_payload = {
        "season": "2024",
        "total_races": 24,
        "races": [],
    }
    with patch(
        "app.services.f1_service.f1_service.get_season",
        return_value=mock_payload,
    ):
        response = client.get("/api/v1/f1/season/2024")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total_races"] == 24
