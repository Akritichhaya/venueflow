import os
import logging
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import crowd, gemini, sheets, food

# ── Structured logging ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="VenueFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crowd.router,  prefix="/api/crowd",  tags=["crowd"])
app.include_router(gemini.router, prefix="/api/gemini", tags=["gemini"])
app.include_router(sheets.router, prefix="/api/sheets", tags=["sheets"])
app.include_router(food.router,   prefix="/api/food",   tags=["food"])

@app.on_event("startup")
async def startup_checks():
    """Validate critical environment variables on startup."""
    required = ["GEMINI_API_KEY", "FIREBASE_DB_URL"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        logger.warning("Missing env vars: %s — some features may be degraded", missing)
    else:
        logger.info("All required environment variables are set.")
    logger.info("VenueFlow API started successfully.")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "VenueFlow API",
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEY")),
        "firebase_configured": bool(os.environ.get("FIREBASE_DB_URL")),
    }
