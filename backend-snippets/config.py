"""Configuration for Hazsight backend.

Nebius Token Factory compliance:
    This backend uses Nebius Token Factory (https://api.tokenfactory.nebius.com/v1/)
    as the inference provider — NOT NVIDIA's direct NIM API.
    This is required for the Nebius x NVIDIA Global AI Hackathon.

Get your API key at: https://tokenfactory.nebius.com
Set it as NEBIUS_API_KEY in your environment.
"""

import os
from pathlib import Path

# ── Nebius Token Factory (hackathon-compliant inference provider) ──────────
NEBIUS_API_KEY = os.environ.get("NEBIUS_API_KEY", "")
NEBIUS_BASE_URL = os.environ.get(
    "NEBIUS_BASE_URL",
    "https://api.tokenfactory.nebius.com/v1/",
)

# NVIDIA open-source models served on Nebius Token Factory.
# Verify exact names in the Token Factory playground once you have a key.
NEBIUS_VLM_MODEL = os.environ.get("NEBIUS_VLM_MODEL", "meta/llama-3.2-11b-vision-instruct")
NEBIUS_REASONING_MODEL = os.environ.get("NEBIUS_REASONING_MODEL", "nvidia/nemotron-3-ultra")
NEBIUS_FAST_MODEL = os.environ.get("NEBIUS_FAST_MODEL", "nvidia/nemotron-3-super")

# ── Tavily (live web search for regulation citations) ──────────────────────
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")

# ── Server ──────────────────────────────────────────────────────────────────
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent
