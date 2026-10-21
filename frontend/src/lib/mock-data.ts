/**
 * Mock data for the Hazsight demo.
 *
 * In production, this data comes from the Python backend (FastAPI on a separate
 * port, accessed via the Caddy gateway with ?XTransformPort=8000). The backend
 * calls Nebius Token Factory with an NVIDIA-served VLM (e.g. Llama 3.2 Vision)
 * for image analysis, Nemotron 3 Ultra for severity assessment + report
 * synthesis, and Nemotron 3 Super for chat Q&A.
 *
 * For the hackathon demo, we use mock data so the full flow works end-to-end
 * even before the Python backend is wired up.
 */

import type { HazardCategory, RiskSeverity } from './types'
import type { RegulationCitation } from './tavily'

export interface DetectedHazard {
  id: string
  category: HazardCategory
  severity: RiskSeverity
  description: string
  affected_area: string
  recommendation: string
  confidence: number
  bounding_box: {
    x: number // percentage 0-100
    y: number // percentage 0-100
    width: number // percentage 0-100
    height: number // percentage 0-100
  }
}

export interface TraceEvent {
  timestamp: number
  type:
    | 'plan'
    | 'vlm_analyze'
    | 'vlm_detect'
    | 'ultra_assess'
    | 'tavily_search'
    | 'synthesize'
    | 'report_ready'
  model?: string
  content: string
  metadata?: Record<string, unknown>
}

export interface JobResult {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  image_url: string
  scene_description: string
  hazards: DetectedHazard[]
  overall_safety_score: number
  report_pdf_url: string | null
  regulations: RegulationCitation[]
  created_at: string
  completed_at: string | null
}

// Sample hazards for demo. Bounding boxes are percentages relative to the
// image dimensions, so they scale with any image size.
export const MOCK_HAZARDS: DetectedHazard[] = [
  {
    id: 'h1',
    category: 'UNAUTHORIZED_ZONE',
    severity: 'CRITICAL',
    description:
      'Emergency exit is partially blocked by stacked cardboard boxes, reducing the clear opening width below the 0.8m minimum required for safe egress.',
    affected_area: 'Bottom-right — emergency exit door',
    recommendation:
      'Immediately remove all obstacles from the emergency exit. Maintain a minimum clear width of 0.8m at all times per Czech fire safety regulation (vyhl. 246/2001 Sb. § 18).',
    confidence: 0.94,
    bounding_box: { x: 62, y: 55, width: 28, height: 40 },
  },
  {
    id: 'h2',
    category: 'FIRE_SMOKE',
    severity: 'HIGH',
    description:
      'Combustible cardboard packaging stored within 0.3m of an active electric space heater, creating a significant fire risk.',
    affected_area: 'Center-left — next to heater',
    recommendation:
      'Relocate combustible materials at least 1.5m from any heat source. Replace the space heater with a wall-mounted unit with automatic overheat shutoff.',
    confidence: 0.89,
    bounding_box: { x: 18, y: 60, width: 22, height: 28 },
  },
  {
    id: 'h3',
    category: 'SLIP_TRIP_FALL',
    severity: 'MEDIUM',
    description:
      'Loose power cable running across the floor in a high-traffic walkway creates a trip hazard.',
    affected_area: 'Bottom-center — floor',
    recommendation:
      'Route the cable through a covered cable tray or use a floor cable protector ramp. Alternatively, reroute along the wall.',
    confidence: 0.82,
    bounding_box: { x: 35, y: 80, width: 40, height: 8 },
  },
  {
    id: 'h4',
    category: 'PPE_VIOLATION',
    severity: 'MEDIUM',
    description:
      'No visible fire extinguisher within 30m of the workspace, contrary to recommended coverage for this hazard class.',
    affected_area: 'Not visible in frame',
    recommendation:
      'Install a 6kg ABC dry powder extinguisher on the wall within 15m of the workspace, with proper signage and monthly inspection tag.',
    confidence: 0.71,
    bounding_box: { x: 0, y: 0, width: 0, height: 0 }, // not visible
  },
]

export const MOCK_SCENE_DESCRIPTION =
  'Indoor warehouse workspace, approximately 25m². Visible elements: stacked cardboard boxes, an electric space heater (active, glowing red indicator), a power cable running across the floor, an emergency exit door (partially obstructed), metal shelving units, and a workstation desk with a laptop. Lighting is adequate. No personnel visible in frame.'

