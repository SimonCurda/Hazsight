/**
 * POST /api/reports/generate
 *
 * Generates a PDF safety audit report from the result data sent in the POST body.
 * This works on Vercel (no in-memory store needed) — the client sends the
 * full result (hazards, regulations, score, etc.) and gets back a PDF.
 *
 * The old GET /api/reports/[jobId] route requires the in-memory job store
 * which doesn't persist across Vercel serverless instances.
 */

import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { PdfReport } from '@/lib/pdf-report'
import type { DetectedHazard } from '@/lib/mock-data'
import type { RegulationCitation } from '@/lib/tavily'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface GeneratePdfBody {
  score: number
  sceneDescription: string
  hazards: DetectedHazard[]
  regulations: RegulationCitation[]
  imageData?: string | null
  jobId?: string
  createdAt?: string
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: GeneratePdfBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { score, sceneDescription, hazards, regulations, imageData, jobId, createdAt } = body

  if (!hazards || !sceneDescription) {
    return NextResponse.json({ error: 'Missing hazards or sceneDescription' }, { status: 400 })
  }

  try {
    const pdfElement = React.createElement(PdfReport, {
      score: score || 0,
      sceneDescription,
      hazards,
      regulations: regulations || [],
      imageData: imageData || null,
      jobId: jobId || 'direct',
      createdAt: createdAt || new Date().toISOString(),
    }) as any

    const pdfBuffer = await renderToBuffer(pdfElement)

    return new Response(pdfBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="hazsight-safety-audit.pdf"',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[pdf] generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
