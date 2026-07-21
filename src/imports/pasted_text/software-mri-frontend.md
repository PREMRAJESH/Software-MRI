# Build Prompt: "Software MRI" — Frontend

## 1. Product Vision

Build the frontend for **Software MRI** — a diagnostic imaging tool for codebases. A developer pastes a GitHub repo URL, and the product scans it like a medical imaging machine scans a body: producing layered, navigable visuals of dependency structure, code complexity, and dead code, so an engineer can understand an unfamiliar (or their own aging) codebase in minutes instead of days.

Positioning: **Figma's directness + GitHub's trust + SonarQube's rigor + VS Code's fluency** — merged into one seamless, single-page diagnostic experience. Not a dashboard with tabs. Not a marketing site. A precision instrument that happens to be beautiful.

This is a hackathon submission that must read as a **production-grade, funded-startup product** on first load — the kind of tool a senior engineer would bookmark, not a kind of tool a hackathon judge has seen ten times today.

Non-negotiable constraint: **no runtime AI/LLM calls anywhere in the shipped product.** Everything the user sees is computed from real static analysis output (dependency graphs, complexity scores, dead code lists) that's fed into this frontend as structured JSON. The frontend's job is to make that real data feel alive, not to fake intelligence.

---

## 2. Design Direction (do not default to generic AI-generated aesthetics)

Reject the three most common AI-default looks: (1) warm cream background + serif display + terracotta accent, (2) near-black + single neon accent with no other point of view, (3) generic broadsheet hairline-rule layout. None of those belong here. This product's visual language comes from **medical imaging instruments crossed with a compiler's internals** — scan lines, wavelength gradients, signal/noise, layered cross-sections — not from generic "dark developer tool" tropes.

### Color system (name these as design tokens, use consistently)
- `--canvas: #0B0E11` — near-black, slightly blue-cool, the "scanner bay"
- `--surface: #12161B` — panel backgrounds, one step up from canvas
- `--surface-raised: #1A1F26` — cards, hover states
- `--line: #232933` — hairline borders, grid lines
- `--signal-cold: #4FD1E8` — healthy code, low complexity, clean dependencies (cyan, like a clean MRI scan)
- `--signal-warm: #F2A65A` — moderate risk, aging code
- `--signal-hot: #F0475C` — high complexity, circular deps, dead code (the "MRI highlight" color)
- `--ink-primary: #EAF0F4` — primary text
- `--ink-muted: #7C8A99` — secondary text, captions
- `--accent-line: linear-gradient(90deg, #4FD1E8, #F2A65A, #F0475C)` — the literal "spectrum" used on the one signature scan element (see §5)

### Typography
- **Display/headers:** a geometric grotesk with slight technical character — *Space Grotesk* or *General Sans* — used at restrained sizes, never oversized hero text. This is an instrument, not a landing page selling itself.
- **Body/UI:** *Inter* or *IBM Plex Sans* — neutral, legible, dense-UI-friendly.
- **Data/code/metrics:** *JetBrains Mono* or *IBM Plex Mono* — used for every number, file path, and metric. This is where the "VS Code" DNA lives — numbers should look like they belong in a terminal, not a marketing stat block.
- Set a real type scale (12/14/16/20/28/40px) and use weight + the mono/sans split to create hierarchy instead of size alone.

### Layout concept
Single continuous canvas, not tabs. Think of it as **one long diagnostic scan the user scrolls through**, but static-first (loads complete, not scroll-gated) — the repo URL input sits at the top like a scanner's control panel, and submitting doesn't navigate to a new page, it **transforms the same canvas** into the results view. The dependency graph, complexity heatmap, and dead-code panel are not separate tabs — they are three synchronized "layers" the user can toggle opacity/focus on, like MRI slice views (T1, T2, FLAIR), reinforcing the medical-imaging metaphor honestly rather than decoratively.

