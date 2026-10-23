/**
 * GET /api/jobs?limit=50
 *
 * Lists all analysis jobs, newest first. Used by the monitoring dashboard
 * to show a history of scans (e.g., a camera taking photos every 15 min).
 *
 * Returns: { jobs: JobResult[], total: number }
 *
 * Each job includes: job_id, status, image_url, overall_safety_score,
 * hazards (count + summary), created_at, completed_at, tavily_live.
 * Does NOT include trace events or base64 image data (keep payload small).
 *
 * Pagination: ?limit=50 (default, max 200) — returns the N most recent jobs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listJobs } from '@/lib/job-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 200)

  const jobs = listJobs(limit)

  return NextResponse.json({
    jobs,
    total: jobs.length,
    limit,
  })
}
