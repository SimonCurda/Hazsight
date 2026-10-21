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
    title: '1. Upload a photo',
    description:
      'Snap a picture of any room, workshop, warehouse, or workspace. Drag-and-drop or browse — JPEG, PNG, WebP all accepted.',
  },
  {
    icon: ScanEye,
    title: '2. Nemotron VLM analyzes',
    description:
      'An NVIDIA-served Vision-Language Model on Nebius Token Factory scans the frame for blocked exits, flammables near heat, overloaded outlets, trip hazards, missing PPE, and more.',
  },
  {
    icon: FileText,
    title: '3. Get an annotated report',
    description:
      'Each detected hazard is marked directly on the image with a severity badge (Low / Medium / High / Critical). Download a polished PDF with cited regulations and recommendations.',
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
  { label: 'Nebius Token Factory', icon: Zap },
  { label: 'NVIDIA Nemotron 3 Ultra', icon: Brain },
  { label: 'Nemotron 3 Super', icon: Zap },
  { label: 'Llama 3.2 Vision VLM', icon: ScanEye },
  { label: 'Tavily Live Search', icon: Globe },
  { label: 'Next.js 16', icon: FileText },
]

interface LandingViewProps {
  onUploadClick: () => void
}

export function LandingView({ onUploadClick }: LandingViewProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, oklch(0.85 0.18 75) 0, transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.7 0.2 50) 0, transparent 50%)',
          }}
          aria-hidden
        />
        <div className="container mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Nebius x NVIDIA Global AI Hackathon
            </Badge>
            <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              See the hazards
              <br />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                before they see you
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Upload a photo of any room. Hazsight&apos;s AI inspector detects
              safety risks — blocked exits, flammables near heat, overloaded
              outlets — marks them on the image, and generates a polished PDF
              report with cited regulations. In 30 seconds.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="gap-2 bg-amber-500 text-amber-950 hover:bg-amber-400"
                onClick={onUploadClick}
              >
                <Camera className="h-4 w-4" />
                Upload a photo
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a
                  href="https://github.com/SimonCurda/Hazsight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <Github className="h-4 w-4" />
                  View source
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free during hackathon · MIT licensed · No signup required for demo
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="container mx-auto max-w-6xl scroll-mt-20 px-4 py-20"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps. One report.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No 8-hour safety audits. No external inspector visits. Just upload,
            analyze, download.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title} className="relative overflow-hidden">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <CardTitle className="font-mono">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Hazard types */}
      <section
        id="hazards"
        className="border-y border-border/40 bg-muted/30 scroll-mt-20"
      >
        <div className="container mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
              What Hazsight detects
            </h2>
            <p className="mt-3 text-muted-foreground">
              Eight hazard categories, each with severity assessment and
              corrective recommendations generated by Nemotron 3 Ultra.
            </p>
          </div>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {HAZARD_TYPES.map((hazard) => (
              <Badge
                key={hazard}
                variant="outline"
                className="gap-1.5 px-3 py-1.5 text-sm"
              >
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                {hazard}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Built on open infrastructure
          </h2>
          <p className="mt-3 text-muted-foreground">
            Powered by NVIDIA open-source models served on Nebius Token
            Factory. Hackathon-compliant by design.
          </p>
        </div>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          {TECH_STACK.map((tech) => (
            <Badge
              key={tech.label}
              variant="secondary"
              className="gap-2 px-4 py-2 text-sm"
            >
              <tech.icon className="h-4 w-4 text-amber-500" />
              {tech.label}
            </Badge>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            The agent reasoning trace is visible in the UI — you can watch
            Nemotron 3 Ultra plan, the VLM analyze, and the report synthesize
            in real time. Then replay the whole trace after the fact.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-gradient-to-b from-transparent to-amber-500/5">
        <div className="container mx-auto max-w-6xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to inspect?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Drop a photo. Get a report. See what your safety audit has been
            missing.
          </p>
          <Button
            size="lg"
            className="mt-8 gap-2 bg-amber-500 text-amber-950 hover:bg-amber-400"
            onClick={onUploadClick}
          >
            <Camera className="h-4 w-4" />
            Upload a photo
          </Button>
        </div>
      </section>
    </>
  )
}
