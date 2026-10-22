'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  ScanEye,
  Search,
  FileText,
  Zap,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TraceEvent } from '@/lib/mock-data'

const EVENT_ICONS: Record<
  TraceEvent['type'],
  React.ComponentType<{ className?: string }>
> = {
  plan: Brain,
  vlm_analyze: ScanEye,
  vlm_detect: ScanEye,
  ultra_assess: Brain,
  tavily_search: Search,
  synthesize: Brain,
  report_ready: FileText,
}

const EVENT_COLORS: Record<TraceEvent['type'], string> = {
  plan: 'text-lime-500',
  vlm_analyze: 'text-sky-500',
  vlm_detect: 'text-sky-500',
  ultra_assess: 'text-lime-500',
  tavily_search: 'text-emerald-500',
  synthesize: 'text-lime-500',
  report_ready: 'text-emerald-500',
}

interface TraceTimelineProps {
  events: TraceEvent[]
  isLive: boolean
}

export function TraceTimeline({ events, isLive }: TraceTimelineProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {events.map((event, idx) => {
          const Icon = EVENT_ICONS[event.type] || Zap
          const colorClass = EVENT_COLORS[event.type] || 'text-muted-foreground'
          const isLast = idx === events.length - 1
          return (
            <motion.div
              key={`${event.timestamp}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="relative flex gap-3"
            >
              {!isLast && (
                <div
                  className="absolute left-[18px] top-9 h-[calc(100%-12px)] w-px bg-border"
                  aria-hidden
                />
              )}
              <div className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                <Icon className={cn('h-4 w-4', colorClass)} />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {event.model && (
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {event.model}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString(undefined, {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {event.content}
                </p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {isLive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pl-12 pt-1 text-xs text-lime-600 dark:text-lime-400"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="font-mono">Agent reasoning in progress...</span>
        </motion.div>
      )}

      {!isLive && events.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pl-12 pt-1 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-mono">Trace complete</span>
        </motion.div>
      )}
    </div>
  )
}
