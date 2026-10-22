# Hazsight

> AI safety inspector powered by NVIDIA Nemotron on Nebius Token Factory. Upload a photo, get a polished PDF safety audit report in 30 seconds.

Hazsight analyzes images of workspaces, warehouses, and industrial sites to detect occupational hazards — blocked emergency exits, flammable materials near heat sources, overloaded outlets, trip hazards, missing PPE — then marks them on the image with severity-colored bounding boxes and generates a downloadable PDF report with cited regulations.

---

## How we use NVIDIA Nemotron

Hazsight uses a **tiered model architecture** — different NVIDIA Nemotron models for different tasks, routed through Nebius Token Factory's OpenAI-compatible API:

| Model | Role | What it does |
|---|---|---|
| **Nemotron 3 Ultra** | Reasoning | Plans the analysis, assesses hazard severity, cross-references regulations, synthesizes the final report |
| **Nemotron 3 Super** | Fast calls | Chat Q&A, quick lookups, status updates — keeps the app responsive |
| **Llama 3.2 Vision** (NVIDIA-served VLM) | Image analysis | Scans the photo for hazards, returns structured JSON with category, severity, bounding box, description, recommendation, confidence |

The flow:
1. User uploads an image
2. Nemotron 3 Ultra plans the analysis (5-step pipeline: scene understanding → hazard ID → severity assessment → regulation lookup → report synthesis)
3. Llama 3.2 Vision analyzes the image and detects hazards with bounding boxes
4. Tavily searches the web for relevant safety regulations per hazard category
5. Nemotron 3 Ultra synthesizes everything into a structured report with safety score

All inference goes through `https://api.tokenfactory.nebius.com/v1/` (OpenAI-compatible endpoint, Bearer auth, `NEBIUS_API_KEY`).

---

## How Nebius Token Factory accelerated our workflow

Nebius Token Factory's **OpenAI-compatible API** meant we could use the standard `openai` npm package — just swap the base URL and API key. Zero code changes to the SDK layer.

**What Token Factory gave us:**
- **One API, three models**: Nemotron 3 Ultra + Nemotron 3 Super + Llama 3.2 Vision — all from one endpoint, one API key, one billing account
- **OpenAI-compatible**: no proprietary SDK to learn — `client.chat.completions.create()` just works
- **Vision modality**: image analysis via standard `image_url` content type in chat completions
- **Zero Data Retention option**: for sensitive workplace photos, ZDR can be enabled (we documented this in `IMPLEMENTATION_PLAN.md`)
- **Builder Program credits**: hackathon credits for Token Factory + Tavily + Nebius Academy

**Graceful fallback**: if `NEBIUS_API_KEY` is not set, the app uses mock data (pre-written hazards + regulation citations) so the demo works for judges without a key. When the key is added, real VLM calls happen.

---

## Nebius tools used

| Tool | Purpose | Where |
|---|---|---|
| **Nebius Token Factory** | Inference API for all NVIDIA models (Ultra, Super, VLM) | `src/lib/nebius.ts` — `analyzeImageWithVlm()`, `extractStructuredJson()` |
| **Tavily** (via Nebius Builder Program) | Live web search for safety regulation citations | `src/lib/tavily.ts` — `searchAllRegulations()` |
| **Nebius AI Cloud** (planned) | Serverless Jobs for batch processing + video stream analysis | `backend/src/hazsight/` — Python skeleton ready |

---

## Repository layout

