'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  Camera,
  FileText,
  ScanEye,
  ShieldCheck,
  Github,
  ExternalLink,
  Zap,
  Brain,
  Globe,
  ChevronRight,
  Cpu,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const STEPS = [
  {
    icon: Camera,
    title: 'INPUT',
    label: '01. CAPTURE',
    description:
      'Snap a picture of any room, workshop, warehouse, or workspace. Drag-and-drop or browse. JPEG, PNG, WebP accepted.',
  },
  {
    icon: ScanEye,
    title: 'ANALYZE',
    label: '02. SCAN',
    description:
      'Llama 3.2 Vision VLM on Nebius Token Factory scans the frame for blocked exits, flammables near heat, overloaded outlets, trip hazards, missing PPE.',
  },
  {
    icon: FileText,
    title: 'REPORT',
    label: '03. EXPORT',
    description:
      'Each hazard is marked on the image with a severity badge. Download a polished PDF with cited regulations and recommendations.',
  },
]

const HAZARD_TYPES = [
  'Blocked emergency exit',
  'Flammable near heat source',
  'Overloaded electrical outlet',
  'Trip / fall hazards',
  'Missing PPE',
  'Unauthorized zone entry',
  'Unsafe machinery proximity',
  'Risky behavior',
]

const TECH_STACK = [
  { label: 'NEBIUS_TOKEN_FACTORY', icon: Zap },
  { label: 'NEMOTRON_3_ULTRA', icon: Brain },
  { label: 'NEMOTRON_3_SUPER', icon: Zap },
  { label: 'LLAMA_3.2_VISION_VLM', icon: ScanEye },
  { label: 'TAVILY_LIVE_SEARCH', icon: Globe },
  { label: 'NEXT.JS_16', icon: Cpu },
]

interface LandingViewProps {
  onUploadClick: () => void
}

