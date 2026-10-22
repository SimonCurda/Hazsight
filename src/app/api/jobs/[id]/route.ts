/**
 * GET /api/jobs/[id]
 *
 * Returns the current status + result of an analysis job.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJob, toJobResult } from '@/lib/job-store'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const job = getJob(id)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  return NextResponse.json(toJobResult(job))
}
