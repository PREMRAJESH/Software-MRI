// Exact contract the frontend expects — mirrors the fixture shape exactly.
// No fields renamed, no optional keys added. What the frontend renders is what this returns.

export interface ScanNode {
  id: string;
  path: string;
  loc: number;
  complexity: number;
  inboundRefs: number;
  outboundRefs: number;
  isCircular: boolean;
  cluster: string;
}

export interface ScanEdge {
  source: string;
  target: string;
  circular: boolean;
}

export interface DebtFinding {
  path: string;
  type: string;
  severity: number;
  lastModified: string;
}

export interface ScanResult {
  repo: string;
  filesScanned: number;
  dependencies: number;
  circularRefs: number;
  scanDurationSeconds: number;
  healthIndex: number;
  healthGrade: string;
  diagnosis: string;
  nodes: ScanNode[];
  edges: ScanEdge[];
  debt: DebtFinding[];
}

export interface ScanStatus {
  stage: string;
  message: string;
  progress: number;
}

export type ScanStage =
  | "cloning"
  | "parsing_imports"
  | "computing_complexity"
  | "scanning_dead_code"
  | "generating_diagnosis"
  | "done";

export const STAGE_MESSAGES: Record<ScanStage, string> = {
  cloning: "Cloning repository archive…",
  parsing_imports: "Parsing import graph…",
  computing_complexity: "Computing cyclomatic complexity…",
  scanning_dead_code: "Scanning unused exports…",
  generating_diagnosis: "Generating diagnosis…",
  done: "Analysis complete.",
};

export const STAGE_PROGRESS: Record<ScanStage, number> = {
  cloning: 0.1,
  parsing_imports: 0.3,
  computing_complexity: 0.55,
  scanning_dead_code: 0.75,
  generating_diagnosis: 0.9,
  done: 1.0,
};

export interface ScanJob {
  scanId: string;
  repoUrl: string;
  repoName: string;
  status: ScanStatus;
  result: ScanResult | null;
  error: string | null;
  startTime: number;
  tempDir: string;
}
