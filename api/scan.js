const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const MAX_SOURCE_FILES = 450;
const MAX_FETCHED_SOURCES = 260;
const COMPLEXITY_THRESHOLD = 25;

function send(res, status, body) {
  res.status(status).json(body);
}

function repoFullName(repoUrl) {
  return repoUrl
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function parseRepo(repoUrl) {
  const fullName = repoFullName(repoUrl);
  const match = fullName.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], fullName };
}

function extname(path) {
  const match = path.match(/(\.[^.\/]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function dirname(path) {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function basename(path) {
  return path.split("/").pop() ?? path;
}

function withoutExtension(path) {
  return path.replace(/\.[^.\/]+$/, "");
}

function clusterForPath(path) {
  const parts = path.split("/");
  if (parts.length <= 1) return "root";
  const [top, second, third] = parts;
  if (["packages", "apps", "examples", "playground"].includes(top) && second) {
    return third ? `${top}/${second}/${third}` : `${top}/${second}`;
  }
  return top;
}

function isSourceFile(path) {
  if (!SOURCE_EXTENSIONS.has(extname(path))) return false;
  return !/(^|\/)(node_modules|dist|build|coverage|\.next|\.cache|\.git)\//.test(path);
}

async function githubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "software-mri",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub request failed (${response.status}): ${detail.slice(0, 160)}`);
  }

  return response.json();
}

async function githubText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "software-mri" },
  });
  if (!response.ok) return "";
  return response.text();
}

function extractImportSpecifiers(source) {
  const specs = [];
  const patterns = [
    /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
    /export\s+[^'"]*\s+from\s+["']([^"']+)["']/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.push(match[1]);
  }

  return specs;
}

function resolveImport(fromPath, specifier, sourcePathSet) {
  if (!specifier.startsWith(".")) return null;
  const baseDir = dirname(fromPath);
  const normalized = `${baseDir}/${specifier}`
    .replace(/^\//, "")
    .split("/")
    .reduce((parts, part) => {
      if (!part || part === ".") return parts;
      if (part === "..") parts.pop();
      else parts.push(part);
      return parts;
    }, [])
    .join("/");

  const candidates = [
    normalized,
    ...[...SOURCE_EXTENSIONS].map((ext) => `${normalized}${ext}`),
    ...[...SOURCE_EXTENSIONS].map((ext) => `${normalized}/index${ext}`),
  ];

  return candidates.find((candidate) => sourcePathSet.has(candidate)) ?? null;
}

function estimateCyclomaticComplexity(source) {
  let complexity = 1;
  complexity += (source.match(/\bif\s*\(/g) || []).length;
  complexity += (source.match(/\belse\s+if\b/g) || []).length;
  complexity += (source.match(/\bswitch\s*\(/g) || []).length;
  complexity += (source.match(/\bcase\s+/g) || []).length;
  complexity += (source.match(/\bfor\s*\(/g) || []).length;
  complexity += (source.match(/\bwhile\s*\(/g) || []).length;
  complexity += (source.match(/\bcatch\s*\(/g) || []).length;
  complexity += (source.match(/\?\s*\w+\s*:/g) || []).length;
  complexity += (source.match(/\|\|/g) || []).length;
  complexity += (source.match(/&&/g) || []).length;
  return Math.max(1, Math.round(complexity / 3));
}

function extractExports(source) {
  const exports = [];
  for (const match of source.matchAll(/export\s+(?:default\s+)?(?:function|const|let|var|class|interface|type|enum)\s+(\w+)/g)) {
    exports.push(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{\s*([^}]+)\s*\}/g)) {
    for (const name of match[1].split(",")) {
      const trimmed = name.trim().split(/\s+as\s+/)[0].trim();
      if (trimmed) exports.push(trimmed);
    }
  }
  return [...new Set(exports)];
}

function extractNamedImports(source) {
  const imports = [];
  for (const match of source.matchAll(/import\s*\{\s*([^}]+)\s*\}\s*from/g)) {
    for (const name of match[1].split(",")) {
      const trimmed = name.trim().split(/\s+as\s+/)[0].trim();
      if (trimmed) imports.push(trimmed);
    }
  }
  for (const match of source.matchAll(/import\s+(\w+)\s+from/g)) imports.push(match[1]);
  return [...new Set(imports)];
}

function detectCycles(nodes, edges) {
  const graph = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) graph.get(edge.source)?.push(edge.target);

  const cycles = [];
  const seen = new Set();

  function visit(nodeId, stack) {
    const index = stack.indexOf(nodeId);
    if (index !== -1) {
      const cycle = stack.slice(index);
      const key = [...cycle].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push(cycle);
      }
      return;
    }
    if (stack.length > 24) return;
    for (const next of graph.get(nodeId) ?? []) visit(next, [...stack, nodeId]);
  }

  for (const node of nodes) visit(node.id, []);
  return cycles.slice(0, 100);
}

function generateReadout(nodes, cycles, highComplexityCount, debt) {
  if (cycles.length > 0 && highComplexityCount > 0) {
    const riskiest = [...nodes].sort((a, b) => b.complexity - a.complexity)[0]?.path ?? "unknown";
    return `${cycles.length} circular dependency ${cycles.length === 1 ? "cycle was" : "cycles were"} detected while ${highComplexityCount} modules exceeded the complexity threshold. Prioritize ${riskiest} before expanding the API surface.`;
  }
  if (cycles.length > 0) {
    return `${cycles.length} circular dependency ${cycles.length === 1 ? "cycle" : "cycles"} detected. Untangle these imports first to reduce maintenance risk.`;
  }
  if (highComplexityCount > 0) {
    const top = [...nodes].sort((a, b) => b.complexity - a.complexity)[0]?.path ?? "unknown";
    return `No circular dependencies detected. ${highComplexityCount} modules exceed the complexity threshold; ${top} is the highest-complexity file in this scan.`;
  }
  if (debt.length > 5) {
    return `No circular dependencies detected. ${debt.length} cleanup opportunities were found across exported symbols and isolated modules.`;
  }
  return `Clean bill of health. ${nodes.length} modules analyzed with no circular dependencies and minimal complexity concerns.`;
}

function buildDebt(sourceByPath, nodes) {
  const allImports = new Set();
  const exportsByPath = new Map();
  for (const [path, source] of sourceByPath) {
    extractNamedImports(source).forEach((name) => allImports.add(name));
    const exports = extractExports(source);
    if (exports.length > 0) exportsByPath.set(path, exports);
  }

  const debt = [];
  for (const [path, exports] of exportsByPath) {
    for (const name of exports) {
      if (!allImports.has(name)) {
        debt.push({
          path,
          type: "unused export",
          severity: Math.min(100, 35 + Math.min(name.length, 20) + (path.includes("legacy") ? 30 : 0)),
          lastModified: "unknown",
        });
      }
    }
  }

  for (const node of nodes) {
    if (node.inboundRefs === 0 && node.outboundRefs === 0 && !/(^|\/)(index|main|app)\.[jt]sx?$/.test(node.path)) {
      debt.push({ path: node.path, type: "unused module", severity: 42, lastModified: "unknown" });
    }
  }

  return debt.sort((a, b) => b.severity - a.severity).slice(0, 50);
}

async function scanRepo(repoUrl) {
  const started = Date.now();
  const parsed = parseRepo(repoUrl);
  if (!parsed) throw new Error("Only github.com repository URLs are supported.");

  const repo = await githubJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
  const branch = repo.default_branch || "main";
  const tree = await githubJson(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );

  const sourcePaths = (tree.tree ?? [])
    .filter((item) => item.type === "blob" && isSourceFile(item.path))
    .map((item) => item.path)
    .slice(0, MAX_SOURCE_FILES);

  if (sourcePaths.length === 0) {
    throw new Error("No JavaScript or TypeScript files found in this repo.");
  }

  const sourceByPath = new Map();
  const fetchPaths = sourcePaths.slice(0, MAX_FETCHED_SOURCES);
  const batches = [];
  for (let i = 0; i < fetchPaths.length; i += 12) batches.push(fetchPaths.slice(i, i + 12));

  for (const batch of batches) {
    const contents = await Promise.all(
      batch.map((path) =>
        githubText(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${path}`).then((source) => [
          path,
          source,
        ]),
      ),
    );
    for (const [path, source] of contents) sourceByPath.set(path, source);
  }

  const sourcePathSet = new Set(sourcePaths);
  const nodes = sourcePaths.map((path, index) => {
    const source = sourceByPath.get(path) ?? "";
    return {
      id: `module-${index}`,
      path,
      loc: source ? source.split("\n").length : 0,
      complexity: source ? estimateCyclomaticComplexity(source) : 1,
      inboundRefs: 0,
      outboundRefs: 0,
      isCircular: false,
      cluster: clusterForPath(path),
    };
  });
  const idByPath = new Map(nodes.map((node) => [node.path, node.id]));

  const edges = [];
  for (const [path, source] of sourceByPath) {
    const sourceId = idByPath.get(path);
    if (!sourceId) continue;
    for (const specifier of extractImportSpecifiers(source)) {
      const targetPath = resolveImport(path, specifier, sourcePathSet);
      const targetId = targetPath ? idByPath.get(targetPath) : null;
      if (targetId && sourceId !== targetId) {
        edges.push({ source: sourceId, target: targetId, circular: false });
      }
    }
  }

  const cycles = detectCycles(nodes, edges);
  const circularIds = new Set(cycles.flat());
  for (const edge of edges) {
    if (circularIds.has(edge.source) && circularIds.has(edge.target)) edge.circular = true;
  }
  for (const node of nodes) node.isCircular = circularIds.has(node.id);

  const inbound = new Map(nodes.map((node) => [node.id, 0]));
  const outbound = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    outbound.set(edge.source, (outbound.get(edge.source) ?? 0) + 1);
    inbound.set(edge.target, (inbound.get(edge.target) ?? 0) + 1);
  }
  for (const node of nodes) {
    node.inboundRefs = inbound.get(node.id) ?? 0;
    node.outboundRefs = outbound.get(node.id) ?? 0;
  }

  const debt = buildDebt(sourceByPath, nodes);
  const highComplexityCount = nodes.filter((node) => node.complexity >= COMPLEXITY_THRESHOLD).length;
  let healthIndex = 100;
  healthIndex -= Math.min(cycles.length * 8, 40);
  healthIndex -= Math.min(highComplexityCount, 20);
  healthIndex -= Math.min(Math.round(debt.filter((item) => item.severity > 50).length * 0.3), 15);
  healthIndex = Math.max(0, Math.min(100, Math.round(healthIndex)));

  return {
    repo: parsed.fullName,
    filesScanned: sourcePaths.length,
    dependencies: edges.length,
    circularRefs: cycles.length,
    scanDurationSeconds: Math.round(((Date.now() - started) / 1000) * 10) / 10,
    healthIndex,
    healthGrade: healthIndex >= 85 ? "HEALTHY" : healthIndex >= 65 ? "FAIR" : healthIndex >= 40 ? "AT_RISK" : "CRITICAL",
    diagnosis: generateReadout(nodes, cycles, highComplexityCount, debt),
    nodes,
    edges,
    debt,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed." });
  }

  try {
    const repoUrl = req.body?.repoUrl;
    if (!repoUrl || typeof repoUrl !== "string") {
      return send(res, 400, { error: "Missing repoUrl in request body." });
    }

    const result = await scanRepo(repoUrl);
    return send(res, 200, { result });
  } catch (error) {
    return send(res, 422, {
      error: error instanceof Error ? error.message : "Scan failed.",
    });
  }
}
