'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Activity, RefreshCw, Camera, TrendingUp, AlertTriangle, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { JobResult } from '@/lib/mock-data'

interface MonitoringViewProps {
  onJobSelect: (job: JobResult) => void
  onUploadClick: () => void
}

export function MonitoringView({ onJobSelect, onUploadClick }: MonitoringViewProps) {
  const [jobs, setJobs] = React.useState<JobResult[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchJobs = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/jobs?limit=50')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchJobs()
    // Auto-refresh every 10s (simulates live monitoring)
    const interval = setInterval(() => fetchJobs(true), 10_000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  // Score trend (most recent N scores, oldest → newest)
  const trendScores = jobs
    .filter((j) => j.status === 'completed')
    .slice(0, 12)
    .reverse()
    .map((j) => j.overall_safety_score)

  const avgScore = trendScores.length > 0
    ? Math.round(trendScores.reduce((a, b) => a + b, 0) / trendScores.length)
    : 0

  const criticalCount = jobs.filter((j) =>
    j.hazards.some((h) => h.severity === 'CRITICAL'),
  ).length

  const scoreColor = (score: number) =>
    score < 50 ? 'text-red-500' : score < 75 ? 'text-amber-500' : 'text-emerald-500'

  const scoreBarColor = (score: number) =>
    score < 50 ? 'bg-red-500' : score < 75 ? 'bg-amber-500' : 'bg-emerald-500'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-lime-500" />
        <span className="hazsight-readout text-sm text-muted-foreground">
          {'// loading monitoring data...'}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header + stats */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-mono text-3xl font-bold tracking-tight">
            Monitoring Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {'// automated safety scans — cameras or cron jobs POST to '}
            <code className="rounded bg-muted px-1 font-mono text-xs text-lime-400">/api/analyze</code>
            {' — results appear here in real time'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fetchJobs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={onUploadClick}>
            <Camera className="h-4 w-4" />
            Manual scan
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {jobs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="hazsight-glass bg-card/60 border-border/40">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-500/10 text-lime-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold">{jobs.length}</div>
                <div className="text-xs text-muted-foreground">total scans</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hazsight-glass bg-card/60 border-border/40">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-red-400">{criticalCount}</div>
                <div className="text-xs text-muted-foreground">critical hazards</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hazsight-glass bg-card/60 border-border/40">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className={cn('font-mono text-2xl font-bold', scoreColor(avgScore))}>
                  {avgScore || '—'}
                  {avgScore > 0 && <span className="text-sm text-muted-foreground">/100</span>}
                </div>
                <div className="text-xs text-muted-foreground">avg safety score</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Score trend mini-chart */}
      {trendScores.length >= 2 && (
        <Card className="hazsight-glass bg-card/60 border-border/40">
          <CardContent className="py-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Score trend ({trendScores.length} recent scans)
              </span>
            </div>
            <div className="flex h-16 items-end gap-1.5">
              {trendScores.map((score, idx) => (
                <motion.div
                  key={idx}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(score, 4)}%` }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className={cn('flex-1 rounded-t-sm', scoreBarColor(score))}
                  title={`Scan ${idx + 1}: ${score}/100`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>oldest</span>
              <span>newest</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs grid */}
      {jobs.length === 0 ? (
        <Card className="hazsight-glass border-border/40 bg-card/40">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-500/10">
              <Camera className="h-7 w-7 text-lime-400" />
            </div>
            <div>
              <p className="font-mono text-base font-semibold">No scans yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a photo manually, or set up automated monitoring by
                POSTing images to <code className="rounded bg-muted px-1 font-mono text-xs text-lime-400">/api/analyze</code>.
              </p>
            </div>
            <Button className="gap-2" onClick={onUploadClick}>
              <Camera className="h-4 w-4" />
              Start a scan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, idx) => {
            const topSeverity = job.hazards
              .sort((a, b) => {
                const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
                return order[a.severity] - order[b.severity]
              })[0]?.severity
            return (
              <motion.button
                key={job.job_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                onClick={() => onJobSelect(job)}
                className="text-left"
              >
                <Card className="hazsight-glass cursor-pointer overflow-hidden border-border/40 bg-card/60 transition-all hover:border-lime-500/40 hover:bg-lime-500/5">
                  {/* Thumbnail */}
                  <div className="relative h-32 overflow-hidden bg-black">
                    {job.image_url ? (
                      <img
                        src={job.image_url}
                        alt="Analyzed scene"
                        className="h-full w-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    {/* Score badge overlay */}
                    <div className="absolute top-2 right-2">
                      <span className={cn(
                        'rounded-md px-2 py-0.5 font-mono text-xs font-bold backdrop-blur-sm',
                        job.overall_safety_score < 50
                          ? 'bg-red-500/80 text-white'
                          : job.overall_safety_score < 75
                            ? 'bg-amber-500/80 text-white'
                            : 'bg-emerald-500/80 text-white',
                      )}>
                        {job.overall_safety_score}/100
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <CardContent className="space-y-2 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(job.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {topSeverity && (
                        <Badge variant="outline" className={cn(
                          'text-[9px]',
                          topSeverity === 'CRITICAL' && 'border-red-500/40 text-red-400',
                          topSeverity === 'HIGH' && 'border-orange-500/40 text-orange-400',
                          topSeverity === 'MEDIUM' && 'border-lime-500/40 text-lime-400',
                          topSeverity === 'LOW' && 'border-emerald-500/40 text-emerald-400',
                        )}>
                          {topSeverity}
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {job.hazards.length} hazard{job.hazards.length === 1 ? '' : 's'} detected
                      {job.tavily_live && ' · live Tavily'}
                    </p>
                  </CardContent>
                </Card>
              </motion.button>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
