# IMPLEMENTATION_PLAN.md - Technical & Implementation Roadmap

This document outlines the architectural roadmap, technology options, and phased execution plan for **Hazsight**.
Hazsight is designed to monitor camera feeds, identify risks and occupational safety hazards, anchor incidents into continuous **timeslots**, trigger real-time alerts, and generate automated safety audit reports.

> **Status**: Architectural Planning & Skeleton Stage (No premature implementation code).

---

## 1. Project Vision & Objectives

- **Project Name**: Hazsight
- **Goal**: Automated occupational health and safety (OHS/EHS) monitoring for industrial sites, construction areas, warehouses, and smart facilities using video feeds.
- **Mandatory Constraint**: Must integrate at least one **NVIDIA AI technology**.
- **Key Deliverables**:
  1. Multimodal scene understanding (what is happening in the visual frame).
  2. Hazard & risk recognition (PPE compliance, fire/smoke, tripping hazards, hazardous machinery proximity, unauthorized zones).
  3. Temporal anchoring (**Timeslots** – tracking start time, duration, and resolution of an incident).
  4. Real-time alerting engine (WebSocket, Webhooks, immediate operator warnings).
  5. Automated reporting engine (Shift/daily summaries in PDF, Markdown, JSON).

---

## 2. NVIDIA AI Technologies Analysis

To satisfy the NVIDIA requirement while balancing flexibility, latency, and hardware constraints:

| NVIDIA Technology | Service / Deployment Model | Key Benefits | Recommended Hazsight Role |
| :--- | :--- | :--- | :--- |
| **NVIDIA NIM API (VLM)**<br>*(e.g., `meta/llama-3.2-11b-vision-instruct`, `nvidia/vila-1.5`, `nvidia/cosmos-nemotron-34b`)* | Cloud or On-Premise Microservice (OpenAI-compatible REST API) | • Zero local GPU requirement for development.<br>• Exceptional semantic scene reasoning and hazard understanding.<br>• Reliable structured JSON output. | **Phases 1 & 2 (Primary choice for fast development)** and semantic hazard reasoning. |
| **NVIDIA Cosmos** (`nvidia/cosmos-nemotron-34b`) | Physical AI & World Foundation Model | • Specifically tailored for physical dynamics, 3D spatial awareness, and industrial environments. | Advanced physical risk modeling (predictive collision risk). |
| **NVIDIA DeepStream SDK + TensorRT** | Edge Video Pipeline (Accelerated on GPU / Jetson) | • 30+ FPS multi-stream RTSP hardware decoding (NVDEC).<br>• Sub-millisecond latency for bounding box object detection (YOLO, PeopleNet). | **Phase 6+ (Production Edge)**: Continuous video ingestion with VLM triggered on anomaly. |
| **NVIDIA NeMo Guardrails** | LLM/VLM Safety & Policy Layer | • Prevents hallucinations in generated safety reports.<br>• Enforces adherence to safety standards. | Phase 5 safety report generation. |

### Recommended Approach: Hybrid Pipeline
1. **Cloud / Development Brain**: Use **NVIDIA NIM API** via `https://integrate.api.nvidia.com/v1`. This allows instant testing with image uploads and flexible prompt engineering without requiring multi-gigabyte local models.
2. **Video & Frame Sampling Engine**: Lightweight Python (OpenCV) frame sampler that selects key frames (e.g. 1 frame/sec or motion-triggered) to minimize unnecessary API calls.
3. **Edge Optimization Ready**: The architecture allows swapping the cloud NIM endpoint for a local NIM container or TensorRT pipeline in the future without altering application code.

---

## 3. System Architecture & Tech Stack Notes

```
+-----------------------------------------------------------------------------------+
|                                 HAZSIGHT PIPELINE                                 |
+-----------------------------------------------------------------------------------+

   +-----------------------+
   |   Video / RTSP Feed   | (Camera, RTSP stream, MP4 video file, test images)
   +-----------+-----------+
               |
               v
   +-----------------------+
   |  Frame Capture Engine | (OpenCV / Async buffer, FPS sampling, Motion trigger)
   +-----------+-----------+
               |
               v
   +-------------------------------------------------------------------------------+
   |                             NVIDIA AI CORE                                    |
   |  - NVIDIA NIM VLM Client (Llama 3.2 Vision / VILA / Cosmos)                  |
   |  - Semantic Prompts: Hazard detection, severity (Low-Critical), actions       |
   |  - Output: Validated Pydantic schema (JSON)                                   |
   +---------------------------------------+---------------------------------------+
                                           |
                                           v
   +-------------------------------------------------------------------------------+
   |                      TIMESLOT & INCIDENT TRACKER                              |
   |  - Aggregates detections into continuous time intervals (Timeslots)           |
   |  - Deduplication: merges repeated hazards into a single tracked incident      |
   |  - State Lifecycle: DETECTED -> PERSISTENT -> RESOLVED                        |
   +-------------------+---------------------------------------+-------------------+
                       |                                       |
                       v                                       v
         +---------------------------+           +---------------------------+
         |      ALERTING ENGINE      |           |     REPORTING ENGINE      |
         | - Real-time notifications |           | - Aggregated timeslots    |
         | - WebSocket to UI         |           | - Safety audit generation |
         | - Webhook / Slack / Push  |           | - Export: PDF, MD, JSON   |
         +-------------+-------------+           +-------------+-------------+
                       |                                       |
                       +-------------------+-------------------+
                                           |
                                           v
                         +-----------------------------------+
                         |       FASTAPI + WEB DASHBOARD     |
                         | - Live camera feed overlay        |
                         | - Interactive timeslot scrubber   |
                         | - Incident management & downloads |
                         +-----------------------------------+
```

