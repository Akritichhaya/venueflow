# VenueFlow 🏟️
### Real-Time Crowd Navigation & Management System for Large Sporting Venues

> Built for **PromptWars: Build with AI** — Vertical: **Crowd Movement & Navigation**

[![Live Demo](https://img.shields.io/badge/Live-Firebase_Hosting-orange)](https://your-project.web.app)
[![Backend](https://img.shields.io/badge/API-Cloud_Run-blue)](https://your-backend.run.app)

---

## 🎯 Chosen Vertical
**Crowd Movement & Navigation** — Helping fans and venue staff navigate large sporting events safely and efficiently using real-time crowd intelligence and AI-powered routing.

---

## 🧠 Problem Statement
Large sporting venues (50,000–100,000 capacity) face:
- **Dangerous crowd density** at entry/exit gates during peak hours
- **Long unpredictable wait times** at concourses and concession stands
- **Poor fan experience** due to lack of real-time navigation information
- **Staff coordination gaps** — no unified view of crowd pressure across zones

---

## 💡 Solution: VenueFlow
A real-time dashboard + AI assistant that:
1. **Monitors** crowd density across all venue zones via live sensor data
2. **Visualizes** hotspots using a Google Maps heatmap overlay
3. **Alerts** staff instantly when any zone exceeds safe capacity (>80%)
4. **Routes** fans intelligently using Gemini AI, avoiding congested areas
5. **Logs** all crowd events to Google Sheets for post-event analytics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Firebase Hosting                    │
│              React + Vite Frontend                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Map View │  │  Zone    │  │   Gemini AI Chat  │  │
│  │ Heatmap  │  │  Panel   │  │   (Navigation)    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│              Cloud Run (FastAPI Backend)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  /crowd  │  │ /gemini  │  │    /sheets        │  │
│  │  routes  │  │  routes  │  │    routes         │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
└───────┼─────────────┼─────────────────┼─────────────┘
        │             │                 │
   ┌────▼────┐  ┌─────▼──────┐  ┌──────▼──────┐
   │Firebase │  │ Gemini 1.5 │  │   Google    │
   │Realtime │  │   Flash    │  │   Sheets    │
   │   DB    │  │    API     │  │    API      │
   └─────────┘  └────────────┘  └─────────────┘
```

---

## 🔧 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite                     |
| Styling     | Custom CSS (DM Mono + Syne fonts)   |
| Maps        | Google Maps JS API + Heatmap Layer  |
| Realtime DB | Firebase Realtime Database          |
| AI          | Google Gemini 1.5 Flash             |
| Analytics   | Google Sheets API v4                |
| Backend     | Python FastAPI                      |
| Deployment  | Cloud Run + Firebase Hosting        |

---

## 🚀 How It Works

### 1. Live Crowd Monitoring
- Zone density data (0–100%) is written to **Firebase Realtime Database** by IoT sensors or staff tablets
- The React frontend **subscribes** to Firebase in real-time — no polling needed
- Dashboard updates instantly as conditions change

### 2. Google Maps Heatmap
- All zone coordinates are rendered as a **weighted heatmap** on a satellite map
- Color gradient: Green (safe) → Yellow (moderate) → Orange (busy) → Red (critical)
- Clicking a zone marker shows density, wait time, and status

### 3. Gemini AI Navigation
- Fans type natural-language queries: *"How do I get from Gate A to the Food Court?"*
- Gemini 1.5 Flash receives current zone densities and returns the **least-congested route**
- Also provides alternate routes and practical tips
- Every 60 seconds, Gemini analyzes the full crowd snapshot and surfaces operational insights for staff

### 4. Google Sheets Logging
- Every crowd update and alert is appended to a Google Sheet
- Two tabs: `CrowdLogs` (time-series density) and `Alerts` (overcrowding events)
- Enables post-event analysis, capacity planning, and compliance reporting

---

## 📁 Project Structure

```
venueflow/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx    # Google Maps + heatmap
│   │   │   ├── ZonePanel.jsx  # Live zone list
│   │   │   ├── StatsBar.jsx   # Key metrics
│   │   │   ├── GeminiChat.jsx # AI navigation chat
│   │   │   └── AlertsBanner.jsx
│   │   ├── firebase.js        # Firebase SDK setup
│   │   ├── App.jsx            # Main layout + data orchestration
│   │   └── App.css            # Dark dashboard styles
│   ├── .env.example
│   └── package.json
├── backend/                   # FastAPI (Python)
│   ├── routes/
│   │   ├── crowd.py           # Firebase zone CRUD
│   │   ├── gemini.py          # Gemini AI endpoints
│   │   └── sheets.py          # Google Sheets logging
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── firebase.json              # Firebase Hosting + Cloud Run rewrite
├── deploy.sh                  # One-command GCP deploy
└── README.md
```

---

## ⚙️ Setup & Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Cloud project with billing enabled
- Firebase project (Realtime Database enabled)

### 1. Clone & configure

```bash
git clone https://github.com/your-username/venueflow.git
cd venueflow
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in Firebase + Maps keys
npm install
npm run dev
```

---

## 🌐 Deployment (GCP)

```bash
# Set your environment variables first
export GEMINI_API_KEY="..."
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export FIREBASE_DB_URL="https://your-project-rtdb.firebaseio.com"
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export SHEETS_SPREADSHEET_ID="..."

# Deploy everything
chmod +x deploy.sh
./deploy.sh your-gcp-project-id
```

This will:
1. Enable all required GCP APIs
2. Build and push the backend Docker image to Container Registry
3. Deploy backend to **Cloud Run** (auto-scaling, serverless)
4. Build the React frontend
5. Deploy frontend to **Firebase Hosting** (global CDN)

---

## 🔑 Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK JSON (stringified) |
| `FIREBASE_DB_URL` | Firebase Realtime DB URL |
| `GOOGLE_SERVICE_ACCOUNT` | GCP service account JSON (stringified) |
| `SHEETS_SPREADSHEET_ID` | Target Google Sheets ID |

### Frontend (VITE_ prefix)
| Variable | Description |
|----------|-------------|
| `VITE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `VITE_FIREBASE_*` | Firebase web app config values |
| `VITE_API_URL` | Backend Cloud Run URL |

---

## 📊 Evaluation Criteria — How VenueFlow Addresses Each

| Criteria | Implementation |
|----------|---------------|
| **Code Quality** | Modular FastAPI routes, reusable React components, typed Pydantic models |
| **Security** | Env vars for all secrets, CORS configured, no keys in source code |
| **Efficiency** | Firebase real-time subscriptions (no polling), Cloud Run scales to zero, Gemini called only on demand |
| **Testing** | Mock data fallback if Firebase offline, graceful error handling on all API calls |
| **Accessibility** | Semantic HTML, color + icon dual encoding for status (not color-only) |
| **Google Services** | Maps API, Gemini AI, Firebase Realtime DB, Google Sheets — all meaningfully integrated |

---

## 🧩 Assumptions

- Venue zones have fixed GPS coordinates (pre-mapped by venue ops team)
- Density data (0–100%) is written by IoT sensors or staff devices to Firebase
- The app targets both **fan-facing** (chat navigation) and **staff-facing** (dashboard) use cases
- Google Sheets logging is for operational analytics, not real-time display

---

## 👤 Author
Built for PromptWars: Build with AI — Google Antigravity Hackathon
