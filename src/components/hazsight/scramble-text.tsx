'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  ScrambleText — "decrypt" / "matrix" text effect.                    */
/*  When scrolled into view, each character position cycles through    */
/*  random symbols (/, \, $, #, @, *, letters, digits) and settles     */
/*  on the correct character — cascading left to right.                */
/*  Respects prefers-reduced-motion (shows text instantly).            */
/* ------------------------------------------------------------------ */

// Characters the scramble cycles through — starts with slashes + dollar
// signs (as the user requested), then mixes in letters/digits/symbols.
const SCRAMBLE_CHARS = '/\\$#@*!?<>{}[]+=-_.:;|~^%0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

interface ScrambleTextProps {
  text: string
  className?: string
  /** Frames each character spends scrambling before locking. */
  charDuration?: number
  /** Delay between consecutive characters starting (ms). */
  stagger?: number
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
}

export function ScrambleText({
  text,
  className,
  charDuration = 14, // frames per char (was 8 — longer scramble)
  stagger = 55, // ms between chars (was 35 — slower cascade)
  as = 'span',
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })
  const [reduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  // Scrambling state — only updated via rAF callback (not synchronously in effect)
  const [scrambled, setScrambled] = useState('')

  useEffect(() => {
    if (!isInView || reduced || !text) return

    let raf: number
    let startTime: number | null = null
    const totalChars = text.length

    const lockTimes: number[] = []
    for (let i = 0; i < totalChars; i++) {
      lockTimes.push(i * stagger + charDuration * 16)
    }
    const totalDuration = lockTimes[totalChars - 1] + 50

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime

      let result = ''
      for (let i = 0; i < totalChars; i++) {
        if (text[i] === ' ') {
          result += ' '
          continue
        }
        if (elapsed >= lockTimes[i]) {
          result += text[i]
        } else if (elapsed >= i * stagger) {
          result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        } else {
          result += ' '
        }
      }
      setScrambled(result)

      if (elapsed < totalDuration) {
        raf = requestAnimationFrame(tick)
      } else {
        setScrambled(text)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isInView, text, charDuration, stagger, reduced])

  // Decide what to display:
  // - Not in view / reduced / empty → show the final text (no scramble)
  // - Scrambling in progress → show the scrambled state
  const display = (!isInView || reduced || !text) ? text : (scrambled || text)

  const Component = as
  return (
    <Component ref={ref as never} className={className}>
      {display}
    </Component>
  )
}
