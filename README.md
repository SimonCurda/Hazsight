# Hazsight

> AI safety inspector powered by NVIDIA Nemotron on Nebius Token Factory. Upload a photo, get a polished PDF safety audit report with cited regulations in 30 seconds.

**Live demo**: [https://hazsight-gamma.vercel.app](https://hazsight-gamma.vercel.app)

Hazsight analyzes images of workspaces, warehouses, and industrial sites to detect occupational hazards — blocked emergency exits, flammable materials near heat sources, trip hazards, missing PPE, fire risks — then marks them on the image with severity-colored bounding boxes, overlays a risk heatmap, searches for relevant safety regulations via Tavily, and generates a downloadable PDF report.

---

## What is Nebius Token Factory and where do we use it?

**Nebius Token Factory** is an OpenAI-compatible inference API that serves NVIDIA's open-source models (Nemotron, Llama, etc.) on high-performance GPU infrastructure. It provides a single endpoint (`https://api.tokenfactory.nebius.com/v1/`) with one API key for all models — no proprietary SDK needed, just the standard `openai` npm package.

We use Nebius Token Factory in **`src/lib/nebius.ts`** for all AI inference:

| Function | Model | What it does |
|---|---|---|
| `analyzeImageWithVlm()` | `nvidia/Nemotron-3.5-Super-VL` | Vision-Language Model — scans the photo, detects hazards with bounding boxes, fire origin points, severity levels |
| `extractStructuredJson()` | `nvidia/Nemotron-3-Ultra-550b-a55b` | Reasoning model — validates and extracts structured JSON from VLM output, handles thinking tags and malformed responses |

Both calls go through the same Nebius Token Factory endpoint with a single `NEBIUS_API_KEY`.

---

## How we use NVIDIA Nemotron

Hazsight uses a **tiered model architecture** — different NVIDIA models for different tasks, all routed through Nebius Token Factory:

| Model | Role | What it does |
|---|---|---|
| **Nemotron 3.5 Super VL** | Vision-Language | Scans the photo for hazards, returns structured JSON: category, severity, bounding box, description, recommendation, confidence, fire origin point, fire severity level |
| **Nemotron 3 Ultra (550B)** | Reasoning | Plans the 5-step analysis pipeline, validates VLM output as JSON, cross-references regulations, synthesizes the final report with safety score |

### The pipeline

1. User uploads an image (any format — client-side canvas converts to PNG + resizes to max 1920px)
2. **Nemotron 3.5 Super VL** analyzes the image → detects hazards with bounding boxes, fire origin points, severity levels
3. **Robust JSON extraction** — handles VLM output with thinking tags, markdown fences, unescaped newlines, conversational preamble
4. **Tavily searches** for relevant safety regulations per hazard category, restricted to the user's selected jurisdiction
5. Result returned with hazards, regulations, trace events, and safety score

All inference goes through `https://api.tokenfactory.nebius.com/v1/` (OpenAI-compatible endpoint, Bearer auth, `NEBIUS_API_KEY`).

---

## Custom Jurisdiction + Tavily Regulation Search

Hazsight lets users **select a jurisdiction** before analysis. Tavily then searches **only official legal databases** for that country — ensuring the citations match the right laws.

### How it works

1. User picks a jurisdiction in the upload view (🇨🇿 Czech, 🇺🇸 USA, 🇯🇵 Japan, 🇪🇺 EU, 🇬🇧 UK, 🌍 ISO)
2. The jurisdiction is sent with the analyze request
3. Tavily's `include_domains` parameter restricts the search to **official legal websites** for that jurisdiction
4. Results include a jurisdiction badge so users know which country's laws apply

### Jurisdiction → Legal databases

| Jurisdiction | Tavily searches ONLY these sites | Query language |
|---|---|---|
| 🇨🇿 **Czech Republic** | `zakonyprolidi.cz`, `suib.cz`, `mpo.cz`, `mvcr.cz`, `mpsv.cz` | Czech (vyhláška 246/2001 Sb., zákoník práce) |
| 🇺🇸 **USA (OSHA)** | `osha.gov`, `ecfr.gov`, `dol.gov`, `bls.gov` | English (29 CFR 1910) |
| 🇯🇵 **Japan** | `elaws.e-gov.go.jp`, `fdma.go.jp`, `anam.or.jp`, `mhlw.go.jp` | Japanese (消防法, 労働安全衛生法) |
| 🇪🇺 **EU** | `eur-lex.europa.eu`, `osha.europa.eu`, `ec.europa.eu` | English (89/391/EEC, 89/654/EEC) |
| 🇬🇧 **UK (HSE)** | `legislation.gov.uk`, `hse.gov.uk`, `rospa.com` | English (HSWA 1974) |
| 🌍 **International** | `iso.org`, `ilo.org`, `who.int` | English (ISO 45001) |

Without `include_domains`, Tavily returns a random mix of US/EU/CZ results (whatever ranks highest on Google). With it, Tavily finds the **actual laws** from the right country's official databases.

---

## How Nebius Token Factory accelerated our workflow

- **OpenAI-compatible API** — used the standard `openai` npm package, just swapped the base URL. Zero SDK changes.
- **One API key, multiple models** — Nemotron 3.5 Super VL + Nemotron 3 Ultra, all from one endpoint
- **Vision modality** — image analysis via standard `image_url` content type in chat completions
- **Builder Program credits** — hackathon credits for Token Factory + Tavily
- **Graceful fallback** — if `NEBIUS_API_KEY` is not set, the app uses mock data so judges can see the full flow without a key

---

## Features

### Core analysis
- **Upload any image** — JPEG, PNG, WebP (client-side canvas converts to PNG + resizes)
- **Live agent-trace timeline** — watch Nemotron plan, VLM detect hazards, Tavily search regulations, report synthesize
- **Annotated image** — severity-colored bounding boxes + risk heatmap overlay (toggleable)
- **Risk list** — sorted by severity, each with category, description, confidence %, recommendation
- **Regulation citations** — real safety laws fetched via Tavily, jurisdiction-aware, with LIVE/MOCK badge
- **PDF download** — 2-page report: hazards + regulation citations, works on Vercel

### Fire detection
- **Fire origin point** — VLM pinpoints where the fire appears to originate
- **Fire severity level** — smoldering, active, spreading, or extinguished
- **Fire alert banner** — monitoring dashboard shows red pulsing alert when fire is detected
- **Flame icon markers** — on the annotated image at the fire origin point

### Monitoring dashboard
- **Scan history** — grid of past analyses with thumbnails, scores, timestamps, hazard category badges
- **Compliance trend chart** — safety score over time with threshold lines (75 = safe, 50 = high risk) + trend delta
- **Fire alert banner** — instant alert when any scan detects fire
- **Auto-refresh** — polls every 10 seconds for live monitoring
- **API-first** — `POST /api/analyze` accepts `image_url` for cron-job/camera integration

### Developer API
- **6 REST endpoints** — `POST /api/analyze`, `GET /api/jobs`, `GET /api/jobs/:id`, `GET /api/reports/:id`, `GET /api/tavily-test`, `GET /api/nebius-test`
- **API documentation** — terminal-style docs on the landing page with curl examples
- **Debug panel** — floating bug icon showing env state, API key status, last analysis trace, Tavily citations
- **Key verification** — `/api/nebius-test` and `/api/tavily-test` endpoints to verify keys before deploying

### UI/UX
- **NVIDIA-green aesthetic** — dark mode, lime-500 palette, code background with typing animation
- **ScrambleText** — decrypt/matrix text effect on section headings (characters cycle through `/ \ $ #` before settling)
- **Glassmorphism** — frosted glass blur behind content cards
- **Mouse parallax** — background code subtly shifts with cursor movement
- **Keyboard shortcuts** — Esc to reset, 1-9 to select hazards
- **Tooltips** — hover bounding boxes for full hazard details

---

## Technology stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (40+ components)
- **Framer Motion** — animations, scroll-triggered fade-ins, trace timeline
- **@react-pdf/renderer** — server-side PDF generation (Vercel-compatible)
- **openai SDK** — pointed at Nebius Token Factory
- **Tavily API** — live web search with jurisdiction-aware `include_domains`

---

## Quickstart

### Run locally (mock mode — no API key needed)

```bash
git clone https://github.com/SimonCurda/Hazsight.git
cd Hazsight
npm install
cp .env.example .env.local
npm run dev
# Open http://localhost:3000
```

Without `NEBIUS_API_KEY`, the app uses **mock data**. Click **"Try with a demo image"** to see the full flow.

### With real AI

Edit `.env.local`:
```bash
NEBIUS_API_KEY=your-key-from-tokenfactory.nebius.com
TAVILY_API_KEY=your-key-from-tavily.com
DATABASE_URL="file:./db/custom.db"
```

Now the app calls **real Nebius Token Factory** (VLM + Nemotron Ultra) + **real Tavily** (live regulation search with jurisdiction-aware domains).

### Deploy to Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set environment variables: `NEBIUS_API_KEY`, `TAVILY_API_KEY`, `DATABASE_URL`
3. Deploy — Vercel auto-detects Next.js

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Submit image for VLM analysis (accepts `image_url` or `image_base64` + `jurisdiction`) |
| `POST` | `/api/reports/generate` | Generate PDF from result data (works on Vercel) |
| `GET` | `/api/jobs` | List all analysis jobs |
| `GET` | `/api/jobs/:id` | Get job status + result |
| `GET` | `/api/jobs/:id/trace` | Agent reasoning trace events |
| `GET` | `/api/nebius-test` | Verify Nebius API key + model names |
| `GET` | `/api/tavily-test` | Verify Tavily API key |
| `GET` | `/api/models` | List all available models on Nebius Token Factory |
| `GET` | `/api/debug` | Full debug info (env, jobs, trace events) |

---

## Hackathon compliance

This project satisfies the [Nebius x NVIDIA Global AI Hackathon](https://nebiusglobalaihackathon.devpost.com/) rules:

- **Runs on Nebius Token Factory**: all inference via `https://api.tokenfactory.nebius.com/v1/`
- **Uses NVIDIA open-source models**: Nemotron 3.5 Super VL + Nemotron 3 Ultra (550B)
- **Track**: Best Apps & Agents
- **Best Use of Tavily** ($3,000 bonus): jurisdiction-aware regulation search with `include_domains` on official legal databases
- **MIT licensed**

---

## Team DAMR58H

| Member | Role |
|---|---|
| **Šimon Čurda** | Tech lead — Next.js frontend + agent orchestration + Nebius routing |
| **Jan "Honza" Korbel** | ML/AI lead — Nemotron prompt design + hazard evaluation |
| **Adam Říha** | Backend — Tavily integration + custom tools |
| **Nikol Picková** | Design/UX/strategy — UI design + demo video + Devpost |
| **Matěj Duček** | Data research + QA — safety regulations dataset |
| **David Jindra** | DevOps — deployment + PDF pipeline |
| **František Křížik Zemanová** | Faculty mentor — fact-checking regulations |

---

## License

Licensed under the MIT License — see [LICENSE](LICENSE).
