"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Code shown on the backdrop (self-referential, on purpose 🙃)       */
/* ------------------------------------------------------------------ */

const RAW_LINES: string[] = [
  "// design-system.ts — the living layer beneath the window",
  'import { createTheme, motion } from "@codecanvas/core";',
  "",
  "export const theme = createTheme({",
  '  mode: "dark",',
  "  palette: {",
  '    base: "#050507",',
  '    surface: "rgba(255, 255, 255, 0.04)",',
  '    accent: "#34d399",',
  '    glow: "0 0 24px rgba(52, 211, 153, 0.35)",',
  "  },",
  "  typography: {",
  '    mono: "JetBrains Mono, monospace",',
  "    scale: [13, 16, 20, 32, 48],",
  "  },",
  "});",
  "",
  "export const backdrop = motion.typewriter({",
  '  speed: "char-by-char",',
  '  caret: "blinking",',
  "  loop: true,",
  "  hover: { scale: 1.05, brightness: 1.6 },",
  '  mobile: { pulse: "gentle", fps: 60 },',
  "});",
  "",
  "export function Window({ children }: PropsWithChildren) {",
  "  return (",
  '    <main className="min-h-svh flex flex-col">',
  "      <Backdrop lines={36} animate loop />",
  '      <section className="glass-card z-10">{children}</section>',
  "    </main>",
  "  );",
  "}",
  "",
  "render(<Window theme={theme} backdrop={backdrop} />);",
];

/* ------------------ tiny syntax highlighter ------------------ */

type Ch = { c: string; k: string };

const TOKEN_RE =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(import|from|export|const|function|return|new|let|type|default|true|false)\b|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*|\/>|\/?>)|([A-Za-z_$][\w$]*(?=\())|([{}:,;=()[\].])|(\s)/g;

const GROUP_CLASS = [
  "tk-com",
  "tk-str",
  "tk-key",
  "tk-num",
  "tk-tag",
  "tk-fn",
  "tk-pun",
  "tk-txt",
];

function tokenizeLine(line: string): Ch[] {
  const out: Ch[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) push(out, line.slice(last, idx), "tk-txt");
    let cls = "tk-txt";
    for (let g = 1; g <= GROUP_CLASS.length; g++) {
      if (m[g] !== undefined) {
        cls = GROUP_CLASS[g - 1];
        break;
      }
    }
    push(out, m[0], cls);
    last = idx + m[0].length;
  }
  if (last < line.length) push(out, line.slice(last), "tk-txt");
  return out;
}

function push(out: Ch[], text: string, cls: string) {
  for (const c of text) out.push({ c, k: cls });
}

const LINES: Ch[][] = RAW_LINES.map(tokenizeLine);

/* ------------------ typing engine ------------------ */

const LINE_H = 22;
const CHAR_MS = 12; // one character every 12 ms  (~80 cps)
const LINE_PAUSE = 170; // breath at every newline
const HOLD_MS = 4200; // pause when the file is complete
const FADE_MS = 900; // fade-out before the loop restarts

const COLS = [
  { delay: 400, offset: 0 },
  { delay: 3300, offset: -36 },
  { delay: 6200, offset: -10 },
];

type Phase = "wait" | "type" | "hold" | "fade";

type ColState = {
  el: HTMLDivElement;
  caret: HTMLDivElement | null;
  spans: HTMLSpanElement[];
  lineLen: number[];
  total: number;
  ptr: number;
  line: number;
  ch: number;
  charW: number;
  start: number;
  nextAt: number;
  phase: Phase;
};

export default function CodeBackground() {
  const colRefs = useRef<Array<HTMLDivElement | null>>([]);
  const caretRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const colEls = colRefs.current.filter(Boolean) as HTMLDivElement[];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cols: ColState[] = colEls.map((el, i) => {
      const spans: HTMLSpanElement[] = [];
      const lineLen: number[] = [];
      el.querySelectorAll<HTMLElement>(".code-line").forEach((ln) => {
        const chars = ln.querySelectorAll<HTMLSpanElement>("span");
        lineLen.push(chars.length);
        chars.forEach((s) => spans.push(s));
      });
      return {
        el,
        caret: caretRefs.current[i] ?? null,
        spans,
        lineLen,
        total: spans.length,
        ptr: 0,
        line: 0,
        ch: 0,
        charW: 7.8,
        start: COLS[i]?.delay ?? 0,
        nextAt: 0,
        phase: "wait",
      };
    });

    const measure = (c: ColState) => {
      const w = c.spans[0]?.getBoundingClientRect().width;
      if (w && w > 1) c.charW = w;
    };

    const moveCaret = (c: ColState) => {
      if (!c.caret) return;
      c.caret.style.transform = `translate(${c.ch * c.charW}px, ${c.line * LINE_H}px)`;
    };

    // Accessibility: no motion → show the finished code statically.
    if (reduced) {
      for (const c of cols) {
        c.spans.forEach((s) => (s.style.visibility = "visible"));
        if (c.caret) c.caret.style.display = "none";
      }
      return;
    }

    let raf = 0;
    const t0 = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;

      for (const c of cols) {
        if (c.el.offsetParent === null) continue; // column hidden by CSS

        switch (c.phase) {
          case "wait": {
            if (t >= c.start) {
              measure(c);
              if (c.caret) c.caret.style.opacity = "1";
              c.phase = "type";
              c.nextAt = t;
            }
            break;
          }
          case "type": {
            let guard = 0;
            while (t >= c.nextAt && c.ptr < c.total && guard++ < 10) {
              c.spans[c.ptr].style.visibility = "visible";
              c.ptr++;
              c.ch++;
              if (c.ch >= (c.lineLen[c.line] ?? 0)) {
                c.line++;
                c.ch = 0;
                c.nextAt += LINE_PAUSE;
              } else {
                c.nextAt += CHAR_MS;
              }
            }
            moveCaret(c);
            if (c.ptr >= c.total) {
              c.phase = "hold";
              c.nextAt = t + HOLD_MS;
            }
            break;
          }
          case "hold": {
            if (t >= c.nextAt) {
              c.phase = "fade";
              c.el.style.opacity = "0";
              c.nextAt = t + FADE_MS;
            }
            break;
          }
          case "fade": {
            if (t >= c.nextAt) {
              for (let i = 0; i < c.ptr; i++) {
                c.spans[i].style.visibility = "hidden";
              }
              c.ptr = 0;
              c.line = 0;
              c.ch = 0;
              c.el.style.opacity = "";
              measure(c);
              moveCaret(c);
              c.phase = "wait";
              c.start = t + 700;
            }
            break;
          }
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="code-layer" aria-hidden="true">
      <div className="code-cols">
        {COLS.map((col, ci) => (
          <div
            key={ci}
            ref={(el) => {
              colRefs.current[ci] = el;
            }}
            className="code-col"
            style={{ transform: `translateY(${col.offset}px)` }}
          >
            <div className="code-lines">
              {LINES.map((chars, li) => (
                <div className="code-line" key={li}>
                  {chars.map((ch, i) => (
                    <span
                      key={i}
                      className={ch.k}
                      style={{ visibility: "hidden" }}
                    >
                      {ch.c}
                    </span>
                  ))}
                </div>
              ))}
              <div
                className="code-caret"
                ref={(el) => {
                  caretRefs.current[ci] = el;
                }}
                style={{ opacity: 0 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
