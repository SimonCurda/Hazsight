"""Image annotator — draws bounding boxes on images for detected hazards.

Uses Pillow (PIL) to draw severity-colored rectangles + labels on the
original image. The annotated image is embedded in the PDF report.

Modular: accepts a color scheme dict so colors can be customized via
ReportConfig without modifying this code.
"""

from io import BytesIO
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont

from ..ai.schemas import DetectedHazard


def annotate_image(
    image_bytes: bytes,
    hazards: List[DetectedHazard],
    severity_colors: Optional[Dict[str, Tuple[int, int, int]]] = None,
    line_width: int = 4,
    label_font_size: int = 16,
) -> bytes:
    """Draw bounding boxes on the image for each hazard.

    Args:
        image_bytes: Original image as bytes (PNG, JPEG, or WebP).
        hazards: List of DetectedHazard. Only hazards with a non-zero
            bounding_box are drawn (zero-width/height = "not visible").
        severity_colors: Dict mapping severity string ("LOW", "MEDIUM",
            "HIGH", "CRITICAL") to (R, G, B) tuple. If None, uses
            defaults from ReportConfig.
        line_width: Border line width in pixels.
        label_font_size: Font size for severity labels.

    Returns:
        Annotated image as PNG bytes.

    Example:
        annotated = annotate_image(
            image_bytes=open("photo.jpg", "rb").read(),
            hazards=analysis.hazards,
            severity_colors=config.severity_colors,
        )
    """
    if severity_colors is None:
        severity_colors = {
            "CRITICAL": (239, 68, 68),
            "HIGH": (249, 115, 22),
            "MEDIUM": (250, 204, 21),
            "LOW": (16, 185, 129),
        }

    img = Image.open(BytesIO(image_bytes))
    draw = ImageDraw.Draw(img)
    width, height = img.size

    # Try to load a font (fallback to default if not available)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", label_font_size)
    except (OSError, IOError):
        font = ImageFont.load_default()

    # Filter to only hazards with visible bounding boxes
    visible = [
        h
        for h in hazards
        if h.bounding_box
        and h.bounding_box.width > 0
        and h.bounding_box.height > 0
    ]

    for idx, hazard in enumerate(visible, start=1):
        bbox = hazard.bounding_box
        # Convert percentages to pixel coordinates
        x1 = int(bbox.x / 100 * width)
        y1 = int(bbox.y / 100 * height)
        x2 = int((bbox.x + bbox.width) / 100 * width)
        y2 = int((bbox.y + bbox.height) / 100 * height)

        color = severity_colors.get(hazard.severity.value, (255, 255, 0))

        # Draw semi-transparent fill (light tint)
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([x1, y1, x2, y2], fill=(*color, 40))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(img)

        # Draw solid border
        draw.rectangle(
            [x1, y1, x2, y2],
            outline=color,
            width=line_width,
        )

        # Draw label (severity + number)
        label = f"{hazard.severity.value} [{idx}]"
        label_bbox = draw.textbbox((0, 0), label, font=font)
        label_w = label_bbox[2] - label_bbox[0]
        label_h = label_bbox[3] - label_bbox[1]
        label_x = x1
        label_y = max(0, y1 - label_h - 4)

        # Label background
        draw.rectangle(
            [label_x, label_y, label_x + label_w + 8, label_y + label_h + 4],
            fill=color,
        )
        # Label text (white or dark depending on severity)
        text_color = (255, 255, 255) if hazard.severity.value in (
            "CRITICAL",
            "HIGH",
        ) else (30, 30, 30)
        draw.text(
            (label_x + 4, label_y + 2),
            label,
            fill=text_color,
            font=font,
        )

    # Save as PNG
    output = BytesIO()
    img.save(output, format="PNG", optimize=True)
    return output.getvalue()
