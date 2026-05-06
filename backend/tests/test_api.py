"""
Backend API Tests for Safe-Route Navigation System
Tests: Health, Auth, Incidents, Routes, Contacts, SOS, AI, Admin endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = os.getenv("TEST_SESSION_TOKEN", "test_session_demo_001")

class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_status(self):
        """GET /api/ returns health status with twilio_ready and llm_ready"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "twilio_ready" in data
        assert "llm_ready" in data
        assert data["status"] == "ok"
        assert data["service"] == "safe-route-api"
        print(f"Health check passed: twilio_ready={data['twilio_ready']}, llm_ready={data['llm_ready']}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_auth_session_invalid_returns_401(self):
        """POST /api/auth/session with invalid session_id returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/session",
            json={"session_id": "invalid_session_id_12345"}
        )
        assert response.status_code == 401
        print("Invalid session_id correctly returns 401")
    
    def test_auth_me_with_valid_token(self):
        """GET /api/auth/me with Bearer test_session_demo_001 returns demo user"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "user_testdemo001"
        assert data["email"] == "demo@aegis.test"
        assert data["is_admin"] is True
        print(f"Auth /me passed: user={data['email']}, is_admin={data['is_admin']}")
    
    def test_auth_me_without_token_returns_401(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("Auth /me without token correctly returns 401")


class TestIncidentsEndpoints:
    """Incidents CRUD endpoint tests"""
    
    def test_list_incidents_returns_seeded_data(self):
        """GET /api/incidents returns ≥12 seeded incidents"""
        response = requests.get(f"{BASE_URL}/api/incidents")
        assert response.status_code == 200
        data = response.json()
        assert "incidents" in data
        assert "count" in data
        assert data["count"] >= 12, f"Expected ≥12 incidents, got {data['count']}"
        print(f"Incidents list passed: {data['count']} incidents found")
    
    def test_create_incident_authenticated(self):
        """POST /api/incidents (authed) creates incident"""
        response = requests.post(
            f"{BASE_URL}/api/incidents",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"},
            json={
                "category": "harassment",
                "description": "TEST_automated_test_incident",
                "lat": 12.9750,
                "lng": 77.6100,
                "severity": 2,
                "time_of_day": "night"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "incident_id" in data
        assert data["category"] == "harassment"
        assert data["severity"] == 2
        assert data["status"] == "active"
        print(f"Incident created: {data['incident_id']}")
        return data["incident_id"]
    
    def test_create_incident_unauthenticated_returns_401(self):
        """POST /api/incidents without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/incidents",
            json={
                "category": "theft",
                "lat": 12.9750,
                "lng": 77.6100,
                "severity": 1
            }
        )
        assert response.status_code == 401
        print("Unauthenticated incident creation correctly returns 401")
    
    def test_incidents_heatmap(self):
        """GET /api/incidents/heatmap returns points array"""
        response = requests.get(f"{BASE_URL}/api/incidents/heatmap")
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert "count" in data
        assert isinstance(data["points"], list)
        if data["count"] > 0:
            # Each point should be [lat, lng, severity]
            assert len(data["points"][0]) == 3
        print(f"Heatmap passed: {data['count']} points")


class TestRoutesEndpoints:
    """Route safety endpoint tests"""
    
    def test_safest_routes_returns_scored_routes(self):
        """POST /api/routes/safest returns ≥1 route with required fields"""
        response = requests.post(
            f"{BASE_URL}/api/routes/safest",
            json={
                "origin": {"lat": 12.9716, "lng": 77.5946},
                "destination": {"lat": 12.9758, "lng": 77.6063},
                "time_of_day": "night"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
        assert len(data["routes"]) >= 1, "Expected at least 1 route"
        
        route = data["routes"][0]
        # Verify required fields
        assert "geometry" in route
        assert "safety_score" in route
        assert 0 <= route["safety_score"] <= 100
        assert route["level"] in ["safe", "caution", "danger"]
        assert "nearby_incidents" in route
        assert isinstance(route["nearby_incidents"], int)
        assert "lighting_score" in route
        assert "crowd_density" in route
        assert "distance_km" in route
        assert "duration_min" in route
        
        print(f"Routes passed: {len(data['routes'])} routes, best score={route['safety_score']}, level={route['level']}")


class TestContactsEndpoints:
    """Trusted contacts CRUD endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for contacts tests"""
        self.headers = {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
    
    def test_contacts_crud_flow(self):
        """POST /api/contacts, GET /api/contacts, DELETE /api/contacts/{id}"""
        headers = {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        
        # Create contact
        create_response = requests.post(
            f"{BASE_URL}/api/contacts",
            headers=headers,
            json={
                "name": "TEST_Contact",
                "phone": "+14155551234",
                "relation": "friend"
            }
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert "contact_id" in created
        assert created["name"] == "TEST_Contact"
        contact_id = created["contact_id"]
        print(f"Contact created: {contact_id}")
        
        # List contacts - verify it exists
        list_response = requests.get(f"{BASE_URL}/api/contacts", headers=headers)
        assert list_response.status_code == 200
        contacts = list_response.json()["contacts"]
        found = any(c["contact_id"] == contact_id for c in contacts)
        assert found, "Created contact not found in list"
        print(f"Contact found in list: {len(contacts)} total contacts")
        
        # Delete contact
        delete_response = requests.delete(
            f"{BASE_URL}/api/contacts/{contact_id}",
            headers=headers
        )
        assert delete_response.status_code == 200
        print(f"Contact deleted: {contact_id}")
        
        # Verify deletion
        list_after = requests.get(f"{BASE_URL}/api/contacts", headers=headers)
        contacts_after = list_after.json()["contacts"]
        not_found = not any(c["contact_id"] == contact_id for c in contacts_after)
        assert not_found, "Contact still exists after deletion"
        print("Contact deletion verified")


class TestSOSEndpoints:
    """SOS trigger endpoint tests"""
    
    def test_sos_trigger_returns_simulated(self):
        """POST /api/sos/trigger (authed) returns alert_id, contacts_notified, simulated=true, maps_url"""
        response = requests.post(
            f"{BASE_URL}/api/sos/trigger",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"},
            json={
                "lat": 12.9716,
                "lng": 77.5946,
                "message": "TEST_Emergency alert"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "alert_id" in data
        assert "contacts_notified" in data
        assert "simulated" in data
        assert data["simulated"] is True, "Expected simulated=true (Twilio not configured)"
        assert "maps_url" in data
        assert "maps.google.com" in data["maps_url"]
        print(f"SOS triggered: alert_id={data['alert_id']}, contacts_notified={data['contacts_notified']}, simulated={data['simulated']}")
    
    def test_sos_trigger_unauthenticated_returns_401(self):
        """POST /api/sos/trigger without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/sos/trigger",
            json={"lat": 12.9716, "lng": 77.5946}
        )
        assert response.status_code == 401
        print("Unauthenticated SOS correctly returns 401")


class TestAIEndpoints:
    """AI (GPT-5.2 and Gemini) endpoint tests"""
    
    def test_ai_risk_analysis(self):
        """POST /api/ai/risk-analysis returns non-empty analysis text"""
        response = requests.post(
            f"{BASE_URL}/api/ai/risk-analysis",
            json={
                "distance_km": 1.5,
                "duration_min": 18.0,
                "safety_score": 72,
                "nearby_incidents": 2,
                "lighting_score": 0.65,
                "crowd_density": 0.55,
                "time_of_day": "night"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert len(data["analysis"]) > 0, "Analysis text should not be empty"
        assert "model" in data
        print(f"AI risk analysis passed: model={data['model']}, analysis_length={len(data['analysis'])}")
    
    def test_ai_chat_returns_reply(self):
        """POST /api/ai/chat returns a reply"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={
                "session_id": "test_chat_session_001",
                "message": "What should I do if I feel unsafe walking at night?"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0, "Reply should not be empty"
        assert "session_id" in data
        assert "model" in data
        print(f"AI chat passed: model={data['model']}, reply_length={len(data['reply'])}")


class TestAdminEndpoints:
    """Admin endpoint tests"""
    
    def test_admin_stats(self):
        """GET /api/admin/stats (authed admin) returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_incidents" in data
        assert "active_incidents" in data
        assert "top_categories" in data
        assert isinstance(data["top_categories"], list)
        print(f"Admin stats passed: total={data['total_incidents']}, active={data['active_incidents']}")
    
    def test_admin_list_incidents(self):
        """GET /api/admin/incidents (authed admin) returns incidents list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/incidents",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "incidents" in data
        assert isinstance(data["incidents"], list)
        print(f"Admin incidents list passed: {len(data['incidents'])} incidents")
    
    def test_admin_update_incident_status(self):
        """PATCH /api/admin/incidents/{id} updates status"""
        headers = {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        
        # First get an incident to update
        list_response = requests.get(f"{BASE_URL}/api/admin/incidents", headers=headers)
        incidents = list_response.json()["incidents"]
        
        # Find an active incident to update
        active_incident = next((i for i in incidents if i["status"] == "active"), None)
        if not active_incident:
            pytest.skip("No active incidents to test update")
        
        incident_id = active_incident["incident_id"]
        
        # Update to resolved
        update_response = requests.patch(
            f"{BASE_URL}/api/admin/incidents/{incident_id}",
            headers=headers,
            json={"status": "resolved"}
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["status"] == "resolved"
        print(f"Admin incident update passed: {incident_id} -> resolved")
        
        # Revert back to active for other tests
        requests.patch(
            f"{BASE_URL}/api/admin/incidents/{incident_id}",
            headers=headers,
            json={"status": "active"}
        )
    
    def test_admin_stats_unauthenticated_returns_401(self):
        """GET /api/admin/stats without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("Unauthenticated admin stats correctly returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
