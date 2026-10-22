/**
 * GET /api/jobs/[id]/trace?since=<timestamp>
 *
 * Returns trace events for a job emitted after the given timestamp
 * (milliseconds since epoch). The frontend polls this every 1s to render
 * the live agent-trace timeline.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTraceEventsSince } from '@/lib/job-store'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const url = new URL(req.url)
  const since = parseInt(url.searchParams.get('since') || '0', 10)
  const events = getTraceEventsSince(id, since)
  return NextResponse.json({ events })
}
