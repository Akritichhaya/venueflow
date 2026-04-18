from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os, json
from datetime import datetime

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SPREADSHEET_ID = os.environ.get("SHEETS_SPREADSHEET_ID", "")

def _get_sheets_service():
    cred_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT")
    if not cred_json:
        raise Exception("GOOGLE_SERVICE_ACCOUNT env var not set")
    cred_dict = json.loads(cred_json)
    creds = service_account.Credentials.from_service_account_info(
        cred_dict, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=creds)

class CrowdLog(BaseModel):
    zone: str
    density: int
    wait_time: int
    status: str
    event_name: str = "Match Day"

class AlertLog(BaseModel):
    zone: str
    alert_type: str
    message: str
    severity: str

@router.post("/log-crowd")
def log_crowd_snapshot(log: CrowdLog):
    """Append crowd snapshot to Google Sheets for analytics."""
    try:
        service = _get_sheets_service()
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        values = [[
            timestamp,
            log.event_name,
            log.zone,
            log.density,
            log.wait_time,
            log.status
        ]]
        service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range="CrowdLogs!A:F",
            valueInputOption="RAW",
            body={"values": values}
        ).execute()
        return {"success": True, "logged_at": timestamp}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/log-alert")
def log_alert(alert: AlertLog):
    """Log a crowd alert event to Google Sheets."""
    try:
        service = _get_sheets_service()
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        values = [[
            timestamp,
            alert.zone,
            alert.alert_type,
            alert.message,
            alert.severity
        ]]
        service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range="Alerts!A:E",
            valueInputOption="RAW",
            body={"values": values}
        ).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/summary")
def get_summary():
    """Fetch recent crowd summary from Sheets for the dashboard."""
    try:
        service = _get_sheets_service()
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range="CrowdLogs!A:F"
        ).execute()
        rows = result.get("values", [])
        # Return last 50 entries
        recent = rows[-50:] if len(rows) > 50 else rows
        return {"rows": recent, "total": len(rows)}
    except Exception as e:
        return {"rows": [], "total": 0, "error": str(e)}
