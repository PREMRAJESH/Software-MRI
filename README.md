<div align="center">

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 220" fill="none">
  <defs>
    <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4fd1e8" stop-opacity="0" />
      <stop offset="50%" stop-color="#4fd1e8" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#f0475c" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4fd1e8" />
      <stop offset="50%" stop-color="#f2a65a" />
      <stop offset="100%" stop-color="#f0475c" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Grid background -->
  <g opacity="0.08">
    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#4fd1e8" stroke-width="0.5"/>
    </pattern>
    <rect width="800" height="220" fill="url(#grid)"/>
  </g>

  <!-- Pulse ring -->
  <circle cx="160" cy="110" r="45" fill="none" stroke="#4fd1e8" stroke-width="1" opacity="0.15">
    <animate attributeName="r" values="40;65;40" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="160" cy="110" r="45" fill="none" stroke="#4fd1e8" stroke-width="0.7" opacity="0.2">
    <animate attributeName="r" values="40;75;40" dur="3s" repeatCount="indefinite" begin="0.5s"/>
    <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" repeatCount="indefinite" begin="0.5s"/>
  </circle>

  <!-- Central node cluster (simplified 3D graph) -->
  <g filter="url(#shadow)">
    <!-- Core -->
    <circle cx="160" cy="110" r="6" fill="#4fd1e8" filter="url(#glow)">
      <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite"/>
    </circle>

    <!-- Orbiting nodes -->
    <g>
      <circle cx="160" cy="110" r="3" fill="#f2a65a">
        <animateMotion dur="3s" repeatCount="indefinite" path="M0,-24 A24,24 0 1,1 -0,24 A24,24 0 1,1 0,-24"/>
      </circle>
      <circle cx="160" cy="110" r="2" fill="#f0475c">
        <animateMotion dur="4.2s" repeatCount="indefinite" path="M0,-32 A32,32 0 1,1 -0,32 A32,32 0 1,1 0,-32"/>
      </circle>
      <circle cx="160" cy="110" r="2.5" fill="#4fd1e8">
        <animateMotion dur="3.6s" repeatCount="indefinite" path="M0,-18 A18,18 0 1,1 -0,18 A18,18 0 1,1 0,-18" begin="0.8s"/>
      </circle>
      <circle cx="160" cy="110" r="1.8" fill="#f2a65a">
        <animateMotion dur="5s" repeatCount="indefinite" path="M0,-38 A38,38 0 1,1 -0,38 A38,38 0 1,1 0,-38" begin="1.5s"/>
      </circle>
    </g>

    <!-- Connection lines -->
    <line x1="130" y1="84" x2="160" y2="110" stroke="#4fd1e8" stroke-width="0.5" opacity="0.4"/>
    <line x1="135" y1="140" x2="160" y2="110" stroke="#f0475c" stroke-width="0.5" opacity="0.4"/>
    <line x1="178" y1="92" x2="160" y2="110" stroke="#f2a65a" stroke-width="0.5" opacity="0.4"/>
    <line x1="190" y1="130" x2="160" y2="110" stroke="#4fd1e8" stroke-width="0.5" opacity="0.3"/>
  </g>

  <!-- Signal bars -->
  <g transform="translate(80, 162)" opacity="0.25">
    <rect x="0" y="0" width="3" height="8" fill="#4fd1e8">
      <animate attributeName="height" values="8;14;8" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="y" values="0;-6;0" dur="1.5s" repeatCount="indefinite"/>
    </rect>
    <rect x="5" y="-2" width="3" height="10" fill="#f2a65a">
      <animate attributeName="height" values="10;18;10" dur="1.5s" repeatCount="indefinite" begin="0.2s"/>
      <animate attributeName="y" values="-2;-10;-2" dur="1.5s" repeatCount="indefinite" begin="0.2s"/>
    </rect>
    <rect x="10" y="2" width="3" height="6" fill="#f0475c">
      <animate attributeName="height" values="6;12;6" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
      <animate attributeName="y" values="2;-4;2" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
    </rect>
  </g>

  <!-- Scrolling scan line -->
  <line x1="40" y1="110" x2="280" y2="110" stroke="url(#lineGlow)" stroke-width="1" opacity="0.3">
    <animate attributeName="x1" values="40;280;40" dur="4s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="180;400;180" dur="4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite"/>
  </line>

  <!-- Typography -->
  <text x="340" y="90" font-family="Space Grotesk, Inter, sans-serif" font-size="28" font-weight="700" letter-spacing="-0.03em" fill="#eaf0f4" filter="url(#shadow)">
    Software
    <tspan fill="url(#textGrad)"> MRI</tspan>
  </text>
  <text x="340" y="118" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" letter-spacing="0.15em" fill="#7c8a99">
    CODEBASE DIAGNOSTICS
  </text>
  <text x="340" y="140" font-family="Inter, sans-serif" font-size="13" fill="#82909c">
    Map structural risk before it becomes operational debt.
  </text>

  <!-- Status badge -->
  <rect x="340" y="152" width="72" height="18" rx="3" fill="none" stroke="#26313b" stroke-width="0.7"/>
  <circle cx="354" cy="161" r="3" fill="#4fd1e8">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/>
  </circle>
  <text x="362" y="164" font-family="SF Mono, JetBrains Mono, monospace" font-size="8" letter-spacing="0.06em" fill="#7c8a99">ENGINE ONLINE</text>

  <!-- Version pill -->
  <rect x="418" y="152" width="42" height="18" rx="3" fill="#12161b" stroke="#26313b" stroke-width="0.7"/>
  <text x="428" y="164" font-family="SF Mono, JetBrains Mono, monospace" font-size="8" letter-spacing="0.08em" fill="#56636d">BETA 0.4</text>

  <!-- Animated dots bottom-right -->
  <g transform="translate(700, 185)" opacity="0.15">
    <circle cx="0" cy="0" r="2" fill="#4fd1e8">
      <animate attributeName="r" values="2;3;2" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="0" r="1.5" fill="#f2a65a">
      <animate attributeName="r" values="1.5;2.5;1.5" dur="1.8s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
    <circle cx="20" cy="0" r="1" fill="#f0475c">
      <animate attributeName="r" values="1;2;1" dur="1.8s" repeatCount="indefinite" begin="1.2s"/>
    </circle>
  </g>
