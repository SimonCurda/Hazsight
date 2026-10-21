/**
 * In-memory job store for Hazsight analysis jobs.
 *
 * Stores jobs + their trace events. Resets on server restart (fine for the
 * hackathon demo — for production, swap this for Prisma + Postgres or Vercel
 * KV / Upstash Redis).
 */

import type { DetectedHazard, JobResult, TraceEvent } from './mock-data'

interface Job {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  imageUrl: string
  imageBase64: string | null
  sceneDescription: string | null
  hazards: DetectedHazard[] | null
  overallSafetyScore: number | null
  reportPdfUrl: string | null
  error: string | null
  createdAt: string
  completedAt: string | null
  traceEvents: TraceEvent[]
}

// In-memory store (uses globalThis to survive hot reloads in dev mode —
// same pattern as Prisma client).
const globalForJobs = globalThis as unknown as {
  __hazsightJobs?: Map<string, Job>
}

const jobs = globalForJobs.__hazsightJobs ?? new Map<string, Job>()

if (!globalForJobs.__hazsightJobs) {
  globalForJobs.__hazsightJobs = jobs
}

export function createJob(imageUrl: string, imageBase64: string | null = null): string {
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const job: Job = {
    id,
    status: 'queued',
    imageUrl,
    imageBase64,
    sceneDescription: null,
    hazards: null,
    overallSafetyScore: null,
    reportPdfUrl: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    traceEvents: [],
  }
  jobs.set(id, job)
  return id
}

export function getJob(jobId: string): Job | null {
  return jobs.get(jobId) || null
}

export function appendTraceEvent(
  jobId: string,
  event: Omit<TraceEvent, 'timestamp'>,
): void {
  const job = jobs.get(jobId)
  if (!job) return
  job.traceEvents.push({
    ...event,
    timestamp: Date.now(),
  })
  job.status = 'processing'
}

export function completeJob(
  jobId: string,
  result: {
    sceneDescription: string
    hazards: DetectedHazard[]
    overallSafetyScore: number
  },
): void {
  const job = jobs.get(jobId)
  if (!job) return
  job.sceneDescription = result.sceneDescription
  job.hazards = result.hazards
  job.overallSafetyScore = result.overallSafetyScore
  job.reportPdfUrl = `/api/reports/${jobId}`
  job.status = 'completed'
  job.completedAt = new Date().toISOString()
}

export function failJob(jobId: string, error: string): void {
  const job = jobs.get(jobId)
  if (!job) return
  job.error = error
  job.status = 'failed'
  job.completedAt = new Date().toISOString()
}

export function getTraceEventsSince(
  jobId: string,
  sinceTimestamp: number,
): TraceEvent[] {
  const job = jobs.get(jobId)
  if (!job) return []
  return job.traceEvents.filter((e) => e.timestamp > sinceTimestamp)
}

export function toJobResult(job: Job): JobResult {
  return {
    job_id: job.id,
    status: job.status,
    image_url: job.imageUrl,
    scene_description: job.sceneDescription || '',
    hazards: job.hazards || [],
    overall_safety_score: job.overallSafetyScore || 0,
    report_pdf_url: job.reportPdfUrl,
    created_at: job.createdAt,
    completed_at: job.completedAt,
  }
}
