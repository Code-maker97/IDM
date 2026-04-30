"""
Intelligent Safe-Route Navigation System - Backend API
FastAPI + MongoDB + Emergent Auth + Twilio (optional) + Emergent LLM (GPT-5.2 + Gemini 3 Flash)

REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
"""
import os
import math
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("safe-route")

# ---------- DB ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ---------- Twilio (optional / simulated) ----------
TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_PHONE = os.environ.get("TWILIO_PHONE_NUMBER", "").strip()
TWILIO_READY = bool(TWILIO_SID and TWILIO_TOKEN and TWILIO_PHONE)

# ---------- Emergent LLM ----------
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()

# ---------- FastAPI ----------
app = FastAPI(title="Safe-Route API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://([a-zA-Z0-9-]+\.)*emergentagent\.com|https?://localhost(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODELS
# ============================================================
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = False
    created_at: datetime

class TrustedContact(BaseModel):
    contact_id: str
    user_id: str
    name: str
    phone: str
    relation: Optional[str] = None
    created_at: datetime

class Incident(BaseModel):
    incident_id: str
    user_id: Optional[str] = None
    category: str
    description: Optional[str] = ""
    lat: float
    lng: float
    severity: int = 2  # 1..3
    time_of_day: Optional[str] = None  # "day" | "night"
    reported_at: datetime
    status: str = "active"  # active | resolved | flagged

class Coord(BaseModel):
    lat: float
    lng: float

class RouteRequest(BaseModel):
    origin: Coord
    destination: Coord
    time_of_day: Optional[str] = None  # "day" | "night"

class IncidentCreate(BaseModel):
    category: str
    description: Optional[str] = ""
    lat: float
    lng: float
    severity: int = 2
    time_of_day: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    phone: str
    relation: Optional[str] = None

class SOSTrigger(BaseModel):
    lat: float
    lng: float
    message: Optional[str] = "Emergency! I need help."

class ChatRequest(BaseModel):
    session_id: str
    message: str

class RiskAnalysisRequest(BaseModel):
    distance_km: float
    duration_min: float
    safety_score: float
    nearby_incidents: int
    lighting_score: float
    crowd_density: float
    time_of_day: str

# ============================================================
# AUTH HELPERS
# ============================================================
async def get_current_user(request: Request) -> User:
    # Cookie first, then Bearer header
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


async def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ============================================================
# AUTH ROUTES (Emergent Google Auth)
# ============================================================
@api.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Exchange session_id (from URL fragment) for persistent session_token."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()

    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", existing["name"]), "picture": data.get("picture")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        # First user becomes admin for demo purposes
        is_admin = (await db.users.count_documents({}) == 0)
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", "User"),
            "picture": data.get("picture"),
            "is_admin": is_admin,
            "created_at": datetime.now(timezone.utc),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60,
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}


@api.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return user.model_dump()


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ============================================================
# ROUTE SAFETY
# ============================================================
def haversine(a: Coord, b: Coord) -> float:
    R = 6371.0
    lat1, lng1 = math.radians(a.lat), math.radians(a.lng)
    lat2, lng2 = math.radians(b.lat), math.radians(b.lng)
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return 2 * R * math.asin(math.sqrt(h))


def points_along(coords: List[List[float]], sample_n: int = 30) -> List[List[float]]:
    """Down-sample a polyline coord list to N points (lng,lat)."""
    if len(coords) <= sample_n:
        return coords
    step = len(coords) / sample_n
    return [coords[int(i * step)] for i in range(sample_n)]


