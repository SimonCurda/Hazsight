"""Configuration for Hazsight using Pydantic Settings.

Uses Nebius Token Factory (https://tokenfactory.nebius.com) for inference,
serving NVIDIA Nemotron open-source models via an OpenAI-compatible API.

Hackathon compliance: All submissions must run on Nebius Token Factory or
Nebius AI Cloud, and use at least one NVIDIA open-source model. This config
satisfies both requirements by routing inference through Nebius Token Factory
and using NVIDIA Nemotron 3 Ultra (reasoning) + Nemotron 3 Super (fast) +
an NVIDIA-served VLM (vision-language model).
"""

from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Nebius Token Factory (NVIDIA Nemotron served via OpenAI-compatible API)
    # Get your API key at: https://tokenfactory.nebius.com
    # ------------------------------------------------------------------
    nebius_api_key: str = Field(
        default="",
        description="API key for Nebius Token Factory (https://tokenfactory.nebius.com)",
    )
    nebius_base_url: str = Field(
        default="https://api.tokenfactory.nebius.com/v1/",
        description="Base URL for Nebius Token Factory OpenAI-compatible endpoint",
    )

    # NVIDIA Nemotron open-source models served on Nebius Token Factory.
    # Nemotron 3 Ultra = deep reasoning (hazard classification, severity,
    # cross-referencing regulations, recommendations).
    nebius_reasoning_model: str = Field(
        default="nvidia/nemotron-3-ultra",
        description=(
            "NVIDIA Nemotron 3 Ultra for deep reasoning: hazard classification, "
            "severity assessment, regulatory cross-referencing, recommendations."
        ),
    )
    # Nemotron 3 Super = fast everyday calls (chat Q&A, quick lookups,
    # status updates) — keeps the app responsive and credits stretch further.
    nebius_fast_model: str = Field(
        default="nvidia/nemotron-3-super",
        description=(
            "NVIDIA Nemotron 3 Super for fast calls: chat Q&A, quick lookups, "
            "status updates. Keeps the app responsive and credits stretch further."
        ),
    )
    # Vision-Language Model for image analysis.
    # Verify the exact model name in the Token Factory playground
    # (https://tokenfactory.nebius.com) once you have an API key.
    # NVIDIA serves Llama 3.2 Vision, VILA, and Nemotron Vision variants
    # on Nebius Token Factory.
    nebius_vlm_model: str = Field(
        default="meta/llama-3.2-11b-vision-instruct",
        description=(
            "VLM for image analysis. Verify exact model name in Token Factory "
            "playground (https://tokenfactory.nebius.com). Alternatives on Nebius: "
            "nvidia/vila-1.5, nvidia/nemotron-vision, meta/llama-3.2-90b-vision-instruct."
        ),
    )

    # ------------------------------------------------------------------
    # Application & logging
    # ------------------------------------------------------------------
    app_env: str = Field(default="development")
    log_level: str = Field(default="INFO")

    # ------------------------------------------------------------------
    # Camera / stream settings
    # ------------------------------------------------------------------
    default_camera_source: str = Field(
        default="0",
        description="Default video source (0 for webcam, path to file, or RTSP URL)",
    )
    frame_sample_interval_seconds: float = Field(
        default=1.0,
        description="Sampling interval in seconds between frames sent to AI",
    )
    motion_detection_enabled: bool = Field(
        default=True,
        description="Whether to filter frames by motion prior to AI inference",
    )

    # ------------------------------------------------------------------
    # Alert rules
    # ------------------------------------------------------------------
    min_alert_severity: str = Field(
        default="HIGH",
        description="Minimum severity threshold to trigger alerts (LOW, MEDIUM, HIGH, CRITICAL)",
    )
    alert_cooldown_seconds: int = Field(
        default=30,
        description="Cooldown period in seconds to avoid repeated alert spamming",
    )

    # ------------------------------------------------------------------
    # Data storage paths
    # ------------------------------------------------------------------
    data_dir: Path = Field(default=Path("./data"))
    incidents_dir: Path = Field(default=Path("./data/incidents"))
    reports_dir: Path = Field(default=Path("./data/reports"))


# Global settings placeholder
settings = Settings()
