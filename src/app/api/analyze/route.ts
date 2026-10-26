/**
 * POST /api/analyze
 *
 * Accepts an image (multipart/form-data with `image` field, OR JSON body with
 * `image_url` field for the demo image), creates a job, and starts background
 * processing via Nebius Token Factory.
 *
 * Returns: { job_id, status: 'queued' }
 *
 * If NEBIUS_API_KEY is not set, falls back to mock data so the demo still
 * works (judges / users without a key can still see the full flow).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createJob, appendTraceEvent, completeJob, failJob } from '@/lib/job-store'
import {
  analyzeImageWithVlm,
  extractStructuredJson,
  nebiusAvailable,
  NEBIUS_VLM_MODEL,
  NEBIUS_REASONING_MODEL,
} from '@/lib/nebius'
import { searchAllRegulations, tavilyAvailable, type Jurisdiction } from '@/lib/tavily'
import {
  MOCK_HAZARDS,
  MOCK_SCENE_DESCRIPTION,
  MOCK_TRACE_EVENTS,
  type DetectedHazard,
} from '@/lib/mock-data'

export const runtime = 'nodejs'
export const maxDuration = 60

interface AnalysisResult {
  sceneDescription: string
  hazards: DetectedHazard[]
  overallSafetyScore: number
}

async function runAnalysis(
  jobId: string,
  imageBase64: string | null,
  imageUrl: string,
  mimeType: string,
  jurisdiction: Jurisdiction = 'CZECH',
): Promise<void> {
  try {
    console.log('[analyze] job started:', jobId, '| nebius:', nebiusAvailable(), '| tavily:', tavilyAvailable(), '| jurisdiction:', jurisdiction, '| hasImage:', !!imageBase64, '| imageUrlLen:', imageUrl?.length || 0)
    appendTraceEvent(jobId, {
      type: 'plan',
      model: 'Nemotron 3 Ultra',
      content:
        'Analyzing image for occupational safety hazards. Plan: (1) scene understanding, (2) hazard identification, (3) severity assessment, (4) regulatory cross-reference, (5) recommendation synthesis.',
    })
    await sleep(400)

    if (!nebiusAvailable()) {
      console.log('[analyze] MOCK MODE — NEBIUS_API_KEY not set, using mock hazards')
      // Fallback: emit mock trace events over time, then complete with mock data.
      // Skip pre-written tavily_search events — we emit accurate ones below
      // so the trace reflects whether Tavily is actually live or in mock mode.
      for (const event of MOCK_TRACE_EVENTS.slice(1)) {
        if (event.type === 'tavily_search') continue
        appendTraceEvent(jobId, event)
        await sleep(700)
      }
      // Emit accurate Tavily status (live if key is set, mock otherwise)
      appendTraceEvent(jobId, {
        type: 'tavily_search',
        model: 'Tavily Live Search',
        content: tavilyAvailable()
          ? 'Searching for relevant safety regulations via Tavily API...'
          : 'Tavily API key not set — using mock regulation citations.',
      })
      // Search for regulations (mock if no Tavily key, real if key is set)
      const regulations = await searchAllRegulations(
        MOCK_HAZARDS.map((h) => ({ category: h.category, description: h.description })),
        jurisdiction,
      )
      for (const reg of regulations) {
        appendTraceEvent(jobId, {
          type: 'tavily_search',
          model: 'Tavily Live Search',
          content: `Found: ${reg.results[0]?.title || 'No results'} (${reg.results.length} citations for ${reg.hazard_category})`,
        })
      }
      completeJob(jobId, {
        sceneDescription: MOCK_SCENE_DESCRIPTION,
        hazards: MOCK_HAZARDS,
        overallSafetyScore: 42,
        regulations,
        tavilyLive: tavilyAvailable(),
      })
      return
    }

    appendTraceEvent(jobId, {
      type: 'vlm_analyze',
      model: NEBIUS_VLM_MODEL,
      content: 'Scene understanding + hazard identification starting...',
    })
    await sleep(200)

    console.log('[analyze] calling VLM:', NEBIUS_VLM_MODEL, '| imageBase64 length:', (imageBase64 || '').length)
    const vlmOutput = await analyzeImageWithVlm(
      imageBase64 || '',
      mimeType,
    )
    console.log('[analyze] VLM response length:', vlmOutput.length, '| preview:', vlmOutput.slice(0, 200))

    appendTraceEvent(jobId, {
      type: 'vlm_detect',
      model: NEBIUS_VLM_MODEL,
      content: `VLM returned scene analysis (${vlmOutput.length} chars). Parsing hazards...`,
    })

    appendTraceEvent(jobId, {
      type: 'ultra_assess',
      model: NEBIUS_REASONING_MODEL,
      content: 'Severity assessment + structured JSON extraction starting...',
    })

    const jsonOutput = await extractStructuredJson(vlmOutput)
    console.log('[analyze] JSON extraction done, length:', jsonOutput.length, '| preview:', jsonOutput.slice(0, 200))

    // Add raw VLM output to trace (for debugging — shows what the model actually returned)
    appendTraceEvent(jobId, {
      type: 'vlm_detect',
      model: NEBIUS_VLM_MODEL,
      content: `VLM raw output (${vlmOutput.length} chars): ${vlmOutput.slice(0, 150)}...`,
    })

    let parsed: AnalysisResult
    try {
      // Try parsing. If it fails, regex-extract { ... } as last resort.
      let jsonStr = jsonOutput
      try { JSON.parse(jsonStr) } catch {
        const match = jsonStr.match(/\{[\s\S]*\}/)
        if (match) jsonStr = match[0]
      }
      const obj = JSON.parse(jsonStr)
      parsed = {
        sceneDescription: obj.scene_description || '',
        hazards: (obj.hazards || []).map(
          (h: DetectedHazard & { bounding_box?: { x: number; y: number; width: number; height: number }; fire_origin_point?: { x: number; y: number }; fire_severity_level?: string; fire_detected_at?: string | null }, idx: number) => ({
            id: `h-${idx + 1}`,
            category: h.category,
            severity: h.severity,
            description: h.description,
            affected_area: h.affected_area || '',
            recommendation: h.recommendation || '',
            confidence: typeof h.confidence === 'number' ? h.confidence : 0.8,
            bounding_box: h.bounding_box || { x: 0, y: 0, width: 0, height: 0 },
            // Fire-specific fields (only present for FIRE_SMOKE hazards)
            ...(h.fire_origin_point ? { fire_origin_point: h.fire_origin_point } : {}),
            ...(h.fire_severity_level ? { fire_severity_level: h.fire_severity_level as 'smoldering' | 'active' | 'spreading' | 'extinguished' } : {}),
            ...(h.fire_detected_at ? { fire_detected_at: h.fire_detected_at } : {}),
          }),
        ),
        overallSafetyScore:
          typeof obj.overall_safety_score === 'number'
            ? obj.overall_safety_score
            : 50,
      }
    } catch (parseErr) {
      // Include the RAW VLM output in the error so the user can see exactly
      // what the model returned — this is critical for debugging parsing issues
      const rawPreview = vlmOutput.slice(0, 2000)
      const jsonPreview = jsonOutput.slice(0, 500)
      throw new Error(
        `Failed to parse VLM output as JSON: ${(parseErr as Error).message}\n\n` +
        `=== RAW VLM OUTPUT (first 2000 chars) ===\n${rawPreview}\n` +
        `=== END RAW OUTPUT ===\n` +
        `=== AFTER EXTRACTION (first 500 chars) ===\n${jsonPreview}`,
      )
    }

    for (const hazard of parsed.hazards) {
      appendTraceEvent(jobId, {
        type: 'vlm_detect',
        model: NEBIUS_VLM_MODEL,
        content: `Hazard detected: ${hazard.category} — ${hazard.severity} — ${hazard.description.slice(0, 100)}...`,
      })
    }

    // Tavily: search for relevant safety regulations per hazard category
    console.log('[analyze] Tavily search starting | jurisdiction:', jurisdiction, '| available:', tavilyAvailable())
    appendTraceEvent(jobId, {
      type: 'tavily_search',
      model: 'Tavily Live Search',
      content: tavilyAvailable()
        ? `Searching ${jurisdiction} safety regulations via Tavily API...`
        : 'Tavily API key not set — using mock regulation citations.',
    })
    const regulations = await searchAllRegulations(
      parsed.hazards.map((h) => ({ category: h.category, description: h.description })),
      jurisdiction,
    )
    for (const reg of regulations) {
      appendTraceEvent(jobId, {
        type: 'tavily_search',
        model: 'Tavily Live Search',
        content: `Found: ${reg.results[0]?.title || 'No results'} (${reg.results.length} citations for ${reg.hazard_category})`,
      })
    }

    appendTraceEvent(jobId, {
      type: 'synthesize',
      model: NEBIUS_REASONING_MODEL,
      content: `Synthesizing report: ${parsed.hazards.length} hazards identified, overall safety score = ${parsed.overallSafetyScore}/100.`,
    })
    await sleep(300)

    appendTraceEvent(jobId, {
      type: 'report_ready',
      model: 'PDF Generator',
      content: `Safety audit report generated. ${parsed.hazards.length} findings. ${regulations.length} regulation citations. Download ready.`,
    })

    completeJob(jobId, { ...parsed, regulations, tavilyLive: tavilyAvailable() })
    console.log('[analyze] job completed:', jobId, '| hazards:', parsed.hazards.length, '| regulations:', regulations.length, '| score:', parsed.overallSafetyScore)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze] job FAILED:', jobId, '| error:', message, '| stack:', err instanceof Error ? err.stack : 'no stack')
    appendTraceEvent(jobId, {
      type: 'plan',
      model: 'Error',
      content: `Analysis failed: ${message}`,
    })
    failJob(jobId, message)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let imageBase64: string | null = null
  let imageUrl: string
  let mimeType = 'image/png'
  let jurisdiction: Jurisdiction = 'CZECH'

  const contentType = req.headers.get('content-type') || ''

  if (contentType.startsWith('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 },
      )
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    imageBase64 = buffer.toString('base64')
    mimeType = file.type || 'image/png'
    // Use a data URL so the uploaded image displays in the results view
    // (the previous fake /api/images/temp- URL didn't actually serve the image)
    imageUrl = `data:${mimeType};base64,${imageBase64}`
  } else {
    const body = await req.json().catch(() => ({}))
    // Support both image_url (demo) and image_base64 (real upload — client converts to PNG)
    if (body.image_base64) {
      imageBase64 = body.image_base64
      mimeType = 'image/png' // client-side canvas always produces PNG
      imageUrl = `data:image/png;base64,${imageBase64}`
    } else {
      imageUrl = body.image_url || '/demo-warehouse.png'
    }
    jurisdiction = (body.jurisdiction as Jurisdiction) || 'CZECH'
  }

  // If no base64 but we have a local image path (demo), read it from disk.
  // Without this, the VLM gets an empty image when using the demo image
  // in LIVE mode (NEBIUS_API_KEY set).
  if (!imageBase64 && imageUrl && imageUrl.startsWith('/') && !imageUrl.startsWith('/api/')) {
    try {
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'public', imageUrl)
      const buffer = await readFile(filePath)
      imageBase64 = buffer.toString('base64')
      mimeType = 'image/png'
      console.log('[analyze] loaded local image from disk:', imageUrl, '| base64 length:', imageBase64.length)
    } catch (err) {
      console.error('[analyze] failed to load local image:', imageUrl, err)
    }
  }

  const jobId = createJob(imageUrl, imageBase64)

  // Synchronous: wait for analysis to complete, then return everything.
  // On Vercel, in-memory job store doesn't persist across instances,
  // so polling doesn't work. Instead, we return the full result + all
  // trace events in the POST response. The client "plays back" the events
  // with delays to simulate the live trace timeline.
  await runAnalysis(jobId, imageBase64, imageUrl, mimeType, jurisdiction)

  // Get the completed job + all trace events from the in-memory store
  const { getJob, getTraceEventsSince } = await import('@/lib/job-store')
  const completedJob = getJob(jobId)
  const allEvents = getTraceEventsSince(jobId, 0)

  // Build the full result
  const result = completedJob ? {
    job_id: jobId,
    status: completedJob.status,
    image_url: imageUrl,
    scene_description: completedJob.sceneDescription || '',
    hazards: completedJob.hazards || [],
    overall_safety_score: completedJob.overallSafetyScore || 0,
    report_pdf_url: completedJob.reportPdfUrl,
    regulations: completedJob.regulations || [],
    tavily_live: completedJob.tavilyLive,
    created_at: completedJob.createdAt,
    completed_at: completedJob.completedAt,
  } : null

  return NextResponse.json({
    job_id: jobId,
    status: completedJob?.status || 'failed',
    error: completedJob?.error || null,
    result,
    events: allEvents.map(e => ({
      type: e.type,
      model: e.model,
      content: e.content,
      timestamp: e.timestamp,
    })),
  })
}
