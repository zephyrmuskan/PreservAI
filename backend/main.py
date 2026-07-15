import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse

# Load environment variables
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(ROOT_DIR, ".env"), override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI(title="PreservAI Backend API")

@app.on_event("startup")
def startup_event():
    import webbrowser
    import threading
    def open_browser():
        webbrowser.open("http://127.0.0.1:8000")
    threading.Timer(1.5, open_browser).start()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUBSCRIPTIONS_FILE = os.path.join(ROOT_DIR, "subscriptions.txt")

class SubscriptionRequest(BaseModel):
    email: str

@app.post("/api/subscribe")
def subscribe(payload: SubscriptionRequest):
    email = payload.email.strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # 1. Save to local subscriptions.txt file as a fallback
    local_saved = False
    try:
        with open(SUBSCRIPTIONS_FILE, "a") as f:
            f.write(f"{email}\n")
        local_saved = True
    except Exception as e:
        print(f"Local file write failed: {str(e)}")
    
    # 2. Sync to Supabase if config is provided and not default template
    if SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/subscriptions"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            res = requests.post(url, headers=headers, json={"email": email}, timeout=6)
            if res.status_code not in (200, 201):
                if res.status_code == 409:
                    raise HTTPException(status_code=400, detail="This email is already registered!")
                raise Exception(f"Supabase returned status {res.status_code}: {res.text}")
        except HTTPException as he:
            raise he
        except Exception as e:
            # If Supabase connection fails but local saving succeeded, we log it and continue
            print(f"Supabase sync failed: {str(e)}")
            if not local_saved:
                raise HTTPException(status_code=500, detail=f"Database synchronization failed: {str(e)}")
                
    elif not local_saved:
        raise HTTPException(status_code=500, detail="Failed to persist subscription locally.")
        
    return {"status": "success", "message": "Successfully subscribed to beta!"}

@app.get("/api/telemetry")
def get_telemetry():
    return {
        "status": "online",
        "route": ["Bhubaneswar", "Kolkata", "Delhi"],
        "sensors": {
            "temperature": 4.1,
            "health_score": 98,
            "risk_score": 12,
            "cooling_remaining_hours": 18
        }
    }

# Route for serving main index.html
@app.get("/")
def get_index():
    index_path = os.path.join(ROOT_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="index.html not found in project root")

# Mount parent static files directory
# We place this at the bottom to avoid interfering with API routes
app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="static")
