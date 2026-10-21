'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Brain } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TraceTimeline } from './trace-timeline'
import type { TraceEvent } from '@/lib/mock-data'

interface ProcessingViewProps {
  previewUrl: string | null
  events: TraceEvent[]
  isLive: boolean
}

export function ProcessingView({
  previewUrl,
  events,
  isLive,
}: ProcessingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-6 lg:grid-cols-2"
    >
      {/* Image preview (dimmed) */}
      <div className="space-y-2">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Uploaded Image
        </h3>
        <div className="relative overflow-hidden rounded-xl border border-border bg-black">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Analyzing"
                className="block max-h-[500px] w-full object-contain opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3 rounded-lg bg-background/80 px-6 py-4 backdrop-blur"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <span className="font-mono text-sm font-semibold">
                    Analyzing scene...
                  </span>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          )}
        </div>
      </div>

      {/* Trace timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-muted-foreground">
            <Brain className="h-4 w-4 text-amber-500" />
            Agent Reasoning Trace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TraceTimeline events={events} isLive={isLive} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
