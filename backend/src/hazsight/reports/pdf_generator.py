"""PDF report generator for Hazsight safety audit reports.

Uses ReportLab to generate a polished PDF with:
- Header (Hazsight branding + metadata)
- Overall safety score (big number + risk level)
- Scene description (text)
- Annotated image (image with severity-colored bounding boxes)
- Hazard table (category, severity, description, recommendation, confidence)
- Cited regulations (placeholder for Tavily integration)
- Footer (page numbers + compliance line)

Modular: each section is a separate function. Pass a custom ReportConfig
to customize appearance without modifying the generator code.

Example:
    from hazsight.reports.pdf_generator import generate_report
    from hazsight.reports.config import ReportConfig
    from hazsight.ai.schemas import SceneAnalysisResponse, DetectedHazard, ...

    config = ReportConfig(title="Custom Report")
    pdf_bytes = generate_report(analysis_result, image_bytes, config)
    open("report.pdf", "wb").write(pdf_bytes)
"""

from io import BytesIO
from typing import List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm, pt
from reportlab.platypus import (
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import HRFlowable

from ..ai.schemas import DetectedHazard, SceneAnalysisResponse
from .config import ReportConfig
from .image_annotator import annotate_image


def generate_report(
    analysis: SceneAnalysisResponse,
    image_bytes: bytes,
    config: Optional[ReportConfig] = None,
) -> bytes:
    """Generate a PDF safety audit report.

    Args:
        analysis: Scene analysis result containing scene_description,
            hazards list, and overall_safety_score.
        image_bytes: Original image (PNG/JPEG/WebP) as bytes. Will be
            annotated with bounding boxes.
        config: Report configuration. If None, uses default_config().

    Returns:
        PDF file as bytes.
    """
    cfg = config or ReportConfig()

    # Create PDF document
    output = BytesIO()
    page_size = A4 if cfg.page_size.upper() == "A4" else letter
    doc = SimpleDocTemplate(
        output,
        pagesize=page_size,
        topMargin=cfg.margin_top,
        bottomMargin=cfg.margin_bottom,
        leftMargin=cfg.margin_left,
        rightMargin=cfg.margin_right,
    )

    # Styles
    styles = _build_styles(cfg)
    story: List = []

    # --- Header ---
    story.extend(_build_header(cfg, analysis, styles))

    # --- Safety Score ---
    if cfg.include_safety_score:
        story.extend(_build_safety_score(analysis.overall_safety_score, cfg, styles))

    # --- Scene Description ---
    if cfg.include_scene_description:
        story.extend(_build_scene_description(analysis.scene_description, cfg, styles))

    # --- Annotated Image ---
    if cfg.include_annotated_image:
        story.extend(_build_annotated_image(image_bytes, analysis.hazards, cfg, styles))

    # --- Hazard Table ---
    if cfg.include_hazard_table:
        story.extend(_build_hazard_table(analysis.hazards, cfg, styles))

    # --- Regulations (placeholder for Tavily) ---
    if cfg.include_regulations:
        story.extend(_build_regulations(analysis.hazards, cfg, styles))

    # Build with header/footer on each page
    doc.build(
        story,
        onFirstPage=lambda canvas, doc: _draw_page_decoration(canvas, doc, cfg),
        onLaterPages=lambda canvas, doc: _draw_page_decoration(canvas, doc, cfg),
    )

    return output.getvalue()


# ============================================
# Modular section builders
# ============================================


def _build_styles(cfg: ReportConfig) -> dict:
    """Build paragraph styles from config."""
    base = getSampleStyleSheet()
    brand = HexColor("#%02x%02x%02x" % cfg.brand_color)
    text_pri = HexColor("#%02x%02x%02x" % cfg.text_primary)
    text_sec = HexColor("#%02x%02x%02x" % cfg.text_secondary)

    return {
        "title": ParagraphStyle(
            "HazsightTitle",
            parent=base["Title"],
            fontName=cfg.font_mono_bold,
            fontSize=cfg.size_h1,
            textColor=brand,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "HazsightSubtitle",
            fontName=cfg.font_mono,
            fontSize=cfg.size_h3,
            textColor=text_sec,
            spaceAfter=12,
        ),
        "section_label": ParagraphStyle(
            "SectionLabel",
            fontName=cfg.font_mono,
            fontSize=cfg.size_small,
            textColor=brand,
            spaceAfter=4,
            spaceBefore=12,
        ),
        "h2": ParagraphStyle(
            "H2",
            fontName=cfg.font_bold,
            fontSize=cfg.size_h2,
            textColor=text_pri,
            spaceAfter=6,
            spaceBefore=12,
        ),
        "body": ParagraphStyle(
            "Body",
            fontName=cfg.font_family,
            fontSize=cfg.size_body,
            textColor=text_pri,
            leading=14,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "Small",
            fontName=cfg.font_family,
            fontSize=cfg.size_small,
            textColor=text_sec,
            leading=10,
        ),
        "tiny": ParagraphStyle(
            "Tiny",
            fontName=cfg.font_mono,
            fontSize=cfg.size_tiny,
            textColor=HexColor("#%02x%02x%02x" % cfg.text_muted),
            leading=8,
        ),
        "score_big": ParagraphStyle(
            "ScoreBig",
            fontName=cfg.font_mono_bold,
            fontSize=48,
            textColor=HexColor("#%02x%02x%02x" % cfg.brand_color),
            alignment=1,  # center
            spaceAfter=2,
        ),
    }


def _build_header(cfg: ReportConfig, analysis: SceneAnalysisResponse, styles: dict) -> List:
    """Build the report header."""
    elements = []
    elements.append(Paragraph(cfg.title, styles["title"]))
    elements.append(Paragraph(cfg.subtitle, styles["subtitle"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=HexColor("#%02x%02x%02x" % cfg.brand_color)))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"// {cfg.organization} · {cfg.hackathon} · {cfg.track}", styles["tiny"]))
    if cfg.include_timestamp:
        ts = analysis.timestamp.strftime("%Y-%m-%d %H:%M UTC") if hasattr(analysis, "timestamp") else "N/A"
        elements.append(Paragraph(f"// Generated: {ts}", styles["tiny"]))
    elements.append(Spacer(1, 12))
    return elements


