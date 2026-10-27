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
  const [lastAnalysis, setLastAnalysis] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [autoRefresh, setAutoRefresh] = React.useState(false)

  const fetchDebug = React.useCallback(async () => {
    setLoading(true)
    try {
      // Read from localStorage (works on Vercel — shows the last POST /api/analyze response)
      let localData: any = null
      try {
        const stored = localStorage.getItem('hazsight_last_analysis')
        if (stored) localData = JSON.parse(stored)
      } catch {}
      setLastAnalysis(localData)

      // Also fetch from /api/debug (works locally, may be empty on Vercel)
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

  const nebiusOk = !!data?.env?.NEBIUS_API_KEY_set
  const tavilyOk = !!data?.env?.TAVILY_API_KEY_set

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
                      <InfoRow label="NODE_ENV" value={data.env.NODE_ENV} />
                      <InfoRow label="VLM Model" value={data.env.NEBIUS_VLM_MODEL} />
                      <InfoRow label="Reasoning Model" value={data.env.NEBIUS_REASONING_MODEL} />
                      <InfoRow label="Base URL" value={data.env.NEBIUS_BASE_URL} />
                    </div>
                  </div>

                  {/* Last Analysis (from localStorage — works on Vercel) */}
                  {lastAnalysis && (
                    <div>
                      <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-lime-400">
                        Last Analysis (client-side)
                      </h3>
                      <div className="space-y-3">
                        {/* Status */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`font-mono font-semibold ${lastAnalysis.status === 'completed' ? 'text-emerald-400' : lastAnalysis.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                            {lastAnalysis.status || '?'}
                          </span>
                          <span className="text-muted-foreground">{lastAnalysis.timestamp ? new Date(lastAnalysis.timestamp).toLocaleString() : ''}</span>
                          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[9px]">
                            {lastAnalysis.jurisdiction || 'CZECH'}
                          </span>
                        </div>

                        {/* Result summary */}
                        {lastAnalysis.result && (
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                            <span>score: <span className="text-foreground">{lastAnalysis.result.overall_safety_score}/100</span></span>
                            <span>hazards: <span className="text-foreground">{lastAnalysis.result.hazards?.length || 0}</span></span>
                            <span>regulations: <span className="text-foreground">{lastAnalysis.result.regulations?.length || 0}</span></span>
                            <span>tavily: <span className={lastAnalysis.result.tavily_live ? 'text-lime-400' : 'text-amber-400'}>{lastAnalysis.result.tavily_live ? 'LIVE' : 'MOCK'}</span></span>
                          </div>
                        )}

                        {/* Tavily regulations */}
                        {lastAnalysis.result?.regulations?.length > 0 && (
                          <div className="rounded-md border border-lime-500/20 bg-lime-500/5 p-2">
                            <p className="mb-1 font-mono text-[9px] uppercase text-lime-400">Tavily Citations</p>
                            {lastAnalysis.result.regulations.slice(0, 4).map((reg: any, i: number) => (
                              <div key={i} className="mb-1 text-[9px]">
                                <span className="font-mono text-foreground/80">{reg.hazard_category}</span>
                                <span className="ml-1 text-muted-foreground">({reg.jurisdiction})</span>
                                {reg.results?.slice(0, 2).map((r: any, j: number) => (
                                  <div key={j} className="ml-2 truncate text-muted-foreground/70">
                                    → {r.title?.slice(0, 60)}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Trace events */}
                        {lastAnalysis.events?.length > 0 && (
                          <div>
                            <p className="mb-1 font-mono text-[9px] uppercase text-muted-foreground">Trace Events ({lastAnalysis.events.length})</p>
                            <div className="space-y-0.5">
                              {lastAnalysis.events.map((ev: any, i: number) => (
                                <div key={i} className="flex gap-2 border-l border-border/40 pl-2 text-[9px]">
                                  <span className={`font-mono font-semibold ${
                                    ev.type === 'tavily_search' ? 'text-lime-400' :
                                    ev.type === 'vlm_analyze' || ev.type === 'vlm_detect' ? 'text-amber-400' :
                                    ev.type === 'report_ready' ? 'text-emerald-400' : 'text-foreground/60'
                                  }`}>{ev.type}</span>
                                  <span className="flex-1 text-muted-foreground">{ev.content?.slice(0, 100)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