### Signature element
**The Scan Bar.** A single horizontal line that sweeps across the canvas during analysis (see §6), rendered with the `--accent-line` gradient, that "reads" the codebase left to right. This same visual motif reappears in miniature as the loading/progress indicator, as a hover-state underline on interactive elements, and as the dividing line between input state and results state. One element, reused with intention — not scattered decoration.

---

## 3. Information Architecture (single page, state-driven, not route-driven)

**State 1 — Idle / Input**
- Centered "scanner console": repo URL input, a monospace placeholder (`github.com/org/repo`), and a single primary action ("Run Scan").
- Below it, quietly: 2–3 example repos as clickable chips for judges/testers who don't want to paste their own.
- No marketing copy walls. One line of positioning text, max two sentences.

**State 2 — Scanning (in progress)**
- The Scan Bar sweeps across the canvas.
- Beneath it, a live-updating log strip (monospace, small, `--ink-muted`) showing real analysis steps as they complete: `Parsing import graph…`, `Computing cyclomatic complexity…`, `Scanning for unused exports…` — genuine status, not fake "AI thinking" theater.
- This state should feel like 2–4 seconds minimum even if analysis is instant, so the diagnostic metaphor lands — but never longer than the real work takes.

**State 3 — Results (the main event)**
Three synchronized layers over one shared canvas, switchable via a compact layer-toggle control (styled like MRI sequence selector buttons: T1 / T2 / FLAIR → relabeled **Structure / Complexity / Debt**):

1. **Structure layer** — dependency graph (force-directed or radial), nodes = files/modules, edges = imports, circular dependencies highlighted in `--signal-hot` with a subtle pulse.
2. **Complexity layer** — same node positions, recolored as a heatmap by cyclomatic complexity (`--signal-cold` → `--signal-warm` → `--signal-hot`), so switching layers seven feels like a re-scan of the same body, not a new screen.
3. **Debt layer** — dead code / unused exports surfaced as a ranked list panel plus dimmed/ghosted nodes in the graph for anything flagged.

A persistent right-hand **Diagnosis Panel** (VS Code sidebar DNA): summary score, top 3 risk files, and a short plain-language readout ("3 circular dependencies found in `/services`. Refactor priority: high.") — computed text, not generated text.

**State 4 — Empty/Error**
- Invalid URL, private repo, or no analyzable files: a calm, specific message in the interface's own voice ("This repo couldn't be scanned — check that it's public and contains a package.json.") with a retry action. Never a generic "Something went wrong."

---

## 4. Component & Interaction Spec

- **Scanner console input:** monospace input field with a focus state that grows a thin `--accent-line` underline (animated width 0→100%, 300ms, `power2.out`).
- **Layer toggle:** three pill buttons, active state uses the corresponding signal color as a bottom border, not a full background fill — keep it restrained.
- **Graph canvas:** built with `d3-force` or `react-force-graph` for physics-based node layout; nodes sized by import count, colored per active layer; hover reveals a tooltip with file path, LOC, complexity score, and connected-file count in mono type.
- **Diagnosis panel:** cards with `--surface-raised` background, 1px `--line` border, no drop shadows (shadows read as generic — use border + subtle inner glow on the active/highlighted card instead).
- **Ranked debt list:** each row = file path (mono) + a small horizontal bar showing severity, animated in with a staggered width-grow on first render.
- **All interactive elements:** visible keyboard focus rings using `--signal-cold`, respect `prefers-reduced-motion` by disabling the sweep/stagger animations and cross-fading instead.

---

## 5. GSAP Animation Spec

Use GSAP deliberately — one orchestrated sequence per state transition, not scattered micro-effects everywhere. Every animation should reinforce the "diagnostic scan" metaphor, never generic bounce-in decoration.

