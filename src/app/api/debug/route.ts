/**
 * GET /api/debug
 *
 * Debug endpoint — returns the full internal state so you can see exactly
 * what's happening: which API keys are set, what mode (mock vs live),
 * recent jobs + their trace events + any errors + the actual code that runs.
 */

import { NextResponse } from 'next/server'
import { nebiusAvailable, NEBIUS_VLM_MODEL, NEBIUS_REASONING_MODEL, NEBIUS_FAST_MODEL } from '@/lib/nebius'
import { tavilyAvailable, JURISDICTIONS } from '@/lib/tavily'
import { listJobs, getJob, getTraceEventsSince } from '@/lib/job-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const jobs = listJobs(5)
  const recentJobsDebug = jobs.map((job) => {
    const fullJob = getJob(job.job_id)
    return {
      job_id: job.job_id,
      status: job.status,
      created_at: job.created_at,
      completed_at: job.completed_at,
      image_url_type: job.image_url?.startsWith('data:') ? 'data-url (base64)' : job.image_url?.startsWith('/') ? 'local-path' : 'external-url',
      image_url_length: job.image_url?.length || 0,
      hazard_count: job.hazards?.length || 0,
      overall_safety_score: job.overall_safety_score,
      tavily_live: job.tavily_live,
      regulation_count: job.regulations?.length || 0,
      trace_event_count: fullJob?.traceEvents?.length || 0,
      error: fullJob?.error || null,
      hazards_preview: job.hazards?.slice(0, 3).map(h => ({
        category: h.category,
        severity: h.severity,
        description: h.description?.slice(0, 80),
        confidence: h.confidence,
        has_fire_data: !!(h.fire_origin_point || h.fire_severity_level),
      })) || [],
      regulations_preview: job.regulations?.slice(0, 3).map(r => ({
        hazard_category: r.hazard_category,
        jurisdiction: r.jurisdiction,
        query: r.query?.slice(0, 80),
        result_count: r.results?.length || 0,
        top_result: r.results?.[0] ? {
          title: r.results[0].title?.slice(0, 80),
          url: r.results[0].url,
          score: r.results[0].score,
        } : null,
      })) || [],
      trace_events: fullJob?.traceEvents?.map(e => ({
        type: e.type,
        model: e.model,
        content: e.content?.slice(0, 200),
        timestamp: new Date(e.timestamp).toISOString(),
      })) || [],
    }
  })

  return NextResponse.json({
    timestamp: new Date().toISOString(),

    // Environment state
    env: {
      NEBIUS_API_KEY_set: nebiusAvailable(),
      TAVILY_API_KEY_set: tavilyAvailable(),
      NEBIUS_BASE_URL: process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1/ (default)',
      NEBIUS_VLM_MODEL: NEBIUS_VLM_MODEL,
      NEBIUS_REASONING_MODEL: NEBIUS_REASONING_MODEL,
      NEBIUS_FAST_MODEL: NEBIUS_FAST_MODEL,
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV || 'development',
      runtime: 'nodejs',
      maxDuration: 60,
    },

    // What mode the app is in
    mode: {
      nebius: nebiusAvailable() ? 'LIVE (real VLM calls via Nebius Token Factory)' : 'MOCK (pre-written hazards — NEBIUS_API_KEY not set)',
      tavily: tavilyAvailable() ? 'LIVE (real web search via Tavily API)' : 'MOCK (pre-written citations — TAVILY_API_KEY not set)',
      architecture: 'synchronous POST (waits for full analysis, returns result + events in one response)',
    },

    // How the analyze flow works
    pipeline: {
      step_1: 'POST /api/analyze → creates job, starts analysis',
      step_2: nebiusAvailable()
        ? 'VLM (Llama 3.2 Vision) analyzes image via Nebius Token Factory'
        : 'MOCK: uses pre-written MOCK_HAZARDS (4 hazards: blocked exit, fire risk, trip, PPE)',
      step_3: nebiusAvailable()
        ? 'Nemotron 3 Ultra extracts/validates structured JSON from VLM output'
        : 'SKIPPED in mock mode',
      step_4: `Tavily searches for regulations (${tavilyAvailable() ? 'LIVE' : 'MOCK'}) — jurisdiction-aware`,
      step_5: 'Job completes → POST returns { job_id, status, result, events }',
      step_6: 'Client plays back trace events with delays → switches to results view',
    },

    // Available jurisdictions for Tavily search
    jurisdictions: Object.entries(JURISDICTIONS).map(([code, j]) => ({
      code,
      label: j.label,
      flag: j.flag,
      query_modifier: j.modifier,
    })),

    // Recent jobs with FULL detail (hazards preview, regulations preview, trace events)
    recent_jobs: recentJobsDebug,

    // The actual API endpoints available
    endpoints: [
      { method: 'POST', path: '/api/analyze', desc: 'Submit image for VLM analysis (synchronous — returns full result)' },
      { method: 'GET', path: '/api/debug', desc: 'This endpoint — shows everything' },
      { method: 'GET', path: '/api/jobs', desc: 'List jobs (may not work on Vercel — in-memory store)' },
      { method: 'GET', path: '/api/jobs/:id', desc: 'Get job by ID (may not work on Vercel)' },
      { method: 'GET', path: '/api/nebius-test', desc: 'Test Nebius API key' },
      { method: 'GET', path: '/api/tavily-test', desc: 'Test Tavily API key' },
    ],

    // Help
    help: {
      if_no_jobs: 'No analysis has been run yet on THIS server instance. On Vercel, each function instance has its own memory — jobs from POST /api/analyze are returned in the response, not stored globally.',
      if_job_status_failed: 'The analysis failed. Check the error field + trace_events for the last event (usually shows where it failed).',
      if_job_status_completed: 'The analysis completed. Check hazard_count + regulations_preview.',
      trace_event_types: 'plan → vlm_analyze → vlm_detect → ultra_assess → tavily_search → synthesize → report_ready',
      how_to_test: 'Upload a photo or click "Try with a demo image". The POST response now includes everything — no polling needed.',
    },
  })
}
