"""Hazsight FastAPI application entry point.

Run with:
    uvicorn hazsight.main:app --port 8000 --reload

This is modular — add more routers as they're built. The app currently
includes the reports router (PDF generation). David/Honza will add the
VLM analysis router, alerting router, etc.

CORS is configured to allow the Next.js frontend (default: http://localhost:3000).
Override the allowed origin via the FRONTEND_URL env var for production.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router as api_router

app = FastAPI(
    title="Hazsight API",
    description=(
        "AI Safety Inspector — powered by NVIDIA Nemotron on Nebius Token Factory. "
        "Analyzes images for occupational safety hazards, generates PDF reports."
    ),
    version="0.1.0",
)

# CORS — allow the Next.js frontend to call this API
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers (modular — add more as they're built)
app.include_router(api_router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "hazsight-backend",
        "version": "0.1.0",
    }


@app.get("/")
async def root():
    """Root endpoint — basic info."""
    return {
        "service": "Hazsight API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "POST /api/reports/generate — generate PDF safety audit report",
        ],
    }