def _build_safety_score(score: int, cfg: ReportConfig, styles: dict) -> List:
    """Build the overall safety score section."""
    elements = []
    elements.append(Paragraph("// Overall Safety Score", styles["section_label"]))
    score_color = _score_color(score, cfg)
    color_hex = "#%02x%02x%02x" % score_color
    risk_level = _risk_level(score)
    elements.append(Paragraph(
        f'<font color="{color_hex}">{score} / 100</font>',
        styles["score_big"],
    ))
    elements.append(Paragraph(
        f'<font color="{color_hex}">{risk_level}</font>',
        styles["subtitle"],
    ))
    elements.append(Spacer(1, 8))
    return elements


def _build_scene_description(description: str, cfg: ReportConfig, styles: dict) -> List:
    """Build the scene description section."""
    elements = []
    elements.append(Paragraph("// Scene Description", styles["section_label"]))
    elements.append(Paragraph(description, styles["body"]))
    elements.append(Spacer(1, 8))
    return elements


def _build_annotated_image(image_bytes: bytes, hazards: List[DetectedHazard], cfg: ReportConfig, styles: dict) -> List:
    """Build the annotated image section."""
    elements = []
    elements.append(Paragraph("// Annotated Image", styles["section_label"]))
    annotated = annotate_image(image_bytes, hazards, cfg.severity_colors)
    img_io = BytesIO(annotated)
    rl_img = RLImage(img_io, width=cfg.image_max_width, height=cfg.image_max_height)
    rl_img._restrictSize(cfg.image_max_width, cfg.image_max_height)
    elements.append(rl_img)
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("Bounding boxes colored by severity. Numbers correspond to the hazard table below.", styles["small"]))
    elements.append(Spacer(1, 8))
    return elements


