"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Continuous code typewriter — appends fragments, never clears.      */
/*  Like a terminal: code keeps flowing downward.                     */
/* ------------------------------------------------------------------ */

// Hardcoded fallback fragments (used if API fails or during SSR)
const FALLBACK_FRAGMENTS: string[][] = [
  ["// nebius.ts", 'const client = new OpenAI({', '  baseURL: "https://api.tokenfactory.nebius.com/v1/",', '  apiKey: process.env.NEBIUS_API_KEY,', "});"],
  ["// tavily.ts", "export async function searchAllRegulations(hazards) {", "  for (const h of uniqueCategories) {", "    const results = await searchRegulations(h.category);", "    citations.push({ hazard_category, results });", "  }", "}"],
  ["// /api/analyze", "const jobId = createJob(imageUrl, imageBase64);", "await runAnalysis(jobId, imageBase64);", "return NextResponse.json({ job_id: jobId });"],
  ["// pdf-report.tsx", "<Document>", "  <Page size='A4'>", "    <Text style={styles.title}>Safety Audit</Text>", "  </Page>", "</Document>"],
  ["# schemas.py", "class BoundingBox(BaseModel):", "    x: float = Field(ge=0, le=100)", "    y: float = Field(ge=0, le=100)"],
  ["// job-store.ts", "export function createJob(url, base64) {", "  const id = `job-${Date.now()}-${random}`;", "  jobs.set(id, { status: 'queued', traceEvents: [] });", "  return id;", "}"],
]

// Will be populated from API on mount, falls back to FALLBACK_FRAGMENTS
let FRAGMENTS: string[][] = FALLBACK_FRAGMENTS;

/* ---- syntax highlighter ---- */

type Ch = { c: string; k: string };

const TOKEN_RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|\b(import|from|export|const|function|return|new|let|type|default|true|false|class)\b|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*|\/>|\/?>)|([A-Za-z_$][\w$]*(?=\())|([{}:,;=()[\].])|(\s)/g;

const GROUP_CLASS = ["tk-com","tk-str","tk-key","tk-num","tk-tag","tk-fn","tk-pun","tk-txt"];

function tokenize(line: string): Ch[] {
  const out: Ch[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) for (const c of line.slice(last, idx)) out.push({ c, k: "tk-txt" });
    let cls = "tk-txt";
    for (let g = 1; g <= GROUP_CLASS.length; g++) {
      if (m[g] !== undefined) { cls = GROUP_CLASS[g - 1]; break; }
    }
    for (const c of m[0]) out.push({ c, k: cls });
    last = idx + m[0].length;
  }
  if (last < line.length) for (const c of line.slice(last)) out.push({ c, k: "tk-txt" });
  return out;
}

function pickRandom(avoid: number[]): number {
  let idx: number, tries = 0;
  do { idx = Math.floor(Math.random() * FRAGMENTS.length); tries++; }
  while (avoid.includes(idx) && tries < 20);
  return idx;
}

/* ---- typing engine ---- */

const CHAR_MS = 16;
const LINE_PAUSE = 120;
const FRAGMENT_GAP = 400; // pause between fragments
const MAX_LINES = 16; // remove old lines when exceeding this

type ColState = {
  el: HTMLDivElement;
  fragIdx: number;
  chars: HTMLSpanElement[];
  ptr: number;
  nextAt: number;
  phase: "wait" | "type" | "gap";
  startDelay: number;
  lineEls: HTMLDivElement[];
  caret: HTMLDivElement | null;
  lineLens: number[];
  charW: number;
};

