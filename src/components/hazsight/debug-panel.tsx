'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, X, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface DebugData {
  env: {
    NEBIUS_API_KEY_set: boolean
    TAVILY_API_KEY_set: boolean
    NEBIUS_BASE_URL: string
    NEBIUS_VLM_MODEL: string
    NEBIUS_REASONING_MODEL: string
    NEBIUS_FAST_MODEL: string
    DATABASE_URL_set: boolean
    NODE_ENV: string
  }
  mode: {
    nebius: string
    tavily: string
  }
  recent_jobs: Array<{
    job_id: string
    status: string
    created_at: string
    completed_at: string | null
    image_url_type: string
    image_url_length: number
    hazard_count: number
    overall_safety_score: number
    tavily_live: boolean
    regulation_count: number
    trace_event_count: number
    error: string | null
    trace_events: Array<{
      type: string
      model: string
      content: string
      timestamp: string
    }>
  }>
  help: Record<string, string>
}

export function DebugPanel() {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<DebugData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [autoRefresh, setAutoRefresh] = React.useState(false)

  const fetchDebug = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/debug')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (err) {
      console.error('Debug fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) void fetchDebug()
  }, [open, fetchDebug])

  React.useEffect(() => {
    if (!open || !autoRefresh) return
    const interval = setInterval(() => fetchDebug(), 2000)
    return () => clearInterval(interval)
  }, [open, autoRefresh, fetchDebug])

  const nebiusOk = data?.env?.NEBIUS_API_KEY_set
  const tavilyOk = data?.env?.TAVILY_API_KEY_set

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-lime-500/40 bg-card/80 backdrop-blur-md text-lime-400 shadow-lg transition-all hover:scale-110 hover:bg-lime-500/10"
        aria-label="Debug panel"
        title="Debug panel"
      >
        <Bug className="h-5 w-5" />
        {(!nebiusOk || !tavilyOk) && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-border bg-card p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-mono text-lg font-bold">
                  <Bug className="h-5 w-5 text-lime-400" />
                  Debug Panel
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoRefresh(v => !v)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-all ${autoRefresh ? 'border-lime-500/40 bg-lime-500/10 text-lime-400' : 'border-border/40 text-muted-foreground'}`}
                  >
                    <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
                    auto
                  </button>
                  <button onClick={() => fetchDebug()} className="rounded-md border border-border/40 p-1.5 text-muted-foreground hover:text-foreground">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button onClick={() => setOpen(false)} className="rounded-md border border-border/40 p-1.5 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {data ? (
                <div className="space-y-5">
                  {/* Environment status */}
                  <div>
                    <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">Environment</h3>
                    <div className="space-y-1.5">
                      <StatusRow label="NEBIUS_API_KEY" ok={nebiusOk} detail={data.mode.nebius} />
                      <StatusRow label="TAVILY_API_KEY" ok={tavilyOk} detail={data.mode.tavily} />
                      <StatusRow label="DATABASE_URL" ok={data.env.DATABASE_URL_set} detail={data.env.DATABASE_URL_set ? 'set' : 'not set (ok for demo)'} />
                      <InfoRow label="NODE_ENV" value={data.env.NODE_ENV} />
                      <InfoRow label="VLM Model" value={data.env.NEBIUS_VLM_MODEL} />
                      <InfoRow label="Reasoning Model" value={data.env.NEBIUS_REASONING_MODEL} />
                      <InfoRow label="Base URL" value={data.env.NEBIUS_BASE_URL} />
                    </div>
                  </div>

                  {/* Recent jobs */}
                  <div>
                    <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      Recent Jobs ({data.recent_jobs.length})
                    </h3>
                    {data.recent_jobs.length === 0 ? (
                      <p className="rounded-md border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
                        No jobs yet. Upload a photo or click "Try with a demo image".
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.recent_jobs.map((job) => (
                          <div key={job.job_id} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                            <div className="flex items-center gap-2">
                              {job.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                              {job.status === 'processing' && <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />}
                              {job.status === 'failed' && <XCircle className="h-4 w-4 text-red-400" />}
                              {job.status === 'queued' && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                              <span className="font-mono text-xs font-semibold">{job.status}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{job.job_id.slice(-8)}</span>
                            </div>
                            {job.error && (
                              <p className="mt-2 rounded bg-red-500/10 p-2 text-[10px] text-red-400">{job.error}</p>
                            )}
                            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                              <span>hazards: {job.hazard_count}</span>
                              <span>regulations: {job.regulation_count}</span>
                              <span>score: {job.overall_safety_score}</span>
                              <span>tavily: {job.tavily_live ? 'LIVE' : 'MOCK'}</span>
                              <span>image: {job.image_url_type}</span>
                              <span>events: {job.trace_event_count}</span>
                            </div>
                            {/* Trace events */}
                            {job.trace_events.length > 0 && (
                              <div className="mt-2 space-y-0.5">
                                {job.trace_events.map((ev, idx) => (
                                  <div key={idx} className="flex gap-2 border-l border-border/40 pl-2 text-[9px]">
                                    <span className="font-mono text-muted-foreground/60">
                                      {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                                    </span>
                                    <span className={`font-mono font-semibold ${
                                      ev.type === 'tavily_search' ? 'text-lime-400' :
                                      ev.type === 'vlm_analyze' || ev.type === 'vlm_detect' ? 'text-amber-400' :
                                      ev.type === 'report_ready' ? 'text-emerald-400' :
                                      ev.model === 'Error' ? 'text-red-400' : 'text-foreground/60'
                                    }`}>
                                      {ev.type}
                                    </span>
                                    <span className="flex-1 text-muted-foreground">{ev.content}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Help */}
                  <div>
                    <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">Help</h3>
                    <div className="space-y-1 text-[10px] text-muted-foreground">
                      {Object.entries(data.help).map(([key, val]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-mono text-lime-400/60">{key}:</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="h-6 w-6 animate-spin text-lime-400" />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
      <span className="font-mono text-[11px]">{label}</span>
      <span className={`ml-auto text-[10px] ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{detail}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono text-[10px] text-foreground/80 truncate max-w-[200px]">{value}</span>
    </div>
  )
}
