import type { JobResult, TraceEvent } from './mock-data'

/**
 * Pre-saved analysis results from a real VLM scan.
 * Used by the "Load saved results" button so users can test the chatbot,
 * PDF generation, and other features without running the API (saves credits).
 *
 * Note: This seed has bounding_box = {0,0,0,0} for all hazards (the VLM run
 * that produced it didn't return spatial coords). For a seed WITH real
 * bounding boxes, see seed-data-2.ts (warehouse scene with collision/PPE).
 */
function buildSeedResults(): JobResult {
  const now = Date.now()
  return {
  job_id: 'seed-demo-001',
  status: 'completed',
  image_url: '/demo-warehouse.png',
  scene_description: 'A cluttered industrial workshop or warehouse space. On the left, there are stacks of cardboard boxes and wooden pallets near an exit door. In the center, metal shelving holds various chemical containers and buckets. A white space heater sits on the floor next to red gasoline cans and aerosol sprays. Orange extension cords snake across the concrete floor. On the right, a worker wearing a welding helmet and gloves is actively welding, producing bright sparks near large orange compressed gas cylinders.',
  overall_safety_score: 35,
  report_pdf_url: null,
  tavily_live: true,
  created_at: new Date(now - 60_000).toISOString(),
  completed_at: new Date(now).toISOString(),
  hazards: [
    {
      id: 'h-1',
      category: 'FIRE_SMOKE',
      severity: 'HIGH',
      description: 'A worker is actively welding, generating bright sparks in close proximity to large orange compressed gas cylinders and red fuel containers, creating a significant ignition risk.',
      affected_area: 'Right side welding station and adjacent gas cylinder storage area',
      recommendation: 'Immediately clear all flammable materials and gas cylinders from the hot work zone, use a welding screen, and assign a dedicated fire watch.',
      confidence: 0.95,
      bounding_box: { x: 60, y: 35, width: 35, height: 45 },
      fire_origin_point: { x: 75, y: 55 },
      fire_severity_level: 'active',
      fire_cause: 'Sparks from welding operation near compressed gas cylinders and red fuel containers — ignition risk from hot work without proper clearance',
      fire_detected_at: new Date(now - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'h-2',
      category: 'FIRE_SMOKE',
      severity: 'HIGH',
      description: 'Red gasoline jerry cans and aerosol cans are stored directly adjacent to an electric space heater, posing a severe fire risk if the heater malfunctions or tips over.',
      affected_area: 'Center floor area next to the white space heater',
      recommendation: 'Relocate all flammable liquids and aerosols to an approved storage cabinet away from heat sources and electrical equipment.',
      confidence: 0.95,
      bounding_box: { x: 30, y: 55, width: 25, height: 25 },
      fire_origin_point: { x: 42, y: 65 },
      fire_severity_level: 'active',
      fire_cause: 'Gasoline cans and aerosols stored directly next to electric space heater — potential ignition from heater malfunction or tip-over',
      fire_detected_at: new Date(now - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'h-3',
      category: 'SLIP_TRIP_FALL',
      severity: 'MEDIUM',
      description: 'Multiple orange extension cords are strewn across the concrete floor in walking areas, creating significant trip hazards for personnel moving through the workspace.',
      affected_area: 'Floor space in the center and foreground of the room',
      recommendation: 'Secure extension cords to the floor or route them overhead to keep walkways clear and prevent tripping incidents.',
      confidence: 0.90,
      bounding_box: { x: 20, y: 80, width: 55, height: 12 },
    },
    {
      id: 'h-4',
      category: 'OTHER',
      severity: 'MEDIUM',
      description: 'Large stacks of cardboard boxes and wooden pallets are haphazardly stored near the exit door and throughout the workspace, potentially obstructing egress and creating falling object hazards.',
      affected_area: 'Left side of the room near the exit door and back wall',
      recommendation: 'Organize storage materials, clear the exit path, and stack items securely to prevent collapse or blockage of emergency exits.',
      confidence: 0.85,
      bounding_box: { x: 2, y: 30, width: 22, height: 50 },
    },
  ],
  regulations: [
    {
      hazard_category: 'FIRE_SMOKE',
      query: 'fire safety regulation combustible materials near heat source workplace Australia safety regulation law',
      jurisdiction: 'Australia',
      results: [
        {
          title: 'Hot Works Fire Watch Requirements Australia: AS 1674.1 Guide (2026)',
          url: 'https://f7i.ai',
          content: 'Pre-Work Inspection: The Fire Watch must verify that all combustible materials within 15 meters of the hot work have been removed or covered with non-combustible blankets. They must also inspect adjacent rooms or floors if heat transfer through walls or metal structures is a risk.',
          score: 0.86,
        },
        {
          title: 'OSHA Hot Work Requirements: A 2026 Guide to Compliance and Safety Standards',
          url: 'https://petrohab.com',
          content: 'The 35-foot rule, established under 29 CFR 1910.252, mandates that all combustible materials be removed from a 35-foot radius of the hot work site. If removal is impossible, you must protect these items with flameproofed covers or non-combustible guards.',
          score: 0.74,
        },
        {
          title: 'Controlling fire and explosion risks | WorkSafe.qld.gov.au',
          url: 'https://www.worksafe.qld.gov.au',
          content: 'The Electrical Safety Regulation 2026 also includes requirements for connecting or reconnecting electrical installations/equipment in hazardous areas to a source of electricity.',
          score: 0.68,
        },
      ],
    },
    {
      hazard_category: 'SLIP_TRIP_FALL',
      query: 'workplace slip trip fall hazard regulation floor cables obstacles Australia safety regulation law',
      jurisdiction: 'Australia',
      results: [
        {
          title: 'NEW SAFEWORK AUSTRALIA GUIDANCE – SLIPS TRIPS AND FALLS - OHS Reps',
          url: 'https://www.ohsrep.org.au',
          content: 'According to the Safe Work Australia Key Work Health and Safety Statistics reports for 2025, 32,000 workers compensation claims were made in the 2024-2025 period for serious injuries arising from slips, trips and falls.',
          score: 0.68,
        },
        {
          title: 'Slips, Trips & Falls: OSHA Prevention Guide (2026) | OSHA Workplace Safety',
          url: 'https://www.oshaworkplacesafety.com',
          content: 'Trip A trip occurs when a workers foot catches or strikes an object unexpectedly, disrupting their forward momentum. Common triggers include cords across walkways, uneven floor surfaces, open drawers, and debris in aisles.',
          score: 0.65,
        },
        {
          title: 'Slips, trips and falls | Safe Work Australia',
          url: 'https://www.safeworkaustralia.gov.au',
          content: 'musculoskeletal injuries (injuries to muscles, nerves, tendons, joints, cartilage and spinal discs) cuts bruises fractures dislocations. More serious injuries and deaths can also happen.',
          score: 0.63,
        },
      ],
    },
    {
      hazard_category: 'OTHER',
      query: 'general workplace safety regulation occupational health safety Australia safety regulation law',
      jurisdiction: 'Australia',
      results: [
        {
          title: 'The Importance of OSHA Regulations for Wooden Pallets',
          url: 'https://www.bluerosepackaging.com',
          content: 'Ensure safety with OSHA regulations for wooden pallets. Learn best practices for handling and storage to protect your workers.',
          score: 0.36,
        },
        {
          title: '[PDF] Safe Stacking and Storage',
          url: 'https://cdn.auckland.ac.nz',
          content: 'Such steps should ensure these items cannot, whether of their own accord, or by virtue of any external force, flow, move, roll, or collapse, as to constitute a danger to persons in their vicinity.',
          score: 0.34,
        },
        {
          title: 'Material Stacking Safety Policy',
          url: 'https://ohsinsider.com',
          content: 'Stacks must not be located where any part of the stack will be within 1.5 m of a rail track. This clearance must be maintained all the way along the stack.',
          score: 0.08,
        },
      ],
    },
  ],
}
}

/** Lazily-built seed results — computed fresh on each call (client-side only)
 * to avoid SSR hydration mismatches from Date.now(). */
export function getSeedResults(): JobResult {
  return buildSeedResults()
}

// Pre-built trace events for the seed results
const SEED_EVENT_DEFS = [
  { type: 'plan' as const, model: 'Nemotron 3 Ultra', content: 'Analyzing image for occupational safety hazards. Plan: (1) scene understanding, (2) hazard identification, (3) severity assessment, (4) regulatory cross-reference, (5) recommendation synthesis.' },
  { type: 'vlm_analyze' as const, model: 'Nvidia/Nemotron-3.5-Super-VL', content: 'Scene understanding + hazard identification starting...' },
  { type: 'vlm_detect' as const, model: 'Nvidia/Nemotron-3.5-Super-VL', content: 'VLM returned scene analysis (3161 chars). Parsing hazards...' },
  { type: 'vlm_detect' as const, model: 'Nvidia/Nemotron-3.5-Super-VL', content: 'Hazard detected: FIRE_SMOKE — HIGH — Active welding operations generating bright sparks near gas cylinders' },
  { type: 'vlm_detect' as const, model: 'Nvidia/Nemotron-3.5-Super-VL', content: 'Hazard detected: FIRE_SMOKE — HIGH — Gasoline cans and aerosols stored next to space heater' },
  { type: 'vlm_detect' as const, model: 'Nvidia/Nemotron-3.5-Super-VL', content: 'Hazard detected: SLIP_TRIP_FALL — MEDIUM — Extension cords strewn across floor' },
  { type: 'vlm_detect' as const, model: 'Nvidia/Nemotron-3.5-Super-VL', content: 'Hazard detected: OTHER — MEDIUM — Cardboard boxes and pallets near exit door' },
  { type: 'tavily_search' as const, model: 'Tavily Live Search', content: 'Searching Australia safety regulations via Tavily API...' },
  { type: 'tavily_search' as const, model: 'Tavily Live Search', content: 'Found: Hot Works Fire Watch Requirements Australia: AS 1674.1 (3 citations for FIRE_SMOKE)' },
  { type: 'tavily_search' as const, model: 'Tavily Live Search', content: 'Found: NEW SAFEWORK AUSTRALIA GUIDANCE (3 citations for SLIP_TRIP_FALL)' },
  { type: 'tavily_search' as const, model: 'Tavily Live Search', content: 'Found: OSHA Regulations for Wooden Pallets (3 citations for OTHER)' },
  { type: 'synthesize' as const, model: 'Nvidia/Nemotron-3-Ultra-550b-a55b', content: 'Synthesizing report: 4 hazards identified, overall safety score = 35/100.' },
  { type: 'report_ready' as const, model: 'PDF Generator', content: 'Safety audit report generated. 4 findings. 3 regulation citations. Download ready.' },
]

/** Lazily-built trace events — computed fresh on each call (client-side only). */
export function getSeedEvents(): TraceEvent[] {
  const now = Date.now()
  return SEED_EVENT_DEFS.map((e, i) => ({ ...e, timestamp: now - (15 - i) * 1000 }))
}
