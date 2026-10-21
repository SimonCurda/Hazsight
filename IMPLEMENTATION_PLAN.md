# IMPLEMENTATION_PLAN.md - Technical & Implementation Roadmap

This document outlines the architectural roadmap, technology options, and phased execution plan for **Hazsight**.
Hazsight is designed to monitor camera feeds, identify risks and occupational safety hazards, anchor incidents into continuous **timeslots**, trigger real-time alerts, and generate automated safety audit reports.

> **Status**: Architectural Planning & Skeleton Stage (No premature implementation code).

---

## 1. Project Vision & Objectives

- **Project Name**: Hazsight
- **Goal**: Automated occupational health and safety (OHS/EHS) monitoring for industrial sites, construction areas, warehouses, and smart facilities using video feeds.
- **Mandatory Constraint**: Must run on **Nebius Token Factory** (or Nebius AI Cloud) and use at least one **NVIDIA open-source model** (per Nebius x NVIDIA Global AI Hackathon rules).
- **Key Deliverables**:
  1. Multimodal scene understanding (what is happening in the visual frame).
  2. Hazard & risk recognition (PPE compliance, fire/smoke, tripping hazards, hazardous machinery proximity, unauthorized zones).
  3. Temporal anchoring (**Timeslots** – tracking start time, duration, and resolution of an incident).
  4. Real-time alerting engine (WebSocket, Webhooks, immediate operator warnings).
  5. Automated reporting engine (Shift/daily summaries in PDF, Markdown, JSON).

---

## 2. NVIDIA AI Technologies via Nebius Token Factory

> **Hackathon Compliance Note**: The Nebius x NVIDIA Global AI Hackathon requires all submissions to run on either **Nebius Token Factory** or **Nebius AI Cloud** and use at least one **NVIDIA open-source model**. All inference in Hazsight is therefore routed through Nebius Token Factory (OpenAI-compatible API at `https://api.tokenfactory.nebius.com/v1/`), which serves the NVIDIA Nemotron open-source model family plus NVIDIA-served VLMs (Llama 3.2 Vision, VILA, Cosmos).

To satisfy the NVIDIA requirement while balancing flexibility, latency, and hardware constraints:

| NVIDIA Technology (served via Nebius Token Factory) | Service / Deployment Model | Key Benefits | Recommended Hazsight Role |
| :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3 Ultra** | Nebius Token Factory public serverless endpoint (OpenAI-compatible REST API) | • Deep reasoning for hazard classification, severity assessment, regulatory cross-referencing.<br>• Excellent structured JSON output.<br>• Zero local GPU requirement. | **Phases 1 & 2 (Primary reasoning model)** for hazard assessment, recommendations, and report synthesis. |
| **NVIDIA Nemotron 3 Super** | Nebius Token Factory public serverless endpoint (OpenAI-compatible REST API) | • Fast, low-latency calls.<br>• Keeps the app responsive and credits stretch further. | Chat Q&A, quick lookups, status updates, real-time operator queries. |
| **NVIDIA-served VLM**<br>*(e.g., `meta/llama-3.2-11b-vision-instruct`, `nvidia/vila-1.5`, `nvidia/cosmos-nemotron-34b`)* | Nebius Token Factory public serverless endpoint (OpenAI-compatible REST API, vision modality) | • Exceptional semantic scene reasoning and hazard understanding from images/frames.<br>• Reliable structured JSON output. | **Phases 1 & 2 (Primary choice for fast development)** and semantic hazard reasoning. |
| **NVIDIA Cosmos** (`nvidia/cosmos-nemotron-34b`) | Physical AI & World Foundation Model | • Specifically tailored for physical dynamics, 3D spatial awareness, and industrial environments. | Advanced physical risk modeling (predictive collision risk). |
| **NVIDIA NeMo Guardrails** | LLM/VLM Safety & Policy Layer | • Prevents hallucinations in generated safety reports.<br>• Enforces adherence to safety standards. | Phase 5 safety report generation. |

