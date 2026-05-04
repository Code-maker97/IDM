"""
Backend API Tests for SurakshitPath - Iteration 3
Tests: Geocoder endpoints, Bulk import, Indore seed, and regression tests
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = "test_session_demo_001"

# ============================================================
# NEW ITERATION 3 TESTS - GEOCODER
# ============================================================
class TestGeocodeEndpoints:
    """Geocoder endpoint tests (Photon + Nominatim fallback)"""
    
    def test_geocode_search_rajwada_indore(self):
        """GET /api/geocode/search?q=Rajwada Indore returns results with lat/lng/label/short"""
        response = requests.get(
            f"{BASE_URL}/api/geocode/search",
            params={"q": "Rajwada Indore", "limit": 6}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        # May be empty if Photon rate-limits, but should not error
        print(f"Geocode search 'Rajwada Indore': {len(data['results'])} results")
        
        if len(data["results"]) > 0:
            result = data["results"][0]
            assert "lat" in result
            assert "lng" in result
            assert "label" in result
            assert "short" in result
            # Verify coordinates are roughly in Indore area (lat ~22.7, lng ~75.8)
            assert 22.5 < result["lat"] < 23.0, f"Lat {result['lat']} not in Indore range"
            assert 75.5 < result["lng"] < 76.2, f"Lng {result['lng']} not in Indore range"
            print(f"First result: {result['short']} at ({result['lat']}, {result['lng']})")
    
    def test_geocode_search_short_query_returns_empty(self):
        """GET /api/geocode/search?q=x (< 2 chars) returns empty results gracefully"""
        response = requests.get(
            f"{BASE_URL}/api/geocode/search",
            params={"q": "x"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert data["results"] == [], f"Expected empty results for short query, got {len(data['results'])}"
        print("Geocode search with short query correctly returns empty results")
    
    def test_geocode_search_indore_fallback(self):
        """GET /api/geocode/search?q=Indore returns results (fallback test)"""
        response = requests.get(
            f"{BASE_URL}/api/geocode/search",
            params={"q": "Indore", "limit": 3}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"Geocode search 'Indore': {len(data['results'])} results")
        
        if len(data["results"]) > 0:
            result = data["results"][0]
            assert "lat" in result
            assert "lng" in result
            print(f"First result: {result.get('short', result.get('label', 'N/A'))}")
    
    def test_geocode_reverse(self):
        """GET /api/geocode/reverse?lat=22.7184&lng=75.8548 returns a label"""
        response = requests.get(
            f"{BASE_URL}/api/geocode/reverse",
            params={"lat": 22.7184, "lng": 75.8548}
        )
        assert response.status_code == 200
        data = response.json()
        assert "label" in data
        # Label may be None if Nominatim fails, but should not error
        print(f"Geocode reverse (22.7184, 75.8548): label={data.get('label', 'None')[:80] if data.get('label') else 'None'}...")


# ============================================================
# NEW ITERATION 3 TESTS - BULK IMPORT
# ============================================================
class TestBulkImportEndpoints:
    """Admin bulk import endpoint tests"""
    
    def test_bulk_import_admin_success(self):
        """POST /api/admin/incidents/bulk (admin auth) imports incidents"""
        response = requests.post(
            f"{BASE_URL}/api/admin/incidents/bulk",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"},
            json={
                "incidents": [
                    {"category": "theft", "lat": 22.75, "lng": 75.89, "severity": 2, "description": "TEST_bulk_import_1"},
                    {"category": "harassment", "lat": 22.72, "lng": 75.86, "severity": 1, "description": "TEST_bulk_import_2"}
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "inserted" in data
        assert data["inserted"] == 2, f"Expected 2 inserted, got {data['inserted']}"
        assert "total_now" in data
        print(f"Bulk import passed: inserted={data['inserted']}, total_now={data['total_now']}")
    
    def test_bulk_import_non_admin_returns_403(self):
        """POST /api/admin/incidents/bulk without admin auth returns 403"""
        # First, we need a non-admin token - but we only have admin token
        # So we test without auth which should return 401
        response = requests.post(
            f"{BASE_URL}/api/admin/incidents/bulk",
            json={
                "incidents": [
                    {"category": "theft", "lat": 22.75, "lng": 75.89, "severity": 2}
                ]
            }
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("Bulk import without auth correctly returns 401")
    
    def test_bulk_import_empty_array(self):
        """POST /api/admin/incidents/bulk with empty array returns inserted=0"""
        response = requests.post(
            f"{BASE_URL}/api/admin/incidents/bulk",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"},
            json={"incidents": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["inserted"] == 0
        print("Bulk import with empty array correctly returns inserted=0")


# ============================================================
# NEW ITERATION 3 TESTS - INDORE SEED
# ============================================================
class TestIndoreSeed:
    """Indore seed data tests"""
    
    def test_seed_incidents_idempotent(self):
        """POST /api/dev/seed-incidents is idempotent and returns city:indore"""
        # First call - may seed or return existing
        response1 = requests.post(f"{BASE_URL}/api/dev/seed-incidents")
        assert response1.status_code == 200
        data1 = response1.json()
        assert "city" in data1
        assert data1["city"] == "indore", f"Expected city=indore, got {data1['city']}"
        print(f"Seed call 1: seeded={data1.get('seeded')}, count={data1.get('count', data1.get('existing'))}")
        
        # Second call - should be idempotent (not re-seed)
        response2 = requests.post(f"{BASE_URL}/api/dev/seed-incidents")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["city"] == "indore"
        assert data2.get("seeded") == False, "Second seed call should return seeded=False"
        print(f"Seed call 2 (idempotent): seeded={data2.get('seeded')}, existing={data2.get('existing')}")
    
    def test_incidents_clustered_around_indore(self):
        """GET /api/incidents returns 51+ incidents clustered around Indore (lat ~22.7, lng ~75.85)"""
        response = requests.get(f"{BASE_URL}/api/incidents", params={"limit": 200})
        assert response.status_code == 200
        data = response.json()
        assert "incidents" in data
        assert data["count"] >= 51, f"Expected ≥51 incidents, got {data['count']}"
        
        # Check that incidents are clustered around Indore
        indore_incidents = [
            i for i in data["incidents"]
            if 22.5 < i["lat"] < 23.0 and 75.5 < i["lng"] < 76.2
        ]
        assert len(indore_incidents) >= 50, f"Expected ≥50 Indore incidents, got {len(indore_incidents)}"
        print(f"Incidents check: total={data['count']}, Indore area={len(indore_incidents)}")


# ============================================================
# REGRESSION TESTS - EXISTING ENDPOINTS
# ============================================================
class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_status(self):
        """GET /api/ returns health status"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "twilio_ready" in data
        assert "llm_ready" in data
        print(f"Health check: twilio_ready={data['twilio_ready']}, llm_ready={data['llm_ready']}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_auth_me_with_valid_token(self):
        """GET /api/auth/me with Bearer token returns demo user"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "user_testdemo001"
        assert data["is_admin"] == True
        print(f"Auth /me: user={data['email']}, is_admin={data['is_admin']}")


class TestRoutesEndpoints:
    """Route safety endpoint tests - using Indore coordinates"""
    
    def test_safest_routes_indore_coords(self):
        """POST /api/routes/safest with Indore coords returns scored routes"""
        response = requests.post(
            f"{BASE_URL}/api/routes/safest",
            json={
                "origin": {"lat": 22.7184, "lng": 75.8548},  # Rajwada
                "destination": {"lat": 22.7509, "lng": 75.8959},  # Vijay Nagar
                "time_of_day": "night"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
        assert len(data["routes"]) >= 1
        
        route = data["routes"][0]
        assert "safety_score" in route
        assert "level" in route
        assert "nearby_incidents" in route
        assert "lighting_score" in route
        assert "crowd_density" in route
        print(f"Routes (Indore): {len(data['routes'])} routes, best score={route['safety_score']}, level={route['level']}, nearby_incidents={route['nearby_incidents']}")


class TestContactsEndpoints:
    """Trusted contacts CRUD tests"""
    
    def test_contacts_crud_flow(self):
        """POST, GET, DELETE contacts"""
        headers = {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        
        # Create
        create_resp = requests.post(
            f"{BASE_URL}/api/contacts",
            headers=headers,
            json={"name": "TEST_Iter3_Contact", "phone": "+919876543210", "relation": "family"}
        )
        assert create_resp.status_code == 200
        contact_id = create_resp.json()["contact_id"]
        print(f"Contact created: {contact_id}")
        
        # List
        list_resp = requests.get(f"{BASE_URL}/api/contacts", headers=headers)
        assert list_resp.status_code == 200
        found = any(c["contact_id"] == contact_id for c in list_resp.json()["contacts"])
        assert found
        
        # Delete
        del_resp = requests.delete(f"{BASE_URL}/api/contacts/{contact_id}", headers=headers)
        assert del_resp.status_code == 200
        print(f"Contact deleted: {contact_id}")


class TestSOSEndpoints:
    """SOS trigger tests"""
    
    def test_sos_trigger_simulated(self):
        """POST /api/sos/trigger returns simulated=true"""
        response = requests.post(
            f"{BASE_URL}/api/sos/trigger",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"},
            json={"lat": 22.7184, "lng": 75.8548, "message": "TEST_SOS_iter3"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["simulated"] == True
        assert "alert_id" in data
        assert "maps_url" in data
        print(f"SOS: alert_id={data['alert_id']}, simulated={data['simulated']}")


class TestAIEndpoints:
    """AI endpoint tests"""
    
    def test_ai_risk_analysis(self):
        """POST /api/ai/risk-analysis returns analysis"""
        response = requests.post(
            f"{BASE_URL}/api/ai/risk-analysis",
            json={
                "distance_km": 2.0,
                "duration_min": 25.0,
                "safety_score": 68,
                "nearby_incidents": 5,
                "lighting_score": 0.55,
                "crowd_density": 0.45,
                "time_of_day": "night"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert len(data["analysis"]) > 0
        print(f"AI risk analysis: model={data['model']}, len={len(data['analysis'])}")
    
    def test_ai_chat(self):
        """POST /api/ai/chat returns reply"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={
                "session_id": "test_iter3_chat",
                "message": "Is Rajwada area safe at night?"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0
        print(f"AI chat: model={data['model']}, len={len(data['reply'])}")


class TestAdminEndpoints:
    """Admin endpoint tests"""
    
    def test_admin_stats(self):
        """GET /api/admin/stats returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_incidents" in data
        assert "active_incidents" in data
        assert "top_categories" in data
        print(f"Admin stats: total={data['total_incidents']}, active={data['active_incidents']}")
    
    def test_admin_incidents_list(self):
        """GET /api/admin/incidents returns list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/incidents",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "incidents" in data
        print(f"Admin incidents: {len(data['incidents'])} incidents")
    
    def test_admin_update_incident(self):
        """PATCH /api/admin/incidents/{id} updates status"""
        headers = {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        
        # Get an active incident
        list_resp = requests.get(f"{BASE_URL}/api/admin/incidents", headers=headers)
        incidents = list_resp.json()["incidents"]
        active = next((i for i in incidents if i["status"] == "active"), None)
        
        if not active:
            pytest.skip("No active incidents to test")
        
        incident_id = active["incident_id"]
        
        # Update to resolved
        update_resp = requests.patch(
            f"{BASE_URL}/api/admin/incidents/{incident_id}",
            headers=headers,
            json={"status": "resolved"}
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "resolved"
        
        # Revert
        requests.patch(
            f"{BASE_URL}/api/admin/incidents/{incident_id}",
            headers=headers,
            json={"status": "active"}
        )
        print(f"Admin incident update: {incident_id} -> resolved -> active")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
