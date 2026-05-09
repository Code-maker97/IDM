# SurakshitPath — Project Summary

> **IDM / Intelligent Safe-Route Navigation System**
> A safety-focused navigation web app for women and vulnerable groups, built as a college hackathon project.

---

## 🎯 What It Does

SurakshitPath helps users navigate urban spaces more safely by:

- Calculating **safety-scored walking routes** (using real OpenStreetMap road data via OSRM + an incident heat map)
- Letting users **report incidents** (harassment, poor lighting, stalking, theft, isolated stretches)
- Providing a one-tap **SOS panic button** that sends GPS location to trusted contacts via SMS (Twilio)
- Offering an **AI safety chatbot** ("Aegis") for contextual advice
- Giving admins a **control-room dashboard** to review and moderate incident reports

The app is specifically seeded with real incident hotspot data from **Indore, Madhya Pradesh**.

---

## 🏗️ Architecture

```
┌───────────────────────────────────┐
│  React Frontend  (port 3000)      │
│  react-leaflet map · Tailwind CSS │
│  Mock API (api.js) or real server │
└────────────┬──────────────────────┘
             │ HTTP / JSON
┌────────────▼──────────────────────┐
│  FastAPI Backend  (server.py)     │
│  Python · Uvicorn · Motor (async) │
└────────────┬──────────────────────┘
             │
    ┌─────── ▼ ──────────┐
    │     MongoDB         │  (Atlas or local)
    │  users · incidents  │
    │  sessions · contacts│
    │  sos_alerts · chat  │
    └────────────────────┘
```

Third-party services used:
| Service | Purpose |
|---|---|
| **OSRM** (public) | Free walking route geometry |
| **Photon / Nominatim** | Free geocoding (address search & reverse) |
| **Twilio** | SMS delivery for SOS alerts (optional) |
| **Emergent Auth** | Google OAuth (cloud deploy only) |
| **GPT-5.2** | AI risk-analysis narrative per route |
| **Gemini 3 Flash** | Multi-turn safety chatbot ("Aegis") |

---

## 🛠️ Tech Stack

### Frontend
| Layer | Choice |
|---|---|
| Framework | **React 18** (Create React App) |
| Routing | react-router-dom v6 |
| Map | **react-leaflet** + **Leaflet** (CartoDB Dark Matter tiles) |
| Styling | **Tailwind CSS v3** |
| Icons | lucide-react |
| HTTP client | Axios (swapped for mock in local mode) |

### Backend
| Layer | Choice |
|---|---|
| Framework | **FastAPI** + Uvicorn |
| Database driver | **Motor** (async MongoDB) |
| Auth | Emergent Google OAuth (session-cookie + Bearer token) |
| SMS | **Twilio** (gracefully degrades to simulation) |
| AI | `emergentintegrations` LLM wrapper |

---

## 📁 Project Structure

```
IDM/
├── backend/
│   ├── server.py          # ~920-line FastAPI app (all routes in one file)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js         # Auth context, route guards, OAuth callback
│   │   ├── pages/
│   │   │   ├── Landing.js     # Onboarding / login screen
│   │   │   ├── MapApp.js      # Main map experience (~16 KB)
│   │   │   └── Admin.js       # Admin control room (~14 KB)
│   │   ├── components/
│   │   │   ├── RouteSearchSheet.js   # Bottom drawer for route planning
│   │   │   ├── SOSPanel.js           # SOS trigger + trusted contacts
│   │   │   ├── IncidentReportModal.js
│   │   │   ├── AIChatbot.js          # "Aegis" chatbot UI
│   │   │   ├── TrustedContactsModal.js
│   │   │   └── GovChrome.js          # Government branding chrome
│   │   └── lib/
│   │       └── api.js     # ★ Currently a full offline mock API
│   └── package.json
├── design_guidelines.json # Detailed design system specification
└── auth_testing.md
```

---

## 🔑 Key Features

### 🗺️ Safe Route Engine
- Queries the **public OSRM walking API** for up to 3 route variants (Direct, Safer Detour, Longer Detour)
- Each route is scored 0–100 based on: nearby incident severity, lighting score, crowd density, and time-of-day penalty
- Routes are colour-coded: 🟢 Safe (≥75) · 🟡 Caution (50-74) · 🔴 Danger (<50)

### 🚨 SOS System
- Fixed floating red button (always visible above map)
- On trigger: sends Google Maps link + custom message to all trusted contacts via SMS
- Falls back to simulated delivery if Twilio is unconfigured
- Full SOS history stored in DB

### 📍 Incident Reporting
- Categories: Harassment, Poor Lighting, Stalking, Theft, Isolated Area
- Severity 1–3 scale
- Reports feed back into the route safety scoring in real time

### 🤖 AI Chatbot ("Aegis")
- Multi-turn conversation via Gemini 3 Flash (cloud) or keyword-matched canned responses (mock)
- Contextual safety advice, always non-alarmist
- Recommends 112 / 1091 helplines for emergencies

### 🛡️ Admin Dashboard
- Live stats: total incidents, active/resolved, SOS count, user count
- Incident table with status management (active → resolved/flagged)
- Bulk import endpoint for partner data dumps (JSON array)
- Top-5 incident category breakdown

---

## 🖥️ Local Demo Mode (Current State)

The `frontend/src/lib/api.js` file has been **replaced with a fully self-contained mock API** that:

- Bypasses Google OAuth → uses a one-click **Dev Login** (`demo@surakshitpath.in`, admin: `true`)
- Calls the **real OSRM public API** directly from the browser (no backend needed for routing)
- Calls the **real Photon geocoding API** for address search
- Keeps all data (incidents, contacts, SOS alerts) in an **in-memory JS store** (resets on refresh)
- Pre-seeds 25 realistic Indore incident hotspots on startup
- Simulates AI responses with hardcoded, contextually appropriate replies

> **To run:** `cd frontend && npm start`  
> No backend or MongoDB instance is required in this mode.

---

## 🎨 Design System

Defined in `design_guidelines.json`:

- **Theme:** Dark mode ("Swiss & High-Contrast" archetype)
- **Colors:** Zinc-950 base · #ef4444 SOS red · #10b981 safe green · #f59e0b caution amber · #3b82f6 AI blue
- **Fonts:** Cabinet Grotesk (headings) · IBM Plex Sans (body) · JetBrains Mono (mono)
- **Layout:** Full-viewport map (100dvh) with fixed glassmorphism bottom sheet for route UI
- **SOS Button:** Always-visible floating 64px pulsing red circle (z-index priority)

---

## 📌 Status & History

| Phase | Summary |
|---|---|
| Initial build | Created on Emergent AI platform with cloud dependencies (OAuth, LLM, MongoDB) |
| Security remediation | Fixed hardcoded secrets, stale closures, type hints, localStorage misuse |
| Local prototype | Decoupled from cloud: mock API, dev-login bypass, offline-capable OSRM routing |
| Current | Fully runnable as a local hackathon demo from `npm start` |
