# Hazsight

> **Intelligent Vision System for Hazard Detection, Incident Timeslots, and Safety Reporting using NVIDIA Nemotron on Nebius Token Factory.**

Hazsight analyzes camera feeds and visual recordings to detect occupational hazards (PPE violations, fire/smoke, unsafe equipment proximity, restricted zones), tracks their temporal duration (**timeslots**), triggers real-time alerts, and generates automated safety audit reports for managers and compliance inspectors.

---

## Repository Layout

Hazsight is a **hybrid repository** with a Python backend and a Next.js frontend in a single repo (per hackathon submission rules requiring a single public repository URL).

```
SimonCurda/Hazsight/
├── README.md                  (this file — shared)
├── AGENTS.md                  (mandatory rules for AI agents)
├── AGENT_LOG.md               (transparent AI activity log)
├── IMPLEMENTATION_PLAN.md     (technical & implementation roadmap)
├── LICENSE                    (MIT)
├── worklog.md                 (human + AI work log)
├── .github/workflows/ci.yml  (CI: lint Python + build Next.js)
│
├── frontend/                  (Next.js 16 + TypeScript + shadcn/ui)
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   │   ├── app/               (App Router — single / route, state-machine)
│   │   ├── components/
│   │   │   ├── ui/            (shadcn/ui components)
│   │   │   ├── hazsight/      (Hazsight-specific: upload, trace, results)
│   │   │   ├── theme-provider.tsx
│   │   │   └── mode-toggle.tsx
│   │   ├── lib/               (types, mock-data, utils)
│   │   └── hooks/
│   ├── prisma/                (Prisma schema — for future use)
│   └── public/
│
└── backend/                   (Python 3.11+ + FastAPI + Nebius Token Factory)
    ├── pyproject.toml
    ├── .env.example
    ├── src/hazsight/
    │   ├── config.py          (Nebius Token Factory client config)
    │   ├── ai/schemas.py      (Pydantic schemas: Hazard, RiskSeverity, etc.)
    │   ├── alerts/            (alerting engine — skeleton)
    │   ├── api/               (FastAPI routes — skeleton)
    │   ├── reports/           (PDF report generation — skeleton)
    │   └── stream/            (video frame capture — skeleton)
    └── tests/
```

---

## Architecture Overview

```
[Camera Feed / Video / RTSP / Image]
                 │
                 ▼
     [Frame Sampler Engine]
                 │
                 ▼
       [Nebius Token Factory — NVIDIA AI]
       ├─ VLM (Llama 3.2 Vision / VILA) — scene + hazard detection
       ├─ Nemotron 3 Ultra — severity + recommendations + report synthesis
       └─ Nemotron 3 Super — chat Q&A, quick lookups
                 │
                 ▼
   [Timeslot & Incident Tracker] ───► [Alerting Engine] ──► (WebSocket, Webhooks)
                 │
                 ▼
      [Reporting Engine] ───────────► (PDF, Markdown, JSON)
                 │
                 ▼
     [FastAPI Backend] ◄──────────► [Next.js Frontend]
                                     - Upload UI
                                     - Annotated image view
                                     - Risk list + report viewer
                                     - Trace timeline (live + replay)
                                     - Dark mode, responsive
```

---

## Technology Stack

### Backend (Python)
- **Language**: Python 3.11+
- **AI inference**: **Nebius Token Factory** (`https://api.tokenfactory.nebius.com/v1/`, OpenAI-compatible)
- **Models** (NVIDIA open-source, served on Nebius):
  - NVIDIA Nemotron 3 Ultra — deep reasoning (hazard classification, severity, recommendations)
  - NVIDIA Nemotron 3 Super — fast calls (chat Q&A, quick lookups)
  - NVIDIA-served VLM (e.g. `meta/llama-3.2-11b-vision-instruct`) — image analysis
- **Backend / API**: FastAPI, Uvicorn, Pydantic v2
- **Computer Vision**: OpenCV (`cv2`), Pillow (`PIL`), NumPy
- **Reporting**: ReportLab (PDF), Markdown, JSON

### Frontend (TypeScript)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui component library
- **State**: React hooks (state machine on `/` route)
- **Animation**: Framer Motion
- **Themes**: next-themes (dark mode + system)
- **Validation**: Zod
- **Deployment**: Vercel (frontend) + Nebius AI Cloud (backend)

---

## Quickstart

### Backend (Python)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .

# Configure environment
cp .env.example .env
# Set NEBIUS_API_KEY in .env (get one at https://tokenfactory.nebius.com)
```

### Frontend (Next.js)

```bash
cd frontend
bun install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL in .env.local (default: http://localhost:8000)

# Run dev server on port 3000
bun run dev
```

The frontend is a state-machine single-page app on the `/` route:
1. **Landing** — hero, how it works, hazard types, tech stack
2. **Upload** — drag-and-drop image upload with preview
3. **Processing** — live agent-trace timeline showing the reasoning steps
4. **Results** — annotated image with severity-colored bounding boxes + risk list + PDF download

Currently the frontend uses **mock data** (`src/lib/mock-data.ts`) so the full flow works end-to-end before the Python backend is wired up. Swap mock for real API calls when the backend is ready.

---

## Phased Roadmap

1. **Phase 1**: Image Scene Description (Baseline VLM via Nebius Token Factory)
2. **Phase 2**: Static Hazard & Risk Recognition (Structured JSON output & hazard classifications)
3. **Phase 3**: Video & Camera Ingestion with Timeslot Tracking
4. **Phase 4**: Real-Time Alerting Engine (Severity thresholds, spam suppression, webhooks)
5. **Phase 5**: Automated Safety Reports (Shift/daily PDF, Markdown, and JSON exports)
6. **Phase 6**: Web Dashboard & Operator Interface (Next.js frontend — live camera overview, timeslot scrubber)

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the full technical roadmap.

---

## Hackathon Compliance

This project satisfies the [Nebius x NVIDIA Global AI Hackathon](https://nebiusglobalaihackathon.devpost.com/) rules:

- **Runs on Nebius Token Factory**: All inference is routed through `https://api.tokenfactory.nebius.com/v1/` (OpenAI-compatible API)
- **Uses at least one NVIDIA open-source model**: NVIDIA Nemotron 3 Ultra (reasoning) + Nemotron 3 Super (fast) + Llama 3.2 Vision (VLM) — all NVIDIA open-source models served on Nebius Token Factory
- **Track**: Best Apps & Agents

---

## Team DAMR58H

- **Šimon Čurda** — Tech lead (Next.js frontend + agent orchestration + Nebius routing)
- **Jan "Honza" Korbel** — ML/AI lead (Ultra/Nano prompt design, brief quality)
- **Adam Říha** — Backend (Tavily + custom tools, Nebius Serverless Jobs)
- **Nikol Picková** — Design/UX/strategy (annotated image UX, PDF template, demo video)
- **Matěj Duček** — Data research + QA (safety regulations dataset, evaluation rubric)
- **David Jindra** — DevOps (deployment, PDF pipeline, image upload pipeline)
- **František Křížik Zemanová** — Faculty mentor (fact-checking safety regulations)

---

## License

Licensed under the MIT License — see [LICENSE](LICENSE).
