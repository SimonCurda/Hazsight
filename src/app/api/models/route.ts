/**
 * GET /api/models
 *
 * Lists all available models on Nebius Token Factory.
 * Calls the OpenAI-compatible /v1/models endpoint.
 *
 * Use this to find the correct VLM model name when you get a 404 error.
 */

import { NextResponse } from 'next/server'
import { nebiusAvailable } from '@/lib/nebius'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET() {
  if (!nebiusAvailable()) {
    return NextResponse.json({
      available: false,
      message: 'NEBIUS_API_KEY not set — cannot list models. Set the key first.',
      hint: 'The current VLM model name in code is: meta/llama-3.2-11b-vision-instruct — this may be wrong. Set NEBIUS_API_KEY and visit this endpoint to see what models are actually available.',
    })
  }

  const baseUrl = process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1/'

  try {
    const response = await fetch(`${baseUrl}models`, {
      headers: {
        Authorization: `Bearer ${process.env.NEBIUS_API_KEY}`,
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json({
        available: true,
        error: `Nebius /models returned ${response.status} ${response.statusText}`,
        details: text.slice(0, 500),
        hint: 'Check if the API key is valid and the base URL is correct.',
      }, { status: 500 })
    }

    const data = await response.json()
    const models = (data.data || []).map((m: { id: string; owned_by?: string }) => ({
      id: m.id,
      owned_by: m.owned_by || 'unknown',
    }))

    // Group by owner for easier reading
    const byOwner: Record<string, string[]> = {}
    for (const m of models) {
      const owner = m.owned_by || 'unknown'
      if (!byOwner[owner]) byOwner[owner] = []
      byOwner[owner].push(m.id)
    }

    // Highlight VLM-capable models (vision/image models)
    const vlmModels = models.filter((m: { id: string }) =>
      /vision|vlm|image|llava|vila|neva|multimodal/i.test(m.id)
    )

    // Highlight NVIDIA models
    const nvidiaModels = models.filter((m: { id: string; owned_by: string }) =>
      /nvidia|nemotron|nima/i.test(m.id) || m.owned_by === 'nvidia'
    )

    return NextResponse.json({
      available: true,
      total_models: models.length,
      current_vlm_model: process.env.NEBIUS_VLM_MODEL || 'meta/llama-3.2-11b-vision-instruct',
      current_reasoning_model: process.env.NEBIUS_REASONING_MODEL || 'nvidia/nemotron-3-ultra',
      vlm_capable_models: vlmModels,
      nvidia_models: nvidiaModels,
      all_models: models.slice(0, 50),
      grouped_by_owner: byOwner,
      hint: 'If you get a 404, the model name is wrong. Pick a model from vlm_capable_models above and set NEBIUS_VLM_MODEL env var to its id.',
    })
  } catch (err) {
    return NextResponse.json({
      available: true,
      error: 'Network error calling Nebius /models',
      details: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