export const MOCK_TRACE_EVENTS: Omit<TraceEvent, 'timestamp'>[] = [
  {
    type: 'plan',
    model: 'Nemotron 3 Ultra',
    content:
      'Analyzing image for occupational safety hazards. Plan: (1) scene understanding, (2) hazard identification, (3) severity assessment, (4) regulatory cross-reference, (5) recommendation synthesis.',
  },
  {
    type: 'vlm_analyze',
    model: 'Llama 3.2 Vision (NVIDIA-served VLM)',
    content:
      'Scene understanding: indoor warehouse, 25m², cardboard boxes, electric space heater, power cable across floor, emergency exit door, metal shelving, workstation desk.',
  },
  {
    type: 'vlm_detect',
    model: 'Llama 3.2 Vision',
    content:
      'Hazard detected: emergency exit partially blocked by stacked cardboard boxes (bounding box at 62%, 55%).',
  },
  {
    type: 'vlm_detect',
    model: 'Llama 3.2 Vision',
    content:
      'Hazard detected: combustible cardboard within 0.3m of active electric heater (bounding box at 18%, 60%).',
  },
  {
    type: 'vlm_detect',
    model: 'Llama 3.2 Vision',
    content:
      'Hazard detected: loose power cable across floor in walkway (bounding box at 35%, 80%).',
  },
  {
    type: 'ultra_assess',
    model: 'Nemotron 3 Ultra',
    content:
      'Severity assessment: Exit blockage = CRITICAL (egress violation). Combustible near heat = HIGH (fire risk). Cable across floor = MEDIUM (trip hazard).',
  },
  {
    type: 'tavily_search',
    model: 'Tavily Live Search',
    content:
      'Searching Czech fire safety regulation for emergency exit clearance requirements...',
  },
  {
    type: 'tavily_search',
    model: 'Tavily Live Search',
    content:
      'Found: vyhl. 246/2001 Sb. § 18 — minimum clear width 0.8m required for emergency exits. Cited in report.',
  },
  {
    type: 'synthesize',
    model: 'Nemotron 3 Ultra',
    content:
      'Synthesizing report: 4 hazards identified, overall safety score = 42/100 (HIGH RISK). Generating PDF with annotated image, hazard table, and regulatory citations.',
  },
  {
    type: 'report_ready',
    model: 'PDF Generator',
    content:
      'Safety audit report generated. 4 findings, 2 critical/high priority. Download ready.',
  },
]

// Sample image generated via Image Generation skill (z-ai-web-dev-sdk).
// Stored at /public/demo-warehouse.png — served by Next.js at /demo-warehouse.png.
// The image depicts a warehouse with the exact hazards the mock data describes:
// blocked emergency exit (right), flammable cardboard near electric heater (left),
// loose power cable across floor (center foreground).
export const MOCK_IMAGE_URL = '/demo-warehouse.png'

export const MOCK_JOB_RESULT: JobResult = {
  job_id: 'demo-job-001',
  status: 'completed',
  image_url: MOCK_IMAGE_URL,
  scene_description: MOCK_SCENE_DESCRIPTION,
  hazards: MOCK_HAZARDS,
  overall_safety_score: 42,
  report_pdf_url: '#demo-report-pdf',
  regulations: [
    {
      hazard_category: 'UNAUTHORIZED_ZONE',
      query: 'emergency exit blocked clearance regulation workplace safety',
      results: [
        {
          title: 'vyhl. 246/2001 Sb. § 18 — Emergency exit clearance (Czech)',
          url: 'https://www.zakonyprolidi.cz/cs/2001-246',
          content: 'Emergency exits must maintain a minimum clear width of 0.8m at all times. No obstacles may be placed in the exit pathway.',
          score: 0.98,
        },
      ],
    },
    {
      hazard_category: 'FIRE_SMOKE',
      query: 'fire safety regulation combustible materials near heat source workplace',
      results: [
        {
          title: 'vyhl. 246/2001 Sb. § 12 — Fire prevention (Czech)',
          url: 'https://www.zakonyprolidi.cz/cs/2001-246',
          content: 'Combustible materials must be stored at a safe distance from heat sources. Minimum distance of 1.5m required.',
          score: 0.97,
        },
      ],
    },
  ],
  created_at: new Date(Date.now() - 60_000).toISOString(),
  completed_at: new Date().toISOString(),
}
