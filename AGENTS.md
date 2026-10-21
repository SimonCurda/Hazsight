# AGENTS.md - Instructions and Guidelines for AI Agents in Hazsight

This document defines mandatory rules, architecture guidelines, workflows, and standards for all AI agents (e.g., Antigravity, Claude, Copilot, etc.) contributing to the **Hazsight** repository.

---

## 1. Project Mission

**Hazsight** is an intelligent vision system for safety monitoring and hazard prevention from camera feeds and streams (RTSP / video files / webcams).
- **Core Requirement**: Integration of at least one **NVIDIA AI technology** (NVIDIA NIM / VLM / Cosmos / DeepStream).
- **Primary Deliverables**: Hazard & risk detection, temporal anchoring (incident timeslots), real-time alerts, and structured safety reports.

---

## 2. Mandatory Rules for AI Agents

All AI agents **MUST** follow these rules:

### A. All Artifacts, Code, and Documentation in English
- **Strict Requirement**: All code, comments, docstrings, documentation, git messages, and logs **MUST BE IN ENGLISH**.

### B. Mandatory Logging in `AGENT_LOG.md`
Before completing any task, an agent **MUST** append an entry to [`AGENT_LOG.md`](AGENT_LOG.md) containing:
1. **Timestamp**: Local / ISO time.
2. **Agent / Task Identifier**.
3. **What was done**: Concise summary of changes.
4. **Where**: List of modified/created files with repository-relative markdown links.
5. **Why**: Motivation and architectural rationale.
6. **Verification**: How the change was validated.

### C. Do Not Prematurely Implement Complex Code
- **Skeleton & Design First**: Keep the codebase modular and skeleton-based until exact design specifications are decided with the user.
- Use placeholders, structural outlines, type definitions, and conceptual notes rather than dense, premature logic.

### D. No Emojis & Use Repository-Relative Links
- Do not use emojis in commit messages, documentation, or code comments.
- Always link files using clean repository-relative paths (e.g. `[README.md](README.md)`) for GitHub compatibility. Never use local computer absolute paths (e.g. `file:///Users/...`).

### E. Security & Best Practices
- Never hardcode secrets or API keys. Always use `.env` via [`src/hazsight/config.py`](src/hazsight/config.py).
- Use Python 3.11+ type hints for all function and method signatures.
- Adhere to Black / Ruff compatible formatting (4 spaces).

---

## 3. Technology Stack & NVIDIA AI

- **Language**: Python 3.11+
- **NVIDIA AI Options**:
  - **NVIDIA NIM API** (`meta/llama-3.2-11b-vision-instruct`, `nvidia/vila-1.5`, `nvidia/cosmos-nemotron-34b`) for visual scene description and semantic risk reasoning.
  - **NVIDIA Cosmos** for physical AI and spatial reasoning.
  - **NVIDIA DeepStream SDK / TensorRT** for edge video acceleration (future phases).
- **Backend / API**: FastAPI, Uvicorn, Pydantic v2
- **Image & Video**: OpenCV (`cv2`), Pillow (`PIL`), NumPy
- **Reports**: ReportLab (PDF), Markdown, JSON

---

## 4. Repository Structure

```
Hazsight/
├── AGENTS.md                  # This document - instructions for AI agents
├── AGENT_LOG.md               # Changelog & audit log for agents and human teammates
├── IMPLEMENTATION_PLAN.md     # Detailed technical & architecture roadmap
├── README.md                  # Project overview and quickstart guide
├── .env.example               # Environment variables template
├── pyproject.toml             # Dependencies & package configuration
├── src/
│   └── hazsight/
│       ├── __init__.py
│       ├── config.py          # Settings and environment configuration
│       ├── ai/                # NVIDIA AI client, schemas, prompts, analyzers
│       ├── stream/            # Video & camera ingestion (RTSP, webcam, files)
│       ├── alerts/            # Alert engine and timeslot tracking
│       ├── reports/           # Safety report generation (PDF, MD, JSON)
│       └── api/               # FastAPI endpoints & dashboard server
└── tests/                     # Unit and integration tests
```
