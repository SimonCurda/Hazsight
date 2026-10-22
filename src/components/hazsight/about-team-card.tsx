"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import HazsightLogo from "./hazsight-logo";

/**
 * Draft copy — will be replaced with the final team description.
 * Edit the ABOUT object below once the exact text is ready.
 */
const ABOUT = {
  eyebrow: "Meet the team",
  tagline: "The people behind the detector eye",
  intro:
    "We are a six-member team of students from Gymnázium Františka Křižíka in Plzeň, Czech Republic.",
  whyTitle: "Why we built it",
  why: "Fire hazards hide in plain sight — a blocked exit, a daisy-chained power strip, a cardboard box parked on a heater. We wanted a tool that spots them the way a trained inspector would: from a single photo, in seconds.",
  impactTitle: "Why it matters",
  impact:
    "Anyone can point a phone at a room and get an instant, actionable safety report — no expertise, no appointment, no cost barrier. Safer classrooms, dorms, workshops and homes, one photo at a time.",
  meta: ["6 students", "Gymnázium Fr. Křižíka", "Plzeň, Czechia"],
};

export default function BrandAbout({ onHomeClick }: { onHomeClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const enterT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const leaveT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimers = useCallback(() => {
    if (enterT.current) clearTimeout(enterT.current);
    if (leaveT.current) clearTimeout(leaveT.current);
    enterT.current = undefined;
    leaveT.current = undefined;
  }, []);

  const handleEnter = useCallback(() => {
    if (leaveT.current) {
      clearTimeout(leaveT.current);
      leaveT.current = undefined;
    }
    enterT.current = setTimeout(() => setOpen(true), 110);
  }, []);

  const handleLeave = useCallback(() => {
    if (enterT.current) {
      clearTimeout(enterT.current);
      enterT.current = undefined;
    }
    leaveT.current = setTimeout(() => setOpen(false), 230);
  }, []);

  const toggle = useCallback(() => {
    clearTimers();
    setOpen((o) => !o);
  }, [clearTimers]);

  // Escape + click-outside while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // cleanup pending timers on unmount
  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto relative flex items-center gap-2.5"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="About the Hazsight team"
        className="cursor-pointer rounded-lg border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-lime-300/70"
      >
        <HazsightLogo />
      </button>
      <button
        type="button"
        onClick={onHomeClick}
        className="select-none font-mono text-sm tracking-wide text-zinc-300 cursor-pointer hover:text-lime-300 transition-colors border-0 bg-transparent p-0 outline-none"
        aria-label="Hazsight home"
      >
        hazsight
        <span className="blink-cursor text-lime-400">_</span>
      </button>

      {/* team card */}
      <div
        className="about-card"
        data-open={open}
        role="dialog"
        aria-label="About the Hazsight team"
        aria-hidden={!open}
      >
        <button
          type="button"
          className="about-close"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 pr-5">
          <HazsightLogo size={20} />
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-lime-300/80">
              {ABOUT.eyebrow}
            </p>
            <p className="text-xs text-zinc-500">{ABOUT.tagline}</p>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-zinc-200">
          {ABOUT.intro}
        </p>

        <div className="mt-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-lime-300/70">
            {ABOUT.whyTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {ABOUT.why}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-lime-300/70">
            {ABOUT.impactTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {ABOUT.impact}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {ABOUT.meta.map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-zinc-400"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
