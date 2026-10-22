'use client'

import * as React from 'react'

/**
 * BackgroundCode — animated code snippets floating behind the app.
 *
 * Features:
 * - Real pieces of the Hazsight codebase (TypeScript + Python) as background text
 * - Per-character spans: each letter lifts + glows green on hover
 * - Subtle pulse when not hovered (desktop) or always-on (mobile, no hover)
 * - Slow horizontal drift (barely perceptible)
 * - Respects prefers-reduced-motion
 *
 * Not distracting — opacity 0.18-0.28 on desktop, 0.22-0.38 on mobile.
 */

interface Snippet {
  code: string
  position: {
    top?: string
    left?: string
    right?: string
    bottom?: string
  }
  size: 'xs' | 'sm' | 'md'
  rotation?: number
}

const SNIPPETS: Snippet[] = [
  {
    code: `const vlm = await analyzeImageWithVlm(imageBase64, 'image/png')`,
    position: { top: '6%', left: '3%' },
    size: 'xs',
    rotation: -1,
  },
  {
    code: `> nebius.tokenfactory.nebius.com/v1/`,
    position: { top: '10%', right: '5%' },
    size: 'sm',
    rotation: 1,
  },
  {
    code: `model: "nvidia/nemotron-3-ultra"`,
    position: { top: '18%', left: '6%' },
    size: 'xs',
    rotation: -0.5,
  },
  {
    code: `// detecting hazards...`,
    position: { top: '22%', right: '8%' },
    size: 'sm',
    rotation: 0.5,
  },
  {
    code: `// compliance: runs_on_nebius_token_factory`,
    position: { top: '14%', left: '38%' },
    size: 'xs',
    rotation: 0,
  },
  {
    code: `class HazardCategory(str, Enum): ...`,
    position: { top: '28%', left: '40%' },
    size: 'xs',
    rotation: 0,
  },
  {
    code: `hazards: List[DetectedHazard] = Field(default_factory=list)`,
    position: { top: '34%', left: '4%' },
    size: 'xs',
    rotation: -1.5,
  },
  {
    code: `severity: RiskSeverity  # LOW | MEDIUM | HIGH | CRITICAL`,
    position: { top: '40%', right: '6%' },
    size: 'xs',
    rotation: 1.5,
  },
  {
    code: `class SceneAnalysisResponse(BaseModel):`,
    position: { top: '46%', left: '36%' },
    size: 'xs',
    rotation: 0,
  },
  {
    code: `overall_safety_score: int = Field(ge=0, le=100)`,
    position: { top: '52%', left: '8%' },
    size: 'xs',
    rotation: -1,
  },
  {
    code: `bounding_box: { x, y, width, height }  # percentages 0-100`,
    position: { top: '58%', right: '4%' },
    size: 'xs',
    rotation: 1,
  },
  {
    code: `> /api/analyze  POST  image -> nebius_vlm -> nemotron_ultra`,
    position: { top: '64%', left: '5%' },
    size: 'sm',
    rotation: -0.5,
  },
  {
    code: `for (const hazard of parsed.hazards) { appendTraceEvent(...) }`,
    position: { top: '70%', right: '6%' },
    size: 'xs',
    rotation: 1,
  },
  {
    code: `> /api/jobs/[id]/trace  GET  ?since=<timestamp>`,
    position: { top: '76%', left: '7%' },
    size: 'xs',
    rotation: -1,
  },
  {
    code: `client = OpenAI({ baseURL: 'https://api.tokenfactory.nebius.com/v1/' })`,
    position: { top: '82%', right: '5%' },
    size: 'xs',
    rotation: 0.5,
  },
  {
    code: `// trace events emit as API calls progress`,
    position: { top: '88%', left: '4%' },
    size: 'sm',
    rotation: -0.5,
  },
  {
    code: `NEBIUS_API_KEY = os.environ.get('NEBIUS_API_KEY')`,
    position: { top: '92%', right: '8%' },
    size: 'xs',
    rotation: 1,
  },
  {
    code: `> best_apps_and_agents_track`,
    position: { top: '4%', left: '45%' },
    size: 'sm',
    rotation: 0,
  },
  {
    code: `appendTraceEvent(jobId, { type: 'vlm_detect', model: 'Llama 3.2 Vision' })`,
    position: { top: '44%', right: '8%' },
    size: 'xs',
    rotation: 1.5,
  },
  {
    code: `// graceful fallback if NEBIUS_API_KEY not set`,
    position: { top: '68%', left: '38%' },
    size: 'xs',
    rotation: 0,
  },
  {
    code: `response.choices[0].message.content`,
    position: { top: '24%', right: '38%' },
    size: 'xs',
    rotation: -0.5,
  },
  {
    code: `> npm_open_source_models_on_nebius`,
    position: { top: '84%', left: '40%' },
    size: 'sm',
    rotation: 0.5,
  },
]

const SIZE_CLASSES: Record<Snippet['size'], string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
}

function CharSpan({ char, idx }: { char: string; idx: number }) {
  // Preserve whitespace
  if (char === ' ') return <span className="bg-code-char"> </span>
  if (char === '\n') return <br />
  return (
    <span
      className="bg-code-char"
      style={{ animationDelay: `${idx * 0.02}s` }}
    >
      {char}
    </span>
  )
}

export function BackgroundCode() {
  return (
    <div
      className="pointer-events-auto fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
      style={{ zIndex: -10 }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 hazsight-grid-bg opacity-30" />

      {/* Ambient green gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.78 0.17 125 / 0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, oklch(0.78 0.17 125 / 0.04) 0%, transparent 70%)',
        }}
      />

      {/* Code snippets */}
      {SNIPPETS.map((snippet, idx) => (
        <div
          key={idx}
          className="bg-code-snippet absolute hazsight-readout text-emerald-500/40 font-medium whitespace-nowrap"
          style={{
            ...snippet.position,
            transform: `rotate(${snippet.rotation || 0}deg)`,
            animationDelay: `${idx * 0.7}s`,
          }}
        >
          <span className={SIZE_CLASSES[snippet.size]}>
            {snippet.code.split('').map((char, ci) => (
              <CharSpan key={ci} char={char} idx={ci} />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
