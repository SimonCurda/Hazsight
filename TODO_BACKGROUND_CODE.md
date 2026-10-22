# TODO: Background Code — Design Spec for Nikol

> Owner: **Nikol Picková** (Design/UX/Strategy Lead)
> Recommended tool: https://chat.z.ai/ — log in, switch to **Full Stack** mode, paste the GitHub PAT into the chat so the AI can read + edit the repo directly.

## Current State

The BackgroundCode component (`frontend/src/components/hazsight/background-code.tsx`) currently renders 22 code snippets from the actual Hazsight codebase. Each snippet is absolutely positioned with fixed `top`/`left`/`right`/`bottom` percentages.

**Problem:** The snippets feel "stuck" to the screen — they're overlaid ON TOP of the background rather than blending INTO it. They don't react fluidly to the cursor. The overall effect is more "scattered text labels" than "living code atmosphere."

## Design Vision (from Šimon)

### 1. Blend with background
Code fragments should feel like they're PART of the background — not stickers on top. Think: subtle, atmospheric, like seeing code through frosted glass. Low contrast, breathing with the ambient gradient.

### 2. Code fragments (not whole snippets)
Use just FRAGMENTS — a function signature, a comment, a variable declaration. Not 80-char one-liners. Short, punchy, recognizable pieces:
- `const vlm = await analyze...`
- `// detecting hazards`
- `severity: CRITICAL`
- `> nebius.tokenfactory...`
- `model: "nemotron-3-ultra"`
- `hazards: List[...]`
- `{ x, y, width, height }`

### 3. Per-character cursor reactivity
When the cursor passes over a character, that INDIVIDUAL letter:
- Scales up (currently `scale(1.2)` — keep or adjust)
- Lifts slightly (`translateY(-3px)`)
- Glows green (NVIDIA-green `lime-400`)
- Transition is smooth + springy (cubic-bezier easing)

The rest of the snippet stays calm. Only the hovered character reacts.

### 4. Mobile (no cursor) — pulse
On touch devices, the whole background gently pulses (breathing effect). Currently implemented via `@media (hover: none)` with `bg-code-pulse-mobile` animation (opacity 0.22 → 0.38). Keep this or refine.

### 5. TYPING ANIMATION (the cool new effect)
Occasionally — randomly, not on a fixed schedule — one of the snippets gets "rewritten" as if a developer is typing in a code editor:

1. A `/` character appears at the start of the snippet (like a comment marker or cursor)
2. The text types out **character by character** (50-100ms per char, with slight randomness for natural feel)
3. When the full text is typed, the `/` cursor blinks once or twice
4. Then the `/` disappears
5. The snippet sits there normally for a while
6. Eventually, another random snippet gets "rewritten"

This should happen to maybe 1 snippet at a time, every 8-15 seconds, randomly chosen. Not all snippets at once — that'd be chaos.

**Implementation hint:** A React component with `useState` for the "currently typing" snippet index + `useEffect` with `setTimeout` to type char-by-char. Pick a random snippet, type it, wait, pick another.

```tsx
// Pseudo-code for the typing effect
const [typingSnippet, setTypingSnippet] = useState<number | null>(null)
const [typedText, setTypedText] = useState('')

useEffect(() => {
  if (typingSnippet === null) {
    // Wait 8-15s, then pick a random snippet to type
    const delay = 8000 + Math.random() * 7000
    const timeout = setTimeout(() => {
      setTypingSnippet(Math.floor(Math.random() * SNIPPETS.length))
      setTypedText('')
    }, delay)
    return () => clearTimeout(timeout)
  }

  const fullText = SNIPPETS[typingSnippet].code
  if (typedText.length < fullText.length) {
    // Type next char (50-100ms, randomized)
    const charDelay = 50 + Math.random() * 50
    const timeout = setTimeout(() => {
      setTypedText(fullText.slice(0, typedText.length + 1))
    }, charDelay)
    return () => clearTimeout(timeout)
  }

  // Done typing — wait 2-3s, then reset
  const resetDelay = 2000 + Math.random() * 1000
  const timeout = setTimeout(() => {
    setTypingSnippet(null)
    setTypedText('')
  }, resetDelay)
  return () => clearTimeout(timeout)
}, [typingSnippet, typedText])
```

When `typingSnippet === idx`, render the snippet with:
- A `/` prefix that blinks
- Only `typedText.length` characters visible (rest hidden or faded)
- The `/` disappears when typing is complete

### 6. More code in background
Increase from 22 to 30+ fragments. Spread them across the viewport more evenly. Vary sizes (xs/sm). Some rotated slightly (-2deg to +2deg).

## Technical Context

- Component: `frontend/src/components/hazsight/background-code.tsx`
- CSS: `frontend/src/app/globals.css` (search for `.bg-code-char`, `.bg-code-snippet`, `bg-code-pulse`)
- Color palette: NVIDIA-green (`lime-400`/`lime-500` in Tailwind = `oklch(0.78 0.19 124)` ≈ NVIDIA `#76b900`)
- Background: deep dark `oklch(0.04 0 0)`
- Grid: checkerboard pattern (`.hazsight-grid-bg`), green-tinted, 28x28px

## Constraints

- **NO indigo or blue colors** (per project rule)
- **Respect `prefers-reduced-motion`** — disable all animations for users who request it
- **Mobile-first** — the pulse effect must work on touch devices (no hover)
- **Not distracting** — the background code should enhance, not compete with, the main content. Max opacity ~0.3 on desktop, ~0.4 on mobile.
- **Performance** — per-character spans are expensive DOM. Cap at ~30 snippets × ~40 chars = ~1200 spans max.

## How to do this via chat.z.ai

1. Go to https://chat.z.ai/
2. Log in (Google or GitHub)
3. In the chat input, switch mode to **Full Stack** (there should be a mode selector)
4. Paste the GitHub PAT into the chat (the one Šimon created — scoped to `SimonCurda/Hazsight` repo)
5. Tell the AI: "Read `frontend/src/components/hazsight/background-code.tsx` and `frontend/src/app/globals.css`. Implement the typing animation + blend-with-background effect described in `frontend/TODO_BACKGROUND_CODE.md`."
6. The AI will edit the files directly via the PAT
7. Review the changes, commit

## Acceptance Criteria

- [ ] Code fragments blend with background (not "stuck on top")
- [ ] Per-character hover: scale + lift + green glow
- [ ] Mobile: subtle pulse (no hover available)
- [ ] Typing animation: random snippet gets typed char-by-char with `/` cursor, every 8-15s
- [ ] 30+ code fragments in background
- [ ] Respects `prefers-reduced-motion`
- [ ] No console errors
- [ ] Lint passes (`bun run lint`)
- [ ] Performance: smooth 60fps on desktop, no jank on mobile
