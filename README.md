# VenueFlow 🏟️
### Real-Time Crowd Navigation & Management System for Large Sporting Venues

> Built for **PromptWars: Build with AI** — Google Antigravity Hackathon
> **Vertical: Crowd Movement & Navigation**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Firebase_Hosting-orange)](https://silica-491904.web.app)
[![Backend](https://img.shields.io/badge/⚙️_API-Cloud_Run-blue)](https://venueflow-backend-950349362495.us-central1.run.app)
[![GitHub](https://img.shields.io/badge/GitHub-VenueFlow-green)](https://github.com/Akritichhaya/venueflow)

---

## 🎯 What is VenueFlow?

VenueFlow is a smart crowd navigation dashboard that helps fans and staff navigate large sporting venues safely using **real-time crowd intelligence** and **AI-powered routing**.

### 🔴 The Problem
Large sporting venues (50,000–100,000 capacity) face:
- Dangerous crowd density at entry/exit gates during peak hours
- Long unpredictable wait times at concourses and concession stands
- Poor fan experience due to lack of real-time navigation information
- Staff coordination gaps — no unified view of crowd pressure across zones

### 💡 The Solution
VenueFlow provides:
1. **Live crowd monitoring** across all venue zones
2. **Google Maps heatmap** showing hotspots in real-time
3. **Gemini AI chat** for intelligent route suggestions
4. **Instant alerts** when zones exceed safe capacity
5. **Google Sheets logging** for post-event analytics

---

## 🚀 Live Demo

👉 **https://silica-491904.web.app**

![VenueFlow Dashboard](https://i.imgur.com/placeholder.png)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Firebase Hosting (Frontend)              │
│         React + Vite + Google Maps + Gemini AI        │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│           Cloud Run (FastAPI Backend)                 │
│     /crowd    │    /gemini    │    /sheets            │
└───────┬───────────────┬───────────────┬─────────────┘
        │               │               │
   ┌────▼────┐  ┌───────▼──────┐  ┌────▼────────┐
   │Firebase │  │ Gemini 2.5   │  │   Google    │
   │Realtime │  │  Flash Lite  │  │   Sheets    │
   │   DB    │  │     API      │  │    API      │
   └─────────┘  └──────────────┘  └─────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Maps | Google Maps JS API + Heatmap Layer |
| AI | Google Gemini 2.5 Flash Lite |
| Realtime DB | Firebase Realtime Database |
| Analytics | Google Sheets API v4 |
| Backend | Python FastAPI |
| Deployment | Cloud Run + Firebase Hosting |

---

## ✨ Features

- 🗺️ **Live Satellite Map** with crowd density heatmap
- 🔴 **Real-time Alerts** for overcrowded zones (>80% capacity)
- 📊 **Stats Dashboard** — avg density, critical zones, wait times
- 🤖 **Gemini AI Chat** — ask for navigation help in natural language
- 📋 **12 Zone Monitoring** — gates, stands, concourses, parking
- 📈 **Google Sheets Logging** — automatic crowd analytics
- ↔️ **Resizable Panels** — drag to resize map and chat

---

## ⚙️ Setup & Run Locally

```bash
# Clone
git clone https://github.com/Akritichhaya/venueflow.git
cd venueflow

# Backend
cd backend
cp .env.example .env
# Fill in your API keys
pip install -r requirements.txt
uvicorn main:app --reload --port 8080

# Frontend (new terminal)
cd frontend
cp .env.example .env
# Fill in your API keys
npm install
npm run dev
```

---

## 🌐 Deployment

Deployed on **Google Cloud Platform**:
- **Frontend** → Firebase Hosting: https://silica-491904.web.app
- **Backend** → Cloud Run: https://venueflow-backend-950349362495.us-central1.run.app

---

## 📊 Evaluation Criteria

| Criteria | Implementation |
|----------|---------------|
| **Code Quality** | Modular FastAPI routes, reusable React components |
| **Security** | Env vars for all secrets, no keys in source code |
| **Efficiency** | Firebase real-time subscriptions, Cloud Run auto-scaling |
| **Testing** | Mock data fallback, graceful error handling |
| **Accessibility** | Color + icon dual encoding, semantic HTML |
| **Google Services** | Maps, Gemini AI, Firebase, Sheets — all integrated |

---

## 👤 Author

**Akriti Chhaya**
Built for PromptWars: Build with AI — Google Antigravity Hackathon 2026

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/Akritichhaya)
