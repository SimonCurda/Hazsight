'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
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
  Activity,
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
import { ScrambleText } from './scramble-text'

const STEPS = [
  {
    icon: Camera,
    title: 'Capture',
    label: '01',
    description:
      'Snap a picture of any room, workshop, warehouse, or workspace. Drag-and-drop or browse — JPEG, PNG, WebP accepted.',
  },
  {
    icon: ScanEye,
    title: 'Scan',
    label: '02',
    description:
      'Llama 3.2 Vision VLM on Nebius Token Factory scans the frame for blocked exits, flammables near heat, overloaded outlets, trip hazards, missing PPE.',
  },
  {
    icon: FileText,
    title: 'Export',
    label: '03',
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
  { label: 'Nebius Token Factory', icon: Zap },
  { label: 'Nemotron 3 Ultra', icon: Brain },
  { label: 'Nemotron 3 Super', icon: Zap },
  { label: 'Llama 3.2 Vision VLM', icon: ScanEye },
  { label: 'Tavily Live Search', icon: Globe },
  { label: 'Next.js 16', icon: Cpu },
]

// Framer Motion variants for scroll-triggered animations
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

interface LandingViewProps {
  onUploadClick: () => void
}

export function LandingView({ onUploadClick }: LandingViewProps) {
  return (
    <>
      {/* Hero — refined, big-tech aesthetic */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Ambient gradient (breathing) */}
        <div className="absolute inset-0 -z-10 hazsight-ambient" aria-hidden />
        {/* Grid background — checkerboard pattern (both vertical + horizontal) */}
        <div className="absolute inset-0 -z-10 hazsight-grid-bg opacity-60" aria-hidden />

        <div className="container mx-auto max-w-6xl px-4 py-24 md:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="mx-auto max-w-3xl text-center"
          >
            {/* Title — `>` prefix in mono, name in sans */}
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              <span className="hazsight-readout text-muted-foreground/60">{'>'}</span>{' '}
              Hazsight
            </h1>
            <p className="hazsight-readout mt-3 text-base text-lime-400/80 sm:text-lg">
              AI safety inspector
            </p>

            {/* Tagline — refined sans */}
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
              Upload a photo. The{' '}
              <span className="text-lime-400">Nemotron 3 Ultra</span> reasoning
              engine detects safety hazards — blocked exits, flammables near
              heat, overloaded outlets — marks them on the image with severity
              badges, and generates a polished PDF report with cited
              regulations. <span className="text-lime-400">In 30 seconds.</span>
            </p>

            {/* CTA — `[ Initiate scan ]` (mono with brackets) + View source (sans) */}
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onUploadClick}
                className="hazsight-readout hazsight-glow-hover gap-2 border border-lime-500/40 bg-lime-500/10 text-lime-400 hover:bg-lime-500/20 hover:text-lime-300"
              >
                <Camera className="h-4 w-4" />
                [ Initiate scan ]
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <a
                  href="https://github.com/SimonCurda/Hazsight"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  View source
                </a>
              </Button>
            </div>
            <p className="hazsight-readout mt-6 text-xs text-muted-foreground">
              MIT licensed · No signup required · Demo runs without API key
            </p>

          {/* NVIDIA + Nebius badges — official logos with proper clear space */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            {/* NVIDIA — official horizontal logo, white version for dark bg */}
            <div className="flex items-center gap-4 rounded-lg border border-lime-500/30 bg-lime-500/5 px-6 py-3">
              <img src="/nvidia-logo-official.png" alt="NVIDIA" className="h-8 w-auto" />
              <span className="hazsight-readout text-[11px] text-muted-foreground border-l border-lime-500/20 pl-4">
                Nemotron · Llama 3.2 Vision
              </span>
            </div>
            <span className="text-muted-foreground/40 text-xs">+</span>
            <div className="flex items-center gap-2 rounded-lg border border-lime-500/30 bg-lime-500/5 px-4 py-2">
              <img src="/nebius-logo.svg" alt="Nebius" className="h-6" />
              <span className="hazsight-readout text-[10px] text-muted-foreground border-l border-lime-500/20 pl-2">
                Token Factory
              </span>
            </div>
          </div>
          </motion.div>
        </div>

        {/* Bottom border — subtle gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" />
      </section>

      {/* Process flow */}
      <motion.section
        id="how-it-works"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
        className="container mx-auto max-w-6xl scroll-mt-20 px-4 py-24"
      >
        <div className="mb-16">
          <p className="hazsight-readout text-xs uppercase tracking-widest text-lime-400/60">
            {'// Process'}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <ScrambleText text="Three-step pipeline" as="span" />
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            No 8-hour safety audits. No external inspector visits. Just upload, scan, export.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.title}
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
            >
              <Card className="hazsight-glass hazsight-hud hazsight-hover-lift relative h-full overflow-hidden border-border/40 bg-card/60">
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime-500/30 bg-lime-500/5 text-lime-400">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="hazsight-readout text-xs text-muted-foreground/60">
                      {step.label}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    <ScrambleText text={step.title} as="span" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Detection catalog */}
      <motion.section
        id="hazards"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
        className="relative scroll-mt-20 border-y border-border/40 bg-muted/10"
      >
        <div className="absolute inset-0 -z-10 hazsight-grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4 py-24">
          <div className="mb-16">
            <p className="hazsight-readout text-xs uppercase tracking-widest text-lime-400/60">
              {'// Detection'}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <ScrambleText text="What Hazsight detects" as="span" />
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              8 hazard classes detected by Nemotron 3 Ultra. Severity scored Low → Critical.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2">
            {HAZARD_TYPES.map((hazard, idx) => (
              <motion.div
                key={hazard}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="hazsight-glass hazsight-readout flex items-center gap-3 rounded-lg border border-border/40 bg-card/60 px-4 py-3 text-sm transition-all hover:border-lime-500/40 hover:bg-lime-500/5"
              >
                <span className="text-lime-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-foreground/90"><ScrambleText text={hazard} as="span" /></span>
                <span className="text-[10px] text-muted-foreground/60">
                  [{String(idx + 1).padStart(2, '0')}]
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Infrastructure */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
        className="container mx-auto max-w-6xl px-4 py-24"
      >
        <div className="mb-16">
          <p className="hazsight-readout text-xs uppercase tracking-widest text-lime-400/60">
            {'// Infrastructure'}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <ScrambleText text="Built on open infrastructure" as="span" />
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Open-source NVIDIA models · Nebius Token Factory · OpenAI-compatible API
          </p>
        </div>

        <div className="hazsight-glass rounded-xl border border-border/40 bg-card/60 p-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map((tech, idx) => (
              <motion.div
                key={tech.label}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-4 py-3"
              >
                <tech.icon className="h-4 w-4 text-lime-400" />
                <span className="text-sm font-medium text-foreground/90">{tech.label}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 border-t border-border/40 pt-4">
            <p className="hazsight-readout text-xs text-muted-foreground">
              <span className="text-emerald-400/80">{'// Compliance: '}</span>
              Runs on Nebius Token Factory · Uses NVIDIA Nemotron open-source models · Best Apps &amp; Agents track
            </p>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionVariants}
        className="relative border-t border-border/40"
      >
        <div className="absolute inset-0 -z-10 hazsight-grid-bg opacity-40" aria-hidden />
        <div className="absolute inset-0 -z-10 hazsight-ambient opacity-50" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-lime-500/30 bg-lime-500/5"
            style={{ boxShadow: '0 0 32px oklch(0.78 0.17 125 / 0.15)' }}
          >
            <ShieldCheck className="h-7 w-7 text-lime-400" />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <ScrambleText text="Ready to inspect?" as="span" />
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Drop a photo. Get a report. See what your safety audit has been missing.
          </p>
          <Button
            size="lg"
            onClick={onUploadClick}
            className="hazsight-readout hazsight-glow-hover mt-10 gap-2 border border-lime-500/40 bg-lime-500/10 text-lime-400 hover:bg-lime-500/20 hover:text-lime-300"
          >
            <Camera className="h-4 w-4" />
            [ Upload photo ]
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.section>
    </>
  )
}
