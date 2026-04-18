from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db
import os, json, random, time

router = APIRouter()

# Initialize Firebase Admin once
if not firebase_admin._apps:
    cred_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if cred_json:
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {
            "databaseURL": os.environ.get("FIREBASE_DB_URL")
        })

ZONES = ["Gate A", "Gate B", "Gate C", "North Stand", "South Stand",
         "East Stand", "West Stand", "Concourse 1", "Concourse 2",
         "Food Court", "Parking P1", "Parking P2"]

class CrowdUpdate(BaseModel):
    zone: str
    density: int        # 0-100
    wait_time: int      # minutes
    lat: float
    lng: float

class RouteRequest(BaseModel):
    from_zone: str
    to_zone: str

@router.get("/zones")
def get_all_zones():
    """Get live crowd density for all venue zones from Firebase."""
    try:
        ref = db.reference("/zones")
        data = ref.get()
        if not data:
            # Seed with mock data if empty
            mock = _generate_mock_zones()
            ref.set(mock)
            return {"zones": list(mock.values()), "source": "seeded"}
        return {"zones": list(data.values()), "source": "live"}
    except Exception as e:
        # Fallback to mock data if Firebase not configured
        mock = _generate_mock_zones()
        return {"zones": list(mock.values()), "source": "mock", "note": str(e)}

@router.post("/update")
def update_zone(update: CrowdUpdate):
    """Push a crowd density update to Firebase (called by IoT sensors / staff)."""
    try:
        ref = db.reference(f"/zones/{update.zone.replace(' ', '_')}")
        payload = {
            **update.dict(),
            "status": _density_to_status(update.density),
            "updated_at": int(time.time())
        }
        ref.set(payload)
        return {"success": True, "zone": update.zone}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/heatmap")
def get_heatmap_data():
    """Returns lat/lng weighted points for Google Maps heatmap layer."""
    try:
        ref = db.reference("/zones")
        data = ref.get() or _generate_mock_zones()
        points = []
        for zone in data.values():
            if "lat" in zone and "lng" in zone:
                points.append({
                    "lat": zone["lat"],
                    "lng": zone["lng"],
                    "weight": zone.get("density", 50) / 100
                })
        return {"points": points}
    except Exception as e:
        return {"points": _mock_heatmap_points(), "note": str(e)}

@router.get("/alerts")
def get_alerts():
    """Return zones that are critically overcrowded (density > 80)."""
    try:
        ref = db.reference("/zones")
        data = ref.get() or _generate_mock_zones()
        alerts = [
            z for z in data.values()
            if z.get("density", 0) > 80
        ]
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        return {"alerts": [], "count": 0, "error": str(e)}

def _density_to_status(density: int) -> str:
    if density < 40:   return "low"
    if density < 70:   return "moderate"
    if density < 85:   return "high"
    return "critical"

def _generate_mock_zones() -> dict:
    """Realistic mock zone data for a stadium (Bengaluru-style coordinates)."""
    zone_coords = {
        "Gate_A":      (12.9784, 77.5912),
        "Gate_B":      (12.9790, 77.5920),
        "Gate_C":      (12.9778, 77.5905),
        "North_Stand": (12.9795, 77.5915),
        "South_Stand": (12.9775, 77.5915),
        "East_Stand":  (12.9785, 77.5930),
        "West_Stand":  (12.9785, 77.5900),
        "Concourse_1": (12.9786, 77.5910),
        "Concourse_2": (12.9787, 77.5918),
        "Food_Court":  (12.9780, 77.5908),
        "Parking_P1":  (12.9770, 77.5895),
        "Parking_P2":  (12.9800, 77.5935),
    }
    result = {}
    for zone_key, (lat, lng) in zone_coords.items():
        density = random.randint(10, 95)
        result[zone_key] = {
            "zone": zone_key.replace("_", " "),
            "density": density,
            "wait_time": max(0, int((density - 30) * 0.4)),
            "lat": lat,
            "lng": lng,
            "status": _density_to_status(density),
            "updated_at": int(time.time())
        }
    return result

def _mock_heatmap_points():
    return [
        {"lat": 12.9784, "lng": 77.5912, "weight": 0.9},
        {"lat": 12.9790, "lng": 77.5920, "weight": 0.4},
        {"lat": 12.9778, "lng": 77.5905, "weight": 0.7},
        {"lat": 12.9795, "lng": 77.5915, "weight": 0.3},
    ]