```
SimonCurda/Hazsight/
├── README.md                       (this file)
├── AGENTS.md                       (mandatory rules for AI agents)
├── AGENT_LOG.md                    (transparent AI activity log)
├── IMPLEMENTATION_PLAN.md         (technical & implementation roadmap)
├── LICENSE                         (MIT)
├── worklog.md                      (human + AI work log)
├── TODO_BACKGROUND_CODE.md         (design spec for Nikol — background code UI)
├── .github/workflows/ci.yml        (CI: lint Python + build Next.js)
│
├── frontend/                       (Next.js 16 + TypeScript)
│   ├── package.json                (deps: openai, @react-pdf/renderer, framer-motion, ...)
│   ├── .env.example                (NEBIUS_API_KEY, TAVILY_API_KEY, ...)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            (state machine: landing → upload → processing → results)
│   │   │   ├── layout.tsx          (root layout + ThemeProvider + BackgroundCode)
│   │   │   ├── globals.css         (NVIDIA-green palette + HUD utilities + animations)
│   │   │   └── api/
│   │   │       ├── analyze/route.ts         (POST: image → Nebius VLM → Nemotron Ultra → Tavily → result)
│   │   │       ├── jobs/[id]/route.ts       (GET: job status + result)
│   │   │       ├── jobs/[id]/trace/route.ts (GET: trace events for live timeline)
│   │   │       └── reports/[jobId]/route.ts (GET: generates + returns PDF)
│   │   ├── components/
│   │   │   ├── hazsight/           (landing-view, upload-dropzone, processing-view,
│   │   │   │                        results-view, annotated-image, risk-list,
│   │   │   │                        trace-timeline, background-code)
│   │   │   ├── ui/                 (shadcn/ui — 40+ components)
│   │   │   ├── theme-provider.tsx  (next-themes dark mode)
│   │   │   └── mode-toggle.tsx     (dark/light toggle)
│   │   └── lib/
│   │       ├── nebius.ts           (Nebius Token Factory client — VLM + Ultra calls)
│   │       ├── tavily.ts           (Tavily client — regulation search + mock fallback)
│   │       ├── job-store.ts        (in-memory job store via globalThis)
│   │       ├── pdf-report.tsx      (React PDF layout via @react-pdf/renderer)
│   │       ├── mock-data.ts        (mock hazards, trace events, regulations)
│   │       └── types.ts            (RiskSeverity, HazardCategory, color mappings)
│   ├── public/
│   │   └── demo-warehouse.png      (AI-generated sample image with hazards)
│   └── prisma/                     (schema — for future persistence)
│
└── backend/                        (Python 3.11+ + FastAPI)
    ├── pyproject.toml
    ├── .env.example
    └── src/hazsight/
        ├── main.py                (FastAPI app — uvicorn hazsight.main:app)
        ├── config.py              (Nebius Token Factory settings)
        ├── ai/schemas.py          (Pydantic: DetectedHazard, BoundingBox, RiskSeverity, ...)
        ├── api/reports.py          (POST /api/reports/generate — Python PDF via ReportLab)
        ├── reports/                (modular PDF generator + image annotator + config)
        ├── alerts/                (alerting engine — skeleton)
        └── stream/                (video frame capture — skeleton)
```

---

## Architecture

```
[User uploads image]
        │
        ▼
[Next.js API Route: POST /api/analyze]
        │
        ├─ 1. Nemotron 3 Ultra (plan)
        ├─ 2. Llama 3.2 Vision VLM (detect hazards + bounding boxes)
        ├─ 3. Nemotron 3 Ultra (severity + structured JSON)
        ├─ 4. Tavily (search regulations per hazard category)
        └─ 5. Synthesize report
        │
        ▼
[Job store (globalThis)] ──► [GET /api/jobs/[id]] (poll for status)
        │                        │
        │                        ▼
        │                [GET /api/jobs/[id]/trace] (live trace timeline)
        │
        ▼
[GET /api/reports/[jobId]] ──► @react-pdf/renderer ──► PDF download
```

**Everything runs on Vercel** — Next.js + API routes + PDF generation. No separate backend needed for the demo. Python backend (`backend/`) is for advanced features (video stream, alerting, scheduled reports).

---

## Technology stack

### Frontend
- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (40+ components)
- **Framer Motion** (scroll-triggered fade-ins, ambient gradient, hover effects)
- **next-themes** (dark mode default — NVIDIA-green palette)
- **@react-pdf/renderer** (server-side PDF generation — works on Vercel)
- **openai** SDK (OpenAI-compatible, pointed at Nebius Token Factory)

### AI / Inference
- **Nebius Token Factory** (`api.tokenfactory.nebius.com/v1/`) — OpenAI-compatible
- **NVIDIA Nemotron 3 Ultra** — deep reasoning (hazard classification, severity, synthesis)
- **NVIDIA Nemotron 3 Super** — fast calls (chat Q&A, quick lookups)
- **Llama 3.2 Vision** — VLM for image analysis (NVIDIA-served on Nebius)