1. **Page load:** Scanner console fades/slides up (`y: 12 → 0`, `opacity: 0 → 1`, `0.5s`, `power3.out`) — quiet, instrument-panel-powering-on feel. No confetti-style stagger of unrelated elements.
2. **Scan trigger → Scanning state:** Use a GSAP timeline:
   - Console recedes (scale 1 → 0.96, opacity fade to secondary) — `0.3s`
   - Scan Bar enters and sweeps left→right across the canvas width, looped, using `xPercent` and a linear ease while "real" analysis runs, driven by actual async progress events (map real analysis steps to bar position, don't fake a smooth loop if you have real progress data)
   - Status log lines type/fade in one at a time (`stagger: 0.15s`) as each real analysis step completes
3. **Scanning → Results reveal:** This is the money moment.
   - Scan Bar decelerates and "settles" into the layer-toggle control (a literal `flip`-style GSAP transform from full-width line to compact pill-group, using `gsap.timeline()` with matched start/end coordinates — this is your signature transition, invest the most polish here)
   - Graph nodes enter with a physics-settle: initial scatter at low opacity, `stagger: {each: 0.008, from: "random"}`, converging into force-layout position over `0.8s`
   - Diagnosis panel slides in from the right (`x: 24 → 0`, `opacity 0 → 1`, slight delay after graph starts) so the eye follows: scan completes → structure appears → diagnosis follows, exactly the order a radiologist reads a scan.
4. **Layer switching:** Node fill colors cross-fade via GSAP color tweening (not a hard cut) over `0.4s`, `power1.inOut` — this should feel like adjusting an imaging sequence, not swapping pages.
5. **Hover micro-interactions:** Node hover scales `1 → 1.15` with a `--signal-cold` glow (box-shadow or SVG filter), `0.15s`, `back.out(1.7)` for a subtle precision-click feel — used only on the graph, not applied indiscriminately to every element on the page.
6. **Reduced motion:** wrap all of the above in a check against `prefers-reduced-motion`; fall back to instant state changes with opacity-only cross-fades.

Do not add scroll-triggered reveals, parallax, or a hand-drawn/sketch drawing style anywhere — this product is state-transition-driven, not scroll-narrative-driven.

---

## 6. Tech Stack Guidance

- **Framework:** React (Vite) or Next.js — either is fine, prioritize fast iteration.
- **Animation:** GSAP core + `Flip` plugin (for the scan-bar-to-toggle transition) + `ScrollToPlugin` not needed (no scroll narrative).
- **Graph rendering:** `react-force-graph-2d` (fastest to integrate well) or raw `d3-force` + SVG/Canvas if more control is needed.
- **Styling:** Tailwind with the token values above wired into `tailwind.config` as custom colors/fonts — avoids ad hoc hex values scattered through components.
- **State:** local component state / Zustand is enough — no need for heavier state management at hackathon scope.
- **Data:** frontend consumes a static or locally-served JSON shape from the analysis step (dependency edges, per-file complexity, dead-export list) — define and document this JSON contract clearly so the analysis backend and frontend can be built in parallel.

---

## 7. Quality Bar (what "production/startup-level" means here, concretely)

- Fully responsive down to a 768px tablet view at minimum (graph panel stacks above diagnosis panel on narrow widths); a hackathon demo will very likely be shown on a projector or shared screen, so test at 1280px and 1920px explicitly.
- No layout shift when transitioning between states — reserve space, don't let content jump.
- Every async action has a real loading state tied to real progress, never a fake spinner with no relationship to actual work.
- Copy is written in the product's own voice: specific, plain, active. "3 circular dependencies found" not "Uh oh, looks like something's off!"
- Ship one thing that looks unmistakably intentional (the Scan Bar → layer-toggle Flip transition) rather than five things that look adequate. Judges remember the one moment, not the feature count.

---

## 8. Deliverable

Build this as a working, deployable frontend that accepts a pre-computed analysis JSON (mock this with 1–2 real analyzed repos' worth of fixture data if the backend isn't ready yet) and renders the full Idle → Scanning → Results flow with the GSAP sequence described above, polished enough to demo live without caveats.