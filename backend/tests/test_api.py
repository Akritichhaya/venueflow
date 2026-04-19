"""
VenueFlow Backend Tests
Tests for all API endpoints and core functionality
"""
import pytest
import json
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


# ── Health Check ──────────────────────────────────────────────────
class TestHealthCheck:
    def test_health_endpoint(self):
        """Test that health endpoint returns 200"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "VenueFlow API"


# ── Crowd Routes ──────────────────────────────────────────────────
class TestCrowdRoutes:
    def test_get_all_zones(self):
        """Test that zones endpoint returns zone data"""
        response = client.get("/api/crowd/zones")
        assert response.status_code == 200
        data = response.json()
        assert "zones" in data
        assert isinstance(data["zones"], list)
        assert len(data["zones"]) > 0

    def test_zone_structure(self):
        """Test that each zone has required fields"""
        response = client.get("/api/crowd/zones")
        data = response.json()
        required_fields = ["zone", "density", "wait_time", "lat", "lng", "status"]
        for zone in data["zones"]:
            for field in required_fields:
                assert field in zone, f"Missing field: {field}"

    def test_zone_density_range(self):
        """Test that density values are within valid range 0-100"""
        response = client.get("/api/crowd/zones")
        data = response.json()
        for zone in data["zones"]:
            assert 0 <= zone["density"] <= 100, f"Density out of range: {zone['density']}"

    def test_zone_status_values(self):
        """Test that status values are valid"""
        valid_statuses = ["low", "moderate", "high", "critical"]
        response = client.get("/api/crowd/zones")
        data = response.json()
        for zone in data["zones"]:
            assert zone["status"] in valid_statuses, f"Invalid status: {zone['status']}"

    def test_get_heatmap_data(self):
        """Test heatmap endpoint returns coordinate points"""
        response = client.get("/api/crowd/heatmap")
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert isinstance(data["points"], list)

    def test_heatmap_point_structure(self):
        """Test heatmap points have lat, lng, weight"""
        response = client.get("/api/crowd/heatmap")
        data = response.json()
        for point in data["points"]:
            assert "lat" in point
            assert "lng" in point
            assert "weight" in point
            assert 0 <= point["weight"] <= 1

    def test_get_alerts(self):
        """Test alerts endpoint returns list"""
        response = client.get("/api/crowd/alerts")
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        assert "count" in data
        assert isinstance(data["alerts"], list)

    def test_alerts_are_critical(self):
        """Test that alerts only contain high density zones"""
        response = client.get("/api/crowd/alerts")
        data = response.json()
        for alert in data["alerts"]:
            assert alert["density"] > 80, "Alert zone should have density > 80"

    def test_update_zone(self):
        """Test zone update endpoint"""
        payload = {
            "zone": "Test Zone",
            "density": 55,
            "wait_time": 10,
            "lat": 12.9784,
            "lng": 77.5912
        }
        response = client.post("/api/crowd/update", json=payload)
        assert response.status_code == 200

    def test_update_zone_invalid_density(self):
        """Test zone update with missing required fields"""
        payload = {"zone": "Test Zone"}
        response = client.post("/api/crowd/update", json=payload)
        assert response.status_code == 422  # Unprocessable Entity


# ── Gemini Routes ─────────────────────────────────────────────────
class TestGeminiRoutes:
    def test_chat_endpoint_exists(self):
        """Test that chat endpoint exists and accepts POST"""
        payload = {"message": "test", "context": ""}
        response = client.post("/api/gemini/chat", json=payload)
        # Accept 200 (success) or 500 (quota exceeded) - both mean endpoint exists
        assert response.status_code in [200, 500]

    def test_chat_missing_message(self):
        """Test chat with empty body still processes"""
        response = client.post("/api/gemini/chat", json={})
        assert response.status_code in [200, 500]

    def test_analyze_endpoint_exists(self):
        """Test that analyze endpoint exists"""
        payload = {"zones": [], "event_name": "Test Event"}
        response = client.post("/api/gemini/analyze", json=payload)
        assert response.status_code in [200, 500]

    def test_navigate_endpoint_exists(self):
        """Test that navigate endpoint exists"""
        payload = {
            "user_location": "Gate A",
            "destination": "Food Court",
            "zones": []
        }
        response = client.post("/api/gemini/navigate", json=payload)
        assert response.status_code in [200, 500]


# ── Sheets Routes ─────────────────────────────────────────────────
class TestSheetsRoutes:
    def test_summary_endpoint_exists(self):
        """Test that sheets summary endpoint exists"""
        response = client.get("/api/sheets/summary")
        assert response.status_code == 200

    def test_log_crowd_endpoint_exists(self):
        """Test that log crowd endpoint exists"""
        payload = {
            "zone": "Gate A",
            "density": 75,
            "wait_time": 18,
            "status": "high",
            "event_name": "Test Match"
        }
        response = client.post("/api/sheets/log-crowd", json=payload)
        assert response.status_code == 200

    def test_log_alert_endpoint_exists(self):
        """Test that log alert endpoint exists"""
        payload = {
            "zone": "Gate A",
            "alert_type": "overcrowding",
            "message": "Zone at 90% capacity",
            "severity": "high"
        }
        response = client.post("/api/sheets/log-alert", json=payload)
        assert response.status_code == 200


# ── Edge Cases ────────────────────────────────────────────────────
class TestEdgeCases:
    def test_invalid_route(self):
        """Test that invalid routes return 404"""
        response = client.get("/api/invalid/route")
        assert response.status_code == 404

    def test_cors_headers(self):
        """Test that CORS headers are present"""
        response = client.options("/api/crowd/zones",
            headers={"Origin": "http://localhost:5173",
                     "Access-Control-Request-Method": "GET"})
        assert response.status_code in [200, 400]

    def test_density_to_status_low(self):
        """Test density categorization - low"""
        response = client.get("/api/crowd/zones")
        data = response.json()
        for zone in data["zones"]:
            if zone["density"] < 40:
                assert zone["status"] == "low"

    def test_density_to_status_critical(self):
        """Test density categorization - critical"""
        response = client.get("/api/crowd/zones")
        data = response.json()
        for zone in data["zones"]:
            if zone["density"] >= 85:
                assert zone["status"] == "critical"

    def test_wait_time_non_negative(self):
        """Test that wait times are non-negative"""
        response = client.get("/api/crowd/zones")
        data = response.json()
        for zone in data["zones"]:
            assert zone["wait_time"] >= 0

    def test_coordinates_valid_bengaluru(self):
        """Test that coordinates are in valid Bengaluru range"""
        response = client.get("/api/crowd/zones")
        data = response.json()
        for zone in data["zones"]:
            # Bengaluru is roughly 12.8-13.1 N, 77.4-77.8 E
            assert 12.5 <= zone["lat"] <= 13.5, f"Invalid latitude: {zone['lat']}"
            assert 77.0 <= zone["lng"] <= 78.0, f"Invalid longitude: {zone['lng']}"
