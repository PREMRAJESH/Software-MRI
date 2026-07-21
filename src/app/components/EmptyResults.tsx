import { Activity, Github, Layers3 } from "lucide-react";

const EXAMPLE_REPOS = [
  { label: "facebook/docusaurus", url: "github.com/facebook/docusaurus" },
  { label: "expressjs/express", url: "github.com/expressjs/express" },
  { label: "vercel/next.js", url: "github.com/vercel/next.js" },
];

const STAT_LABELS = ["Files scanned", "Dependencies", "Circular refs", "Scan duration"];

function spherePositions(count: number) {
  const pts: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push([
      Math.cos(theta) * radius * 120,
      y * 120,
      Math.sin(theta) * radius * 120,
    ]);
  }
  return pts;
}

const dots = spherePositions(28);

export default function EmptyResults({
  onRunScan,
}: {
  onRunScan: (repo: string) => void;
}) {
  return (
    <div className="mt-7">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 border border-[#232933] bg-[#101419]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#232933] px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Layers3 size={15} className="text-[#65737f]" />
                <h2 className="font-[Space_Grotesk] text-[15px] font-medium text-[#65737f]">
                  Cross-sectional map
                </h2>
                <span className="rounded-full border border-[#232933] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#4a5a68]">
                  — modules
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-[#4a5a68]">
                Drag to rotate &middot; click a module to zoom and inspect.
              </p>
            </div>
          </div>

          <div className="relative h-[440px] overflow-hidden sm:h-[560px]">
            <div className="pointer-events-none absolute inset-0 z-0 opacity-20 [background-image:radial-gradient(#42525d_0.7px,transparent_0.7px)] [background-size:16px_16px]" />
            <svg className="absolute inset-0 size-full">
              {dots.map(([x, y, z], i) => (
                <circle
                  key={i}
                  cx={x + 300}
                  cy={y + 260}
                  r={2.5 + Math.abs(z) * 0.025}
                  fill="none"
                  stroke="#4a5a68"
                  strokeWidth={0.4 + Math.abs(z) * 0.003}
                  opacity={0.3 + Math.abs(z) * 0.004}
                />
              ))}
            </svg>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
              <div
                className="h-px w-48 bg-[linear-gradient(90deg,transparent,#4fd1e8,transparent)] opacity-[0.12]"
                style={{ animation: "idle-pulse 3s ease-in-out infinite" }}
              />
            </div>
            <style>{`@keyframes idle-pulse { 0%,100% { opacity: 0.06; } 50% { opacity: 0.22; } }`}</style>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#232933] border-t border-[#232933] sm:grid-cols-4">
            {STAT_LABELS.map((label) => (
              <div key={label} className="px-5 py-4">
                <p className="font-mono text-[9px] uppercase tracking-[.11em] text-[#4a5a68]">
                  {label}
                </p>
                <p className="mt-1 font-mono text-[17px] text-[#3d4a55]">&mdash;</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="border border-[#232933] bg-[#12161b]">
          <div className="border-b border-[#232933] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#65737f]" />
                <h2 className="font-[Space_Grotesk] text-[15px] font-medium text-[#65737f]">
                  Diagnosis
                </h2>
              </div>
              <span className="font-mono text-[10px] text-[#4a5a68]">v1.0</span>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#4a5a68]">
                  Health index
                </p>
                <p className="mt-1 font-[Space_Grotesk] text-[46px] leading-none tracking-[-.06em] text-[#3d4a55]">
                  &mdash;<span className="ml-1 text-[17px] text-[#3d4a55]">/100</span>
                </p>
              </div>
              <div className="mb-1 flex size-14 items-center justify-center rounded-full border-2 border-[#232933] font-mono text-[11px] text-[#3d4a55]">
                &mdash;
              </div>
            </div>
            <div className="mt-4 h-[3px] overflow-hidden bg-[#1c242c]" />
          </div>

          <div className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#4a5a68]">
              Computed readout
            </p>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-[#232933]" />
              <div className="h-3 w-4/5 rounded bg-[#232933]" />
              <div className="h-3 w-[55%] rounded bg-[#232933]" />
            </div>
            <div className="mt-4 border-t border-[#232933] pt-4">
              <div className="h-2 w-full rounded bg-[#1c242c]" />
              <div className="mt-1.5 h-2 w-[70%] rounded bg-[#1c242c]" />
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#65737f]">
          Try:
        </span>
        {EXAMPLE_REPOS.map((repo) => (
          <button
            key={repo.url}
            onClick={() => onRunScan(repo.url)}
            className="flex items-center gap-1.5 rounded-[5px] border border-[#2a333d] bg-[#12161b] px-3 py-1.5 font-mono text-[11px] text-[#aab5bf] transition hover:border-[#4fd1e8]/40 hover:text-[#4fd1e8]"
          >
            <Github size={12} />
            {repo.label}
          </button>
        ))}
      </div>
    </div>
  );
}
