# Software MRI — Engineering Guidelines

## Code Style

- TypeScript only — no `any` unless bridging untyped third-party APIs; use branded types for domain primitives
- Default exports are forbidden; prefer named exports for tree-shaking and consistent imports
- Colocate tests, types, and constants with the consuming module; extract only when shared across 3+ consumers
- Keep functions small and pure; side effects go in hooks or event handlers, never in render
- Use `useMemo` / `useCallback` only when profiling proves a bottleneck — premature memoization is technical debt

## Component Architecture

- **Leaf components** (shadcn-style primitives in `ui/`): stateless, polymorphic via `asChild`/`Slot`, controlled styling via `className`
- **Composite components** (e.g. `Graph3D`): single responsibility, props interface documented with JSDoc, ref forwarding via `forwardRef`
- **Page-level components** (`App.tsx`): orchestrate state, wire data, delegate rendering to composites; never contain raw DOM layout
- Avoid prop drilling beyond 2 levels — use composition (`children`) or context; never create a context for a single piece of state

## Styling Convention

- **Tailwind CSS 4** with the `@theme inline` token set defined in `theme.css` — prefer semantic tokens (`bg-muted`, `text-muted-foreground`, `border-border`) over raw hex values
- Dark theme only — the palette is locked to `#0b0e11` (bg), `#12161b` (card), `#232933` (border), `#4fd1e8` (primary/accent), `#f2a65a` (warning), `#f0475c` (destructive)
- Inline `style` is forbidden for layout; use Tailwind utilities for everything. Runtime-variable styles (e.g. dynamic width, color) use inline `style` only for data-driven values — never for spacing or positioning
- Hover/active/focus transitions use Tailwind's `transition` + `duration-*` utilities; no custom keyframes unless animating complex SVG

## Graph & Visualization Patterns

- `Graph3D` wraps `react-force-graph-3d` with a Fibonacci-sphere layout — never override `fx`/`fy`/`fz` after initial placement
- Node coloring is driven by the `layer` prop via `colorForNode` callback; keep the color function pure and idempotent
- Hover state is lifted to the parent (`App.tsx`) via `onHover`; the graph never owns selection state
- Fullscreen is implemented via `createPortal` to `document.body` — the graph component receives a `fullscreen` boolean but does not manage it

## State & Data Flow

- Scan state machine: `ready → scanning → results | error` — transitions are monotonic; reset via explicit `setScan("ready")`
- API polling uses `AbortController` for cancellation; the `abortRef.current?.abort()` path must always be reachable on unmount
- The demo fixture (`software-mri-fixture.json`) auto-loads on first visit so the page is never empty — keep it in sync with the `ScanResult` type
- Derived data (`enrichedNodes`, `graphLinks`, `debtByPath`, `risks`) is computed in `useMemo` and never duplicated in `useState`

## Backend (Express)

- Route handlers are thin — business logic lives in `pipeline.ts`; `router.ts` only parses params and returns responses
- Scan state is stored in-memory (`Map<scanId, ScanState>`); restarting the server loses in-flight scans — this is acceptable for the beta
- Madge is run with `--tsconfig` and `--ext ts,tsx` for TypeScript projects; the pipeline falls back to JS if no tsconfig is found
- `simple-git` clones are shallow (`--depth 1`) and cleaned up after analysis via `fs.rmSync` with error swallowing

## What Not To Do

- Do not add more CSS files — all styling is Tailwind utilities or `theme.css`
- Do not add routing libraries — this is a single-page tool; feature toggles use `scan` state, not URL paths
- Do not add a state management library — React state + `useMemo` is sufficient for this complexity class
- Do not commit log files, `dist/`, `node_modules/`, or `.env` — see `.gitignore`
- Do not add comments in components — the code should be self-documenting; use JSDoc on public interfaces only
