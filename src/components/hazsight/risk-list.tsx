'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, MapPin, Lightbulb, Gauge, CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { SEVERITY_COLORS, HAZARD_CATEGORY_LABELS } from '@/lib/types'
import type { DetectedHazard } from '@/lib/mock-data'

export const SEVERITY_ORDER: Record<DetectedHazard['severity'], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

// Static Tailwind class lookup (JIT can't analyze dynamic class names)
const SEVERITY_BORDER: Record<
  DetectedHazard['severity'],
  { hover: string; selected: string }
> = {
  CRITICAL: {
    hover: 'hover:border-red-500/70',
    selected: 'border-red-500 ring-1 ring-red-500/40',
  },
  HIGH: {
    hover: 'hover:border-orange-500/60',
    selected: 'border-orange-500 ring-1 ring-orange-500/40',
  },
  MEDIUM: {
    hover: 'hover:border-lime-500/60',
    selected: 'border-lime-500 ring-1 ring-lime-500/40',
  },
  LOW: {
    hover: 'hover:border-emerald-500/60',
    selected: 'border-emerald-500 ring-1 ring-emerald-500/40',
  },
}

interface RiskListProps {
  hazards: DetectedHazard[]
  onHazardClick?: (hazardId: string) => void
  selectedHazardId?: string | null
}

export function RiskList({
  hazards,
  onHazardClick,
  selectedHazardId,
}: RiskListProps) {
  const sorted = React.useMemo(
    () => [...hazards].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [hazards],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Detected Hazards ({hazards.length})
        </h3>
      </div>
      {hazards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-emerald-700 dark:text-emerald-300">
                  All clear — no hazards detected
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The scene appears to comply with safety standards.
                  Continue regular monitoring to maintain this state.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        sorted.map((hazard, idx) => {
        const colors = SEVERITY_COLORS[hazard.severity]
        const isSelected = selectedHazardId === hazard.id
        const isCritical = hazard.severity === 'CRITICAL'
        const borderClasses = SEVERITY_BORDER[hazard.severity]
        return (
          <motion.button
            key={hazard.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            onClick={() => onHazardClick?.(hazard.id)}
            className="block w-full text-left"
          >
            <Card
              className={cn(
                'hazsight-glass bg-card/70 cursor-pointer transition-all',
                borderClasses.hover,
                isSelected && borderClasses.selected,
                // CRITICAL: always-on glowing red border + slow pulse for urgency
                isCritical && 'border-red-500/60 shadow-[0_0_20px_-4px_rgba(239,68,68,0.5)] animate-pulse-slow',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('gap-1', colors.badge)} variant="default">
                        <AlertTriangle className="h-3 w-3" />
                        {hazard.severity}
                      </Badge>
                      <span className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {HAZARD_CATEGORY_LABELS[hazard.category]}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {hazard.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Gauge className="h-3 w-3" />
                      {Math.round(hazard.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                {hazard.affected_area && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{hazard.affected_area}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-foreground">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lime-500" />
                  <span className="leading-relaxed">{hazard.recommendation}</span>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        )
      })
    )}
    </div>
  )
}
