'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, MapPin, Flame } from 'lucide-react'

import { cn } from '@/lib/utils'
import { SEVERITY_COLORS, HAZARD_CATEGORY_LABELS } from '@/lib/types'
import type { DetectedHazard } from '@/lib/mock-data'

interface AnnotatedImageProps {
  imageUrl: string
  hazards: DetectedHazard[]
  onHazardClick?: (hazardId: string) => void
  selectedHazardId?: string | null
  showHeatmap?: boolean
}

export function AnnotatedImage({
  imageUrl,
  hazards,
  onHazardClick,
  selectedHazardId,
  showHeatmap = false,
}: AnnotatedImageProps) {
  const visibleHazards = hazards.filter(
    (h) => h.bounding_box.width > 0 && h.bounding_box.height > 0,
  )

  // Heatmap: each hazard gets a radial gradient overlay at its center.
  // Color + intensity based on severity (CRITICAL = red, HIGH = orange, MEDIUM = amber, LOW = green)
  const severityHeatmap = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'rgba(239, 68, 68, 0.6)'
      case 'HIGH': return 'rgba(249, 115, 22, 0.55)'
      case 'MEDIUM': return 'rgba(245, 158, 11, 0.45)'
      case 'LOW': return 'rgba(16, 185, 129, 0.35)'
      default: return 'rgba(100, 100, 100, 0.3)'
    }
  }
  const severityRing = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '2px solid rgba(239, 68, 68, 0.8)'
      case 'HIGH': return '2px solid rgba(249, 115, 22, 0.7)'
      case 'MEDIUM': return '2px solid rgba(245, 158, 11, 0.6)'
      case 'LOW': return '2px solid rgba(16, 185, 129, 0.5)'
      default: return '2px solid rgba(100, 100, 100, 0.4)'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
      <img
        src={imageUrl}
        alt="Analyzed scene with detected hazards"
        className="block max-h-[600px] w-full object-contain"
      />
      {/* Disclaimer for seed/demo results (no bounding boxes) */}
      {visibleHazards.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center bg-black/40 p-4">
          <p className="rounded-lg bg-black/70 px-3 py-1.5 text-center font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
            {'// Illustrative analysis — hazard locations not marked on this image'}
          </p>
        </div>
      )}
      {visibleHazards.map((hazard, idx) => {
        const colors = SEVERITY_COLORS[hazard.severity]
        const isSelected = selectedHazardId === hazard.id
        // Flip the tooltip below the box if it's too close to the top edge
        const flipDown = hazard.bounding_box.y < 18
        return (
          <motion.button
            key={hazard.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.15, duration: 0.4 }}
            onClick={() => onHazardClick?.(hazard.id)}
            aria-label={`Hazard ${idx + 1}: ${HAZARD_CATEGORY_LABELS[hazard.category]} — ${hazard.severity}`}
            className={cn(
              'group hazsight-tooltip-trigger absolute cursor-pointer rounded-md border-2 transition-all',
              colors.box,
              isSelected ? 'z-20 ring-2 ring-offset-2 ring-offset-black/50' : 'z-10 hover:z-30',
            )}
            style={{
              left: `${hazard.bounding_box.x}%`,
              top: `${hazard.bounding_box.y}%`,
              width: `${hazard.bounding_box.width}%`,
              height: `${hazard.bounding_box.height}%`,
              boxShadow: isSelected ? `0 0 0 2px var(--color-lime-500)` : undefined,
            }}
          >
            {/* Always-visible badge: severity + index */}
            <span
              className={cn(
                'absolute left-0 flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                colors.badge,
                flipDown ? '-top-7' : '-bottom-7',
              )}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {hazard.severity}
              <span className="opacity-80">·</span>
              {idx + 1}
            </span>

            {/* Hover tooltip: full hazard description — pure CSS hover via .hazsight-tooltip-trigger */}
            <span
              className={cn(
                'hazsight-tooltip pointer-events-none absolute left-0 z-40 w-64 max-w-[80vw] rounded-lg border border-border/80 bg-popover/95 p-3 text-left shadow-2xl backdrop-blur-sm',
                flipDown ? 'top-full mt-3' : 'bottom-full mb-3',
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', colors.badge)}>
                  {hazard.severity}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {HAZARD_CATEGORY_LABELS[hazard.category]}
                </span>
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-foreground">
                {hazard.description}
              </span>
              {hazard.affected_area && (
                <span className="mt-1.5 flex items-start gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="mt-0.5 h-2.5 w-2.5 flex-shrink-0" />
                  {hazard.affected_area}
                </span>
              )}
              <span className="mt-1.5 block text-[10px] text-muted-foreground/80">
                {Math.round(hazard.confidence * 100)}% confidence · click to pin
              </span>
            </span>
          </motion.button>
        )
      })}

      {/* Heatmap overlay — colored radial gradients at each hazard's center */}
      {showHeatmap && visibleHazards.length > 0 && visibleHazards.map((hazard, idx) => {
        const cx = hazard.bounding_box.x + hazard.bounding_box.width / 2
        const cy = hazard.bounding_box.y + hazard.bounding_box.height / 2
        const radius = Math.max(hazard.bounding_box.width, hazard.bounding_box.height, 10) * 1.2
        const heatColor = severityHeatmap(hazard.severity)
        const ringColor = severityRing(hazard.severity)
        return (
          <div
            key={`heat-${idx}`}
            className="pointer-events-none absolute z-20"
            style={{
              left: `${cx - radius / 2}%`,
              top: `${cy - radius / 2}%`,
              width: `${radius}%`,
              height: `${radius}%`,
              background: `radial-gradient(circle, ${heatColor} 0%, ${heatColor.replace(/0\.\d+\)/, '0.15)')} 50%, transparent 80%)`,
              border: ringColor,
              borderRadius: '50%',
            }}
          />
        )
      })}

      {/* Fire origin point markers — flame icon at the detected fire origin */}
      {visibleHazards
        .filter((h) => h.fire_origin_point)
        .map((hazard, idx) => (
          <motion.div
            key={`fire-${idx}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + idx * 0.15, duration: 0.4 }}
            className="pointer-events-none absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{
              left: `${hazard.fire_origin_point!.x}%`,
              top: `${hazard.fire_origin_point!.y}%`,
            }}
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
            <Flame className="relative h-6 w-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </motion.div>
        ))}
    </div>
  )
}