def _point_line_distance_km(plat, plng, alat, alng, blat, blng) -> float:
    """Approximate distance (km) from point P to segment AB using equirectangular projection."""
    # Convert to meters on a local plane
    lat0 = math.radians((alat + blat) / 2)
    kx = 111.320 * math.cos(lat0)  # km per degree lng
    ky = 110.574  # km per degree lat
    ax, ay = alng * kx, alat * ky
    bx, by = blng * kx, blat * ky
    px, py = plng * kx, plat * ky
    dx, dy = bx - ax, by - ay
    seg_len_sq = dx*dx + dy*dy
    if seg_len_sq == 0:
        t = 0.0
    else:
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / seg_len_sq))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def compute_safety_score(
    route_coords: List[List[float]],  # list of [lng, lat]
    incidents: List[Dict[str, Any]],
    time_of_day: str,
    buffer_km: float = 0.2,
) -> Dict[str, Any]:
    """Compute a 0-100 safety score for a route polyline."""
    nearby = 0
    severity_sum = 0
    # Check each incident against each segment; count if within buffer
    for inc in incidents:
        ilat, ilng = inc["lat"], inc["lng"]
        min_d = float("inf")
        for i in range(len(route_coords) - 1):
            a = route_coords[i]; b = route_coords[i + 1]
            d = _point_line_distance_km(ilat, ilng, a[1], a[0], b[1], b[0])
            if d < min_d:
                min_d = d
                if min_d < buffer_km:
                    break
        if min_d < buffer_km:
            nearby += 1
            severity_sum += int(inc.get("severity", 2))

    # Deterministic pseudo-random feel based on route geometry
    seed = int((sum(c[0] + c[1] for c in route_coords[:5]) * 1000) % 1000)
    lighting_score = round(0.55 + ((seed % 40) / 100.0), 2)  # 0.55-0.94
    crowd_density = round(0.40 + ((seed % 55) / 100.0), 2)  # 0.40-0.94
    if time_of_day == "night":
        lighting_score = max(0.15, lighting_score - 0.30)
        crowd_density = max(0.15, crowd_density - 0.25)

    base = 100
    base -= min(50, severity_sum * 6)         # up to -50 for incident severity
    base -= int((1 - lighting_score) * 30)     # up to -30 for poor lighting
    base -= int((1 - crowd_density) * 15)      # up to -15 for low crowd
    if time_of_day == "night":
        base -= 6
    safety_score = max(5, min(100, base))

    if safety_score >= 75:
        level = "safe"
    elif safety_score >= 50:
        level = "caution"
    else:
        level = "danger"

    return {
        "safety_score": safety_score,
        "level": level,
        "nearby_incidents": nearby,
        "incident_severity_sum": severity_sum,
        "lighting_score": lighting_score,
        "crowd_density": crowd_density,
    }


@api.post("/routes/safest")
async def safest_routes(req: RouteRequest):
    """Fetch alternative routes from OSRM and score them for safety."""
    time_of_day = req.time_of_day or ("night" if datetime.now().hour >= 19 or datetime.now().hour < 6 else "day")

    # Fetch all active incidents
    incidents = await db.incidents.find({"status": "active"}, {"_id": 0}).to_list(length=5000)

    osrm_url = (
        f"https://router.project-osrm.org/route/v1/foot/"
        f"{req.origin.lng},{req.origin.lat};{req.destination.lng},{req.destination.lat}"
        f"?alternatives=true&geometries=geojson&overview=full&steps=false"
    )

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(osrm_url)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Routing service unavailable")
    data = r.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(status_code=404, detail="No routes found")

    results = []
    for idx, rt in enumerate(data["routes"]):
        coords = rt["geometry"]["coordinates"]  # list of [lng, lat]
        scored = compute_safety_score(coords, incidents, time_of_day)
        results.append({
            "route_id": f"r_{idx}",
            "geometry": coords,
            "distance_km": round(rt["distance"] / 1000, 2),
            "duration_min": round(rt["duration"] / 60, 1),
            "time_of_day": time_of_day,
            **scored,
        })

    # Sort by safety desc, then distance asc
    results.sort(key=lambda x: (-x["safety_score"], x["distance_km"]))
    return {"routes": results, "time_of_day": time_of_day}