export function LandingView({ onUploadClick }: LandingViewProps) {
  return (
    <>
      {/* Hero — industrial AI vision system */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Grid + dot matrix background */}
        <div className="absolute inset-0 -z-10 hazsight-grid-bg" aria-hidden />
        <div className="absolute inset-0 -z-10 hazsight-dot-bg opacity-50" aria-hidden />
        {/* Radial amber glow */}
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, oklch(0.75 0.18 65 / 0.15) 0%, transparent 60%)',
          }}
          aria-hidden
        />
        {/* Scan line animation */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="hazsight-scanline" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status badge — terminal style */}
            <div className="mb-6 inline-flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/5 px-3 py-1.5 hazsight-readout text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <span className="text-amber-400">SYSTEM_ONLINE</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">NEBIUS_X_NVIDIA_HACKATHON</span>
            </div>

            {/* Title — tech readout style */}
            <h1 className="hazsight-readout text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              <span className="text-muted-foreground">{'>'}</span>{' '}
              HAZSIGHT
            </h1>
            <p className="hazsight-readout mt-2 text-lg text-amber-400/90 sm:text-xl">
              AI SAFETY INSPECTOR · V0.1.0
            </p>

            {/* Tagline */}
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
              Upload a photo. The{' '}
              <span className="text-amber-400">Nemotron 3 Ultra</span> reasoning
              engine detects safety hazards — blocked exits, flammables near
              heat, overloaded outlets — marks them on the image with severity
              badges, and generates a polished PDF report with cited
              regulations. <span className="text-amber-400">In 30 seconds.</span>
            </p>

            {/* CTA — terminal-style buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onUploadClick}
                className="hazsight-readout gap-2 border border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                style={{
                  boxShadow:
                    '0 0 16px oklch(0.75 0.18 65 / 0.2), inset 0 0 8px oklch(0.75 0.18 65 / 0.05)',
                }}
              >
                <Camera className="h-4 w-4" />
                [ INITIATE_SCAN ]
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="hazsight-readout gap-2 border-border/60"
              >
                <a
                  href="https://github.com/SimonCurda/Hazsight"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  VIEW_SOURCE
                </a>
              </Button>
            </div>
            <p className="hazsight-readout mt-4 text-xs text-muted-foreground">

            </p>
          </div>
        </div>

        {/* Bottom border — tech divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
      </section>

      {/* How it works — HUD-styled cards */}
      <section
        id="how-it-works"
        className="relative container mx-auto max-w-6xl scroll-mt-20 px-4 py-20"
      >
        <div className="mb-12">
          <p className="hazsight-readout text-xs uppercase tracking-widest text-amber-400/70">

          </p>
          <h2 className="hazsight-readout mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-muted-foreground">{'>'}</span> three_step_pipeline
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <Card
              key={step.title}
              className="hazsight-hud relative overflow-hidden border-border/60 bg-card/50 transition-colors hover:border-amber-500/50"
            >
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded border border-amber-500/40 bg-amber-500/5 text-amber-400">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="hazsight-readout text-xs text-muted-foreground">
                    {step.label}
                  </span>
                </div>
                <CardTitle className="hazsight-readout text-2xl">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </CardDescription>
              </CardContent>
              {/* Bottom corner indicator */}
              <div className="absolute bottom-2 right-2 hazsight-readout text-[10px] text-muted-foreground/40">
                {String(idx + 1).padStart(2, '0')}/03
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hazard types — terminal-style list */}
      <section
        id="hazards"
        className="relative scroll-mt-20 border-y border-border/40 bg-muted/20"
      >
        <div className="absolute inset-0 -z-10 hazsight-grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12">
            <p className="hazsight-readout text-xs uppercase tracking-widest text-amber-400/70">

            </p>
            <h2 className="hazsight-readout mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-muted-foreground">{'>'}</span> hazard_categories
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              8 hazard classes detected by Nemotron 3 Ultra · severity scored LOW → CRITICAL
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2">
            {HAZARD_TYPES.map((hazard, idx) => (
              <div
                key={hazard}
                className="hazsight-readout flex items-center gap-3 rounded border border-border/40 bg-card/40 px-3 py-2 text-sm transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
              >
                <span className="text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">{hazard}</span>
                <span className="text-[10px] text-muted-foreground">
                  [{String(idx + 1).padStart(2, '0')}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack — terminal output */}
      <section className="relative container mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12">
          <p className="hazsight-readout text-xs uppercase tracking-widest text-amber-400/70">

          </p>
          <h2 className="hazsight-readout mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-muted-foreground">{'>'}</span> infrastructure
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Open-source models · Nebius Token Factory · OpenAI-compatible API
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-black/40 p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="hazsight-readout text-xs text-muted-foreground">
              hazsight@nebius:~$ cat ./config/stack.txt
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.label}
                className="hazsight-readout flex items-center gap-2 rounded border border-border/40 bg-card/40 px-3 py-2 text-sm"
              >
                <tech.icon className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-foreground/90">{tech.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 hazsight-readout text-xs text-muted-foreground">
            <span className="text-emerald-400">{'// compliance: '}</span>
            RUNS_ON_NEBIUS_TOKEN_FACTORY · USES_NVIDIA_NEMOTRON · BEST_APPS_AND_AGENTS_TRACK
          </div>
        </div>
      </section>

      {/* CTA — final scan prompt */}
      <section className="relative border-t border-border/40">
        <div className="absolute inset-0 -z-10 hazsight-grid-bg opacity-40" aria-hidden />
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, oklch(0.75 0.18 65 / 0.08) 0%, transparent 70%)',
          }}
          aria-hidden
        />
        <div className="container mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/5 hazsight-glow-amber">
            <ShieldCheck className="h-8 w-8 text-amber-400" />
          </div>
          <p className="hazsight-readout text-xs uppercase tracking-widest text-amber-400/70">

          </p>
          <h2 className="hazsight-readout mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-muted-foreground">{'>'}</span> initiate_scan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Drop a photo. Get a report. See what your safety audit has been missing.
          </p>
          <Button
            size="lg"
            onClick={onUploadClick}
            className="hazsight-readout mt-8 gap-2 border border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            style={{
              boxShadow:
                '0 0 16px oklch(0.75 0.18 65 / 0.2), inset 0 0 8px oklch(0.75 0.18 65 / 0.05)',
            }}
          >
            <Camera className="h-4 w-4" />
            [ UPLOAD_PHOTO ]
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  )
}
