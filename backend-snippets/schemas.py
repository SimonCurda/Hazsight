"""Pydantic schemas for Hazsight VLM analysis.

These define the contract between the VLM output, the reasoning model,
and the API response. Both the Python backend and the Next.js frontend
speak this same schema (frontend mirrors it in src/lib/types.ts).
"""

from pydantic import BaseModel, Field
from enum import Enum


class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class HazardCategory(str, Enum):
    PPE_VIOLATION = "PPE_VIOLATION"
    FIRE_SMOKE = "FIRE_SMOKE"
    SLIP_TRIP_FALL = "SLIP_TRIP_FALL"
    UNAUTHORIZED_ZONE = "UNAUTHORIZED_ZONE"
    MACHINERY_PROXIMITY = "MACHINERY_PROXIMITY"
    UNSAFE_BEHAVIOR = "UNSAFE_BEHAVIOR"
    OTHER = "OTHER"


class BoundingBox(BaseModel):
    """Bounding box as percentages (0-100) of image dimensions.
    (0, 0) is top-left. Used to draw hazard overlays on the image."""
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    width: float = Field(ge=0, le=100)
    height: float = Field(ge=0, le=100)


class DetectedHazard(BaseModel):
    category: HazardCategory
    severity: RiskSeverity
    description: str = Field(min_length=10)
    affected_area: str = ""
    recommendation: str = Field(min_length=5)
    confidence: float = Field(ge=0, le=1)
    bounding_box: BoundingBox


class SceneAnalysisResponse(BaseModel):
    scene_description: str
    overall_safety_score: float = Field(ge=0, le=100)
    hazards: list[DetectedHazard] = []