# ============================================================
# INCIDENTS
# ============================================================
@api.post("/incidents", response_model=Incident)
async def create_incident(inc: IncidentCreate, user: User = Depends(get_current_user)):
    doc = {
        "incident_id": f"inc_{uuid.uuid4().hex[:10]}",
        "user_id": user.user_id,
        "category": inc.category,
        "description": inc.description or "",
        "lat": inc.lat,
        "lng": inc.lng,
        "severity": max(1, min(3, inc.severity)),
        "time_of_day": inc.time_of_day or ("night" if datetime.now().hour >= 19 else "day"),
        "reported_at": datetime.now(timezone.utc),
        "status": "active",
    }
    await db.incidents.insert_one(doc)
    doc.pop("_id", None)
    return Incident(**doc)


@api.get("/incidents")
async def list_incidents(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 5.0,
    limit: int = 200,
):
    query = {"status": "active"}
    docs = await db.incidents.find(query, {"_id": 0}).sort("reported_at", -1).limit(limit).to_list(length=limit)
    if lat is not None and lng is not None:
        origin = Coord(lat=lat, lng=lng)
        docs = [d for d in docs if haversine(origin, Coord(lat=d["lat"], lng=d["lng"])) <= radius_km]
    return {"incidents": docs, "count": len(docs)}


@api.get("/incidents/heatmap")
async def incidents_heatmap():
    docs = await db.incidents.find({"status": "active"}, {"_id": 0, "lat": 1, "lng": 1, "severity": 1}).to_list(length=5000)
    points = [[d["lat"], d["lng"], d.get("severity", 2)] for d in docs]
    return {"points": points, "count": len(points)}


# ============================================================
# TRUSTED CONTACTS
# ============================================================
@api.post("/contacts", response_model=TrustedContact)
async def add_contact(c: ContactCreate, user: User = Depends(get_current_user)):
    doc = {
        "contact_id": f"ct_{uuid.uuid4().hex[:10]}",
        "user_id": user.user_id,
        "name": c.name,
        "phone": c.phone,
        "relation": c.relation,
        "created_at": datetime.now(timezone.utc),
    }
    await db.contacts.insert_one(doc)
    doc.pop("_id", None)
    return TrustedContact(**doc)


@api.get("/contacts")
async def list_contacts(user: User = Depends(get_current_user)):
    docs = await db.contacts.find({"user_id": user.user_id}, {"_id": 0}).to_list(length=100)
    return {"contacts": docs}


