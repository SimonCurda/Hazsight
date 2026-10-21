# AGENT_LOG.md - AI Agent Activity & Decision Log

This file serves as a transparent audit log for all actions, architectural decisions, and modifications made by AI agents in the **Hazsight** project.
Every agent is **required** to prepend a new entry to the [Action History](#action-history) section before completing their task.

---

## Log Entry Template

```markdown
### [YYYY-MM-DD HH:MM] - Task Name / Change Title
- **Agent**: [Model / Agent Name, e.g. Antigravity (Gemini 3.8 Flash)]
- **What**: Concise summary of what was added, modified, or refactored.
- **Where**: Affected files with repository-relative markdown links:
  - [`path/to/file.py`](path/to/file.py)
- **Why**: Motivation, context, and architectural rationale.
- **Verification**: How the change was tested or verified.
```

---

## Action History

### [2026-10-21 13:45] - Restructure to hybrid mono-repo + scaffold Next.js frontend
- **Agent**: Z.ai Code (assisting Šimon Čurda)
- **What**:
  - Restructured the repository into a hybrid mono-repo layout: moved Python backend into [`backend/`](backend/) subdir (src/, tests/, pyproject.toml, .env.example), created [`frontend/`](frontend/) subdir for the Next.js app.
  - Scaffolded the full Next.js 16 frontend (TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, next-themes for dark mode) in [`frontend/`](frontend/):
    - [`frontend/src/app/layout.tsx`](frontend/src/app/layout.tsx) — root layout with Hazsight metadata + ThemeProvider
    - [`frontend/src/app/page.tsx`](frontend/src/app/page.tsx) — state machine: landing -> uploading -> processing -> results
    - [`frontend/src/components/hazsight/landing-view.tsx`](frontend/src/components/hazsight/landing-view.tsx) — hero, how it works, hazard types, tech stack, CTA
    - [`frontend/src/components/hazsight/upload-dropzone.tsx`](frontend/src/components/hazsight/upload-dropzone.tsx) — drag-and-drop image upload with preview + analyze
    - [`frontend/src/components/hazsight/processing-view.tsx`](frontend/src/components/hazsight/processing-view.tsx) — dimmed image + live agent-trace timeline
    - [`frontend/src/components/hazsight/trace-timeline.tsx`](frontend/src/components/hazsight/trace-timeline.tsx) — animated reasoning trace with Framer Motion
    - [`frontend/src/components/hazsight/annotated-image.tsx`](frontend/src/components/hazsight/annotated-image.tsx) — image with severity-colored bounding boxes (click to highlight)
    - [`frontend/src/components/hazsight/risk-list.tsx`](frontend/src/components/hazsight/risk-list.tsx) — sorted hazard cards with severity badges, recommendations, confidence
    - [`frontend/src/components/hazsight/results-view.tsx`](frontend/src/components/hazsight/results-view.tsx) — safety score, scene description, annotated image + risk list, PDF download
    - [`frontend/src/components/theme-provider.tsx`](frontend/src/components/theme-provider.tsx) + [`frontend/src/components/mode-toggle.tsx`](frontend/src/components/mode-toggle.tsx) — dark mode toggle
    - [`frontend/src/lib/types.ts`](frontend/src/lib/types.ts) — RiskSeverity, HazardCategory, color mappings (mirror Python schemas.py)
    - [`frontend/src/lib/mock-data.ts`](frontend/src/lib/mock-data.ts) — mock hazards, trace events, sample image (for demo without backend)
  - Wrote [`worklog.md`](worklog.md) at repo root — shared human + AI work log.
  - Wrote [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — CI workflow that lints Python (ruff) + builds Next.js (bun run lint + bun run build).
  - Rewrote [`README.md`](README.md) to reflect the hybrid structure, Nebius Token Factory compliance, tech stack, quickstart for both frontend + backend, and team DAMR58H.
- **Where**:
  - [`backend/`](backend/) (Python files moved from root via `git mv`)
  - [`frontend/`](frontend/) (new — Next.js scaffold from `/home/z/my-project/`)
  - [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (new)
  - [`worklog.md`](worklog.md) (new)
  - [`README.md`](README.md) (rewritten)
- **Why**:
  - Hackathon submission rules require a single public repository URL. A hybrid mono-repo (backend/ + frontend/) satisfies this while letting each team (Python backend by David+Honza, Next.js frontend by Šimon+Nikol) work in its own subdir without conflict.
  - The Next.js frontend implements "Option B: Standalone modern frontend (Vite + React / Next.js)" that was already anticipated in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) Section 3.
  - Mock data in [`frontend/src/lib/mock-data.ts`](frontend/src/lib/mock-data.ts) lets the full flow demo end-to-end before the Python backend is wired up. When the backend is ready, swap mock for real API calls.
- **Verification**:
  - Ran `bun run lint` on the frontend — passes with zero errors.
  - Verified via `agent-browser`: landing page renders correctly (no console errors, all interactive elements present). "Upload a photo" button switches to upload view (state machine works). Dark mode toggle works. Back navigation works. Sticky header + sticky footer confirmed.
  - Cannot run Python locally (env constrained to Next.js + Bun on port 3000); David or Honza must verify the backend still runs correctly after the `git mv` restructure.

### [2026-10-21 13:25] - Nebius Token Factory Compliance Fix (Swap NVIDIA NIM Direct API)
- **Agent**: Z.ai Code (assisting Šimon Čurda)
- **What**:
  - Replaced NVIDIA NIM direct API (`https://integrate.api.nvidia.com/v1`, `NVIDIA_API_KEY` from `build.nvidia.com`) with **Nebius Token Factory** (`https://api.tokenfactory.nebius.com/v1/`, `NEBIUS_API_KEY` from `tokenfactory.nebius.com`) in [`config.py`](backend/src/hazsight/config.py) and [`.env.example`](backend/.env.example) (files later moved to `backend/` subdir in the 13:45 restructure entry).
  - Renamed env vars: `NVIDIA_API_KEY` -> `NEBIUS_API_KEY`, `NVIDIA_BASE_URL` -> `NEBIUS_BASE_URL`, `NVIDIA_MODEL` -> split into `NEBIUS_REASONING_MODEL` (Nemotron 3 Ultra) + `NEBIUS_FAST_MODEL` (Nemotron 3 Super) + `NEBIUS_VLM_MODEL` (vision model).
  - Updated [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) Section 2 (NVIDIA AI Technologies via Nebius Token Factory), Section 3 (architecture diagram + hybrid repo layout), Phase 1 deliverables, and Section 6 (how to obtain a Nebius Token Factory API key instead of NVIDIA NIM API key).
- **Where**:
  - [`backend/src/hazsight/config.py`](backend/src/hazsight/config.py) (was `src/hazsight/config.py` before restructure)
  - [`backend/.env.example`](backend/.env.example) (was `.env.example` before restructure)
  - [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- **Why**:
  - Hackathon official rules require: *"All submissions must run on either Nebius Token Factory or Nebius AI Cloud and use at least one NVIDIA open source model."* The original `config.py` used NVIDIA's direct API at `integrate.api.nvidia.com`, which is NOT Nebius Token Factory — this would have caused disqualification.
  - Nebius Token Factory is OpenAI-compatible, so David's existing `openai` SDK code requires no code logic changes — only base URL, API key env var, and model name updates.
  - NVIDIA Nemotron 3 Ultra and Nemotron 3 Super are confirmed available on Nebius Token Factory (per `llmendpoint.com/providers/nebius-token-factory`), satisfying the "at least one NVIDIA open-source model" requirement.
- **Verification**:
  - Confirmed Nebius Token Factory endpoint via official docs ([`docs.tokenfactory.nebius.com/quickstart`](https://docs.tokenfactory.nebius.com/quickstart)): `https://api.tokenfactory.nebius.com/v1/`, OpenAI-compatible, Bearer auth.
  - Confirmed Nemotron 3 Ultra + Nemotron 3 Super + Llama 3.2 Vision availability via Nebius Token Factory provider catalog.
  - Cannot run Python locally (env constrained to Next.js 16 + Bun on port 3000); David or Honza must verify the backend runs correctly with a real `NEBIUS_API_KEY` once Nebius Builder Program access is set up.
  - Verified all changed files have valid Python syntax and valid Markdown.

### [2026-10-21 10:41] - Strict GitHub Formatting: Removed Emojis & Replaced Absolute Local Paths
- **Agent**: Antigravity (Gemini 3.8 Flash)
- **What**:
  - Removed all emojis across all documentation and markdown files.
  - Replaced all local machine absolute URLs (`file:///Users/Dajda/...`) with clean repository-relative links (`README.md`, `LICENSE`, `AGENTS.md`, etc.) so that all links function properly on GitHub.
  - Added explicit rule to [`AGENTS.md`](AGENTS.md) banning emojis and requiring repository-relative links.
- **Where**:
  - [`README.md`](README.md)
  - [`AGENTS.md`](AGENTS.md)
  - [`AGENT_LOG.md`](AGENT_LOG.md)
  - [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- **Why**:
  - User requested strictly no emojis and no computer-local paths (`file:///Users/...`) since the repository is published on GitHub.
- **Verification**:
  - Ran ripgrep verification for emoji unicode ranges and `file:///` strings across all workspace files.

### [2026-10-21 10:30] - Complete English Migration & Skeleton-Only Architecture
- **Agent**: Antigravity (Gemini 3.8 Flash)
- **What**:
  - Converted all documentation, comments, schemas, and configurations entirely to English per user requirement.
  - Ensured code is kept as a clean structural skeleton and notes only (no premature implementation code), leaving architectural design open for team decision.
  - Updated [`AGENTS.md`](AGENTS.md), [`AGENT_LOG.md`](AGENT_LOG.md), [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md), [`README.md`](README.md), and python package modules to English skeleton structure with design notes.
- **Where**:
  - [`AGENTS.md`](AGENTS.md)
  - [`AGENT_LOG.md`](AGENT_LOG.md)
  - [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
  - [`README.md`](README.md)
  - [`pyproject.toml`](pyproject.toml)
  - [`.env.example`](.env.example)
  - [`src/hazsight/config.py`](src/hazsight/config.py)
  - [`src/hazsight/ai/schemas.py`](src/hazsight/ai/schemas.py)
  - `src/hazsight/**/__init__.py`
- **Why**:
  - Strict user requirement: Everything must be in English, and no full implementation code should be written yet. The repo must remain a lightweight skeleton with clear notes and planning.
- **Verification**:
  - Verified syntax of all Markdown, TOML, and Python skeleton files.

### [2026-10-21 10:25] - Repository Initialization & Initial Roadmap
- **Agent**: Antigravity (Gemini 3.8 Flash)
- **What**:
  - Initial repository layout setup with modular directories (`ai`, `stream`, `alerts`, `reports`, `api`).
- **Where**:
  - Root configuration, package definitions, initial docs.
- **Why**:
  - Establishing baseline structure for Hazsight.
- **Verification**:
  - Directory verification and git status inspection.
