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

### [2026-10-21 13:25] - Nebius Token Factory Compliance Fix (Swap NVIDIA NIM Direct API)
- **Agent**: Z.ai Code (assisting Šimon Čurda)
- **What**:
  - Replaced NVIDIA NIM direct API (`https://integrate.api.nvidia.com/v1`, `NVIDIA_API_KEY` from `build.nvidia.com`) with **Nebius Token Factory** (`https://api.tokenfactory.nebius.com/v1/`, `NEBIUS_API_KEY` from `tokenfactory.nebius.com`) in [`config.py`](src/hazsight/config.py) and [`.env.example`](.env.example).
  - Renamed env vars: `NVIDIA_API_KEY` -> `NEBIUS_API_KEY`, `NVIDIA_BASE_URL` -> `NEBIUS_BASE_URL`, `NVIDIA_MODEL` -> split into `NEBIUS_REASONING_MODEL` (Nemotron 3 Ultra) + `NEBIUS_FAST_MODEL` (Nemotron 3 Super) + `NEBIUS_VLM_MODEL` (vision model).
  - Updated [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) Section 2 (NVIDIA AI Technologies via Nebius Token Factory), Section 3 (architecture diagram + hybrid repo layout), Phase 1 deliverables, and Section 6 (how to obtain a Nebius Token Factory API key instead of NVIDIA NIM API key).
- **Where**:
  - [`src/hazsight/config.py`](src/hazsight/config.py)
  - [`.env.example`](.env.example)
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