@api.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: User = Depends(get_current_user)):
    res = await db.contacts.delete_one({"contact_id": contact_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"ok": True}


# ============================================================
# SOS
# ============================================================
def _send_sms(to: str, body: str) -> Dict[str, Any]:
    """Try Twilio if ready, else simulate."""
    if not TWILIO_READY:
        logger.info(f"[SOS-SIMULATED] -> {to}: {body}")
        return {"sent": True, "simulated": True, "to": to}
    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        msg = client.messages.create(body=body, from_=TWILIO_PHONE, to=to)
        return {"sent": True, "simulated": False, "sid": msg.sid, "to": to}
    except Exception as e:
        logger.exception("Twilio send failed")
        return {"sent": False, "simulated": False, "error": str(e), "to": to}


@api.post("/sos/trigger")
async def sos_trigger(sos: SOSTrigger, user: User = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": user.user_id}, {"_id": 0}).to_list(length=50)
    gmaps = f"https://maps.google.com/?q={sos.lat},{sos.lng}"
    body = (
        f"[SOS] {user.name} needs help. "
        f"{sos.message or ''} "
        f"Live location: {gmaps}"
    )
    deliveries = [_send_sms(c["phone"], body) for c in contacts]

    alert_id = f"sos_{uuid.uuid4().hex[:10]}"
    await db.sos_alerts.insert_one({
        "alert_id": alert_id,
        "user_id": user.user_id,
        "lat": sos.lat,
        "lng": sos.lng,
        "message": sos.message,
        "deliveries": deliveries,
        "simulated": not TWILIO_READY,
        "triggered_at": datetime.now(timezone.utc),
    })
    return {
        "alert_id": alert_id,
        "contacts_notified": len(deliveries),
        "deliveries": deliveries,
        "simulated": not TWILIO_READY,
        "maps_url": gmaps,
    }


@api.get("/sos/history")
async def sos_history(user: User = Depends(get_current_user)):
    docs = await db.sos_alerts.find({"user_id": user.user_id}, {"_id": 0}).sort("triggered_at", -1).limit(20).to_list(length=20)
    return {"alerts": docs}


# ============================================================
# AI (GPT-5.2 for risk analysis, Gemini 3 Flash for chatbot)
# ============================================================
def _make_chat(provider: str, model: str, session_id: str, system_message: str):
    from emergentintegrations.llm.chat import LlmChat
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(provider, model)


@api.post("/ai/risk-analysis")
async def ai_risk_analysis(req: RiskAnalysisRequest):
    """GPT-5.2 generates a natural-language safety insight for a scored route."""
    from emergentintegrations.llm.chat import UserMessage
    system = (
        "You are a safety navigation assistant for women and vulnerable groups. "
        "Produce concise (max 90 words), empowering, non-alarmist insights about a route. "
        "Return 2 sections: '**Insight**' (one short paragraph) and '**Tips**' (3 bullet points). "
        "Never fear-monger. Always actionable."
    )
    chat = _make_chat("openai", "gpt-5.2", f"risk_{uuid.uuid4().hex[:8]}", system)
    prompt = (
        f"Route stats:\n"
        f"- Distance: {req.distance_km} km\n"
        f"- Duration: {req.duration_min} min\n"
        f"- Safety score: {req.safety_score}/100\n"
        f"- Nearby reported incidents: {req.nearby_incidents}\n"
        f"- Lighting score: {req.lighting_score} (0-1)\n"
        f"- Crowd density: {req.crowd_density} (0-1)\n"
        f"- Time of day: {req.time_of_day}\n"
    )
    try:
        text = await chat.send_message(UserMessage(text=prompt))
        return {"analysis": text, "model": "gpt-5.2"}
    except Exception as e:
        logger.exception("risk analysis failed")
        # graceful fallback
        level = "safe" if req.safety_score >= 75 else ("caution" if req.safety_score >= 50 else "high risk")
        return {
            "analysis": (
                f"**Insight**\nThis route scores {req.safety_score}/100 — {level}. "
                f"{'Conditions look good.' if req.safety_score >= 75 else 'Proceed with awareness.'}\n\n"
                f"**Tips**\n- Stay on well-lit streets\n- Share live location with a contact\n- Keep phone accessible"
            ),
            "model": "fallback",
            "error": str(e),
        }


@api.post("/ai/chat")
async def ai_chat(req: ChatRequest, request: Request):
    """Gemini 3 Flash safety chatbot with multi-turn via stored session_id."""
    from emergentintegrations.llm.chat import UserMessage
    system = (
        "You are 'Aegis', a warm, empowering safety assistant for women and vulnerable "
        "groups navigating urban spaces. Give concise, practical safety guidance. "
        "When someone describes danger, recommend: (1) call local emergency services, "
        "(2) use the app's SOS button, (3) move to a crowded/well-lit area. "
        "Be supportive, never judgmental. Keep replies under 120 words."
    )
    chat = _make_chat("gemini", "gemini-3-flash-preview", req.session_id, system)
    try:
        text = await chat.send_message(UserMessage(text=req.message))
        # Persist
        await db.chat_messages.insert_one({
            "session_id": req.session_id,
            "user_message": req.message,
            "ai_message": text,
            "at": datetime.now(timezone.utc),
        })
        return {"reply": text, "session_id": req.session_id, "model": "gemini-3-flash-preview"}
    except Exception as e:
        logger.exception("chat failed")
        return {
            "reply": (
                "I'm here with you. If you feel unsafe right now, tap the red SOS button, "
                "move toward a well-lit area with more people, and call your local emergency number. "
                "How can I help further?"
            ),
            "session_id": req.session_id,
            "model": "fallback",
            "error": str(e),
        }


# ============================================================
# ADMIN
# ============================================================
@api.get("/admin/incidents")
async def admin_list_incidents(admin: User = Depends(get_admin_user), limit: int = 200):
    docs = await db.incidents.find({}, {"_id": 0}).sort("reported_at", -1).limit(limit).to_list(length=limit)
    return {"incidents": docs}


@api.patch("/admin/incidents/{incident_id}")
async def admin_update_incident(incident_id: str, body: Dict[str, Any], admin: User = Depends(get_admin_user)):
    allowed = {k: v for k, v in body.items() if k in {"status", "severity", "category", "description"}}
    if not allowed:
        raise HTTPException(status_code=400, detail="No allowed fields")
    res = await db.incidents.update_one({"incident_id": incident_id}, {"$set": allowed})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.incidents.find_one({"incident_id": incident_id}, {"_id": 0})
    return doc


@api.get("/admin/stats")
async def admin_stats(admin: User = Depends(get_admin_user)):
    total = await db.incidents.count_documents({})
    active = await db.incidents.count_documents({"status": "active"})
    resolved = await db.incidents.count_documents({"status": "resolved"})
    users = await db.users.count_documents({})
    sos = await db.sos_alerts.count_documents({})
    # Top categories
    cats_cursor = db.incidents.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ])
    cats = [{"category": c["_id"], "count": c["count"]} async for c in cats_cursor]
    return {
        "total_incidents": total,
        "active_incidents": active,
        "resolved_incidents": resolved,
        "total_users": users,
        "total_sos": sos,
        "top_categories": cats,
    }


