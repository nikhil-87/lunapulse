<p align="center">
  <h1 align="center">🫀 LunaPulse</h1>
  <p align="center">Real-Time Wearable Intelligence Dashboard</p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Llama_3.2-OpenRouter-0452F9?logo=meta" alt="Llama 3.2" />
    <img src="https://img.shields.io/badge/WebSocket-Real_Time-FF6F00" alt="WebSocket" />
  </p>
</p>

---

## 📖 Overview

**LunaPulse** is a real-time wearable sensor intelligence dashboard that streams complex simulated health data via WebSockets, detects anomalies using an unsupervised Machine Learning algorithm, and provides instant AI-powered clinical explanations streamed token-by-token from Meta's Llama 3.2 (via OpenRouter).

### Key Features

- **🔴 Live 6D Sensor Streaming** — Heart Rate, SpO₂, Accelerometer, Temperature, Respiratory Rate, and HRV updated at 1Hz.
- **🧠 ML Anomaly Detection** — Online sliding-window `IsolationForest` continuously adapts to the user's baseline.
- **✨ Generative AI Explanations** — Meta Llama 3.2 streaming clinical insights in real-time.
- **📊 Animated Charts** — Smooth, rolling real-time visualizations using Recharts and Framer Motion.
- **🚨 Algorithmic Diagnostician** — Custom rules engine explicitly diagnoses physical conditions like Fevers, Sleep Apnea, and Panic Attacks.
- **⚡ WebSocket Architecture** — Real-time bidirectional communication eliminating HTTP polling latency.
- **🗃️ Asynchronous PostgreSQL** — All readings, alerts, and AI responses stored efficiently without blocking the WebSocket streams.

---

## 🏗 Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (React 19 + Vite)"]
        UI[Dashboard UI]
        WS_Client[WebSocket Client]
        Zustand[Zustand Stores]
        Charts[Recharts + Framer Motion]
    end

    subgraph Backend["Backend (FastAPI)"]
        WS_Server[WebSocket Manager]
        Simulator[Sensor Simulator]
        Detector[Anomaly Detector]
        LLM[Llama 3.2 Streaming]
        API[REST Routes]
        DB_Layer[SQLAlchemy Models]
    end

    subgraph Database["PostgreSQL"]
        Readings[(sensor_readings)]
        Alerts[(alerts)]
        Sessions[(sessions)]
    end

    UI --> WS_Client
    WS_Client <-->|WebSocket /ws| WS_Server
    UI --> API

    Simulator -->|Generates 6D data| WS_Server
    WS_Server -->|Feeds data| Detector
    Detector -->|Anomaly found| LLM
    LLM -->|Streams tokens| WS_Server
    WS_Server -->|Broadcasts| WS_Client

    API --> DB_Layer
    WS_Server --> DB_Layer
    DB_Layer --> Readings
    DB_Layer --> Alerts
    DB_Layer --> Sessions
```

---

## 📂 Folder Structure

```
luna-task/
├── backend/
│   ├── app.py                  # FastAPI app entry point
│   ├── config.py               # Environment-based settings
│   ├── database.py             # Async SQLAlchemy setup
│   ├── models.py               # ORM models
│   ├── schemas.py              # Pydantic validation schemas
│   ├── routes/
│   │   ├── health.py           # GET /health
│   │   ├── alerts.py           # GET /alerts
│   │   ├── history.py          # GET /history
│   │   └── websocket.py        # WS /ws — main streaming endpoint
│   ├── services/
│   │   ├── simulator.py        # 6D physiological state simulator
│   │   ├── anomaly.py          # IsolationForest + Heuristics
│   │   ├── llm.py              # Llama 3.2 / OpenRouter streaming
│   │   └── ws_manager.py       # WebSocket connection manager
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/         # UI Components (Charts, Cards, Alerts)
│   │   ├── stores/             # Zustand state stores
│   │   ├── hooks/              # useWebSocket
│   │   └── types/              # TypeScript types
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Zustand |
| **Backend** | FastAPI, Python 3.12, SQLAlchemy (async), Uvicorn |
| **Database** | PostgreSQL (asyncpg) |
| **AI/ML** | Meta Llama 3.2 (via OpenRouter), Scikit-learn (IsolationForest), NumPy |
| **Real-time** | Native WebSockets |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.19.0
- **Python** ≥ 3.12
- **PostgreSQL** ≥ 14
- **OpenRouter API Key** ([Get one here](https://openrouter.ai/keys))

### 1. Database Setup

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE luna_wearable;"
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate # macOS/Linux

pip install -r requirements.txt
cp .env.example .env
```
Edit `.env` and configure your Database and OpenRouter key:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/luna_wearable
OPENROUTER_API_KEY=your_api_key_here
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Running Locally

**Terminal 1 — Backend:**
For absolute convenience on Windows, you can simply run the shortcut script located in the root folder. It will automatically activate the virtual environment and start the server:
```cmd
.\run_backend.bat
```
*(Alternatively, you can manually `cd backend`, activate the venv, and run `uvicorn app:app --reload --host 0.0.0.0 --port 8000`)*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🧠 Anomaly Detection Pipeline

### Algorithm

1. **Primary: Isolation Forest** (scikit-learn)
   - Trained dynamically on a rolling window of the last 200 seconds.
   - 6-Dimensional Features: `[heart_rate, spo2, temperature, resp_rate, hrv, accel_magnitude]`
   - Re-trained from scratch every 50 seconds to continuously adapt to the user's changing baseline.
2. **Secondary: Heuristic Rules Engine**
   - Intercepts mathematical anomalies and classifies them into clinical states (e.g., Fever, Sleep Apnea, Panic Attack).
3. **Fallback: Z-Score**
   - Used only during the initial 30-second "Cold Start" period before the Isolation Forest activates.

---

## ✨ Streaming LLM Flow

```
Anomaly Detected (e.g., "Suspected Onset Fever")
    ↓
Build clinical prompt (Inject all 6 current sensor values + diagnosis)
    ↓
Call Meta Llama 3.2 API (streaming mode via OpenRouter)
    ↓
For each token generated:
    → Broadcast {type: "llm_token", token: "..."} to all connected browsers
    ↓
Frontend renders tokens immediately using React Markdown with a typing cursor animation.
```
