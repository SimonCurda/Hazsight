'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Download, RotateCcw, ShieldAlert, FileText, Brain, ChevronDown } from 'lucide-react'

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
import type { JobResult, TraceEvent } from '@/lib/mock-data'

interface ResultsViewProps {
  result: JobResult
  events: TraceEvent[]
  onReset: () => void
}

export function ResultsView({ result, events, onReset }: ResultsViewProps) {
  const [selectedHazardId, setSelectedHazardId] = React.useState<string | null>(null)
  const [traceOpen, setTraceOpen] = React.useState(false)

  const handleHazardClick = (id: string) => {
    setSelectedHazardId((prev) => (prev === id ? null : id))
  }

  const safetyScore = result.overall_safety_score
  const scoreColor =
    safetyScore < 40
      ? 'text-red-600 dark:text-red-400'
      : safetyScore < 70
        ? 'text-lime-600 dark:text-lime-400'
        : 'text-emerald-600 dark:text-emerald-400'
  const scoreBarColor =
    safetyScore < 40
      ? 'bg-red-500'
      : safetyScore < 70
        ? 'bg-lime-500'
        : 'bg-emerald-500'
  const riskLevel =
    safetyScore < 40
      ? { label: 'HIGH RISK', color: 'text-red-600 dark:text-red-400' }
      : safetyScore < 70
        ? { label: 'MODERATE RISK', color: 'text-lime-600 dark:text-lime-400' }
        : { label: 'LOW RISK', color: 'text-emerald-600 dark:text-emerald-400' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Summary card */}
      <Card>
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
                  className={`h-full ${scoreBarColor}`}
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
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={result.report_pdf_url || '#'} download>
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Analyze another photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scene description */}
      <Card>
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

      {/* Replay trace — expandable reasoning timeline */}
      {events.length > 0 && (
        <Collapsible
          open={traceOpen}
          onOpenChange={setTraceOpen}
          className="rounded-xl border border-border/60 bg-card/50"
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
