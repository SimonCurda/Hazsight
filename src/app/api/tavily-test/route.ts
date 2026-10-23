/**
 * GET /api/tavily-test
 *
 * Verifies that the TAVILY_API_KEY env var is set and working by making a
 * real test search query to the Tavily API. Returns the results so you can
 * confirm the key works before deploying to Vercel.
 *
 * Usage:
 *   - Open /api/tavily-test in the browser
 *   - Or: curl http://localhost:3000/api/tavily-test
 *
 * Returns 200 with:
 *   { available: true, key_set: true, query: string, results: TavilyResult[] }
 *
 * Returns 200 with:
 *   { available: false, key_set: false, message: string }
 *   when no key is set (mock mode — the app still works with mock citations).
 *
 * Returns 500 with:
 *   { available: false, key_set: true, error: string }
 *   when the key is set but the API call fails (invalid key, rate limit, etc).
 */

import { NextResponse } from 'next/server'
import { tavilyAvailable } from '@/lib/tavily'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TEST_QUERY =
  'Czech fire safety regulation emergency exit clearance workplace'

export async function GET(): Promise<NextResponse> {
  if (!tavilyAvailable()) {
    return NextResponse.json({
      available: false,
      key_set: false,
      message:
        'TAVILY_API_KEY is not set. The app is running in mock mode — regulation citations are pre-written. Add the key to .env.local (local) or Vercel env vars (production) to enable live web search.',
      hint: 'Get a free key at https://tavily.com — then set TAVILY_API_KEY=tvly-xxxx in .env.local',
    })
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: TEST_QUERY,
        search_depth: 'basic',
        max_results: 3,
        include_answer: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        {
          available: false,
          key_set: true,
          error: `Tavily API returned ${response.status} ${response.statusText}`,
          details: text.slice(0, 500),
          hint:
            response.status === 401
              ? 'The API key is invalid or expired. Generate a new one at https://app.tavily.com'
              : 'Check https://docs.tavily.com for rate limits and error codes.',
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    const results = (data.results || []).map(
      (r: { title?: string; url?: string; content?: string; score?: number }) => ({
        title: r.title || '',
        url: r.url || '',
        content: (r.content || '').slice(0, 300),
        score: r.score || 0,
      }),
    )

    return NextResponse.json({
      available: true,
      key_set: true,
      query: TEST_QUERY,
      result_count: results.length,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      {
        available: false,
        key_set: true,
        error: 'Network error calling Tavily API',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
