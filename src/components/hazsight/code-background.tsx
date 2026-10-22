"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Continuous code typewriter — reads actual source files via API.   */
/*  2 columns, each typing different random snippets.                  */
/*  Blinking _ cursor. Hover on a line → line glows.                  */
/* ------------------------------------------------------------------ */

const FALLBACK: string[][] = [
  ["// nebius.ts", 'const client = new OpenAI({', '  baseURL: "https://api.tokenfactory.nebius.com/v1/",', "});"],
  ["// tavily.ts", "export async function searchAllRegulations(hazards) {", "  for (const h of uniqueCategories) {", "    const results = await searchRegulations(h.category);", "  }", "}"],
  ["// /api/analyze", "const jobId = createJob(imageUrl, imageBase64);", "await runAnalysis(jobId, imageBase64);"],
  ["# schemas.py", "class BoundingBox(BaseModel):", "    x: float = Field(ge=0, le=100)", "    y: float = Field(ge=0, le=100)"],
];

type Ch = { c: string; k: string };

const TOKEN_RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|\b(import|from|export|const|function|return|new|let|type|default|true|false|class)\b|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*|\/>|\/?>)|([A-Za-z_$][\w$]*(?=\())|([{}:,;=()[\].])|(\s)/g;
const CLS = ["tk-com","tk-str","tk-key","tk-num","tk-tag","tk-fn","tk-pun","tk-txt"];

function tokenize(line: string): Ch[] {
  const out: Ch[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const i = m.index ?? 0;
    if (i > last) for (const c of line.slice(last, i)) out.push({ c, k: "tk-txt" });
    let k = "tk-txt";
    for (let g = 1; g <= CLS.length; g++) { if (m[g] !== undefined) { k = CLS[g-1]; break; } }
    for (const c of m[0]) out.push({ c, k });
    last = i + m[0].length;
  }
  if (last < line.length) for (const c of line.slice(last)) out.push({ c, k: "tk-txt" });
  return out;
}

function pick(avoid: number[], max: number): number {
  let idx: number, t = 0;
  do { idx = Math.floor(Math.random() * max); t++; }
  while (avoid.includes(idx) && t < 20);
  return idx;
}

const LINE_H = 22;
const CHAR_MS = 16;
const GAP_MS = 350;
const MAX_LINES = 14;

type State = {
  el: HTMLDivElement;
  frags: string[][];
  fragIdx: number;
  chars: HTMLSpanElement[];
  lineLens: number[];
  ptr: number;
  nextAt: number;
  phase: "wait" | "type" | "gap";
  delay: number;
  caret: HTMLDivElement | null;
  charW: number;
};

export default function CodeBackground() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const cols = [leftRef.current, rightRef.current].filter(Boolean) as HTMLDivElement[];
    if (cols.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fetch real snippets from codebase, THEN start typing
    fetch("/api/code-snippets")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const snippets: string[][] = data.snippets?.length >= 2 ? data.snippets : FALLBACK;
        start(snippets);
      })
      .catch(() => {
        if (cancelled) return;
        start(FALLBACK);
      });

    function start(snippets: string[][]) {
      // Assign different starting fragments to each column
      const states: State[] = cols.map((el, i) => {
        const firstIdx = i === 0 ? pick([], snippets.length) : pick([cols.length > 0 ? 0 : -1], snippets.length);
        return {
          el,
          frags: snippets,
          fragIdx: firstIdx,
          chars: [],
          lineLens: [],
          ptr: 0,
          nextAt: 0,
          phase: "wait" as const,
          delay: i === 0 ? 200 : 1000,
          caret: null,
          charW: 7.8,
        };
      });

      // Fix second column to avoid first column's fragment
      if (states.length > 1) {
        states[1].fragIdx = pick([states[0].fragIdx], snippets.length);
      }

      function build(s: State) {
        const lines = s.frags[s.fragIdx];
        // Separator between fragments
        if (s.chars.length > 0 || s.el.children.length > 0) {
          const sep = document.createElement("div");
          sep.className = "code-line";
          sep.style.opacity = "0.25";
          sep.innerHTML = '<span class="tk-com" style="visibility:visible">// ───</span>';
          s.el.appendChild(sep);
        }
        s.chars = [];
        s.lineLens = [];
        s.ptr = 0;
        for (let li = 0; li < lines.length; li++) {
          const div = document.createElement("div");
          div.className = "code-line";
          const chs = tokenize(lines[li]);
          for (const ch of chs) {
            const sp = document.createElement("span");
            sp.className = ch.k;
            sp.textContent = ch.c;
            sp.style.visibility = "hidden";
            div.appendChild(sp);
            s.chars.push(sp);
          }
          s.el.appendChild(div);
          s.lineLens.push(chs.length);
        }
        // Create caret if not exists
        if (!s.caret) {
          s.caret = document.createElement("div");
          s.caret.className = "code-caret";
          s.caret.textContent = "_";
          s.caret.style.opacity = "0";
        }
        s.el.appendChild(s.caret);
        s.caret.style.opacity = "1";
        s.caret.style.transform = "translate(0px, 0px)";
        // Remove old lines if too many
        while (s.el.querySelectorAll(".code-line").length > MAX_LINES) {
          const first = s.el.querySelector(".code-line");
          if (first) first.remove();
        }
      }

      // Initialize both columns
      states.forEach((s) => build(s));

      if (reduced) {
        for (const s of states) {
          s.chars.forEach((c) => (c.style.visibility = "visible"));
          if (s.caret) s.caret.style.opacity = "0";
        }
        return;
      }

      let raf = 0;
      const t0 = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        raf = requestAnimationFrame(tick);
        const t = now - t0;

        for (const s of states) {
          if (s.el.offsetParent === null) continue;
          switch (s.phase) {
            case "wait":
              if (t >= s.delay) { s.phase = "type"; s.nextAt = t; }
              break;
            case "type":
              let guard = 0;
              while (t >= s.nextAt && s.ptr < s.chars.length && guard++ < 8) {
                s.chars[s.ptr].style.visibility = "visible";
                s.ptr++;
                s.nextAt += CHAR_MS;
              }
              // Move caret
              if (s.caret && s.ptr < s.chars.length) {
                let rem = s.ptr, line = 0, ch = 0;
                for (let li = 0; li < s.lineLens.length; li++) {
                  if (rem < s.lineLens[li]) { line = li; ch = rem; break; }
                  rem -= s.lineLens[li];
                }
                s.caret.style.transform = `translate(${ch * s.charW}px, ${line * LINE_H}px)`;
              }
              if (s.ptr >= s.chars.length) {
                // Pick next random fragment (different from current + other columns)
                const others = states.filter((o) => o !== s).map((o) => o.fragIdx);
                s.fragIdx = pick([s.fragIdx, ...others], s.frags.length);
                s.phase = "gap";
                s.nextAt = t + GAP_MS;
                if (s.caret) s.caret.style.opacity = "0";
              }
              break;
            case "gap":
              if (t >= s.nextAt) {
                build(s);
                s.phase = "type";
                s.nextAt = t;
              }
              break;
          }
        }
      };

      raf = requestAnimationFrame(tick);
    }

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="code-layer" aria-hidden="true">
      <div className="code-cols" style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
        <div className="code-col" ref={leftRef} style={{ flex: "1 1 0", minWidth: 0, maxWidth: "400px" }} />
        <div className="code-col" ref={rightRef} style={{ flex: "1 1 0", minWidth: 0, maxWidth: "400px", transform: "translateY(-36px)" }} />
      </div>
    </div>
  );
}
