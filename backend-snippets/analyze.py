"""FastAPI route for VLM image analysis via Nebius Token Factory.

POST /api/analyze-image
    Accepts: multipart/form-data with `image` (file)
    Returns: SceneAnalysisResponse (hazards, scene_description, safety_score)

This is the Python backend equivalent of the Next.js /api/analyze route.
David/Honza can use this when the Python backend is deployed (Railway/Render).
Uses the OpenAI SDK (OpenAI-compatible) pointed at Nebius Token Factory.

Run: uvicorn hazsight.main:app --port 8000 --reload
"""

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI
import os
import json
import base64

from ..ai.schemas import (
    SceneAnalysisResponse,
    DetectedHazard,
    BoundingBox,
)

router = APIRouter(prefix="/api", tags=["analysis"])


def get_client() -> OpenAI | None:
    """Get Nebius Token Factory client. Returns None if API key not set."""
    api_key = os.environ.get("NEBIUS_API_KEY")
    if not api_key:
        return None
    return OpenAI(
        api_key=api_key,
        base_url=os.environ.get(
            "NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/"
        ),
    )


VLM_MODEL = os.environ.get("NEBIUS_VLM_MODEL", "meta/llama-3.2-11b-vision-instruct")
REASONING_MODEL = os.environ.get("NEBIUS_REASONING_MODEL", "nvidia/nemotron-3-ultra")

VLM_PROMPT = """You are an occupational safety inspector analyzing a photo.

Identify all safety hazards. Categories:
- PPE_VIOLATION, FIRE_SMOKE, SLIP_TRIP_FALL, UNAUTHORIZED_ZONE,
  MACHINERY_PROXIMITY, UNSAFE_BEHAVIOR, OTHER

For each hazard provide: category, severity (LOW/MEDIUM/HIGH/CRITICAL),
description, affected_area, recommendation, confidence (0-1),
bounding_box {x, y, width, height} as percentages 0-100.

Also provide: scene_description, overall_safety_score (0-100).

Return ONLY valid JSON: {scene_description, overall_safety_score, hazards: [...]}
No markdown, no commentary."""


@router.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    """Analyze an image for safety hazards via Nebius Token Factory VLM."""

    client = get_client()
    if not client:
        return JSONResponse(
            status_code=503,
            content={"error": "NEBIUS_API_KEY not set. Configure in backend/.env"},
        )

    image_bytes = await image.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    mime_type = image.content_type or "image/png"

    # Step 1: VLM analyzes image
    response = client.chat.completions.create(
        model=VLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": VLM_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_b64}"},
                    },
                ],
            }
        ],
        max_tokens=2000,
        temperature=0.2,
    )

    vlm_output = response.choices[0].message.content or ""

    # Step 2: Parse JSON (use Nemotron Ultra to clean up if needed)
    try:
        result = json.loads(vlm_output)
    except json.JSONDecodeError:
        cleanup = client.chat.completions.create(
            model=REASONING_MODEL,
            messages=[
                {"role": "system", "content": "Extract only the JSON. No markdown."},
                {"role": "user", "content": vlm_output},
            ],
            max_tokens=2000,
            temperature=0,
        )
        result = json.loads(cleanup.choices[0].message.content or "{}")

    # Step 3: Build Pydantic models
    hazards = []
    for i, h in enumerate(result.get("hazards", [])):
        bbox_data = h.get("bounding_box")
        bbox = BoundingBox(
            x=bbox_data.get("x", 0),
            y=bbox_data.get("y", 0),
            width=bbox_data.get("width", 0),
            height=bbox_data.get("height", 0),
        ) if bbox_data else None

        hazards.append(
            DetectedHazard(
                category=h.get("category", "OTHER"),
                severity=h.get("severity", "MEDIUM"),
                description=h.get("description", ""),
                affected_area=h.get("affected_area"),
                recommendation=h.get("recommendation", ""),
                confidence=h.get("confidence", 0.8),
                bounding_box=bbox,
            )
        )

    analysis = SceneAnalysisResponse(
        scene_description=result.get("scene_description", ""),
        hazards=hazards,
        overall_safety_score=result.get("overall_safety_score", 50),
    )

    return analysis.model_dump()


@router.get("/analyze/health")
async def analyze_health():
    """Health check for the analysis module."""
    return {
        "status": "ok",
        "module": "analyze",
        "nebius_available": bool(os.environ.get("NEBIUS_API_KEY")),
        "vlm_model": VLM_MODEL,
        "reasoning_model": REASONING_MODEL,
    }
