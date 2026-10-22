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
import { searchAllRegulations, tavilyAvailable } from '@/lib/tavily'
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
): Promise<void> {
  try {
    appendTraceEvent(jobId, {
      type: 'plan',
      model: 'Nemotron 3 Ultra',
      content:
        'Analyzing image for occupational safety hazards. Plan: (1) scene understanding, (2) hazard identification, (3) severity assessment, (4) regulatory cross-reference, (5) recommendation synthesis.',
    })
    await sleep(400)

    if (!nebiusAvailable()) {
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

    const vlmOutput = await analyzeImageWithVlm(
      imageBase64 || '',
      mimeType,
    )

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

    let parsed: AnalysisResult
    try {
      const obj = JSON.parse(jsonOutput)
      parsed = {
        sceneDescription: obj.scene_description || '',
        hazards: (obj.hazards || []).map(
          (h: DetectedHazard & { bounding_box?: { x: number; y: number; width: number; height: number } }, idx: number) => ({
            id: `h-${idx + 1}`,
            category: h.category,
            severity: h.severity,
            description: h.description,
            affected_area: h.affected_area || '',
            recommendation: h.recommendation || '',
            confidence: typeof h.confidence === 'number' ? h.confidence : 0.8,
            bounding_box: h.bounding_box || { x: 0, y: 0, width: 0, height: 0 },
          }),
        ),
        overallSafetyScore:
          typeof obj.overall_safety_score === 'number'
            ? obj.overall_safety_score
            : 50,
      }
    } catch (parseErr) {
      throw new Error(
        `Failed to parse VLM output as JSON: ${(parseErr as Error).message}`,
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
    appendTraceEvent(jobId, {
      type: 'tavily_search',
      model: 'Tavily Live Search',
      content: tavilyAvailable()
        ? 'Searching for relevant safety regulations via Tavily API...'
        : 'Tavily API key not set — using mock regulation citations.',
    })
    const regulations = await searchAllRegulations(
      parsed.hazards.map((h) => ({ category: h.category, description: h.description })),
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
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
    imageUrl = `/api/images/temp-${Date.now()}`
  } else {
    const body = await req.json().catch(() => ({}))
    imageUrl = body.image_url || '/demo-warehouse.png'
  }

  const jobId = createJob(imageUrl, imageBase64)

  // Await processing — ensures the job is complete before we return the response.
  // (Background `void` processing doesn't work reliably in Next.js serverless
  // because the function may be killed after the response is sent.)
  await runAnalysis(jobId, imageBase64, imageUrl, mimeType)

  return NextResponse.json({
    job_id: jobId,
    status: 'completed',
  })
}
