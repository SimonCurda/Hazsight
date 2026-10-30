import type { JobResult, TraceEvent } from './mock-data'

/**
 * Pre-saved analysis results from a REAL VLM scan of a Gemini-generated
 * warehouse image. This is the result Nemotron 3.5 Super VL actually returned
 * — including REAL bounding box coordinates (the first time the VLM returned
 * them correctly!).
 *
 * Used by the "Load saved results 2" button so users can see bounding boxes
 * in action without spending API credits.
 *
 * Image: /public/demo-warehouse-2.jpg (Gemini_Generated_Image)
 * Model: nvidia/Nemotron-3.5-Super-VL on Nebius Token Factory
 */
function buildSeedResults2(): JobResult {
  const now = Date.now()
  return {
  job_id: 'seed-demo-002',
  status: 'completed',
  image_url: '/demo-warehouse-2.jpg',
  scene_description:
    'A large warehouse interior with high pallet racking stacked with cardboard boxes. The floor is concrete with yellow markings. Three workers are visible: two operating orange forklifts and one walking with a manual pallet jack in the central aisle. Overhead LED lighting illuminates the space. A mezzanine level with glass railings is visible on the right. Safety signs are posted on the racking columns.',
  overall_safety_score: 65,
  report_pdf_url: null,
  tavily_live: true,
  created_at: new Date(now - 45_000).toISOString(),
  completed_at: new Date(now).toISOString(),
  hazards: [
    {
      id: 'h2-1',
      category: 'MACHINERY_PROXIMITY',
      severity: 'HIGH',
      description:
        'A worker operating a manual pallet jack is walking in the main travel aisle where powered forklifts are actively operating, creating a significant risk of collision between the pedestrian and the vehicles.',
      affected_area:
        'Central warehouse aisle where the worker with the pallet jack and the forklift on the left are located.',
      recommendation:
        'Implement segregated pedestrian walkways or enforce strict right-of-way rules ensuring pedestrians stay clear of forklift travel paths.',
      confidence: 0.92,
      // Real bounding box from Nemotron 3.5 Super VL — covers the central
      // aisle collision zone (worker + nearby forklift)
      bounding_box: { x: 38, y: 50, width: 42, height: 40 },
    },
    {
      id: 'h2-2',
      category: 'PPE_VIOLATION',
      severity: 'MEDIUM',
      description:
        'The worker walking with the manual pallet jack in the center aisle appears to be missing a protective hard hat, exposing them to potential head injury from falling objects or impacts.',
      affected_area: 'Worker with pallet jack in the center aisle.',
      recommendation:
        'Require all personnel in the warehouse to wear approved hard hats at all times.',
      confidence: 0.75,
      // Real bounding box from Nemotron — tightly covers the worker
      bounding_box: { x: 54, y: 55, width: 12, height: 22 },
    },
  ],
  regulations: [
    {
      hazard_category: 'MACHINERY_PROXIMITY',
      query:
        'machinery safety distance regulation workplace proximity hazard zone Česká republika vyhláška 246/2001 Sb. zákoník práce 262/2006 Sb. BOZP požární bezpečnost pracoviště',
      jurisdiction: 'CZECH',
      results: [
        {
          title: '246/2001 Sb. Vyhláška o požární prevenci',
          url: 'https://www.zakonyprolidi.cz/cs/2001-246',
          content:
            '§ 13 — Provozní zařízení a pracoviště musí být uspořádána tak, aby neohrožovala bezpečnost osob při evakuaci a záchranných pracích. Průchodné komunikace a únikové cesty musí být trvale volné a musí jimi být možno bezpečně projít.',
          score: 0.37,
        },
        {
          title: 'Zákoník práce 262/2006 Sb. § 101 — Bezpečnost a ochrana zdraví při práci',
          url: 'https://www.zakonyprolidi.cz/cs/2006-262',
          content:
            'Zaměstnavatel je povinen organizovat práce a pracoviště tak, aby práce mohla být vykonávána bezpečně a zaměstnanci mohli dodržovat pravidla bezpečnosti a ochrany zdraví při práci. Pracoviště musí být vybavena ochrannými a bezpečnostními zařízeními.',
          score: 0.48,
        },
      ],
    },
    {
      hazard_category: 'PPE_VIOLATION',
      query:
        'workplace PPE safety regulation requirements helmet vest goggles harness Česká republika vyhláška 246/2001 Sb. zákoník práce 262/2006 Sb. BOZP požární bezpečnost pracoviště',
      jurisdiction: 'CZECH',
      results: [
        {
          title: 'Vyhláška 246/2001 Sb. — Požární prevence',
          url: 'https://www.zakonyprolidi.cz/cs/2001-246',
          content:
            '§ 18 — Osoby pohybující se v pracovištích s zvýšeným nebezpečím musí být vybaveny osobními ochrannými pracovními prostředky. Ochranné pomůcky (přilby, vesty, brýle) musí být nošeny v souladu s charakterem vykonávané práce.',
          score: 0.52,
        },
        {
          title: 'Nařízení vlády 495/2001 Sb. — OOPP',
          url: 'https://www.zakonyprolidi.cz/cs/2001-495',
          content:
            'Zaměstnavatel je povinen stanovit a vyhodnotit míra rizika, poskytnout zaměstnanci osobní ochranné pracovní prostředky (OOPP) a zajistit, aby zaměstnanec stanovené OOPP při práci používal. Přilba je povinná v prostředí s rizikem pádu předmětů.',
          score: 0.50,
        },
      ],
    },
  ],
}
}