export default function CodeBackground() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch real code snippets from the API (reads actual source files)
    fetch('/api/code-snippets')
      .then((res) => res.json())
      .then((data) => {
        if (data.snippets && data.snippets.length >= 2) {
          FRAGMENTS = data.snippets
        }
      })
      .catch(() => {
        // Keep FALLBACK_FRAGMENTS
      })

    const cols = [leftRef.current, rightRef.current].filter(Boolean) as HTMLDivElement[];
    if (cols.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // FIX: create states with placeholder fragIdx, then fix second column
    const states: ColState[] = cols.map((el, i) => ({
      el,
      fragIdx: 0, // placeholder — fixed below
      chars: [],
      ptr: 0,
      nextAt: 0,
      phase: "wait" as const,
      startDelay: i === 0 ? 300 : 1200,
      lineEls: [],
      caret: null,
      lineLens: [],
      charW: 7.8,
    }));

    // Now safely assign random fragments (states is fully initialized)
    states[0].fragIdx = pickRandom([]);
    states[1].fragIdx = pickRandom([states[0].fragIdx]);

    function appendFragment(s: ColState) {
      const lines = FRAGMENTS[s.fragIdx];

      // Add separator
      if (s.lineEls.length > 0) {
        const sep = document.createElement("div");
        sep.className = "code-line";
        sep.style.opacity = "0.3";
        sep.innerHTML = '<span class="tk-com" style="visibility:visible">// ─── next ───</span>';
        s.el.appendChild(sep);
        s.lineEls.push(sep);
      }

      s.chars = [];
      s.ptr = 0;
      s.lineLens = [];

      for (let li = 0; li < lines.length; li++) {
        const lineDiv = document.createElement("div");
        lineDiv.className = "code-line";
        const chs = tokenize(lines[li]);
        for (const ch of chs) {
          const span = document.createElement("span");
          span.className = ch.k;
          span.textContent = ch.c;
          span.style.visibility = "hidden";
          lineDiv.appendChild(span);
          s.chars.push(span);
        }
        s.el.appendChild(lineDiv);
        s.lineEls.push(lineDiv);
        s.lineLens.push(chs.length);
      }

      // Create/update caret
      if (!s.caret) {
        s.caret = document.createElement("div");
        s.caret.className = "code-caret";
        s.caret.textContent = "_";
        s.caret.style.opacity = "0";
      }
      s.el.appendChild(s.caret);
      s.caret.style.opacity = "1";
      // Position caret at start
      s.caret.style.transform = "translate(0px, 0px)";

      // Remove old lines if exceeding MAX_LINES
      while (s.lineEls.length > MAX_LINES) {
        const old = s.lineEls.shift();
        if (old) old.remove();
      }
    }

    // Initialize both columns
    states.forEach((s) => appendFragment(s));

    if (reduced) {
      for (const s of states) {
        s.chars.forEach((c) => (c.style.visibility = "visible"));
      }
      return;
    }

    let raf = 0;
    const t0 = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;

      for (const s of states) {
        if (s.el.offsetParent === null) continue;
        switch (s.phase) {
          case "wait":
            if (t >= s.startDelay) {
              s.phase = "type";
              s.nextAt = t;
            }
            break;
          case "type":
            let guard = 0;
            while (t >= s.nextAt && s.ptr < s.chars.length && guard++ < 8) {
              s.chars[s.ptr].style.visibility = "visible";
              s.ptr++;
              s.nextAt += CHAR_MS;
            }
            // Move caret to next typing position
            if (s.caret && s.ptr < s.chars.length) {
              // Calculate line + char position from ptr
              let remaining = s.ptr;
              let line = 0;
              let chInLine = 0;
              for (let li = 0; li < s.lineLens.length; li++) {
                if (remaining < s.lineLens[li]) {
                  line = li;
                  chInLine = remaining;
                  break;
                }
                remaining -= s.lineLens[li];
              }
              s.caret.style.transform = `translate(${chInLine * s.charW}px, ${line * LINE_H}px)`;
            }
            if (s.ptr >= s.chars.length) {
              const others = states.filter((o) => o !== s).map((o) => o.fragIdx);
              s.fragIdx = pickRandom([s.fragIdx, ...others]);
              s.phase = "gap";
              s.nextAt = t + FRAGMENT_GAP;
              if (s.caret) s.caret.style.opacity = "0";
            }
            break;
          case "gap":
            if (t >= s.nextAt) {
              // Append next fragment below (continuous flow)
              appendFragment(s);
              s.phase = "type";
              s.nextAt = t;
            }
            break;
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="code-layer" aria-hidden="true">
      <div className="code-cols">
        <div className="code-col" ref={leftRef} />
        <div className="code-col" ref={rightRef} style={{ transform: "translateY(-36px)" }} />
      </div>
    </div>
  );
}
