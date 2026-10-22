"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Static code background — reads actual source files via API.        */
/*  2 columns of syntax-highlighted code (all visible, no typing).     */
/*  Mouse parallax: cursor subtly shifts the columns.                  */
/*  Line hover: individual lines enlarge + glow (CSS .code-line:hover).*/
/*  No cursor glow, no carets, no typing animation (per user request).  */
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

/** Render a set of snippets as static, syntax-highlighted code lines into a column. */
function renderColumn(col: HTMLDivElement, snippets: string[][], startIdx: number) {
  col.innerHTML = "";
  // Stack 3 snippets (cycling through the array) to fill the visible column height
  const count = Math.min(3, snippets.length);
  let idx = startIdx;
  for (let i = 0; i < count; i++) {
    const lines = snippets[idx];
    for (const line of lines) {
      const div = document.createElement("div");
      div.className = "code-line";
      const chs = tokenize(line);
      for (const ch of chs) {
        const sp = document.createElement("span");
        sp.className = ch.k;
        sp.textContent = ch.c;
        div.appendChild(sp);
      }
      col.appendChild(div);
    }
    // Faint separator between snippets
    if (i < count - 1) {
      const sep = document.createElement("div");
      sep.className = "code-line";
      sep.style.opacity = "0.2";
      sep.innerHTML = '<span class="tk-com">// ───</span>';
      col.appendChild(sep);
    }
    idx = (idx + 1) % snippets.length;
  }
}

export default function CodeBackground() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const cols = [leftRef.current, rightRef.current].filter(Boolean) as HTMLDivElement[];
    if (cols.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Mouse parallax state — only the columns shift, no glow
    const mouse = {
      x: 0.5, y: 0.5,        // current (smoothly interpolated)
      tx: 0.5, ty: 0.5,      // target (latest mouse position, normalized 0..1)
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };

    if (!reduced) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    // Fetch real snippets and render them statically
    fetch("/api/code-snippets")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const snippets: string[][] = data.snippets?.length >= 2 ? data.snippets : FALLBACK;
        const leftIdx = pick([], snippets.length);
        const rightIdx = pick([leftIdx], snippets.length);
        renderColumn(cols[0], snippets, leftIdx);
        if (cols[1]) renderColumn(cols[1], snippets, rightIdx);
      })
      .catch(() => {
        if (cancelled) return;
        renderColumn(cols[0], FALLBACK, 0);
        if (cols[1]) renderColumn(cols[1], FALLBACK, 1);
      });

    // Parallax animation loop — cursor subtly shifts the columns
    let raf = 0;
    if (!reduced) {
      const tick = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(tick);
        mouse.x += (mouse.tx - mouse.x) * 0.08;
        mouse.y += (mouse.ty - mouse.y) * 0.08;
        if (colsRef.current) {
          const dx = (mouse.x - 0.5) * 36;
          const dy = (mouse.y - 0.5) * 20;
          colsRef.current.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
        }
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="code-layer" aria-hidden="true">
      <div
        ref={colsRef}
        className="code-cols"
        style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          willChange: "transform",
        }}
      >
        <div className="code-col" ref={leftRef} style={{ flex: "1 1 0", minWidth: 0, maxWidth: "400px", display: "block" }} />
        <div className="code-col" ref={rightRef} style={{ flex: "1 1 0", minWidth: 0, maxWidth: "400px", transform: "translateY(-36px)", display: "block" }} />
      </div>
    </div>
  );
}
