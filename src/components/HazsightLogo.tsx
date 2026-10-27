"use client";

import { useEffect, useRef } from "react";

/**
 * HazsightLogo — an interactive "detector eye".
 *
 * • The pupil follows the mouse cursor anywhere on the page (lerped).
 * • On touch devices / idle it wanders on its own (lissajous drift).
 * • It blinks periodically (CSS) and on hover locks focus:
 *   dashed radar ring spins + sonar scan accelerates + badge glows.
 * • Honors prefers-reduced-motion (fully static).
 */
export default function HazsightLogo({ size = 30 }: { size?: number }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const pupilRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pupil = pupilRef.current;
    if (!root || !pupil) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX = 3.0; // max pupil offset in SVG user units
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let following = false;
    let idleT = Math.random() * 4000; // desync idle wander between loads

    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      // closer cursor → wider eye movement (0.55 … 1.0 intensity)
      const intensity = 0.55 + 0.45 * Math.min(dist, 160) / 160;
      tx = (dx / dist) * MAX * intensity;
      ty = (dy / dist) * MAX * intensity;
      following = true;
    };
    const onBlurWin = () => {
      following = false;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("blur", onBlurWin);

    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 50);
      last = now;

      if (!following) {
        // autonomous wander while idle (also covers touch devices)
        idleT += dt;
        const t = idleT / 1000;
        tx = Math.sin(t * 0.9) * 1.7 + Math.sin(t * 0.33) * 0.8;
        ty = Math.cos(t * 0.7) * 1.3;
      }

      const k = Math.min(1, dt / 90); // exponential smoothing
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      pupil.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", onBlurWin);
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className="logo-badge h-8 w-8"
      role="img"
      aria-label="Hazsight detector eye logo"
    >
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="hz-iris" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="55%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </radialGradient>
        </defs>

        {/* sonar scan ring (always) */}
        <circle
          className="logo-scan"
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="rgba(52,211,153,0.55)"
          strokeWidth="1"
        />
        {/* sonar ring only on hover — faster pulse */}
        <circle
          className="logo-scan-fast"
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="rgba(52,211,153,0.8)"
          strokeWidth="1.2"
        />

        {/* eye + pupil (pupil moved by JS) */}
        <g className="logo-eye">
          <path
            d="M7 20 C 12.5 12.5, 27.5 12.5, 33 20 C 27.5 27.5, 12.5 27.5, 7 20 Z"
            fill="rgba(52,211,153,0.08)"
            stroke="rgba(52,211,153,0.85)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <g ref={pupilRef}>
            <circle cx="20" cy="20" r="5" fill="url(#hz-iris)" />
            <circle cx="20" cy="20" r="2.1" fill="#022c22" />
            <circle cx="21.5" cy="18.4" r="0.9" fill="#d1fae5" />
          </g>
        </g>

        {/* dashed focus-lock ring (hover) */}
        <circle
          className="logo-focus"
          cx="20"
          cy="20"
          r="9.5"
          fill="none"
          stroke="#34d399"
          strokeWidth="1"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