</svg>

</div>

<br/>

**Software MRI** is a diagnostic engine that scans any GitHub repository and produces an interactive 3D map of your codebase's structural health — surfacing circular dependencies, complexity hot zones, dead code, and technical debt before they become operational risk.

---

## Features

- **Cross-sectional 3D map** — interactive force-directed graph of every module in your repository, color-coded by structure, complexity, or debt layer
- **Circular dependency detection** — identifies cycles in your import graph and flags them with high signal
- **Cyclomatic complexity analysis** — per-module complexity scoring with hot zone overlays (high churn × high complexity)
- **Technical debt registry** — findings with severity scoring, tag classification, and last-modified tracking
- **Health index** — composite score (0–100) with grade and natural-language computed readout
- **Risk surface view** — top signals ranked by risk score with one-click navigation to the source module
- **Export** — download full analysis as JSON for CI/CD pipeline integration

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                    │
│  React · MUI · Radix UI · Tailwind CSS · Three.js   │
│  3D Force Graph · Recharts · Vaul · Sonner           │
└─────────────────────┬───────────────────────────────┘
                      │  /api (proxy → :3001)
                      ▼
┌─────────────────────────────────────────────────────┐
│               Backend (Express · TypeScript)          │
│  simple-git (clone) → madge (import graph) →         │
│  complexity heuristics → debt scanner → diagnosis    │
└─────────────────────────────────────────────────────┘
```

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite 6, TypeScript, MUI 7, Radix UI, Tailwind CSS 4, Three.js |
| Visualization | react-force-graph-3d, recharts, embla-carousel |
| Backend | Express 4, TypeScript, tsx |
| Analysis | simple-git, madge (import graph), custom complexity/debt heuristics |
| Package Manager | pnpm (workspace monorepo) |

---

## Quick Start

```bash
pnpm install

# Terminal 1 — Backend
cd backend && pnpm dev

# Terminal 2 — Frontend
pnpm dev
```

Open `http://localhost:5173` in your browser. Paste a GitHub URL (e.g. `https://github.com/vercel/next.js`) and click **Run scan**.

> **Tip:** The app loads a demo fixture on first visit so you can explore the UI immediately without running a scan.

---

## Project Layout

```
├── src/                        # Frontend source
│   ├── app/
│   │   ├── App.tsx             # Main application shell
│   │   ├── components/
│   │   │   ├── graph-3d.tsx    # 3D force-directed graph (Three.js)
│   │   │   ├── EmptyResults.tsx
│   │   │   └── ui/             # shadcn-style primitives
│   │   └── lib/
│   │       └── analysis.ts     # Enrichment & scoring logic
│   ├── imports/                # Demo fixture data
│   ├── styles/                 # Global CSS
│   └── main.tsx                # Entry point
├── backend/                    # Express API server
│   └── src/
│       ├── index.ts            # Server entry
│       ├── router.ts           # API routes
│       ├── pipeline.ts         # Scan pipeline orchestration
│       └── types.ts            # Shared types
├── vite.config.ts
└── pnpm-workspace.yaml
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scan` | Initiate a new scan (`{ repoUrl }`) |
| `GET` | `/api/scan/:id/status` | Poll scan status (stage, progress) |
| `GET` | `/api/scan/:id/result` | Retrieve completed scan result |

---

## License

See [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) for third-party license information.

<br/>

<div align="center">
  <sub>
    Built with React · Three.js · Express · TypeScript
    <br/>
    <code>STATIC ANALYSIS ONLY · DATA REMAINS LOCAL</code>
  </sub>
</div>
