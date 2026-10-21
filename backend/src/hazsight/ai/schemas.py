"""Conceptual data schemas and skeleton types for scene and hazard analysis.

Note: These are preliminary skeleton models and design notes.
No heavy business logic or prescriptive implementation is added yet.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskSeverity(str, Enum):
    """Hazard risk severity levels."""
    LOW = "LOW"             # Minor irregularities / low impact
    MEDIUM = "MEDIUM"       # Elevated risk, missing secondary PPE, cluttered pathway
    HIGH = "HIGH"           # Severe danger, missing mandatory PPE in high-hazard zones
    CRITICAL = "CRITICAL"   # Imminent life-safety hazard (fire, smoke, fall from height)


class HazardCategory(str, Enum):
    """Categories of occupational and environmental hazards."""
    PPE_VIOLATION = "PPE_VIOLATION"             # Helmet, high-vis vest, goggles, harness
    FIRE_SMOKE = "FIRE_SMOKE"                   # Open flames, spark generation, smoke
    SLIP_TRIP_FALL = "SLIP_TRIP_FALL"           # Spilled liquids, loose cables, floor obstacles
    UNAUTHORIZED_ZONE = "UNAUTHORIZED_ZONE"     # Personnel inside restricted perimeters
    MACHINERY_PROXIMITY = "MACHINERY_PROXIMITY" # Unsafe distance from operating heavy machinery
    UNSAFE_BEHAVIOR = "UNSAFE_BEHAVIOR"         # Risky climbing, unsafe lifting, reckless conduct
    OTHER = "OTHER"                             # Unclassified hazard


class DetectedHazard(BaseModel):
    """Individual hazard recognized in a visual frame."""
    category: HazardCategory = Field(description="Classified category of the hazard")
    severity: RiskSeverity = Field(description="Assessed severity level")
    description: str = Field(description="Detailed narrative explaining the hazard context")
    affected_area: Optional[str] = Field(
        default=None,
        description="Spatial location note within the frame (e.g., 'bottom-left near excavator')",
    )
    recommendation: str = Field(description="Immediate corrective action recommended by AI")
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Model confidence score between 0.0 and 1.0",
    )


class SceneAnalysisResponse(BaseModel):
    """Multimodal scene analysis output skeleton."""
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of frame capture / analysis",
    )
    scene_description: str = Field(
        description="Objective narrative of the visual scene (environment, people, machinery)",
    )
    hazards: List[DetectedHazard] = Field(
        default_factory=list,
        description="List of detected hazards (empty if scene is safe)",
    )
    overall_safety_score: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Overall safety index (100 = completely safe, 0 = critical hazard)",
    )


class TimeslotIncident(BaseModel):
    """Conceptual model for an incident tracked over a continuous timeslot."""
    incident_id: str
    category: HazardCategory
    severity: RiskSeverity
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: float = 0.0
    status: str = "ACTIVE"  # "ACTIVE", "RESOLVED"
    best_frame_path: Optional[str] = None
    description: str
    occurrences_count: int = 1