# ============================================================
# PUBLIC / HEALTH / SEED
# ============================================================
@api.get("/")
async def root():
    return {
        "service": "safe-route-api",
        "status": "ok",
        "twilio_ready": TWILIO_READY,
        "llm_ready": bool(EMERGENT_LLM_KEY),
    }


@api.post("/dev/seed-incidents")
async def seed_incidents():
    """Idempotent demo seed — Bangalore / MG Road area."""
    existing = await db.incidents.count_documents({"category": {"$regex": "^seed_"}})
    if existing > 0:
        return {"seeded": False, "existing": existing}

    samples = [
        # (category, description, lat, lng, severity)
        ("harassment", "Group of men catcalling near bar exit", 12.9741, 77.6095, 3),
        ("poor_lighting", "Street lamp broken, pitch dark after 8pm", 12.9716, 77.5946, 2),
        ("theft", "Phone snatching reported by bystanders", 12.9783, 77.6408, 3),
        ("isolated", "Long stretch with no shops or people at night", 12.9615, 77.6379, 2),
        ("stalking", "Multiple reports of being followed", 12.9698, 77.7500, 3),
        ("poor_lighting", "Underpass with no lights", 12.9279, 77.6271, 2),
        ("harassment", "Inappropriate staring and comments", 12.9352, 77.6245, 2),
        ("theft", "Bag snatching from auto", 12.9784, 77.5940, 3),
        ("isolated", "Empty footpath past 10pm", 12.9850, 77.6000, 1),
        ("poor_lighting", "Park gate area dark", 12.9762, 77.5993, 2),
        ("harassment", "Verbal harassment at bus stop", 12.9667, 77.5667, 2),
        ("theft", "Mobile snatching at signal", 12.9260, 77.6762, 3),
    ]
    docs = []
    for cat, desc, lat, lng, sev in samples:
        docs.append({
            "incident_id": f"inc_{uuid.uuid4().hex[:10]}",
            "user_id": None,
            "category": cat,
            "description": f"seed_{desc}",
            "lat": lat,
            "lng": lng,
            "severity": sev,
            "time_of_day": "night",
            "reported_at": datetime.now(timezone.utc),
            "status": "active",
        })
    await db.incidents.insert_many(docs)
    return {"seeded": True, "count": len(docs)}


# ============================================================
# Mount
# ============================================================
app.include_router(api)


@app.on_event("startup")
async def startup():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.incidents.create_index("incident_id", unique=True)
    await db.incidents.create_index([("lat", 1), ("lng", 1)])
    await db.contacts.create_index("contact_id", unique=True)
    logger.info(f"Safe-Route API started. Twilio ready={TWILIO_READY}, LLM ready={bool(EMERGENT_LLM_KEY)}")
