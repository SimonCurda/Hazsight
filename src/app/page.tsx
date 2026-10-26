'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Github,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Loader2,
  RotateCcw,
  Activity,
  Copy,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import AboutTeamCard from '@/components/hazsight/about-team-card'
import { LandingView } from '@/components/hazsight/landing-view'
import { UploadDropzone } from '@/components/hazsight/upload-dropzone'
import { ProcessingView } from '@/components/hazsight/processing-view'
import { ResultsView } from '@/components/hazsight/results-view'
import { MonitoringView } from '@/components/hazsight/monitoring-view'
import {
  MOCK_TRACE_EVENTS,
  MOCK_JOB_RESULT,
  MOCK_IMAGE_URL,
  type TraceEvent,
  type JobResult,
} from '@/lib/mock-data'

type View = 'landing' | 'uploading' | 'processing' | 'results' | 'monitoring' | 'error'

export default function Home() {
  const [view, setView] = React.useState<View>('landing')
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [events, setEvents] = React.useState<TraceEvent[]>([])
  const [result, setResult] = React.useState<JobResult | null>(null)
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
  const [isLive, setIsLive] = React.useState(false)
  const [isPosting, setIsPosting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [jurisdiction, setJurisdiction] = React.useState<string>('CZECH')
  const [copied, setCopied] = React.useState(false)

  // Poll for trace events + job status while processing.
  React.useEffect(() => {
    if (view !== 'processing' || !jobId) return

    let lastEventTimestamp = 0
    setIsLive(true)

    const poll = async () => {
      try {
        // 1. Fetch new trace events since lastTimestamp.
        const traceRes = await fetch(
          `/api/jobs/${jobId}/trace?since=${lastEventTimestamp}`,
        )
        if (traceRes.ok) {
          const data = await traceRes.json()
          if (data.events && data.events.length > 0) {
            setEvents((prev) => [...prev, ...data.events])
            lastEventTimestamp = data.events[data.events.length - 1].timestamp
          }
        }

        // 2. Check job status.
        const jobRes = await fetch(`/api/jobs/${jobId}`)
        if (jobRes.ok) {
          const jobData: JobResult = await jobRes.json()
          if (jobData.status === 'completed') {
            setResult({
              ...jobData,
              image_url: previewUrl || jobData.image_url,
            })
            setIsLive(false)
            setView('results')
          } else if (jobData.status === 'failed') {
            setIsLive(false)
            setError(jobData.error || 'Analysis failed')
            setView('error')
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    // Poll immediately, then every 1s.
    void poll()
    const interval = setInterval(poll, 1000)
    return () => clearInterval(interval)
  }, [view, jobId, previewUrl])

  const handleUploadClick = () => {
    setView('uploading')
  }

  const handleFileSelected = (file: File, url: string) => {
    setUploadedFile(file)
    setPreviewUrl(url)
  }

  const handleClear = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
  }

  // Shared analysis starter — POST is synchronous, returns full result + events.
  // On Vercel, in-memory store doesn't persist across instances, so we can't
  // poll. Instead, the POST returns everything and we "play back" the trace
  // events with delays to simulate the live timeline.
  const startAnalysis = async (body: BodyInit, imgUrl: string) => {
    setPreviewUrl(imgUrl)
    setEvents([])
    setResult(null)
    setJobId(null)
    setUploadedFile(null)
    setError(null)
    setIsPosting(true)
    setView('processing')

    try {
      const headers = typeof body === 'string'
        ? { 'Content-Type': 'application/json' }
        : undefined
      const res = await fetch('/api/analyze', { method: 'POST', body, headers })
      const data = await res.json()

      if (data.error || !data.result) {
        throw new Error(data.error || 'Analysis failed — check debug panel')
      }

      // Store in localStorage for debug panel (works on Vercel where in-memory store doesn't persist)
      try {
        localStorage.setItem('hazsight_last_analysis', JSON.stringify({
          timestamp: new Date().toISOString(),
          status: data.status,
          error: data.error,
          result: data.result,
          events: data.events,
          jurisdiction,
        }))
      } catch {}

      // Switch from "connecting" spinner to live trace timeline
      setIsPosting(false)
      setIsLive(true)

      // Play back trace events with delays to simulate live timeline
      const events = data.events || []
      for (let i = 0; i < events.length; i++) {
        setEvents(prev => [...prev, events[i]])
        await new Promise(r => setTimeout(r, events.length > 15 ? 150 : 300))
      }

      // Set the result and switch to results view
      const jobResult: JobResult = {
        ...data.result,
        image_url: imgUrl || data.result.image_url,
      }
      setResult(jobResult)
      setIsLive(false)
      setView('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setView('error')
    } finally {
      setIsPosting(false)
    }
  }

  const handleAnalyze = () => {
    const formData = new FormData()
    if (uploadedFile) formData.append('image', uploadedFile)
    void startAnalysis(formData, previewUrl || '')
  }

  const handleTryDemo = () => {
    void startAnalysis(
      JSON.stringify({ image_url: MOCK_IMAGE_URL, jurisdiction }),
      MOCK_IMAGE_URL,
    )
  }

  const handleReset = () => {
    setView('landing')
    setPreviewUrl(null)
    setEvents([])
    setResult(null)
    setJobId(null)
    setUploadedFile(null)
    setError(null)
    setIsPosting(false)
  }

  const handleBackToHome = () => {
    setView('landing')
  }

  const handleMonitoringClick = () => {
    setView('monitoring')
  }

  const handleJobSelectFromMonitoring = (jobResult: JobResult) => {
    setResult(jobResult)
    setPreviewUrl(jobResult.image_url)
    setView('results')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header — terminal style */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {view !== 'landing' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToHome}
                aria-label="Back to home"
                className="rounded hazsight-readout"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <AboutTeamCard onHomeClick={handleBackToHome} />
          </div>
          <nav className="flex items-center gap-1">
            {view === 'landing' && (
              <>
                <Button variant="ghost" size="sm" asChild className="text-xs sm:inline-flex">
                  <Link href="#how-it-works">Process</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-xs sm:inline-flex">
                  <Link href="#hazards">Hazards</Link>
                </Button>
              </>
            )}
            {/* Monitoring dashboard — available from any view */}
            <Button
              variant={view === 'monitoring' ? 'default' : 'ghost'}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleMonitoringClick}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Monitoring</span>
            </Button>
            <Button variant="ghost" size="icon" asChild className="rounded">
              <a
                href="https://github.com/SimonCurda/Hazsight"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <ModeToggle />
          </nav>
        </div>
        {/* Tech divider line */}
        <div className="h-px bg-gradient-to-r from-transparent via-lime-500/40 to-transparent" />
      </header>

      {/* Main content — switches based on view */}
      <main className="flex-1">
        {view === 'landing' && <LandingView onUploadClick={handleUploadClick} />}

        {view === 'uploading' && (
          <section className="container mx-auto max-w-3xl px-4 py-12">
            <div className="mb-8 text-center">
              <h1 className="font-mono text-3xl font-bold tracking-tight">
                Upload a photo for analysis
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Drop an image of any room, workspace, or industrial site.
                We&apos;ll analyze it for safety hazards in ~30 seconds.
              </p>
            </div>

            {/* Jurisdiction selector — determines which country's laws Tavily searches */}
            <div className="hazsight-glass mb-6 rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="hazsight-readout text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {'// Jurisdiction:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: 'CZECH', label: '🇨🇿 Czech', query: 'Czech Republic vyhláška zákon' },
                    { code: 'USA', label: '🇺🇸 USA (OSHA)', query: 'OSHA 29 CFR 1910' },
                    { code: 'JAPAN', label: '🇯🇵 Japan', query: 'Japan 消防法' },
                    { code: 'EU', label: '🇪🇺 EU', query: 'EU directive' },
                    { code: 'UK', label: '🇬🇧 UK (HSE)', query: 'UK HSE' },
                    { code: 'INTERNATIONAL', label: '🌍 ISO', query: 'ISO standard' },
                  ].map((j) => (
                    <button
                      key={j.code}
                      onClick={() => setJurisdiction(j.code)}
                      className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all ${
                        jurisdiction === j.code
                          ? 'border-lime-500/60 bg-lime-500/15 text-lime-400'
                          : 'border-border/40 bg-card/30 text-muted-foreground hover:border-lime-500/30 hover:text-foreground'
                      }`}
                    >
                      {j.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                Determines which country&apos;s safety regulations Tavily searches for — affects the citations in the report.
              </p>
            </div>

            <UploadDropzone
              onFileSelected={handleFileSelected}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              previewUrl={previewUrl}
              isUploading={false}
            />
            <div className="mt-6 flex items-center justify-center">
              <div className="flex flex-1 max-w-xs items-center">
                <div className="h-px flex-1 bg-border" />
                <span className="px-4 text-xs uppercase tracking-wide text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={handleTryDemo}
              >
                <Sparkles className="h-4 w-4 text-lime-500" />
                Try with a demo image
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                See the full flow with a sample warehouse photo — no upload needed.
              </p>
            </div>
          </section>
        )}

        {view === 'processing' && (
          <section className="container mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8">
              <h1 className="font-mono text-3xl font-bold tracking-tight">
                {isPosting ? 'Connecting to Nebius...' : 'Analyzing your photo'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isPosting
                  ? 'Sending image to Nebius Token Factory for VLM analysis via Nemotron...'
                  : 'Watch Nemotron 3 Ultra plan, the VLM detect hazards, and the report synthesize in real time.'}
              </p>
            </div>
            {isPosting ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="h-10 w-10 animate-spin text-lime-500" />
                <span className="hazsight-readout text-sm text-muted-foreground">
                  {'// awaiting response from api.tokenfactory.nebius.com'}
                </span>
              </div>
            ) : (
              <ProcessingView
                previewUrl={previewUrl}
                events={events}
                isLive={isLive}
              />
            )}
          </section>
        )}

        {view === 'monitoring' && (
          <section className="container mx-auto max-w-6xl px-4 py-12">
            <MonitoringView
              onJobSelect={handleJobSelectFromMonitoring}
              onUploadClick={handleUploadClick}
            />
          </section>
        )}

        {view === 'error' && (
          <section className="container mx-auto max-w-3xl px-4 py-12">
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  Analysis Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-red-400/60">
                      {'// error details'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const errText = error || 'An unknown error occurred during analysis.'
                        try {
                          navigator.clipboard.writeText(errText)
                        } catch {
                          const ta = document.createElement('textarea')
                          ta.value = errText
                          ta.style.position = 'fixed'
                          ta.style.opacity = '0'
                          document.body.appendChild(ta)
                          ta.focus()
                          ta.select()
                          try { document.execCommand('copy') } catch {}
                          document.body.removeChild(ta)
                        }
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="relative z-10 flex items-center gap-1 rounded-md border border-border/40 bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground transition-all hover:border-lime-500/30 hover:text-lime-400 cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-red-400">
                    {error || 'An unknown error occurred during analysis.'}
                  </pre>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Try again
                  </Button>
                  <Button variant="outline" onClick={handleBackToHome}>
                    Back to home
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open('/api/models', '_blank')}
                  >
                    <Activity className="h-4 w-4" />
                    Check available models
                  </Button>
                </div>
                <div className="rounded-md border border-lime-500/20 bg-lime-500/5 p-3 text-xs text-muted-foreground">
                  <span className="font-mono text-lime-400">{'// tip: '}</span>
                  If the error says &quot;model does not exist&quot;, visit{' '}
                  <code className="rounded bg-muted px-1 font-mono text-[10px] text-lime-400">/api/models</code>{' '}
                  to see which models are available on Nebius Token Factory. Then update the{' '}
                  <code className="rounded bg-muted px-1 font-mono text-[10px] text-lime-400">NEBIUS_VLM_MODEL</code>{' '}
                  env var on Vercel.
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {view === 'results' && result && (
          <section className="container mx-auto max-w-6xl px-4 py-12">
            <ResultsView result={result} events={events} onReset={handleReset} />
          </section>
        )}
      </main>

      {/* Sticky footer — terminal style */}
      <footer className="mt-auto border-t border-border/40 bg-muted/20">
        <div className="absolute inset-0 -z-10 hazsight-grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
            <div className="max-w-md">
              <div className="mb-2 flex items-center gap-2">
                <span className="hazsight-readout text-sm font-bold tracking-tight text-lime-400">Hazsight</span>
                <span className="hazsight-readout text-[10px] text-muted-foreground">
                  v0.1.0
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="hazsight-readout text-lime-400/60">{'// '}</span>
                AI safety inspector · NVIDIA Nemotron on Nebius Token Factory ·
                Built by Team DAMR58H for Nebius x NVIDIA Global AI Hackathon.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://github.com/SimonCurda/Hazsight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-lime-400"
              >
                <Github className="h-4 w-4" />
                GitHub repository
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://nebiusglobalaihackathon.devpost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-lime-400"
              >
                <ExternalLink className="h-4 w-4" />
                Hackathon page
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border/40 pt-6">
            <p className="hazsight-readout text-[10px] text-muted-foreground">
              <span className="text-emerald-400/70">{'// Compliance: '}</span>
              MIT licensed · Runs on Nebius Token Factory · Uses NVIDIA Nemotron open-source models · Best Apps &amp; Agents track
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
