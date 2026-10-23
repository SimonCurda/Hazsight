'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Download, RotateCcw, ShieldAlert, FileText, Brain, ChevronDown, Keyboard, Gavel, ExternalLink, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AnnotatedImage } from './annotated-image'
import { RiskList } from './risk-list'
import { TraceTimeline } from './trace-timeline'
import { SEVERITY_ORDER } from './risk-list'
import { HAZARD_CATEGORY_LABELS } from '@/lib/types'
import type { JobResult, TraceEvent } from '@/lib/mock-data'

interface ResultsViewProps {
  result: JobResult
  events: TraceEvent[]
  onReset: () => void
}

export function ResultsView({ result, events, onReset }: ResultsViewProps) {
  const [selectedHazardId, setSelectedHazardId] = React.useState<string | null>(null)
  const [traceOpen, setTraceOpen] = React.useState(false)
  const [regsOpen, setRegsOpen] = React.useState(false)
  const [hintVisible, setHintVisible] = React.useState(true)

  const handleHazardClick = (id: string) => {
    setSelectedHazardId((prev) => (prev === id ? null : id))
  }

  // Sorted hazards (same ordering as RiskList uses) for keyboard shortcut indexing
  const sortedHazards = React.useMemo(
    () => [...result.hazards].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [result.hazards],
  )

  // Keyboard shortcuts: Esc → reset, 1-9 → select hazard by index
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'Escape') {
        e.preventDefault()
        onReset()
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1
        const hazard = sortedHazards[idx]
        if (hazard) {
          e.preventDefault()
          handleHazardClick(hazard.id)
          setHintVisible(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sortedHazards, onReset])

  // Whether Tavily ran live (real API call) or in mock mode (pre-written citations).
  // Set server-side in the job result based on whether TAVILY_API_KEY was set.
  const tavilyLive = result.tavily_live
  const regulations = result.regulations || []
  const totalCitations = regulations.reduce((sum, r) => sum + r.results.length, 0)

  const safetyScore = result.overall_safety_score
  // Traffic-light semantics: red = danger, amber = caution, emerald = safe
  const scoreColor =
    safetyScore < 50
      ? 'text-red-600 dark:text-red-400'
      : safetyScore < 75
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400'
  const scoreBarColor =
    safetyScore < 50
      ? 'bg-red-500'
      : safetyScore < 75
        ? 'bg-amber-500'
        : 'bg-emerald-500'
  const scoreBarGlow =
    safetyScore < 50
      ? 'shadow-[0_0_12px_rgba(239,68,68,0.6)]'
      : safetyScore < 75
        ? 'shadow-[0_0_12px_rgba(245,158,11,0.5)]'
        : 'shadow-[0_0_12px_rgba(16,185,129,0.5)]'
  const riskLevel =
    safetyScore < 50
      ? { label: 'HIGH RISK', color: 'text-red-600 dark:text-red-400' }
      : safetyScore < 75
        ? { label: 'MODERATE RISK', color: 'text-amber-600 dark:text-amber-400' }
        : { label: 'LOW RISK', color: 'text-emerald-600 dark:text-emerald-400' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Summary card */}
      <Card className="hazsight-glass bg-card/70 border-border/40 shadow-lg shadow-black/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="font-mono">Safety Audit Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated in ~30 seconds by Nemotron 3 Ultra on Nebius Token Factory
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Overall Safety Score
              </div>
              <div className={`font-mono text-3xl font-bold ${scoreColor}`}>
                {safetyScore}
                <span className="text-base text-muted-foreground">/100</span>
              </div>
              <div className={`mt-0.5 text-xs font-semibold uppercase tracking-wide ${riskLevel.color}`}>
                {riskLevel.label}
              </div>
              <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${safetyScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${scoreBarColor} ${scoreBarGlow}`}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ShieldAlert className="h-3 w-3 text-lime-500" />
              {result.hazards.length} hazards detected
            </Badge>
            <Button size="sm" variant="outline" className="gap-1.5 hazsight-glow-hover" asChild>
              <a href={result.report_pdf_url || '#'} download>
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Analyze another photo
            </Button>
            {hintVisible && sortedHazards.length > 0 && (
              <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-lime-500/30 bg-lime-500/5 px-2 py-1 text-[10px] text-muted-foreground sm:inline-flex">
                <Keyboard className="h-3 w-3 text-lime-500" />
                Press <kbd className="rounded bg-muted px-1 font-mono text-[9px] text-foreground">1</kbd>–<kbd className="rounded bg-muted px-1 font-mono text-[9px] text-foreground">{Math.min(9, sortedHazards.length)}</kbd> to select · <kbd className="rounded bg-muted px-1 font-mono text-[9px] text-foreground">Esc</kbd> to reset
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scene description */}
      <Card className="hazsight-glass bg-card/70 border-border/40 shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-muted-foreground">
            <FileText className="h-4 w-4" />
            Scene Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {result.scene_description}
          </p>
        </CardContent>
      </Card>

      {/* Annotated image + risk list */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Annotated Image
          </h3>
          <AnnotatedImage
            imageUrl={result.image_url}
            hazards={result.hazards}
            onHazardClick={handleHazardClick}
            selectedHazardId={selectedHazardId}
          />
          <p className="text-xs text-muted-foreground">
            Click a hazard box to highlight it in the list below.
          </p>
        </div>
        <RiskList
          hazards={result.hazards}
          onHazardClick={handleHazardClick}
          selectedHazardId={selectedHazardId}
        />
      </div>

      {/* Regulations & Citations — Tavily web search results */}
      {regulations.length > 0 && (
        <Collapsible
          open={regsOpen}
          onOpenChange={setRegsOpen}
          className="hazsight-glass rounded-xl border border-border/40 bg-card/60 shadow-lg shadow-black/20"
        >
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400">
                  <Gavel className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
                    Regulations &amp; Citations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {totalCitations} citation{totalCitations === 1 ? '' : 's'} across {regulations.length} hazard categor{regulations.length === 1 ? 'y' : 'ies'} — sourced via{' '}
                    {tavilyLive ? (
                      <span className="font-semibold text-lime-600 dark:text-lime-400">Tavily Live Search</span>
                    ) : (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">mock citations</span>
                    )}
                    .
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {tavilyLive ? (
                  <Badge variant="outline" className="gap-1 border-lime-500/40 text-lime-600 dark:text-lime-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-500 animate-pulse" />
                    LIVE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    MOCK
                  </Badge>
                )}
                <motion.div
                  animate={{ rotate: regsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-5 border-t border-border/60 px-6 py-4">
              {regulations.map((reg) => (
                <div key={reg.hazard_category} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide">
                      {HAZARD_CATEGORY_LABELS[reg.hazard_category as keyof typeof HAZARD_CATEGORY_LABELS] || reg.hazard_category}
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Search className="h-3 w-3" />
                      <span className="font-mono">{reg.query}</span>
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {reg.results.map((r, idx) => (
                      <a
                        key={idx}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-lg border border-border/60 bg-background/50 p-3 transition-all hover:border-lime-500/40 hover:bg-lime-500/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:text-lime-600 dark:group-hover:text-lime-400">
                            {r.title}
                          </p>
                          <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground/60 group-hover:text-lime-500" />
                        </div>
                        <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">
                          {r.content}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-mono text-[9px] text-muted-foreground/70 truncate max-w-[70%]">
                            {new URL(r.url).hostname}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                            {Math.round(r.score * 100)}% match
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Replay trace — expandable reasoning timeline */}
      {events.length > 0 && (
        <Collapsible
          open={traceOpen}
          onOpenChange={setTraceOpen}
          className="hazsight-glass rounded-xl border border-border/40 bg-card/60 shadow-lg shadow-black/20"
        >
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
                    Reasoning Trace
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Re-watch the agent&apos;s reasoning — {events.length} events from
                    Nemotron 3 Ultra, VLM, and Tavily.
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: traceOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border/60 px-6 py-4">
              <TraceTimeline events={events} isLive={false} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  )
}
