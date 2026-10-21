"""Configuration skeleton for Hazsight using Pydantic Settings.

Note: Keep this as a lightweight skeleton until architecture details are decided.
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

    # NVIDIA AI configuration
    nvidia_api_key: str = Field(
        default="",
        description="API key for NVIDIA NIM / API catalog (build.nvidia.com)",
    )
    nvidia_base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        description="Base URL for NVIDIA NIM OpenAI-compatible endpoint",
    )
    nvidia_model: str = Field(
        default="meta/llama-3.2-11b-vision-instruct",
        description="Default NVIDIA Vision-Language Model",
    )

    # Environment & logging
    app_env: str = Field(default="development")
    log_level: str = Field(default="INFO")

    # Camera / stream settings
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

    # Alert rules
    min_alert_severity: str = Field(
        default="HIGH",
        description="Minimum severity threshold to trigger alerts (LOW, MEDIUM, HIGH, CRITICAL)",
    )
    alert_cooldown_seconds: int = Field(
        default=30,
        description="Cooldown period in seconds to avoid repeated alert spamming",
    )

    # Data storage paths
    data_dir: Path = Field(default=Path("./data"))
    incidents_dir: Path = Field(default=Path("./data/incidents"))
    reports_dir: Path = Field(default=Path("./data/reports"))


# Global settings placeholder
settings = Settings()
