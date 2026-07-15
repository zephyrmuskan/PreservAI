# PreservAI Backend & Integration Documentation

This document summarizes the architecture of the PreservAI backend, how it connects to Supabase, and the deployment setup for hosting on Vercel.

---

## 🛠️ Tech Stack & Structure

- **Core Framework**: Python FastAPI (`backend/main.py`)
- **Server**: Uvicorn (local hot-reloading on port 8000)
- **Database Client**: Direct HTTP endpoints using `requests` (removes the need for heavy external database dependencies on Vercel)
- **Environment Management**: `python-dotenv` for loading credentials securely from `.env`

---

## 🔌 Supabase Database Integration

### 1. Database Schema
Email signups from the beta launch form are synced to the following table layout in your Supabase project (`kfuwyvqbidstpnjgunqe`):

| Column | Type | Attributes |
| :--- | :--- | :--- |
| `id` | bigint | Primary Key, Generated Identity |
| `created_at` | timestamptz | Defaults to `now()` |
| `email` | text | Unique, Not Null |

### 2. Integration Logic & Fallback
The `/api/subscribe` endpoint handles email submissions:
- **Local Fallback**: Emails are always appended locally to `subscriptions.txt` as a fallback to ensure zero data loss during network hiccups.
- **Supabase Sync**: If environment keys are configured, the API sends a POST request directly to the Supabase REST endpoint (`/rest/v1/subscriptions`).
- **RLS Configuration**: Row Level Security (RLS) is bypassed by utilizing your key, or supported publicly with an anonymous insert policy.

---

## 🚀 API Endpoints

### `POST /api/subscribe`
Saves business emails for the beta release.
- **Payload**: `{"email": "user@example.com"}`
- **Success Response**: `{"status": "success", "message": "Successfully subscribed to beta!"}`

### `GET /api/telemetry`
Streams cold chain sensor status and coordinates.
- **Response**:
  ```json
  {
    "status": "online",
    "route": ["Bhubaneswar", "Kolkata", "Delhi"],
    "sensors": {
      "temperature": 4.1,
      "health_score": 98,
      "risk_score": 12,
      "cooling_remaining_hours": 18
    }
  }
  ```

---

## ☁️ Vercel Deployment Configuration (`vercel.json`)

Vercel is configured to run the combined FastAPI server and serve the frontend assets seamlessly using custom routing rules:

- **Build Target**: Compiles `backend/main.py` using the `@vercel/python` engine.
- **API Routing**: Redirects all `/api/*` requests directly to the FastAPI server.
- **Static Assets**: Serves static files (`logo.png`, `styles.css`, `app.js`, `mockData.js`) directly from the workspace filesystem.
- **Single Page App Routing**: Redirects all non-file requests back to `index.html` to handle routing.
- **Custom Domains**: Configured in Vercel settings to route traffic from `preservai.life` and `www.preservai.life`.

---

## 🧪 Local Testing & Verification

A helper verification script is available at `test_supabase.py` (which is ignored by git for security) to verify your Supabase status:
```bash
./venv/bin/python test_supabase.py
```
This script automatically pings your Supabase endpoint and checks if the `subscriptions` table exists and is writable.