### Recommended Approach: Hybrid Pipeline
1. **Cloud / Development Brain**: Use **Nebius Token Factory** via `https://api.tokenfactory.nebius.com/v1/` (OpenAI-compatible). This allows instant testing with image uploads and flexible prompt engineering without requiring multi-gigabyte local models. Get an API key at `https://tokenfactory.nebius.com`.
2. **Video & Frame Sampling Engine**: Lightweight Python (OpenCV) frame sampler that selects key frames (e.g. 1 frame/sec or motion-triggered) to minimize unnecessary API calls.
3. **Edge Optimization Ready**: The architecture allows swapping the public serverless endpoint for a Nebius dedicated endpoint (single-region, zero data retention for sensitive workloads) or local TensorRT pipeline in the future without altering application code.

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
   |                      NEBIUS TOKEN FACTORY (NVIDIA AI)                         |
   |  - Nemotron 3 Ultra  : hazard classification, severity, recommendations       |
   |  - Nemotron 3 Super  : chat Q&A, quick lookups                                |
   |  - VLM (Llama 3.2 Vision / VILA / Cosmos) : scene understanding              |
   |  - OpenAI-compatible REST API at https://api.tokenfactory.nebius.com/v1/      |
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
            +--------------------------------------+        +--------------------------+
            |   PYTHON BACKEND (FastAPI)           |<------>|  NEXT.JS FRONTEND        |
            |   - /api/analyze (POST image)        |  REST  |  (TypeScript + shadcn/ui) |
            |   - /api/jobs/{id} (GET status)      |   +    |  - Upload UI             |
            |   - /api/jobs/{id}/trace (GET)      |  WS     |  - Annotated image view  |
            |   - VLM calls via Nebius Token       |        |  - Risk list + report    |
            |     Factory (OpenAI SDK)             |        |  - Trace timeline        |
            +--------------------------------------+        |  - Dark mode, responsive  |
                                                            +--------------------------+
```

### Architectural Decisions (locked)
- **Backend**: Python 3.11+ with **FastAPI** (asynchronous, high performance, native OpenAPI documentation). Hosts the VLM/Ultra/Super inference pipeline via Nebius Token Factory, Tavily integration, and PDF report generation. Owners: Honza + Adam.
- **Web UI**: **Option B chosen** — Standalone modern frontend in **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui**, communicating with the Python backend via REST + WebSocket. Owners: Šimon + Nikol. The Next.js frontend lives in this same repository under `frontend/` and is deployed to Vercel; the Python backend lives under `backend/` (currently `src/`) and is deployed separately.
- **Persistence**: SQLite (development) -> PostgreSQL (production) for storing incident timeslots, alerts, and report logs.

### Hybrid Repository Layout
```
SimonCurda/Hazsight/
├── README.md                  (shared)
├── AGENTS.md                  (shared — mandatory rules for AI agents)
├── AGENT_LOG.md               (shared — activity log)
├── IMPLEMENTATION_PLAN.md    (this document, shared)
├── LICENSE                    (MIT)
├── .env.example               (merged: frontend + backend vars)
├── .gitignore                 (merged)
├── .github/workflows/ci.yml  (lint Python + build Next.js)
├── frontend/                  (Next.js 16 + TypeScript — Šimon)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json
│   ├── src/
│   │   ├── app/               (App Router: / route only)
│   │   ├── components/        (shadcn/ui + custom)
│   │   ├── lib/              (Nebius client, api client)
│   │   └── hooks/
│   └── public/
└── backend/                  (Python — David + Honza)
    ├── pyproject.toml
    ├── src/hazsight/         (FastAPI app, ai/, alerts/, reports/, stream/)
    └── tests/
```

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
- **Goal**: Connect to Nebius Token Factory with a test image using an NVIDIA-served VLM (e.g. `meta/llama-3.2-11b-vision-instruct`).
- **Outcome**: The AI produces an accurate natural language description of what it observes (environment, equipment, personnel, lighting, general activities).
- **Deliverables**:
  - Nebius Token Factory API client configuration (in `backend/src/hazsight/config.py`).
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
  - Actionable recommendations generated by Nemotron 3 Ultra via Nebius Token Factory.

### Phase 6: Web Interface & Operator Dashboard
- **Goal**: Web interface (Next.js + shadcn/ui) for safety operators.
- **Outcome**:
  - Live feed view with hazard status indicator.
  - Interactive timeslot timeline scrubber.
  - Incident acknowledgment and report export center.

---

## 6. How to Obtain a Nebius Token Factory API Key

> **Hackathon compliance**: Submissions must use Nebius Token Factory (or Nebius AI Cloud), not NVIDIA's direct API at `build.nvidia.com`. The Nebius Token Factory serves the same NVIDIA open-source models (Nemotron 3 Ultra, Nemotron 3 Super, Llama 3.2 Vision, VILA, Cosmos) through an OpenAI-compatible endpoint.

1. Visit [tokenfactory.nebius.com](https://tokenfactory.nebius.com).
2. Create an account (Google or GitHub login supported).
3. Join the **Nebius Builder Program** for hackathon credits (Nebius Token Factory, Tavily, and Nebius Academy access — see the hackathon rules page).
4. Generate a personal API key in the Token Factory UI.
5. Verify available models in the playground (look for `nvidia/nemotron-3-ultra`, `nvidia/nemotron-3-super`, and a vision model like `meta/llama-3.2-11b-vision-instruct`).
6. Set the key in your local `.env`:
   ```bash
   NEBIUS_API_KEY=your-nebius-token-factory-key-here
   ```
