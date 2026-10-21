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

  // Emit trace events over time when in processing view.
  React.useEffect(() => {
    if (view !== 'processing') return

    let i = 0
    const interval = setInterval(() => {
      if (i >= MOCK_TRACE_EVENTS.length) {
        clearInterval(interval)
        // Slight delay before switching to results so the last "Trace complete"
        // indicator is visible.
        setTimeout(() => {
          setResult({ ...MOCK_JOB_RESULT, image_url: previewUrl || MOCK_JOB_RESULT.image_url })
          setView('results')
        }, 600)
        return
      }
      setEvents((prev) => [
        ...prev,
        { ...MOCK_TRACE_EVENTS[i], timestamp: Date.now() },
      ])
      i += 1
    }, 900)

    return () => clearInterval(interval)
  }, [view, previewUrl])

  const handleUploadClick = () => {
    setView('uploading')
  }

  const handleFileSelected = (_file: File, url: string) => {
    setPreviewUrl(url)
  }

  const handleClear = () => {
    setPreviewUrl(null)
  }

  const handleAnalyze = () => {
    setEvents([])
    setResult(null)
    setView('processing')
  }

  const handleTryDemo = () => {
    setPreviewUrl(MOCK_IMAGE_URL)
    setEvents([])
    setResult(null)
    setView('processing')
  }

  const handleReset = () => {
    setView('landing')
    setPreviewUrl(null)
    setEvents([])
    setResult(null)
  }

  const handleBackToHome = () => {
    setView('landing')
  }

  const isLive = view === 'processing' && events.length < MOCK_TRACE_EVENTS.length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {view !== 'landing' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToHome}
                aria-label="Back to home"
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2"
              aria-label="Hazsight home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-amber-950">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="font-mono text-base font-bold tracking-tight">
                Hazsight
              </span>
              <Badge variant="secondary" className="ml-1 hidden text-xs sm:inline-flex">
                v0.1.0
              </Badge>
            </button>
          </div>
          <nav className="flex items-center gap-1">
            {view === 'landing' && (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="#how-it-works">How it works</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="#hazards">Hazard types</Link>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" asChild className="rounded-full">
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
                <Sparkles className="h-4 w-4 text-amber-500" />
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
            <ResultsView result={result} onReset={handleReset} />
          </section>
        )}
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border/40 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
            <div className="max-w-md">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-amber-950">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <span className="font-mono text-sm font-bold">Hazsight</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI safety inspector powered by NVIDIA Nemotron on Nebius Token
                Factory. Built by Team DAMR58H for the Nebius x NVIDIA Global AI
                Hackathon.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://github.com/SimonCurda/Hazsight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub repository
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://nebiusglobalaihackathon.devpost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Hackathon page
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border/40 pt-6 text-xs text-muted-foreground">
            <p>
              Licensed under MIT · NVIDIA Nemotron open-source models served on
              Nebius Token Factory · Best Apps &amp; Agents track
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