### Search
- **Tavily** — live web search for safety regulation citations ($3,000 Best Use of Tavily bonus target)

### Backend (Python — optional, for advanced features)
- **FastAPI** + **Uvicorn** + **Pydantic v2**
- **ReportLab** (PDF generation — alternative to @react-pdf/renderer)
- **Pillow** (image annotation — draws bounding boxes on images)
- **OpenCV** (video frame capture — skeleton)

---

## Quickstart

### Frontend only (works now, no API key needed)

```bash
git clone https://github.com/SimonCurda/Hazsight.git
cd Hazsight/frontend
npm install          # or: bun install
cp .env.example .env.local
npm run dev          # or: bun run dev
# Open http://localhost:3000
```

Without `NEBIUS_API_KEY`, the app uses **mock data** (pre-written hazards + regulation citations). Click **"Try with a demo image"** to see the full flow.

### With real AI (add API keys)

Edit `frontend/.env.local`:
```bash
NEBIUS_API_KEY=your-key-from-tokenfactory.nebius.com
TAVILY_API_KEY=your-key-from-tavily.com
```

Now the app calls **real Nebius Token Factory** (VLM + Nemotron Ultra) + **real Tavily** (live regulation search).

### Backend (optional — for Python PDF generation)

```bash
cd backend
pip install -e .
uvicorn hazsight.main:app --port 8000 --reload
```

---

## Features

- **Upload a photo** — drag-and-drop or browse (JPEG, PNG, WebP)
- **Live agent-trace timeline** — watch Nemotron 3 Ultra plan, the VLM detect hazards, Tavily search regulations, and the report synthesize in real time
- **Annotated image** — severity-colored bounding boxes (Critical = red, High = orange, Medium = amber, Low = emerald). Click a box to highlight it in the risk list.
- **Risk list** — sorted by severity, each with category, description, confidence %, recommendation
- **Regulation citations** — real safety regulations (Czech vyhl. 246/2001 Sb., EU directives, ISO standards) fetched via Tavily
- **PDF download** — polished safety audit report with header, safety score, scene description, annotated image, hazard table, cited regulations
- **Reasoning trace replay** — expand the "Reasoning Trace" section in results to re-watch the agent's reasoning
- **Demo image** — AI-generated warehouse photo with actual hazards (blocked exit, flammable near heater, cable on floor)
- **Background code** — animated code snippets from the actual codebase floating in the background. Per-character hover effect (letters scale up + glow green). Subtle pulse on mobile.
- **Dark mode** — NVIDIA-green palette on deep dark background, checkerboard grid pattern, ambient gradient
- **Responsive** — mobile-first design with touch-friendly targets
- **No signup required** — judges can click "Try with a demo image" and see the full flow without any account

---

## Hackathon compliance

This project satisfies the [Nebius x NVIDIA Global AI Hackathon](https://nebiusglobalaihackathon.devpost.com/) rules:

- **Runs on Nebius Token Factory**: all inference is routed through `https://api.tokenfactory.nebius.com/v1/` (OpenAI-compatible API)
- **Uses at least one NVIDIA open-source model**: NVIDIA Nemotron 3 Ultra + Nemotron 3 Super + Llama 3.2 Vision — all NVIDIA open-source models served on Nebius Token Factory
- **Track**: Best Apps & Agents
- **Best Use of Tavily**: regulation citations via Tavily Live Search ($3,000 bonus target)

---

## Team DAMR58H

| Member | Role |
|---|---|
| **Šimon Čurda** | Tech lead — Next.js frontend + agent orchestration + Nebius routing |
| **Jan "Honza" Korbel** | ML/AI lead — Nemotron prompt design + hazard evaluation |
| **Adam Říha** | Backend — Tavily integration + custom tools + Nebius Serverless Jobs |
| **Nikol Picková** | Design/UX/strategy — UI design + demo video + Devpost submission |
| **Matěj Duček** | Data research + QA — safety regulations dataset + evaluation rubric |
| **David Jindra** | DevOps — deployment + PDF pipeline + repo management |
| **František Křížik Zemanová** | Faculty mentor — fact-checking safety regulations |

---

## License

Licensed under the MIT License — see [LICENSE](LICENSE).
