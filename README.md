# PreservAI – AI Powered Cold Chain Intelligence Platform 📦❄️

🌐 **Live Demo**: [preservai-app.vercel.app](https://preservai-app.vercel.app)

PreservAI is a next-generation real-time cold chain monitoring, shelf-life prediction, and spoilage prevention platform designed for healthcare, food, and logistics sectors.

---

## 🚀 Key Features

- **3D Immersive Product Tour**: A custom, scroll-driven interactive 3D scene (constructed from Three.js primitives) showcasing our core hardware: the **Smart Tag** and the **Smart PCM Crate**.
- **Real-Time Telemetry & Tracking**: Live Leaflet.js mapping tracking coordinates, ambient conditions, and excursions on route.
- **AI Rerouting Simulator**: Visualizes automated route deviation and risk mitigation when temperature or shock levels breach thresholds.
- **Supabase Integration**: Stores beta signup emails directly to a secure cloud database in real-time.
- **Vercel Deploy Ready**: Zero-config deployment configurations for combined FastAPI backend and static frontend hosting.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript, Three.js, Leaflet.js, Chart.js
- **Backend**: Python FastAPI, Uvicorn, Requests, Python-Dotenv
- **Database**: Supabase
- **Hosting**: Vercel Serverless Functions

---

## 📂 Project Structure

```text
PreservAI/
├── backend/
│   ├── main.py              # FastAPI application server
│   └── requirements.txt     # Python dependencies
├── app.js                   # Main application frontend logic
├── BACKEND.md               # Backend API and database documentation
├── index.html               # Main landing page and dashboard markup
├── logo.png                 # Official PreservAI logo
├── mockData.js              # Simulation and mock telemetry datasets
├── requirements.txt         # Root requirements file for Vercel
├── styles.css               # Core CSS and scroll layouts
├── test_supabase.py         # local credentials validation script
└── vercel.json              # Vercel routing rules configuration
```

---

## 💻 Local Setup & Installation

### 1. Configure Credentials
Create a `.env` file in the root directory:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-api-key
```

### 2. Install Dependencies & Run
Start the development server:
```bash
npm install
npm run dev
```

The application will start hot-reloading at **`http://127.0.0.1:8000`**.

---

## ☁️ Deployment

For deployment instructions on custom domains (`preservai.life`), refer to the **[BACKEND.md](BACKEND.md)** documentation.
