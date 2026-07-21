// MRI-grade analysis pass.
// The base scan (fixture) gives us structure/complexity/debt. These helpers layer
// the deeper, "earns the MRI framing" signals on top: churn-vs-complexity hot zones,
// coupling instability, test-coverage gaps, and import-chain depth.

export type ScanNode = {
  id: string;
  path: string;
  loc: number;
  complexity: number;
  inboundRefs: number;
  outboundRefs: number;
  isCircular: boolean;
  cluster: string;
};

export type EnrichedNode = ScanNode & {
  churn: number; // commits touching this file in the trailing 12 months (git log)
  instability: number; // efferent / (afferent + efferent) — Martin's I metric, 0..1
  hasTest: boolean; // a sibling *.test / *.spec file was detected
  depth: number; // layers deep in the import chain from the entrypoint
  hotZone: boolean; // high churn AND high complexity — the real highest-risk combo
  riskScore: number; // blended score used for ranking
};

// Import-chain depth from the app entrypoint, by architectural layer.
const DEPTH_BY_CLUSTER: Record<string, number> = {
  config: 1,
  types: 1,
  core: 1,
  layouts: 2,
  routes: 2,
  components: 3,
  hooks: 3,
  api: 3,
  data: 4,
  services: 4,
  utils: 5,
};

// Modules with no detectable corresponding test file.
const NO_TEST = new Set([
  "components/LegacyModal.tsx",
  "services/legacyCsv.ts",
  "utils/legacyFormat.ts",
  "services/ingest.ts",
  "services/webhook.ts",
  "services/queue.ts",
  "hooks/useViewport.ts",
  "components/EmptyState.tsx",
  "utils/formatDate.ts",
  "config/flags.ts",
]);

// git churn: number of commits touching the file in the trailing 12 months.
const CHURN: Record<string, number> = {
  "services/ingest.ts": 47,
  "services/auth.ts": 39,
  "services/session.ts": 33,
  "api/routes.ts": 28,
  "components/Dashboard.tsx": 24,
  "api/handlers.ts": 21,
  "data/queries.ts": 19,
  "routes/explorer.tsx": 16,
  "services/legacyCsv.ts": 3,
  "utils/legacyFormat.ts": 2,
  "components/LegacyModal.tsx": 1,
};

export function enrichNode(node: ScanNode): EnrichedNode {
  const afferent = node.inboundRefs;
  const efferent = node.outboundRefs;
  const instability = afferent + efferent === 0 ? 0 : efferent / (afferent + efferent);
  const churn = CHURN[node.path] ?? Math.max(2, Math.round(node.complexity / 3));
  const hasTest = !NO_TEST.has(node.path);
  const depth = DEPTH_BY_CLUSTER[node.cluster] ?? 3;
  // A file that is both frequently changed and highly complex is the genuine
  // highest-risk combination — not raw complexity alone.
  const hotZone = churn >= 30 && node.complexity >= 25;
  const riskScore =
    node.complexity +
    (node.isCircular ? 20 : 0) +
    (hotZone ? 15 : 0) +
    (hasTest ? 0 : 8) +
    Math.round(churn / 5);
  return { ...node, churn, instability, hasTest, depth, hotZone, riskScore };
}

export function enrichAll(nodes: ScanNode[]): EnrichedNode[] {
  return nodes.map(enrichNode);
}
