from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import crowd, gemini, sheets

app = FastAPI(title="VenueFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crowd.router, prefix="/api/crowd", tags=["crowd"])
app.include_router(gemini.router, prefix="/api/gemini", tags=["gemini"])
app.include_router(sheets.router, prefix="/api/sheets", tags=["sheets"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "VenueFlow API"}
