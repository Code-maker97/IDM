# SurakshitPath सुरक्षित पथ — PRD

## Submission Context
- **Hackathon**: BGI Hackathon 2026
- **Theme**: Smart Cities & Urban Innovation · Disaster Management
- **Problem Statement ID**: IT3P2 — Intelligent Safe-Route Navigation System for Women & Vulnerable Groups
- **Team**: Innovaters (Team ID 1467)

## Product
**SurakshitPath सुरक्षित पथ** ("Safe Path") — an AI-driven safe-route navigation platform
designed in the visual language of Indian government citizen portals (UMANG / 112 India / Himmat Plus).

## Tech Stack
- Frontend: React 18 + Tailwind + Leaflet (CartoDB Voyager light tiles) + lucide-react
- Backend: FastAPI + MongoDB (motor) + httpx
- Routing: OpenStreetMap + OSRM (foot profile)
- Auth: Emergent-managed Google OAuth (localStorage Bearer token)
- AI: GPT-5.2 (risk analysis) + Gemini 3 Flash (chatbot) via emergentintegrations
- SMS: Twilio (currently in SIMULATION mode — drop-in real SMS by setting Twilio creds)

## Visual Identity (Iteration 2)
- Tricolor strip (saffron/white/green) at top & bottom
- Masthead: "भारत सरकार · Government of India · Smart Cities Mission"
- Logo: Ashoka chakra placeholder (CSS) + bilingual wordmark
- Palette: Navy #0b3d91 (primary) · Saffron #ff9933 (accent) · India green #138808 (safe) · #c0202b (SOS)
- Fonts: Noto Serif (heading), Noto Sans + Noto Sans Devanagari (body), Mukta (Hindi fallback)
- Clear "PROTOTYPE" notice strip + Team & Problem ID branding throughout

## Features Implemented
1. **Citizen-facing Landing** — gov-style hero, "At a glance" stats card, six citizen-services tiles, four-step "How it works", research & data sources card
2. **Map App** (`/app`)
   - Gov navy header, day/night toggle, contacts/admin/logout
   - **Free-text address search** (Photon + Nominatim fallback) with debounced autocomplete + Indore landmark quick-picks
   - OSRM safest route with multi-factor scoring (lighting, crowd, incidents, time-of-day)
   - Color-coded route polylines (safe/caution/danger)
   - Trusted contacts management
   - SOS button (pulsing) → Twilio SMS (simulated)
   - AI Chatbot (Gemini 3 Flash, multi-turn)
   - AI Route Risk Analysis (GPT-5.2)
   - Incident reporting (6 categories × 3 severities)
   - Emergency footer with 112 / 1091 helpline shortcuts
3. **Admin Console** (`/admin`)
   - Stats cards (incidents, users, SOS triggers)
   - Incident heatmap (size ∝ severity)
   - Top categories bar chart
   - **Bulk JSON incident import** (paste-and-go, partnership / dataset ready)
   - Moderation table (resolve / flag) with filters
4. **PWA** manifest + theme color
5. **Target city: Indore** — 51 realistic incidents seeded across Rajwada, Sarafa, Vijay Nagar, Palasia, Bhawarkuan, MG Road, DAVV/university belt, Rau, Sarwate stand, Khajrana, LIG, Dewas Naka, Malharganj, Super Corridor, etc.

## Backend Endpoints
- Auth: `POST /api/auth/session`, `GET /api/auth/me`, `POST /api/auth/logout`
- Incidents: `POST/GET /api/incidents`, `GET /api/incidents/heatmap`
- Routes: `POST /api/routes/safest`
- Contacts: `POST/GET/DELETE /api/contacts`
- SOS: `POST /api/sos/trigger`, `GET /api/sos/history`
- AI: `POST /api/ai/risk-analysis`, `POST /api/ai/chat`
- Geocoder: `GET /api/geocode/search`, `GET /api/geocode/reverse`
- Admin: `GET /api/admin/stats`, `GET/PATCH /api/admin/incidents`, `POST /api/admin/incidents/bulk`

## Testing
- Iteration 1: 18/18 backend + all frontend flows ✅
- Iteration 2 (gov re-skin): 18/18 backend + all frontend flows ✅
- Iteration 3 (geocoder + Indore + bulk import): 19/19 backend + all frontend flows ✅

## Backlog
- **P1**: Add Twilio creds for live SMS · free-text Nominatim geocoder · websocket live incidents · push notifications
- **P2**: Heatmap density layer · multi-language UI (Hindi, Tamil, Bengali, etc.) · "Share-a-Journey" live link · public transport integration
- **P3**: Wearable / IoT panic button · 112 ERSS direct integration · machine-learning crime forecasting

## Smart Enhancements
- **Trust loop**: incident upvoting/verification by community → improves scoring weights
- **Growth**: "Share-a-Journey" link (every shared link onboards a new user)
- **B2G revenue**: licence the admin dashboard to municipal corporations / city police
