/**
 * Nebius Token Factory client.
 *
 * Uses the OpenAI SDK (OpenAI-compatible API) pointed at Nebius Token Factory.
 * Hackathon compliance: this is the actual inference provider — not NVIDIA's
 * direct API at build.nvidia.com.
 *
 * Get your API key at: https://tokenfactory.nebius.com
 * Set it as NEBIUS_API_KEY in .env.local
 */

import OpenAI from 'openai'

function getNebiusClient(): OpenAI | null {
  const apiKey = process.env.NEBIUS_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1/',
  })
}

export const NEBIUS_REASONING_MODEL =
  process.env.NEBIUS_REASONING_MODEL || 'nvidia/Nemotron-3-Ultra-550b-a55b'

export const NEBIUS_FAST_MODEL =
  process.env.NEBIUS_FAST_MODEL || 'nvidia/nemotron-3-super-120b-a12b'

export const NEBIUS_VLM_MODEL =
  process.env.NEBIUS_VLM_MODEL || 'nvidia/Nemotron-3.5-Super-VL'

export const nebiusAvailable = (): boolean => {
  return !!process.env.NEBIUS_API_KEY
}

/**
 * Call the NVIDIA-served VLM (Llama 3.2 Vision) on Nebius Token Factory to
 * analyze an image and identify safety hazards.
 *
 * Returns structured JSON: { scene_description, hazards, overall_safety_score }
 */
export async function analyzeImageWithVlm(
  imageBase64: string,
  mimeType: string = 'image/png',
): Promise<string> {
  const client = getNebiusClient()
  if (!client) {
    throw new Error('NEBIUS_API_KEY not set')
  }

  const prompt = `You are an occupational safety inspector analyzing a photo of a workspace, warehouse, or industrial site.

Identify all safety hazards visible in the image. Use these hazard categories:
- PPE_VIOLATION: missing helmet, vest, goggles, harness, or other PPE
- FIRE_SMOKE: flames, sparks, smoke, or flammable materials near heat sources
- SLIP_TRIP_FALL: spills, loose cables, floor obstacles, uneven surfaces
- UNAUTHORIZED_ZONE: personnel or objects in restricted areas
- MACHINERY_PROXIMITY: unsafe distance from operating machinery
- UNSAFE_BEHAVIOR: risky climbing, unsafe lifting, reckless conduct
- OTHER: any other safety hazard

For EACH hazard, provide:
- category: one of the categories above
- severity: LOW, MEDIUM, HIGH, or CRITICAL
  - CRITICAL: imminent life-safety hazard (fire, smoke, blocked exit, fall from height)
  - HIGH: severe risk (flammable near heat, missing mandatory PPE in high-hazard zone)
  - MEDIUM: notable risk (missing secondary PPE, cluttered pathway)
  - LOW: minor irregularity
- description: detailed narrative of the hazard
- affected_area: spatial location in the image (e.g., "bottom-right near door")
- recommendation: immediate corrective action
- confidence: 0.0 to 1.0
- bounding_box: { x, y, width, height } as percentages 0-100 of image dimensions, where (0,0) is top-left. Use 0,0,0,0 if the hazard is "absence of something" (e.g., no fire extinguisher visible).

FIRE DETECTION (for FIRE_SMOKE hazards only):
- fire_origin_point: { x, y } as percentages 0-100 — the point where the fire/smoke appears to originate (e.g., the heat source, the seat of the fire). This is used to pinpoint the fire's origin on the map.
- fire_severity_level: one of "smoldering" (early smoke, no visible flame), "active" (visible flames or glowing), "spreading" (fire spreading to adjacent materials), or "extinguished" (post-fire residue, no active flame).
- fire_detected_at: leave this null — it will be set by the monitoring system.

Also provide:
- scene_description: objective narrative of the visual scene (environment, equipment, people, lighting, activities)
- overall_safety_score: 0-100 (100 = completely safe, 0 = critical hazard everywhere)

Return ONLY valid JSON in this exact shape (no markdown fences, no commentary):
{
  "scene_description": "...",
  "overall_safety_score": 42,
  "hazards": [
    {
      "category": "FIRE_SMOKE",
      "severity": "HIGH",
      "description": "...",
      "affected_area": "...",
      "recommendation": "...",
      "confidence": 0.89,
      "bounding_box": { "x": 18, "y": 60, "width": 22, "height": 28 },
      "fire_origin_point": { "x": 28, "y": 70 },
      "fire_severity_level": "active",
      "fire_detected_at": null
    }
  ]
}`

  const response = await client.chat.completions.create({
    model: NEBIUS_VLM_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.2,
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * Use Nemotron 3 Ultra to clean up / validate the VLM's output as structured
 * JSON. If the VLM already returned valid JSON, this is a no-op pass-through.
 * If the VLM returned text with markdown fences or commentary, Ultra extracts
 * just the JSON.
 */
export async function extractStructuredJson(
  vlmOutput: string,
): Promise<string> {
  // Fast path: if it's already valid JSON, return as-is.
  try {
    JSON.parse(vlmOutput)
    return vlmOutput
  } catch {
    // Fall through to Nemotron Ultra cleanup.
  }

  const client = getNebiusClient()
  if (!client) {
    throw new Error('NEBIUS_API_KEY not set')
  }

  const response = await client.chat.completions.create({
    model: NEBIUS_REASONING_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON extraction assistant. The user will provide text that contains JSON. Extract ONLY the JSON object and return it. No markdown fences, no commentary, no explanation. Just the raw JSON.',
      },
      {
        role: 'user',
        content: vlmOutput,
      },
    ],
    max_tokens: 2000,
    temperature: 0,
  })

  return response.choices[0]?.message?.content || ''
}
