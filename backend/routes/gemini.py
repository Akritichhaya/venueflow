from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os, json, logging
from google.api_core.exceptions import ResourceExhausted

logger = logging.getLogger(__name__)


router = APIRouter()

def get_model():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    print(f"Using Gemini key: {api_key[:20]}...")
    genai.configure(api_key=api_key)
    # gemini-2.0-flash: 1500 req/day free tier (vs 20/day for 2.5-flash-lite)
    return genai.GenerativeModel("gemini-2.0-flash")

model = get_model()

# ── Demo fallbacks (used when API quota is exhausted) ──────────────────────────

def _nav_fallback(from_loc: str, to_loc: str, zones: list) -> str:
    least_busy = min(zones, key=lambda z: z.get("density", 100)) if zones else {}
    zone_name = least_busy.get("zone", "North Concourse")
    return (
        f"🗺️ **Best Route** (AI Demo Mode)\n"
        f"• Head via **{zone_name}** — currently the least crowded path\n"
        f"• From **{from_loc}** → take the inner corridor → **{to_loc}**\n\n"
        f"🔄 **Alternate Route**\n"
        f"• Use the outer walkway via East Gate — slightly longer but clear\n\n"
        f"⏱️ **Estimated Time:** 4–7 minutes\n\n"
        f"💡 **Tip:** Avoid the main concourse for the next 10 mins — "
        f"crowd is dispersing from the last event."
    )

def _analyze_fallback(zones: list, event_name: str) -> str:
    critical = [z for z in zones if z.get("status") == "critical"]
    avg = sum(z.get("density", 0) for z in zones) / max(len(zones), 1)
    risk = "Critical" if len(critical) > 2 else "High" if avg > 70 else "Medium" if avg > 40 else "Low"
    return (
        f"📊 **Crowd Analysis — {event_name}** (AI Demo Mode)\n\n"
        f"**Overall Risk Level: {risk}**\n\n"
        f"**Immediate Actions for Staff:**\n"
        f"• Deploy 2 additional stewards to Gate B and North Stand entrance\n"
        f"• Open overflow corridor on Level 2 to reduce bottleneck\n\n"
        f"**Predicted Bottleneck (next 15 min):**\n"
        f"• Main concourse near food stalls — density expected to peak at ~85%\n\n"
        f"📢 **Fan Broadcast Message:**\n"
        f"\"Attention fans — please use the East and West exits for faster exit. "
        f"North concourse is currently busy. Thank you!\""
    )

def _chat_fallback(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["toilet", "bathroom", "restroom", "washroom"]):
        return "🚻 Nearest restrooms are on Level 1 near Gates A, C and F, and on Level 2 near Block 112. All are currently accessible."
    if any(w in msg for w in ["food", "eat", "drink", "snack", "beer"]):
        return "🍔 Food stalls are open at Zones B, D and F. The main food court on Level 2 has shorter queues right now. Enjoy the match!"
    if any(w in msg for w in ["park", "car", "parking"]):
        return "🅿️ Parking Lot A (North) and Lot C (East) still have spaces. Lot B is full. Exit via Gate 7 for fastest access to Lot A."
    if any(w in msg for w in ["exit", "leave", "out", "go home"]):
        return "🚪 For fastest exit use Gates E or F (South side) — currently low crowd. Main North Gate will be busy for ~20 mins post-match."
    if any(w in msg for w in ["seat", "stand", "block", "section"]):
        return "💺 Your seat block can be accessed via the nearest numbered gate. Check your ticket for your block letter — staff at each gate can guide you."
    return (
        "👋 Hi! I'm VenueFlow AI (Demo Mode). I can help with:\n"
        "• 🗺️ Navigation & routes\n"
        "• 🚻 Facilities (restrooms, food, parking)\n"
        "• 🚪 Entry & exit guidance\n"
        "• 📊 Crowd updates\n\n"
        "Ask me anything about the venue!"
    )

# ── Endpoints ──────────────────────────────────────────────────────────────────

class NavigationQuery(BaseModel):
    user_location: str
    destination: str
    zones: list          # current zone density data

class CrowdAnalysisQuery(BaseModel):
    zones: list
    event_name: str = "Match Day"

@router.post("/navigate")
async def get_navigation_advice(query: NavigationQuery):
    """Ask Gemini for the best route given current crowd densities."""
    try:
        zone_summary = "\n".join([
            f"- {z['zone']}: {z['density']}% full, ~{z['wait_time']} min wait ({z['status']})"
            for z in query.zones[:8]
        ])

        prompt = f"""You are VenueFlow AI, a smart navigation assistant for a large sporting venue.

Current crowd conditions:
{zone_summary}

A fan is at: {query.user_location}
They want to reach: {query.destination}

Give them:
1. The BEST route (least crowded path)
2. An ALTERNATE route if the best is also busy
3. Estimated total time
4. One practical tip for this specific situation

Be concise, friendly, and specific. Use bullet points. Max 150 words."""

        response = await model.generate_content_async(prompt)
        return {
            "advice": response.text,
            "from": query.user_location,
            "to": query.destination
        }
    except ResourceExhausted:
        return {
            "advice": _nav_fallback(query.user_location, query.destination, query.zones),
            "from": query.user_location,
            "to": query.destination,
            "demo": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_crowd(query: CrowdAnalysisQuery):
    """Ask Gemini to analyze overall crowd patterns and give operational insights."""
    try:
        critical = [z for z in query.zones if z.get("status") == "critical"]
        high = [z for z in query.zones if z.get("status") == "high"]
        avg_density = sum(z.get("density", 0) for z in query.zones) / max(len(query.zones), 1)

        prompt = f"""You are VenueFlow AI, a crowd management system for {query.event_name}.

Crowd snapshot:
- Average density: {avg_density:.1f}%
- Critical zones ({len(critical)}): {", ".join(z["zone"] for z in critical) or "None"}
- High density zones ({len(high)}): {", ".join(z["zone"] for z in high) or "None"}
- Total zones monitored: {len(query.zones)}

Provide:
1. Overall crowd risk level (Low/Medium/High/Critical)
2. Top 2 immediate actions for venue staff
3. Predicted bottleneck in next 15 minutes
4. One fan communication message to broadcast

Keep it operational and brief. Max 200 words."""

        response = await model.generate_content_async(prompt)
        return {
            "analysis": response.text,
            "avg_density": round(avg_density, 1),
            "critical_count": len(critical)
        }
    except ResourceExhausted:
        avg_density = sum(z.get("density", 0) for z in query.zones) / max(len(query.zones), 1)
        critical = [z for z in query.zones if z.get("status") == "critical"]
        return {
            "analysis": _analyze_fallback(query.zones, query.event_name),
            "avg_density": round(avg_density, 1),
            "critical_count": len(critical),
            "demo": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(body: dict):
    """General venue assistant chat endpoint."""
    try:
        user_msg = body.get("message", "")
        context = body.get("context", "")

        prompt = f"""You are VenueFlow, a helpful AI assistant for fans at a large sporting venue.
{f'Current venue context: {context}' if context else ''}

Fan question: {user_msg}

Answer helpfully and concisely. If about navigation or crowds, give practical advice. Max 100 words."""

        response = await model.generate_content_async(prompt)
        return {"reply": response.text}
    except ResourceExhausted:
        return {"reply": _chat_fallback(body.get("message", "")), "demo": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))