# Hazsight Design Language

> The single source of truth for Hazsight's visual identity. All UI work — by humans or AI agents — must follow this document.

---

## Color Palette

### Background
- **Background**: `oklch(0.04 0 0)` — very dark, almost black (deep neutral, not pure black)
- **Card**: `oklch(0.08 0 0)` — subtle lift from background
- **Foreground**: `oklch(0.97 0 0)` — pure off-white

### Accent (NVIDIA Green)
- **Primary**: `lime-500` in Tailwind = `oklch(0.78 0.19 124)` ≈ NVIDIA `#76b900`
- **Primary foreground**: `oklch(0.04 0 0)` — dark text on green buttons
- **Hover**: `lime-400` — slightly brighter
- **NO amber, NO indigo, NO blue** — ever. Amber was replaced with lime across the entire codebase.

### Severity Colors
| Severity | Badge BG | Text | Use |
|---|---|---|---|
| CRITICAL | `red-600` `#dc2626` | white | Imminent life-safety hazard |
| HIGH | `orange-600` `#ea580c` | white | Severe risk |
| MEDIUM | `lime-600` `#65a30d` | white | Notable risk (was amber — replaced) |
| LOW | `emerald-700` `#047857` | white | Minor irregularity |

### Borders & Lines
- Border: `oklch(1 0 0 / 8%)` — very subtle white
- Grid lines: `oklch(0.78 0.17 125 / 0.08)` — NVIDIA green at 8% opacity
- Divider: gradient from transparent → lime-500/30 → transparent

---

## Typography

### Fonts
- **Body**: Geist Sans (clean, professional, big-tech feel)
- **Code/Tech**: Geist Mono (terminal feel — for `>`, `//`, `[ ]`, version numbers)
- **PDF**: Helvetica + Courier (cross-platform PDF fonts)

### Usage Rules
- Mix sans + mono — sans for body text, mono for code-y elements
- The `>` prefix before Hazsight title: mono, muted color
- `[ Initiate scan ]` buttons: mono, with brackets
- `// Process`, `// Detection` section labels: mono, small, muted
- `[01]...[08]` numbering: mono
- Body text: NEVER ALL_CAPS_WITH_UNDERSCORES — always proper case

---

## Layout

### Structure
- Sticky header (top-0, z-50, backdrop-blur)
- Main content (flex-1)
- Sticky footer (mt-auto, border-top)
- Root wrapper: `min-h-screen flex flex-col`

### Spacing
- Section padding: `py-24` / `py-32` / `py-36` (generous whitespace — big-tech feel)
- Card padding: `p-6` or `p-8`
- Gap between elements: `gap-4` or `gap-6`

### Grid
- Checkerboard pattern (`.hazsight-grid-bg`) — 28x28px, green-tinted
- Both vertical AND horizontal lines visible
- Opacity: 60% in hero, 30% in other sections

---

## Background Code

### Component: `code-background.tsx` (Nikol's — self-typing typewriter)
- Code snippets from our ACTUAL codebase (nebius.ts, tavily.ts, job-store.ts, pdf-report.tsx, schemas.py)
- Types itself character-by-character (typewriter effect)
- Per-line hover: line scales up + glows green
- Mobile (no cursor): gentle pulse
- Opacity: `0.12` — dim, not distracting
- Honors `prefers-reduced-motion`

### Component: `background-code.tsx` (Šimon's — static snippets with per-char hover)
- 22 code snippets positioned absolutely across viewport
- Per-CHARACTER hover: scale(1.2) + translateY(-3px) + green glow
- Mobile: pulse
- Both components can coexist — CodeBackground is the primary (self-typing)

---

## Logo

### Component: `hazsight-logo.tsx` (Nikol's — interactive detector eye)
- Pupil follows mouse cursor (lerped)
- On touch devices: lissajous drift (wanders on its own)
- Blinks periodically
- On hover: dashed radar ring spins + sonar scan accelerates + badge glows
- Honors `prefers-reduced-motion` (fully static)

### Component: `about-team-card.tsx` (Nikol's — team popover)
- Contains the HazsightLogo (eye) + "hazsight_" text
- Eye → hover/click → team popover with info about Team DAMR58H
- "hazsight_" text → click → navigate to home (`onHomeClick` prop)
- No duplicate logos — only ONE eye logo in the header

### Footer
- Text only: "Hazsight" in lime-400 (no icon — the eye is in the header)

---

## Motion

### Framer Motion
- `whileInView` fade-in on sections + cards (staggered, 0.1s delay)
- `cubic-bezier(0.22, 1, 0.36, 1)` easing — smooth, natural
- Ambient gradient: breathing radial gradient (12s ease-in-out loop)
- Hover lift on cards: translateY(-2px) + box-shadow

### CSS Animations
- Scan line (when used): slow, subtle, green-tinted
- Background code pulse: opacity 0.12 → 0.20 on mobile (more visible)
- prefers-reduced-motion: disables ALL animations

---

## Interaction Patterns

### Navigation
- Click "hazsight_" text → return to landing (home)
- Hover/click eye logo → team popover
- ArrowLeft button (when not on landing) → back to home
- Dark mode toggle → top right

### State Machine (single page, / route)
1. **Landing** — hero + how it works + hazard types + tech stack + CTA
2. **Upload** — drag-and-drop + "Try with a demo image" button
3. **Processing** — live agent-trace timeline + dimmed image
4. **Results** — annotated image + risk list + PDF download + reasoning trace replay

### Buttons
- Primary CTA: `[ Initiate scan ]` — mono, brackets, lime border + glow
- Secondary: `View source` — sans, ghost variant
- Download: `Download PDF` — outline + Download icon

---

## Prohibited

- ❌ NO indigo or blue colors (per project rule)
- ❌ NO amber/yellow (replaced with lime/NVIDIA green)
- ❌ NO ALL_CAPS_WITH_UNDERSCORES in UI text (use proper case)
- ❌ NO green text on white/light background (use dark text for readability)
- ❌ NO duplicate logos (one eye logo only)
- ❌ NO emojis in committed code/docs (per AGENTS.md)
- ❌ NO absolute file paths in docs (use repository-relative links, per AGENTS.md)

---

## File Locations

| Asset | File |
|---|---|
| Global CSS | `frontend/src/app/globals.css` |
| Landing page | `frontend/src/components/hazsight/landing-view.tsx` |
| Background code (self-typing) | `frontend/src/components/hazsight/code-background.tsx` |
| Background code (static snippets) | `frontend/src/components/hazsight/background-code.tsx` |
| Eye logo | `frontend/src/components/hazsight/hazsight-logo.tsx` |
| Team popover | `frontend/src/components/hazsight/about-team-card.tsx` |
| Theme provider | `frontend/src/components/theme-provider.tsx` |
| Dark mode toggle | `frontend/src/components/mode-toggle.tsx` |
| Main page (state machine) | `frontend/src/app/page.tsx` |
| Root layout | `frontend/src/app/layout.tsx` |

---

*Last updated: 2026-10-21 by Z.ai Code. All future UI work must follow this document.*
