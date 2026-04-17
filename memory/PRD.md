# Aegis · Safe-Route Navigation System — PRD

## Problem Statement
Intelligent Safe-Route Navigation System for Women & Vulnerable Groups.
Design and develop an intelligent navigation system that recommends the safest routes in
real time by leveraging location data, crowd-sourced inputs, and AI-driven risk analysis,
along with emergency assistance features.

## Tech Stack
- Frontend: React 18 + Tailwind CSS + Leaflet + react-leaflet + lucide-react
- Backend: FastAPI + MongoDB (motor) + httpx
- Maps: OpenStreetMap tiles (CartoDB Dark Matter) + OSRM routing
- Auth: Emergent-managed Google OAuth (session cookies)
- AI: GPT-5.2 (risk analysis) + Gemini 3 Flash (chatbot) via emergentintegrations
- SMS: Twilio (currently in SIMULATION mode — add creds to enable real SMS)

## User Personas
- **Commuter Priya** — walks home after 8pm; wants well-lit routes + SOS
- **Student Aisha** — new to city; needs trusted-contacts SMS + AI chat
- **Admin Sarah** — moderates crowd-sourced incident reports

## Implemented Features (2026-04-17)
- Emergent Google OAuth (session_token cookie + Bearer header)
- Leaflet map (CartoDB Dark) with geolocation, user marker, incident markers
- OSRM-based route fetching with multi-factor safety scoring (incidents within 200m buffer, lighting, crowd, time-of-day)
- Route polylines color-coded by safety level (safe/caution/danger)
- Crowd-sourced incident reporting (6 categories, 3 severities)
- Trusted contacts management (add/delete)
- SOS panic button with live location sharing (Twilio-ready, simulated now)
- AI Safety Chatbot (Gemini 3 Flash, multi-turn, persistent session)
- AI Route Risk Analysis (GPT-5.2, natural-language insight + tips)
- Admin dashboard: stats, incident heatmap, moderation table (resolve/flag), top-categories chart
- Day/night mode toggle affecting safety scoring
- Landing page with onboarding and Google sign-in CTA
- 12 demo incidents seeded in Bengaluru

## Backend Endpoints
- Auth: `/api/auth/session`, `/auth/me`, `/auth/logout`
- Incidents: `POST/GET /api/incidents`, `GET /api/incidents/heatmap`
- Routes: `POST /api/routes/safest`
- Contacts: `POST/GET/DELETE /api/contacts`
- SOS: `POST /api/sos/trigger`, `GET /api/sos/history`
- AI: `POST /api/ai/risk-analysis`, `POST /api/ai/chat`
- Admin: `GET /api/admin/stats`, `GET/PATCH /api/admin/incidents`
- Dev: `POST /api/dev/seed-incidents`

## Testing (iteration_1.json)
- Backend: 18/18 passed (100%)
- Frontend: all flows passing (Landing, Map, Route Search, SOS, AI chat, Report, Contacts, Admin)

## Backlog / Future
- **P1**: Real Twilio SMS (user adds keys); live incident subscriptions via WebSocket; voice-activated SOS; wearable/IoT integration
- **P2**: Geocoder for free-text origin/dest; full incident heatmap layer with density shading; multi-language; share-my-journey live link for contacts
- **P2**: Push notifications when near reported hotspots
- **P3**: Integration with public transport / ride-sharing; offline route caching

## Smart Enhancements
- **Growth**: Share-a-journey link — a trusted contact can watch live location without installing the app
- **Trust loop**: Let users upvote/verify incidents to weight the safety scoring
- **Revenue**: Free for individuals, paid tier for corporate safety (NGO / college campus dashboards)
