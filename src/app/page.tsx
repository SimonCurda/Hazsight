'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Github,
  ExternalLink,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/mode-toggle'
import AboutTeamCard from '@/components/hazsight/about-team-card'
import { LandingView } from '@/components/hazsight/landing-view'
import { UploadDropzone } from '@/components/hazsight/upload-dropzone'
import { ProcessingView } from '@/components/hazsight/processing-view'
import { ResultsView } from '@/components/hazsight/results-view'
import {
  MOCK_TRACE_EVENTS,
  MOCK_JOB_RESULT,
  MOCK_IMAGE_URL,
  type TraceEvent,
  type JobResult,
} from '@/lib/mock-data'

type View = 'landing' | 'uploading' | 'processing' | 'results'

export default function Home() {
  const [view, setView] = React.useState<View>('landing')
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [events, setEvents] = React.useState<TraceEvent[]>([])
  const [result, setResult] = React.useState<JobResult | null>(null)
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
  const [isLive, setIsLive] = React.useState(false)

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
            setView('landing')
            alert(`Analysis failed: ${jobData.error || 'Unknown error'}`)
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

  const handleAnalyze = async () => {
    setEvents([])
    setResult(null)
    setView('processing')

    try {
      const formData = new FormData()
      if (uploadedFile) {
        formData.append('image', uploadedFile)
      }
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: uploadedFile ? formData : undefined,
      })
      const data = await res.json()
      if (data.job_id) {
        setJobId(data.job_id)
      } else {
        throw new Error(data.error || 'Failed to create job')
      }
    } catch (err) {
      alert(`Failed to start analysis: ${err instanceof Error ? err.message : String(err)}`)
      setView('uploading')
    }
  }

  const handleTryDemo = async () => {
    setPreviewUrl(MOCK_IMAGE_URL)
    setEvents([])
    setResult(null)
    setUploadedFile(null)
    setView('processing')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: MOCK_IMAGE_URL }),
      })
      const data = await res.json()
      if (data.job_id) {
        setJobId(data.job_id)
      } else {
        throw new Error(data.error || 'Failed to create job')
      }
    } catch (err) {
      alert(`Failed to start analysis: ${err instanceof Error ? err.message : String(err)}`)
      setView('uploading')
    }
  }

  const handleReset = () => {
    setView('landing')
    setPreviewUrl(null)
    setEvents([])
    setResult(null)
    setJobId(null)
    setUploadedFile(null)
  }

  const handleBackToHome = () => {
    setView('landing')
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
                Analyzing your photo
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Watch Nemotron 3 Ultra plan, the VLM detect hazards, and the
                report synthesize in real time.
              </p>
            </div>
            <ProcessingView
              previewUrl={previewUrl}
              events={events}
              isLive={isLive}
            />
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