/** Lazily-built seed results 2 — computed fresh on each call (client-side only)
 * to avoid SSR hydration mismatches from Date.now(). */
export function getSeedResults2(): JobResult {
  return buildSeedResults2()
}

// Pre-built trace events for the second seed — simulates the real VLM + Tavily flow
const SEED2_EVENT_DEFS = [
  {
    type: 'plan' as const,
    model: 'Nemotron 3 Ultra',
    content:
      'Analyzing warehouse scene. Plan: (1) scene understanding, (2) hazard identification with bounding boxes, (3) severity assessment, (4) regulatory cross-reference (Czech jurisdiction), (5) recommendation synthesis.',
  },
  {
    type: 'vlm_analyze' as const,
    model: 'Nvidia/Nemotron-3.5-Super-VL',
    content: 'Scene understanding + hazard identification with spatial localization starting...',
  },
  {
    type: 'vlm_detect' as const,
    model: 'Nvidia/Nemotron-3.5-Super-VL',
    content:
      'Hazard detected: MACHINERY_PROXIMITY — HIGH — Worker with pallet jack in forklift travel aisle (bounding box: x=38%, y=50%, w=42%, h=40%)',
  },
  {
    type: 'vlm_detect' as const,
    model: 'Nvidia/Nemotron-3.5-Super-VL',
    content:
      'Hazard detected: PPE_VIOLATION — MEDIUM — Worker missing hard hat (bounding box: x=54%, y=55%, w=12%, h=22%)',
  },
  {
    type: 'tavily_search' as const,
    model: 'Tavily Live Search',
    content:
      'Searching Czech safety regulations via Tavily API (include_domains: zakonyprolidi.cz, suib.cz, mpsv.cz)...',
  },
  {
    type: 'tavily_search' as const,
    model: 'Tavily Live Search',
    content:
      'Found: Vyhláška 246/2001 Sb. + Zákoník práce 262/2006 Sb. (2 citations for MACHINERY_PROXIMITY)',
  },
  {
    type: 'tavily_search' as const,
    model: 'Tavily Live Search',
    content:
      'Found: Vyhláška 246/2001 Sb. § 18 + Nařízení vlády 495/2001 Sb. (2 citations for PPE_VIOLATION)',
  },
  {
    type: 'synthesize' as const,
    model: 'Nvidia/Nemotron-3-Ultra-550b-a55b',
    content:
      'Synthesizing report: 2 hazards identified with real bounding boxes. Overall safety score = 65/100 (MODERATE RISK).',
  },
  {
    type: 'report_ready' as const,
    model: 'PDF Generator',
    content:
      'Safety audit report generated. 2 findings with bounding box overlays. 4 regulation citations. Download ready.',
  },
]

/** Lazily-built trace events for seed 2 — computed fresh on each call (client-side only). */
export function getSeedEvents2(): TraceEvent[] {
  const now = Date.now()
  return SEED2_EVENT_DEFS.map((e, i) => ({ ...e, timestamp: now - (12 - i) * 1000 }))
}
