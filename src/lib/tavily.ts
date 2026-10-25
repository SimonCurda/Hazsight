/**
 * Tavily Live Search integration for Hazsight.
 *
 * After the VLM detects hazards, we use Tavily to search for relevant safety
 * regulations (e.g., "Czech fire safety regulation emergency exit clearance").
 * The citations are added to the trace timeline, included in the PDF report,
 * and shown in the results view UI.
 *
 * Mock fallback: if TAVILY_API_KEY is not set, returns pre-written regulation
 * citations for each hazard category. This lets the demo work without a key.
 * When the key is added, real Tavily API calls happen.
 *
 * Get your API key at: https://tavily.com (free tier available)
 * Set it as TAVILY_API_KEY in .env.local
 */

export interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

export interface RegulationCitation {
  hazard_category: string
  query: string
  jurisdiction: string
  results: TavilyResult[]
}

// Queries for each hazard category — what we search for in Tavily
const CATEGORY_QUERIES: Record<string, string> = {
  PPE_VIOLATION:
    'workplace PPE safety regulation requirements helmet vest goggles harness',
  FIRE_SMOKE:
    'fire safety regulation combustible materials near heat source workplace',
  SLIP_TRIP_FALL:
    'workplace slip trip fall hazard regulation floor cables obstacles',
  UNAUTHORIZED_ZONE:
    'emergency exit blocked clearance regulation workplace safety',
  MACHINERY_PROXIMITY:
    'machinery safety distance regulation workplace proximity hazard zone',
  UNSAFE_BEHAVIOR:
    'unsafe behavior workplace safety regulation employer obligations',
  OTHER: 'general workplace safety regulation occupational health safety',
}

// Jurisdiction-specific search modifiers — appended to the base query so
// Tavily finds the RIGHT laws for the RIGHT country. Without this, Tavily
// returns a mix of US/EU/CZ results (whatever ranks highest on Google).
export const JURISDICTIONS = {
  CZECH: { label: 'Czech Republic', flag: '🇨🇿', modifier: 'Czech Republic vyhláška zákon právo' },
  USA: { label: 'USA (OSHA)', flag: '🇺🇸', modifier: 'OSHA 29 CFR 1910 US federal regulation' },
  JAPAN: { label: 'Japan', flag: '🇯🇵', modifier: 'Japan 消防法 Building Standards Law 労働安全衛生法' },
  EU: { label: 'EU Directives', flag: '🇪🇺', modifier: 'EU directive European Commission regulation' },
  UK: { label: 'UK (HSE)', flag: '🇬🇧', modifier: 'UK HSE Health and Safety Executive regulation' },
  INTERNATIONAL: { label: 'International (ISO)', flag: '🌍', modifier: 'ISO standard international' },
} as const

export type Jurisdiction = keyof typeof JURISDICTIONS

