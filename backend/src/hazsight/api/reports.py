"""FastAPI route for generating PDF safety audit reports.

POST /api/reports/generate
    Accepts: multipart/form-data with `image` (file) + `analysis_json` (JSON string)
    Returns: PDF file (application/pdf)

The analysis_json should be a SceneAnalysisResponse serialized as JSON.

Example frontend call:
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('analysis_json', JSON.stringify(analysisResult))

    const res = await fetch('/api/reports/generate', {
        method: 'POST',
        body: formData,
    })
    const pdfBlob = await res.blob()
    // Download pdfBlob
"""

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from ..ai.schemas import SceneAnalysisResponse
from ..reports.config import ReportConfig
from ..reports.pdf_generator import generate_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate")
async def generate_pdf_report(
    image: UploadFile = File(..., description="Original image file (PNG/JPEG/WebP)"),
    analysis_json: str = Form(..., description="SceneAnalysisResponse as JSON string"),
):
    """Generate a PDF safety audit report.

    Accepts an image file + analysis JSON (SceneAnalysisResponse), generates
    a PDF with:
    - Header (Hazsight branding + metadata)
    - Overall safety score (big number + risk level)
    - Scene description
    - Annotated image (with severity-colored bounding boxes)
    - Hazard table (category, severity, description, recommendation, confidence)
    - Cited regulations (placeholder for Tavily integration)
    - Footer (page numbers + compliance line)

    Returns the PDF as a downloadable file.
    """
    # Parse the analysis JSON into a Pydantic model
    analysis = SceneAnalysisResponse.model_validate_json(analysis_json)

    # Read the image bytes
    image_bytes = await image.read()

    # Generate the PDF using the default config
    # (pass a custom ReportConfig here to customize appearance)
    config = ReportConfig()
    pdf_bytes = generate_report(analysis, image_bytes, config)

    # Return as a downloadable PDF
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="hazsight-safety-audit.pdf"',
        },
    )


@router.get("/health")
async def health():
    """Health check for the reports module."""
    return {"status": "ok", "module": "reports"}
