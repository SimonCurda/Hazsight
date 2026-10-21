# Hazsight 🛡️👁️

> **Intelligent Vision System for Hazard Detection, Incident Timeslots, and Safety Reporting using NVIDIA AI.**

Hazsight analyzes camera feeds and visual recordings to detect occupational hazards (PPE violations, fire/smoke, unsafe equipment proximity, restricted zones), tracks their temporal duration (**timeslots**), triggers real-time alerts, and generates automated safety audit reports for managers and compliance inspectors.

---

## 📚 Project Documentation

- 📋 [**`IMPLEMENTATION_PLAN.md`**](file:///Users/Dajda/Documents/Hazsight/IMPLEMENTATION_PLAN.md): Complete technical plan, NVIDIA AI model analysis (NIM, VILA, Cosmos, DeepStream), system architecture options, and phased roadmap.
- 🤖 [**`AGENTS.md`**](file:///Users/Dajda/Documents/Hazsight/AGENTS.md): Mandatory rules and instructions for all AI agents contributing to this repository.
- 📝 [**`AGENT_LOG.md`**](file:///Users/Dajda/Documents/Hazsight/AGENT_LOG.md): Transparent activity log tracking all changes, motivations, and verifications.

---

## ⚡ Architecture Overview

```
[Camera Feed / Video / RTSP / Image]
                 │
                 ▼
     [Frame Sampler Engine]
                 │
                 ▼
       [NVIDIA NIM VLM API]  ◄─── (Llama 3.2 Vision / VILA / Cosmos)
                 │
                 ▼
   [Timeslot & Incident Tracker] ───► [Alerting Engine] ──► (WebSocket, Webhooks)
                 │
                 ▼
      [Reporting Engine] ───────────► (Export PDF, Markdown, JSON)
                 │
                 ▼
     [FastAPI & Web Dashboard]
```

---

## 🛠️ Technology Stack

- **Language**: Python 3.11+
- **NVIDIA AI**: NVIDIA NIM Microservices (`meta/llama-3.2-11b-vision-instruct`, `nvidia/vila-1.5`, `nvidia/cosmos-nemotron-34b`)
- **Backend / API**: FastAPI, Uvicorn, Pydantic v2
- **Computer Vision**: OpenCV (`cv2`), Pillow (`PIL`), NumPy
- **Reporting**: ReportLab (PDF), Markdown, JSON

---

## 🚀 Quickstart (Environment Setup)

### 1. Setup Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 2. Configure Environment Variables
Copy `.env.example` and insert your NVIDIA API key from [build.nvidia.com](https://build.nvidia.com):
```bash
cp .env.example .env
# Set NVIDIA_API_KEY in .env
```

---

## 🗺️ Phased Roadmap

1. **Phase 1**: Image Scene Description (Baseline VLM scene understanding)
2. **Phase 2**: Static Hazard & Risk Recognition (Structured JSON output & hazard classifications)
3. **Phase 3**: Video & Camera Ingestion with Timeslot Tracking (Continuous stream and incident intervals)
4. **Phase 4**: Real-Time Alerting Engine (Severity thresholds, spam suppression, webhooks)
5. **Phase 5**: Automated Safety Reports (Shift/daily PDF, Markdown, and JSON exports)
6. **Phase 6**: Web Dashboard & Operator Interface (Live camera overview, timeslot scrubber)

---

## 📄 License
Licensed under the MIT License - see [LICENSE](file:///Users/Dajda/Documents/Hazsight/LICENSE).