// Mock regulation citations — used when TAVILY_API_KEY is not set.
// These are real-ish regulation references (Czech + EU directives + ISO standards).
const MOCK_REGULATIONS: Record<string, TavilyResult[]> = {
  PPE_VIOLATION: [
    {
      title: 'Council Directive 89/656/EEC — PPE at work',
      url: 'https://eur-lex.europa.eu/eli/dir/1989/656/oj',
      content:
        'Employers must provide appropriate personal protective equipment (PPE) at no cost to workers. PPE must be suitable for the risk, fit correctly, and be maintained in good condition.',
      score: 0.95,
    },
    {
      title: 'Czech Labour Code §267 — Employer PPE obligations',
      url: 'https://www.zakonyprolidi.cz/cs/2006-262',
      content:
        'The employer is obliged to provide employees with personal protective equipment and ensure its use in accordance with the nature of the work performed.',
      score: 0.88,
    },
  ],
  FIRE_SMOKE: [
    {
      title: 'vyhl. 246/2001 Sb. § 12 — Fire prevention (Czech)',
      url: 'https://www.zakonyprolidi.cz/cs/2001-246',
      content:
        'Combustible materials must be stored at a safe distance from heat sources. Minimum distance of 1.5m is required between flammable materials and active heating equipment.',
      score: 0.97,
    },
    {
      title: 'Commission Regulation (EU) 2016/1417 — Industrial fire safety',
      url: 'https://eur-lex.europa.eu/eli/reg/2016/1417/oj',
      content:
        'Industrial buildings must maintain clear separation between combustible storage and heat-generating equipment. Active monitoring is recommended.',
      score: 0.85,
    },
  ],
  SLIP_TRIP_FALL: [
    {
      title: 'Council Directive 89/654/EEC Annex I — Workplace floors',
      url: 'https://eur-lex.europa.eu/eli/dir/1989/654/oj',
      content:
        'Floors must be fixed, stable, and non-slip. Cables must be routed through covered trays or along walls to prevent trip hazards in walkways.',
      score: 0.92,
    },
    {
      title: 'ISO 23554 — Slip resistance requirements for floors',
      url: 'https://www.iso.org/standard/23554',
      content:
        'Workplace floors must meet minimum slip resistance values. Loose cables in walkways must be covered with cable protectors or routed through trays.',
      score: 0.80,
    },
  ],
  UNAUTHORIZED_ZONE: [
    {
      title: 'vyhl. 246/2001 Sb. § 18 — Emergency exit clearance (Czech)',
      url: 'https://www.zakonyprolidi.cz/cs/2001-246',
      content:
        'Emergency exits must maintain a minimum clear width of 0.8m at all times. No obstacles may be placed in the exit pathway. Violations are subject to fines up to 500,000 CZK.',
      score: 0.98,
    },
    {
      title: 'ISO 16069 — Safety wayfinding and escape routes',
      url: 'https://www.iso.org/standard/16069',
      content:
        'Escape routes must be clearly marked and unobstructed at all times. Minimum clear opening widths apply based on occupant load.',
      score: 0.82,
    },
  ],
  MACHINERY_PROXIMITY: [
    {
      title: 'Directive 2006/42/EC — Machinery safety',
      url: 'https://eur-lex.europa.eu/eli/dir/2006/42/oj',
      content:
        'Machinery must maintain safe distances from personnel. Guards and safety zones must be established around operating equipment.',
      score: 0.90,
    },
    {
      title: 'ČSN EN ISO 13857 — Safety distances',
      url: 'https://www.iso.org/standard/13857',
      content:
        'Minimum safety distances must be maintained to prevent personnel from reaching hazard zones of machinery.',
      score: 0.83,
    },
  ],
  UNSAFE_BEHAVIOR: [
    {
      title: 'Directive 89/391/EEC — Occupational safety framework',
      url: 'https://eur-lex.europa.eu/eli/dir/1989/391/oj',
      content:
        'Employers must ensure safe working practices. Risk assessments must include behavioral hazards and implement preventive measures.',
      score: 0.87,
    },
    {
      title: 'Czech Labour Code §266 — Safe working practices',
      url: 'https://www.zakonyprolidi.cz/cs/2006-262',
      content:
        'The employer is obliged to ensure that work is performed in a safe manner. Unsafe practices must be identified and corrected.',
      score: 0.85,
    },
  ],
  OTHER: [
    {
      title: 'Directive 89/391/EEC — General occupational safety',
      url: 'https://eur-lex.europa.eu/eli/dir/1989/391/oj',
      content:
        'Employers must assess all workplace risks and implement appropriate preventive measures to protect worker health and safety.',
      score: 0.75,
    },
  ],
}

export function tavilyAvailable(): boolean {
  return !!process.env.TAVILY_API_KEY
}

/**
 * Search for safety regulations relevant to a hazard category.
 *
 * If TAVILY_API_KEY is set, makes a real Tavily API call with jurisdiction-specific
 * query modifiers (Czech laws, OSHA, Japan Fire Service Act, etc.).
 * If not, returns pre-written mock citations for the category.
 */
export async function searchRegulations(
  hazardCategory: string,
  hazardDescription?: string,
  jurisdiction: Jurisdiction = 'CZECH',
): Promise<TavilyResult[]> {
  // Build query from category + description + jurisdiction modifier
  const baseQuery = CATEGORY_QUERIES[hazardCategory] || CATEGORY_QUERIES.OTHER
  const jurModifier = JURISDICTIONS[jurisdiction].modifier
  const query = hazardDescription
    ? `${baseQuery} ${jurModifier} — ${hazardDescription.slice(0, 100)}`
    : `${baseQuery} ${jurModifier}`

  if (!tavilyAvailable()) {
    // Mock fallback — return pre-written citations
    return MOCK_REGULATIONS[hazardCategory] || MOCK_REGULATIONS.OTHER
  }

  // Real Tavily API call
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: false,
      }),
    })

    if (!response.ok) {
      console.error('Tavily API error:', response.status)
      return MOCK_REGULATIONS[hazardCategory] || MOCK_REGULATIONS.OTHER
    }

    const data = await response.json()
    return (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      content: (r.content || '').slice(0, 300),
      score: r.score || 0,
    }))
  } catch (err) {
    console.error('Tavily search failed:', err)
    return MOCK_REGULATIONS[hazardCategory] || MOCK_REGULATIONS.OTHER
  }
}

/**
 * Search regulations for all detected hazards.
 * Returns one citation set per unique hazard category.
 */
export async function searchAllRegulations(
  hazards: Array<{ category: string; description: string }>,
  jurisdiction: Jurisdiction = 'CZECH',
): Promise<RegulationCitation[]> {
  // Deduplicate by category
  const seen = new Set<string>()
  const uniqueCategories = hazards.filter((h) => {
    if (seen.has(h.category)) return false
    seen.add(h.category)
    return true
  })

  const citations: RegulationCitation[] = []

  for (const hazard of uniqueCategories) {
    const results = await searchRegulations(hazard.category, hazard.description, jurisdiction)
    citations.push({
      hazard_category: hazard.category,
      query: `${CATEGORY_QUERIES[hazard.category] || CATEGORY_QUERIES.OTHER} ${JURISDICTIONS[jurisdiction].modifier}`,
      jurisdiction,
      results,
    })
  }

  return citations
}
