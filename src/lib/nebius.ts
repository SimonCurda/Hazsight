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

export function getNebiusClient(): OpenAI | null {
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
 * Call the NVIDIA-served VLM on Nebius Token Factory to analyze an image.
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
- description: detailed narrative of the hazard
- affected_area: spatial location in the image
- recommendation: immediate corrective action
- confidence: 0.0 to 1.0
- bounding_box: { x, y, width, height } as percentages 0-100

FIRE DETECTION (for FIRE_SMOKE hazards only):
- fire_origin_point: { x, y } as percentages 0-100
- fire_severity_level: "smoldering", "active", "spreading", or "extinguished"
- fire_detected_at: null

Also provide:
- scene_description: objective narrative of the visual scene
- overall_safety_score: 0-100

IMPORTANT: Return ONLY valid JSON. Do NOT use newlines inside string values. Keep all strings on a single line. Do not add commentary before or after the JSON.

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
    max_tokens: 8000,
    temperature: 0.2,
  })

  const content = response.choices[0]?.message?.content || ''
  console.log('[nebius] VLM raw output (first 300 chars):', content.slice(0, 300))
  return content
}

/**
 * Fix unescaped newlines inside JSON string values.
 * VLMs often output multi-line strings with literal newlines, which is
 * invalid JSON. This scans character-by-character and escapes them.
 */
function fixJsonNewlines(input: string): string {
  let result = ''
  let inStr = false
  let esc = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (esc) { result += ch; esc = false; continue }
    if (ch === '\\') { result += ch; esc = true; continue }
    if (ch === '"') { inStr = !inStr; result += ch; continue }
    if (inStr && ch === '\n') { result += '\\n'; continue }
    if (inStr && ch === '\r') { continue }
    if (inStr && ch === '\t') { result += '\\t'; continue }
    result += ch
  }
  return result
}

/**
 * Extract a JSON object from text that might have conversational wrapper,
 * markdown fences, thinking tags, or unescaped newlines.
 */
function extractJsonFromText(text: string): string | null {
  if (!text) return null

  // 1. Fix unescaped newlines inside JSON string values
  let work = fixJsonNewlines(text)

  // 2. Strip markdown fences
  const fenceMatch = work.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) {
    try { JSON.parse(fenceMatch[1].trim()); return fenceMatch[1].trim() } catch {}
  }

  // 3. Try parsing as-is
  try { JSON.parse(work.trim()); return work.trim() } catch {}

  // 4. Find first { to last }
  const first = work.indexOf('{')
  const last = work.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = work.slice(first, last + 1)
    try { JSON.parse(candidate); return candidate } catch {
      const fixed = candidate.replace(/,\s*([}\]])/g, '$1')
      try { JSON.parse(fixed); return fixed } catch {}
    }
  }

  return null
}

/**
 * Use Nemotron 3 Ultra to extract JSON from VLM output.
 * Tries regex extraction first (handles most cases without Ultra call).
 */
export async function extractStructuredJson(
  vlmOutput: string,
): Promise<string> {
  // Fast path: try regex extraction first
  const extracted = extractJsonFromText(vlmOutput)
  if (extracted) {
    return extracted
  }

  // Fall through to Nemotron Ultra for harder cases
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
    max_tokens: 4000,
    temperature: 0,
  })

  const ultraOutput = response.choices[0]?.message?.content || ''
  // Try extracting from Ultra's output too
  const ultraExtracted = extractJsonFromText(ultraOutput)
  return ultraExtracted || ultraOutput
}
