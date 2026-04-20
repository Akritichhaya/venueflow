from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os, json, logging
from datetime import datetime
from functools import lru_cache

router = APIRouter()
logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

@lru_cache(maxsize=1)
def _get_sheets_service():
    """Build and cache the Sheets service (singleton — avoids rebuilding on every request)."""
    cred_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT")
    spreadsheet_id = os.environ.get("SHEETS_SPREADSHEET_ID", "")
    if not cred_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT env var not set")
    if not spreadsheet_id:
        raise RuntimeError("SHEETS_SPREADSHEET_ID env var not set")
    cred_dict = json.loads(cred_json)
    creds = service_account.Credentials.from_service_account_info(
        cred_dict, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)

def _get_spreadsheet_id() -> str:
    sid = os.environ.get("SHEETS_SPREADSHEET_ID", "")
    if not sid:
        raise RuntimeError("SHEETS_SPREADSHEET_ID env var not set")
    return sid

class CrowdLog(BaseModel):
    zone: str
    density: int
    wait_time: int
    status: str
    event_name: str = "Match Day"

    @validator("density")
    def density_range(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("density must be between 0 and 100")
        return v

    @validator("wait_time")
    def wait_time_positive(cls, v):
        if v < 0:
            raise ValueError("wait_time must be >= 0")
        return v

class AlertLog(BaseModel):
    zone: str
    alert_type: str
    message: str
    severity: str

    @validator("severity")
    def severity_valid(cls, v):
        allowed = {"low", "medium", "high", "critical"}
        if v.lower() not in allowed:
            raise ValueError(f"severity must be one of {allowed}")
        return v.lower()

@router.post("/log-crowd")
async def log_crowd_snapshot(log: CrowdLog):
    """Append crowd snapshot to Google Sheets for analytics."""
    try:
        service = _get_sheets_service()
        spreadsheet_id = _get_spreadsheet_id()
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        values = [[timestamp, log.event_name, log.zone,
                   log.density, log.wait_time, log.status]]
        service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range="CrowdLogs!A:F",
            valueInputOption="RAW",
            body={"values": values}
        ).execute()
        logger.info("Logged crowd snapshot for zone %s (density=%d)", log.zone, log.density)
        return {"success": True, "logged_at": timestamp}
    except RuntimeError as e:
        logger.warning("Sheets not configured: %s", e)
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error("Failed to log crowd snapshot: %s", e)
        return {"success": False, "error": str(e)}

@router.post("/log-alert")
async def log_alert(alert: AlertLog):
    """Log a crowd alert event to Google Sheets."""
    try:
        service = _get_sheets_service()
        spreadsheet_id = _get_spreadsheet_id()
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        values = [[timestamp, alert.zone, alert.alert_type,
                   alert.message, alert.severity]]
        service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range="Alerts!A:E",
            valueInputOption="RAW",
            body={"values": values}
        ).execute()
        logger.info("Logged alert for zone %s (severity=%s)", alert.zone, alert.severity)
        return {"success": True}
    except RuntimeError as e:
        logger.warning("Sheets not configured: %s", e)
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error("Failed to log alert: %s", e)
        return {"success": False, "error": str(e)}

@router.get("/summary")
async def get_summary():
    """Fetch recent crowd summary from Sheets for the dashboard."""
    try:
        service = _get_sheets_service()
        spreadsheet_id = _get_spreadsheet_id()
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range="CrowdLogs!A:F"
        ).execute()
        rows = result.get("values", [])
        recent = rows[-50:] if len(rows) > 50 else rows
        return {"rows": recent, "total": len(rows)}
    except RuntimeError as e:
        return {"rows": [], "total": 0, "error": str(e)}
    except Exception as e:
        logger.error("Failed to fetch summary: %s", e)
        return {"rows": [], "total": 0, "error": str(e)}