def _build_hazard_table(hazards: List[DetectedHazard], cfg: ReportConfig, styles: dict) -> List:
    """Build the hazard table section."""
    elements = []
    elements.append(Paragraph("// Detected Hazards", styles["section_label"]))
    elements.append(Paragraph(f"{len(hazards)} hazards identified", styles["subtitle"]))

    # Sort by severity (CRITICAL first)
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    sorted_hazards = sorted(hazards, key=lambda h: severity_order.get(h.severity.value, 4))

    # Table header
    header = ["Category", "Severity", "Description", "Recommendation", "Conf."]
    rows = [header]
    for h in sorted_hazards:
        rows.append([
            h.category.value,
            h.severity.value,
            Paragraph(h.description, styles["small"]),
            Paragraph(h.recommendation, styles["small"]),
            f"{int(h.confidence * 100)}%",
        ])

    table = Table(rows, colWidths=list(cfg.table_col_widths), repeatRows=1)
    table.setStyle(_build_table_style(cfg))
    elements.append(table)
    elements.append(Spacer(1, 8))
    return elements


def _build_regulations(hazards: List[DetectedHazard], cfg: ReportConfig, styles: dict) -> List:
    """Build the cited regulations section.

    Placeholder — when Tavily integration is ready, this will show
    real regulation citations fetched from the web.
    """
    elements = []
    elements.append(Paragraph("// Cited Regulations", styles["section_label"]))
    elements.append(Paragraph(
        "Regulations will be cited here once the Tavily integration is wired up. "
        "Each hazard category will cross-reference applicable safety standards "
        "(e.g., Czech fire safety regulation vyhl. 246/2001 Sb. for emergency exit clearance).",
        styles["small"],
    ))
    elements.append(Spacer(1, 8))
    return elements


def _build_table_style(cfg: ReportConfig) -> TableStyle:
    """Build table style from config."""
    brand = HexColor("#%02x%02x%02x" % cfg.brand_color)
    bg_light = HexColor("#%02x%02x%02x" % cfg.bg_light)
    text_pri = HexColor("#%02x%02x%02x" % cfg.text_primary)

    style = TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), brand),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), cfg.font_mono_bold),
        ("FONTSIZE", (0, 0), (-1, 0), cfg.size_small),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        # Body
        ("FONTNAME", (0, 1), (-1, -1), cfg.font_family),
        ("FONTSIZE", (0, 1), (-1, -1), cfg.size_small),
        ("TEXTCOLOR", (0, 1), (-1, -1), text_pri),
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        # Alternating row colors
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, bg_light]),
        # Grid
        ("LINEBELOW", (0, 0), (-1, 0), 1, brand),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, HexColor("#dddddd")),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
    ])
    return style


def _draw_page_decoration(canvas, doc, cfg: ReportConfig) -> None:
    """Draw footer on each page."""
    canvas.saveState()
    footer_y = 30
    # Footer line
    canvas.setStrokeColor(HexColor("#%02x%02x%02x" % cfg.brand_color))
    canvas.setLineWidth(0.5)
    canvas.line(
        cfg.margin_left, footer_y + 12,
        doc.pagesize[0] - cfg.margin_right, footer_y + 12,
    )
    # Footer text (left)
    canvas.setFont(cfg.font_mono, cfg.footer_size)
    canvas.setFillColor(HexColor("#%02x%02x%02x" % cfg.text_muted))
    canvas.drawString(cfg.margin_left, footer_y, cfg.footer_text)
    # Page number (right)
    page_num = canvas.getPageNumber()
    canvas.drawRightString(
        doc.pagesize[0] - cfg.margin_right, footer_y,
        f"// page {page_num}",
    )
    canvas.restoreState()


# ============================================
# Helpers
# ============================================


def _score_color(score: int, cfg: ReportConfig) -> Tuple[int, int, int]:
    """Get color for a safety score."""
    if score < 40:
        return cfg.severity_colors["CRITICAL"]
    if score < 70:
        return cfg.severity_colors["HIGH"]
    return cfg.severity_colors["LOW"]


def _risk_level(score: int) -> str:
    """Get risk level label for a safety score."""
    if score < 40:
        return "HIGH RISK"
    if score < 70:
        return "MODERATE RISK"
    return "LOW RISK"
