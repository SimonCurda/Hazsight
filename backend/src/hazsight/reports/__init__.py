"""Hazsight report generation module.

Exposes the PDF generator, image annotator, and report config for use
by the FastAPI API layer or CLI tools.

Usage:
    from hazsight.reports import generate_report, ReportConfig, annotate_image

    config = ReportConfig(title="Custom Report")
    pdf_bytes = generate_report(analysis, image_bytes, config)
"""

from .config import ReportConfig, default_config
from .image_annotator import annotate_image
from .pdf_generator import generate_report

__all__ = [
    "ReportConfig",
    "default_config",
    "annotate_image",
    "generate_report",
]
