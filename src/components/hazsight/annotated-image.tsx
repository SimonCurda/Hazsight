'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { SEVERITY_COLORS, HAZARD_CATEGORY_LABELS } from '@/lib/types'
import type { DetectedHazard } from '@/lib/mock-data'

interface AnnotatedImageProps {
  imageUrl: string
  hazards: DetectedHazard[]
  onHazardClick?: (hazardId: string) => void
  selectedHazardId?: string | null
}

export function AnnotatedImage({
  imageUrl,
  hazards,
  onHazardClick,
  selectedHazardId,
}: AnnotatedImageProps) {
  const visibleHazards = hazards.filter(
    (h) => h.bounding_box.width > 0 && h.bounding_box.height > 0,
  )

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
      <img
        src={imageUrl}
        alt="Analyzed scene with detected hazards"
        className="block max-h-[600px] w-full object-contain"
      />
      {visibleHazards.map((hazard, idx) => {
        const colors = SEVERITY_COLORS[hazard.severity]
        const isSelected = selectedHazardId === hazard.id
        return (
          <motion.button
            key={hazard.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.15, duration: 0.4 }}
            onClick={() => onHazardClick?.(hazard.id)}
            aria-label={`Hazard ${idx + 1}: ${HAZARD_CATEGORY_LABELS[hazard.category]} — ${hazard.severity}`}
            className={cn(
              'absolute cursor-pointer rounded-md border-2 transition-all',
              colors.box,
              isSelected ? 'z-20 ring-2 ring-offset-2 ring-offset-black/50' : 'z-10 hover:z-20',
            )}
            style={{
              left: `${hazard.bounding_box.x}%`,
              top: `${hazard.bounding_box.y}%`,
              width: `${hazard.bounding_box.width}%`,
              height: `${hazard.bounding_box.height}%`,
              boxShadow: isSelected ? `0 0 0 2px var(--color-lime-500)` : undefined,
            }}
          >
            <span
              className={cn(
                'absolute -top-7 left-0 flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                colors.badge,
              )}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {hazard.severity}
              <span className="opacity-80">·</span>
              {idx + 1}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
