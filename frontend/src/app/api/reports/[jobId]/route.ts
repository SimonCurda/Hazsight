/**
 * GET /api/reports/[jobId]
 *
 * Generates and returns a PDF safety audit report for a completed job.
 * Uses @react-pdf/renderer (works on Vercel — Node.js serverless, no native deps).
 *
 * The PDF includes:
 * - Header (Hazsight branding + timestamp)
 * - Overall safety score (big number + risk level)
 * - Scene description
 * - Analyzed image (if available — from upload or demo image)
 * - Hazard table (category, severity, description, recommendation, confidence)
 * - Footer (compliance line)
 */

import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { readFile } from 'fs/promises'
import { join } from 'path'

import { getJob } from '@/lib/job-store'
import { PdfReport } from '@/lib/pdf-report'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  const { jobId } = await params
  const job = getJob(jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'completed' || !job.hazards || !job.sceneDescription) {
    return NextResponse.json(
      { error: 'Job not completed yet', status: job.status },
      { status: 400 },
    )
  }

  // Get image data for the PDF
  let imageData: string | null = null
  if (job.imageBase64) {
    // Uploaded file — use stored base64
    imageData = `data:image/png;base64,${job.imageBase64}`
  } else if (job.imageUrl && job.imageUrl.startsWith('/')) {
    // Demo image — read from public dir
    try {
      const imagePath = join(process.cwd(), 'public', job.imageUrl)
      const imageBuffer = await readFile(imagePath)
      imageData = `data:image/png;base64,${imageBuffer.toString('base64')}`
    } catch {
      // Image not found — skip in PDF
    }
  }

  // Generate the PDF
  try {
    const pdfElement = React.createElement(PdfReport, {
      score: job.overallSafetyScore || 0,
      sceneDescription: job.sceneDescription,
      hazards: job.hazards,
      imageData,
      jobId: job.id,
      createdAt: job.createdAt,
    })

    const pdfBuffer = await renderToBuffer(pdfElement)

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="hazsight-safety-audit.pdf"',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF', detail: String(err) },
      { status: 500 },
    )
  }
}
