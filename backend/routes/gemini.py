from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os, json

router = APIRouter()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-1.5-flash")

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

        response = model.generate_content(prompt)
        return {
            "advice": response.text,
            "from": query.user_location,
            "to": query.destination
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

        response = model.generate_content(prompt)
        return {
            "analysis": response.text,
            "avg_density": round(avg_density, 1),
            "critical_count": len(critical)
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

        response = model.generate_content(prompt)
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
