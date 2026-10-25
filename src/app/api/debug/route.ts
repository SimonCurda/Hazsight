/**
 * GET /api/debug
 *
 * Debug endpoint — returns the full internal state so you can see exactly
 * what's happening: which API keys are set, what mode (mock vs live),
 * recent jobs + their trace events + any errors.
 *
 * This is for development/debugging only. Do NOT expose in production.
 */

import { NextResponse } from 'next/server'
import { nebiusAvailable, NEBIUS_VLM_MODEL, NEBIUS_REASONING_MODEL, NEBIUS_FAST_MODEL } from '@/lib/nebius'
import { tavilyAvailable } from '@/lib/tavily'
import { listJobs, getJob, getTraceEventsSince } from '@/lib/job-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const jobs = listJobs(5) // last 5 jobs
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
      trace_events: fullJob?.traceEvents?.map(e => ({
        type: e.type,
        model: e.model,
        content: e.content?.slice(0, 120),
        timestamp: new Date(e.timestamp).toISOString(),
      })) || [],
    }
  })

  return NextResponse.json({
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
    },
    // What mode the app is in
    mode: {
      nebius: nebiusAvailable() ? 'LIVE (real VLM calls)' : 'MOCK (pre-written hazards)',
      tavily: tavilyAvailable() ? 'LIVE (real web search)' : 'MOCK (pre-written citations)',
    },
    // Recent jobs with full detail
    recent_jobs: recentJobsDebug,
    // How to read this
    help: {
      if_mode_is_mock: 'API keys are NOT set. Add NEBIUS_API_KEY and TAVILY_API_KEY to .env.local (local) or Vercel env vars (production).',
      if_no_jobs: 'No analysis has been run yet. Upload a photo or click "Try with a demo image".',
      if_job_status_processing: 'The analysis is still running. Check trace_events for progress.',
      if_job_status_failed: 'The analysis failed. Check the error field for details.',
      if_job_status_completed: 'The analysis completed successfully. Check hazard_count and regulation_count.',
      trace_event_types: 'plan, vlm_analyze, vlm_detect, ultra_assess, tavily_search, synthesize, report_ready',
    },
  })
}
