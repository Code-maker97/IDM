<div align="center">

<h1>🛡️ SurakshitPath</h1>
<p><strong>Intelligent Safe-Route Navigation System for Women & Vulnerable Groups</strong></p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Motor-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

<p><em>Navigate your city with confidence — real-time safety scoring, one-tap SOS, and AI-powered guidance.</em></p>

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Running Locally (Offline Demo)](#running-locally-offline-demo-no-backend-needed)
  - [Running the Full Stack](#running-the-full-stack)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Design System](#-design-system)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

**SurakshitPath** (सुरक्षित पथ — *"Safe Path"*) is a full-stack web application that helps women and vulnerable groups navigate urban spaces more safely. It combines real-world OpenStreetMap routing with a community-driven incident database to compute live safety scores for walking routes.

Originally built for the **BGI Hackathon 2026**, the app is seeded with curated incident hotspot data from **Indore, Madhya Pradesh** and is designed to work as a fully offline demo or as a production-grade cloud-deployed service.

---

## ✨ Features

### 🗺️ Safety-Scored Route Navigation
- Fetches up to **3 real walking route alternatives** via the public OSRM API
- Each route is scored **0–100** based on:
  - Nearby reported incidents & their severity
  - Estimated lighting conditions
  - Crowd density
  - Time-of-day penalty (day vs. night)
- Routes are colour-coded: 🟢 **Safe** (≥75) · 🟡 **Caution** (50–74) · 🔴 **Danger** (<50)
- "Safer Detour" variant uses intelligent via-waypoint avoidance of incident clusters

### 🚨 One-Tap SOS
- Persistent floating panic button — **always visible**, never hidden in a menu
- Sends a Google Maps live-location link + custom message to all trusted contacts via **Twilio SMS**
- Falls back gracefully to simulated delivery if Twilio is unconfigured
- Full SOS history log per user

### 📍 Community Incident Reporting
- Report: `Harassment · Stalking · Theft · Poor Lighting · Isolated Area`
- Severity scale 1–3
- Reports feed back into route safety scores in **real time**
- Incident heatmap overlay on the map

### 🤖 AI Safety Chatbot — "Aegis"
- Powered by **Gemini 3 Flash** (multi-turn conversation)
- Contextual, empowering safety advice — never alarmist
- Auto-recommends `112` (Police) and `1091` (Women's Helpline) for emergencies
- Offline: keyword-matched canned responses with full scenario coverage

### 👥 Trusted Contacts
- Add/remove emergency contacts (name, phone, relationship)
- Contacts are automatically notified on SOS trigger

### 🛡️ Admin Control Room
- Live stats dashboard: incidents, SOS count, user count
- Incident moderation: mark as `active / resolved / flagged`
- Bulk incident import (JSON) for partnership data ingestion
- Top-5 incident category breakdown

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 (Create React App) |
| **Routing** | react-router-dom v6 |
| **Map** | react-leaflet + Leaflet.js (CartoDB Dark Matter tiles) |
| **Styling** | Tailwind CSS v3 |
| **Icons** | lucide-react |
| **HTTP Client** | Axios |
| **Backend** | FastAPI + Uvicorn |
| **Database** | MongoDB (async via Motor) |
| **Auth** | Emergent Google OAuth (session cookie + Bearer token) |
| **SMS** | Twilio (optional) |
| **AI** | GPT-5.2 (risk analysis) · Gemini 3 Flash (chatbot) |
| **Routing API** | OSRM public API (free, no key needed) |
| **Geocoding** | Photon (Komoot) + Nominatim fallback |

---

## 📁 Project Structure

```
IDM/
├── backend/
│   ├── server.py              # FastAPI app — all routes, models, safety engine
│   ├── requirements.txt
│   └── tests/
│       ├── test_api.py
│       └── test_api_iter3.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js             # Auth context, protected routes, OAuth callback
│   │   ├── index.css          # Global styles & design tokens
│   │   ├── pages/
│   │   │   ├── Landing.js     # Onboarding & login screen
│   │   │   ├── MapApp.js      # Main map experience
│   │   │   └── Admin.js       # Admin control room dashboard
│   │   ├── components/
│   │   │   ├── RouteSearchSheet.js      # Bottom drawer — route planning & results
│   │   │   ├── SOSPanel.js              # SOS trigger + trusted contacts manager
│   │   │   ├── IncidentReportModal.js   # Incident submission form
│   │   │   ├── AIChatbot.js             # "Aegis" chatbot interface
│   │   │   ├── TrustedContactsModal.js  # Contact management UI
│   │   │   └── GovChrome.js             # Branding / government chrome bar
│   │   └── lib/
│   │       └── api.js         # API client (real Axios calls OR offline mock)
│   ├── .env
│   ├── package.json
│   └── tailwind.config.js
├── design_guidelines.json     # Full design system specification
├── auth_testing.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.11 (for full-stack mode only)
- **MongoDB** connection string (for full-stack mode only)

---

### Running Locally (Offline Demo) — No Backend Needed

The frontend ships with a fully self-contained **mock API** (`src/lib/api.js`) that requires no server, database, or API keys.

```bash
# 1. Clone the repository
git clone https://github.com/Code-maker97/IDM.git
cd IDM/frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Click **"Continue as Demo User"** on the landing page — you'll be instantly logged in as an admin with 25 pre-seeded Indore incident hotspots on the map.

> **What works in offline mode:**
> - ✅ Full map with CartoDB Dark Matter tiles
> - ✅ Real walking routes via OSRM (requires internet)
> - ✅ Real address search via Photon geocoding (requires internet)
> - ✅ Safety scoring, route comparison
> - ✅ Incident reporting (stored in memory)
> - ✅ SOS trigger (simulated — no real SMS sent)
> - ✅ AI chatbot (keyword-matched responses)
> - ✅ Admin dashboard

---

### Running the Full Stack

#### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set environment variables (see section below)
# Then start the server
uvicorn server:app --reload --port 8001
```

The API will be available at `http://localhost:8001`.

#### 2. Frontend (pointing to real backend)

```bash
cd frontend

# Set the backend URL in .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

npm install
npm start
```

---

## 🔐 Environment Variables

### Backend (`.env` in `/backend`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | ✅ | MongoDB connection string (e.g. Atlas URI) |
| `DB_NAME` | ✅ | MongoDB database name |
| `TWILIO_ACCOUNT_SID` | ⬜ | Twilio SID — omit to use simulated SMS |
| `TWILIO_AUTH_TOKEN` | ⬜ | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ⬜ | Twilio sender phone number |
| `EMERGENT_LLM_KEY` | ⬜ | Emergent AI API key for GPT-5.2 & Gemini |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_BACKEND_URL` | `http://localhost:3000` | Backend base URL |

> **Note:** The frontend mock (`api.js`) ignores `REACT_APP_BACKEND_URL` entirely — it intercepts all calls client-side. To switch to real backend calls, replace `api.js` with a standard Axios instance pointing to `REACT_APP_BACKEND_URL`.

---

## 📡 API Reference

All routes are prefixed with `/api`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/session` | Exchange OAuth session_id for session token |
| `GET` | `/auth/me` | Get current authenticated user |
| `POST` | `/auth/logout` | Clear session |
| `POST` | `/auth/dev-login` | Dev-only instant login (no OAuth) |

### Routes
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/routes/safest` | Get safety-scored route alternatives |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/incidents` | List active incidents (with optional lat/lng radius filter) |
| `POST` | `/incidents` | Report a new incident |
| `GET` | `/incidents/heatmap` | Get heatmap points (lat, lng, severity) |

### Contacts & SOS
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/contacts` | List trusted contacts |
| `POST` | `/contacts` | Add a trusted contact |
| `DELETE` | `/contacts/{id}` | Remove a contact |
| `POST` | `/sos/trigger` | Trigger SOS — notifies all contacts |
| `GET` | `/sos/history` | Get user's SOS alert history |

### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/risk-analysis` | GPT-generated route safety narrative |
| `POST` | `/ai/chat` | Multi-turn chatbot ("Aegis") |

### Geocoding
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/geocode/search?q=...` | Address search (Photon → Nominatim fallback) |
| `GET` | `/geocode/reverse?lat=&lng=` | Reverse geocoding |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/stats` | Platform statistics |
| `GET` | `/admin/incidents` | All incidents (all statuses) |
| `PATCH` | `/admin/incidents/{id}` | Update incident status/severity |
| `POST` | `/admin/incidents/bulk` | Bulk import incidents from JSON |

---

## 🎨 Design System

SurakshitPath uses a **Swiss & High-Contrast dark archetype** — designed for clarity and trust, especially in low-light conditions.

| Token | Value | Usage |
|---|---|---|
| Background base | `#09090b` | App background |
| Surface | `#18181b` | Cards, panels |
| SOS / Danger | `#ef4444` | SOS button, danger routes only |
| Safe route | `#10b981` | Safe route polylines & indicators |
| Caution route | `#f59e0b` | Caution route polylines |
| AI / Chat | `#3b82f6` | Chatbot FAB |
| Primary text | `#f4f4f5` | Body text |
| Secondary text | `#a1a1aa` | Labels, subtitles |

**Fonts:** Cabinet Grotesk (headings) · IBM Plex Sans (body) · JetBrains Mono (mono)

**Map tiles:** [CartoDB Dark Matter](https://carto.com/basemaps/)

---

## 🧪 Testing

Backend tests are located in `backend/tests/`.

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure all interactive elements include a `data-testid` attribute following the `kebab-case` role-based format (e.g., `sos-panic-button`, `route-search-input`).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for the **BGI Hackathon 2026**

*Empowering safe navigation for everyone.*

</div>
