/**
 * GET /api/nebius-test
 *
 * Verifies that the NEBIUS_API_KEY env var is set and working by making a
 * minimal chat completion request to Nebius Token Factory. Returns the
 * result so you can confirm the key works before deploying to Vercel.
 *
 * Usage:
 *   - Open /api/nebius-test in the browser
 *   - Or: curl http://localhost:3000/api/nebius-test
 *
 * Returns 200 with:
 *   { available: true, key_set: true, base_url, models, test_response }
 *
 * Returns 200 with:
 *   { available: false, key_set: false, message, hint }
 *   when no key is set (mock mode — the app still works with mock hazards).
 *
 * Returns 500 with:
 *   { available: false, key_set: true, error, details, hint }
 *   when the key is set but the API call fails (invalid key, wrong model, etc).
 */

import { NextResponse } from 'next/server'
import { nebiusAvailable, NEBIUS_FAST_MODEL, NEBIUS_VLM_MODEL, NEBIUS_REASONING_MODEL } from '@/lib/nebius'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(): Promise<NextResponse> {
  const baseUrl = process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1/'

  if (!nebiusAvailable()) {
    return NextResponse.json({
      available: false,
      key_set: false,
      base_url: baseUrl,
      models: {
        vlm: NEBIUS_VLM_MODEL,
        reasoning: NEBIUS_REASONING_MODEL,
        fast: NEBIUS_FAST_MODEL,
      },
      message:
        'NEBIUS_API_KEY is not set. The app is running in mock mode — hazards are pre-written. Add the key to .env.local (local) or Vercel env vars (production) to enable real VLM analysis via Nebius Token Factory.',
      hint: 'Get a key at https://tokenfactory.nebius.com — then set NEBIUS_API_KEY=xxx in .env.local',
    })
  }

  // Make a minimal test request to verify the key + endpoint + model work.
  // Uses the fast model with a 1-token response to keep it cheap + quick.
  try {
    const response = await fetch(`${baseUrl}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEBIUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: NEBIUS_FAST_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Reply with exactly: OK',
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        {
          available: false,
          key_set: true,
          base_url: baseUrl,
          models: {
            vlm: NEBIUS_VLM_MODEL,
            reasoning: NEBIUS_REASONING_MODEL,
            fast: NEBIUS_FAST_MODEL,
          },
          error: `Nebius API returned ${response.status} ${response.statusText}`,
          details: text.slice(0, 500),
          hint:
            response.status === 401
              ? 'The API key is invalid or expired. Generate a new one at https://tokenfactory.nebius.com'
              : response.status === 404
                ? `The model "${NEBIUS_FAST_MODEL}" was not found. Try setting NEBIUS_FAST_MODEL to a valid model name (check the Token Factory playground).`
                : 'Check the Nebius Token Factory docs for rate limits and error codes.',
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    const testResponse =
      data.choices?.[0]?.message?.content || '(empty response)'

    return NextResponse.json({
      available: true,
      key_set: true,
      base_url: baseUrl,
      models: {
        vlm: NEBIUS_VLM_MODEL,
        reasoning: NEBIUS_REASONING_MODEL,
        fast: NEBIUS_FAST_MODEL,
      },
      test_model: NEBIUS_FAST_MODEL,
      test_response: testResponse,
      message: 'Nebius Token Factory API key is valid and working. Real VLM analysis will run when you analyze a photo.',
    })
  } catch (err) {
    return NextResponse.json(
      {
        available: false,
        key_set: true,
        base_url: baseUrl,
        models: {
          vlm: NEBIUS_VLM_MODEL,
          reasoning: NEBIUS_REASONING_MODEL,
          fast: NEBIUS_FAST_MODEL,
        },
        error: 'Network error calling Nebius Token Factory API',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