### Architectural Decisions to Finalize with the Team
- **Backend**: Python 3.11+ with **FastAPI** (asynchronous, high performance, native OpenAPI documentation).
- **Web UI Options**:
  - *Option A*: Embedded FastAPI dashboard (Jinja2 + Vanilla JS/CSS + WebSockets) for minimal complexity and zero extra build step.
  - *Option B*: Standalone modern frontend (Vite + React / Next.js) communicating via REST + WebSocket API.
- **Persistence**: SQLite (development) -> PostgreSQL (production) for storing incident timeslots, alerts, and report logs.

---

## 4. Conceptual Data Schemas (Notes & Types)

```python
# Conceptual Pydantic schemas for AI output and incident tracking

class RiskSeverity(str, Enum):
    LOW = "LOW"             # Minor irregularities
    MEDIUM = "MEDIUM"       # Notable risk, missing secondary PPE, cluttered pathway
    HIGH = "HIGH"           # Severe risk, missing helmet near heavy machinery
    CRITICAL = "CRITICAL"   # Imminent danger, fire/smoke, fall from height

class HazardCategory(str, Enum):
    PPE_VIOLATION = "PPE_VIOLATION"             # Helmet, vest, goggles, harness
    FIRE_SMOKE = "FIRE_SMOKE"                   # Flame, sparks, heavy smoke
    SLIP_TRIP_FALL = "SLIP_TRIP_FALL"           # Spills, loose cables, floor obstacles
    UNAUTHORIZED_ZONE = "UNAUTHORIZED_ZONE"     # Personnel inside restricted perimeter
    MACHINERY_PROXIMITY = "MACHINERY_PROXIMITY" # Worker too close to moving equipment
    UNSAFE_BEHAVIOR = "UNSAFE_BEHAVIOR"         # Risky climbing, unsafe loads
    OTHER = "OTHER"

class DetectedHazard:
    category: HazardCategory
    severity: RiskSeverity
    description: str
    affected_area: str          # e.g., "top-left near scaffolding"
    recommendation: str         # immediate mitigating action
    confidence: float           # 0.0 to 1.0

class TimeslotIncident:
    incident_id: str
    category: HazardCategory
    severity: RiskSeverity
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: float
    status: str                 # "ACTIVE", "RESOLVED"
    best_frame_path: Optional[str]
    description: str
    occurrences_count: int
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Image Scene Description (Baseline VLM)
- **Goal**: Connect to NVIDIA NIM API with a test image.
- **Outcome**: The AI produces an accurate natural language description of what it observes (environment, equipment, personnel, lighting, general activities).
- **Deliverables**:
  - NVIDIA API client configuration.
  - CLI verification script taking a sample image and printing scene description.

### Phase 2: Static Hazard & Risk Recognition
- **Goal**: Direct the model towards hazard detection with strict structured JSON output.
- **Outcome**:
  - List of classified risks with severity ratings and corrective recommendations.
  - Optional visual overlay highlighting detected hazards on the frame.

### Phase 3: Video Stream Ingestion & Timeslot Tracking
- **Goal**: Transition from static images to continuous camera feeds (RTSP / webcam / video file).
- **Mechanism**:
  - Frame sampling (e.g., 1 frame per second or motion-triggered).
  - **Timeslot Engine**: Merges consecutive detections into continuous time intervals (e.g. *Incident from 14:02:10 to 14:02:45*).

### Phase 4: Alerting Engine
- **Goal**: Instant notification when high-risk hazards occur.
- **Outcome**:
  - Configurable alert severity thresholds (HIGH, CRITICAL).
  - Cooldown logic to prevent notification flooding.
  - Webhook dispatch and WebSocket broadcast.

### Phase 5: Automated Safety Reports
- **Goal**: Automated generation of shift or 24-hour safety reports.
- **Outcome**:
  - Aggregated timeslot summary, incident charts, and high-risk frame snapshots.
  - Export formats: Markdown, JSON, and PDF (via ReportLab).
  - Actionable recommendations generated by NVIDIA AI.

### Phase 6: Web Interface & Operator Dashboard
- **Goal**: Web interface for safety operators.
- **Outcome**:
  - Live feed view with hazard status indicator.
  - Interactive timeslot timeline scrubber.
  - Incident acknowledgment and report export center.

---

## 6. How to Obtain an NVIDIA NIM API Key

1. Visit [build.nvidia.com](https://build.nvidia.com).
2. Browse models (e.g. `meta/llama-3.2-11b-vision-instruct` or `nvidia/vila-1.5`).
3. Generate a personal API key.
4. Set the key in your local `.env`:
   ```bash
   NVIDIA_API_KEY=nvapi-your-key-here
   ```
