import { useEffect, useMemo, useState, useRef } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  Crosshair,
  Database,
  FileCode2,
  Flame,
  Github,
  Layers3,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { createPortal } from "react-dom";
import { Graph3D, type GraphLink } from "./components/graph-3d";
import { enrichAll, type EnrichedNode } from "./lib/analysis";
import demoFixture from "../imports/pasted_text/software-mri-fixture.json";

type Layer = "Structure" | "Complexity" | "Debt";
type ScanState = "ready" | "scanning" | "results" | "error";

type ScanResult = {
  repo: string;
  filesScanned: number;
  dependencies: number;
  circularRefs: number;
  scanDurationSeconds: number;
  healthIndex: number;
  healthGrade: string;
  diagnosis: string;
  nodes: Array<{
    id: string;
    path: string;
    loc: number;
    complexity: number;
    inboundRefs: number;
    outboundRefs: number;
    isCircular: boolean;
    cluster: string;
  }>;
  edges: Array<{ source: string; target: string; circular: boolean }>;
  debt: Array<{
    path: string;
    type: string;
    severity: number;
    lastModified: string;
  }>;
};

const SCAN_API = import.meta.env.VITE_API_URL ?? "/api";

function SignalMark() {
  return <div className="relative flex size-8 items-center justify-center overflow-hidden rounded-[7px] border border-[#4fd1e8]/40 bg-[#101d23]" aria-hidden="true"><span className="h-px w-5 bg-[#4fd1e8] shadow-[0_0_9px_#4fd1e8]" /><span className="absolute h-5 w-px bg-[#f0475c]/70" /></div>;
}

export default function App() {
  const [layer, setLayer] = useState<Layer>("Structure");
  const [scan, setScan] = useState<ScanState>("ready");
  const [repo, setRepo] = useState("github.com/");
  const [query, setQuery] = useState("");
  const [hoverNode, setHoverNode] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [step, setStep] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const scanIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scanData = scanResult;

  // Auto-load demo fixture on first mount so the page is never empty
  useEffect(() => {
    if (!scanResult) {
      setScanResult(demoFixture as unknown as ScanResult);
      setRepo("acme/telemetry-console");
      setScan("results");
    }
  }, []);

  const enrichedNodes = useMemo(() => scanData ? enrichAll(scanData.nodes) : [], [scanData]);
  const graphLinks = useMemo(() => (scanData?.edges ?? []) as GraphLink[], [scanData]);
  const debtByPath = useMemo(() => new Map((scanData?.debt ?? []).map((item) => [item.path, item.severity] as const)), [scanData]);

  function colorForNode(node: EnrichedNode, layer: Layer) {
    if (layer === "Complexity") return node.complexity > 25 ? "#f0475c" : node.complexity > 10 ? "#f2a65a" : "#4fd1e8";
    if (layer === "Debt") {
      const severity = debtByPath.get(node.path);
      if (severity === undefined) return "#2b343c";
      return severity > 75 ? "#f0475c" : "#d8a86b";
    }
    return node.isCircular ? "#f0475c" : node.complexity > 16 ? "#f2a65a" : "#4fd1e8";
  }

  const risks = useMemo(() => [...enrichedNodes]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4)
    .map((node) => ({
      file: node.path,
      note: node.isCircular
        ? "Circular dependency"
        : node.hotZone
          ? "Hot zone · churn × complexity"
          : !node.hasTest
            ? "No test coverage"
            : `Cyclomatic complexity ${node.complexity}`,
      tone: node.isCircular || node.complexity > 25 || node.hotZone ? "bg-[#f0475c]" : "bg-[#f2a65a]",
    })), [enrichedNodes]);

  const debt = useMemo(() => (scanData?.debt ?? []).map((item) => ({
    file: item.path,
    tag: item.type,
    score: item.severity,
    lastModified: item.lastModified,
    color: item.severity > 75 ? "bg-[#f0475c]" : item.severity > 40 ? "bg-[#f2a65a]" : "bg-[#4fd1e8]",
  })), [scanData]);

  const hotZones = useMemo(() => enrichedNodes.filter((node) => node.hotZone), [enrichedNodes]);
  const testGaps = useMemo(() => enrichedNodes.filter((node) => !node.hasTest && (node.complexity >= 20 || node.isCircular)), [enrichedNodes]);
  const deepest = useMemo(() => [...enrichedNodes].sort((a, b) => b.depth - a.depth)[0], [enrichedNodes]);
  const mostRelied = useMemo(() => [...enrichedNodes].sort((a, b) => b.inboundRefs - a.inboundRefs)[0], [enrichedNodes]);
  const supportingReadout = useMemo(() => {
    if (!deepest || !mostRelied) return "";
    return `${hotZones.length} churn×complexity hot zone${hotZones.length === 1 ? "" : "s"} (${hotZones.map((n) => n.label).join(", ")}); ${testGaps.length} high-risk modules ship without tests; ${mostRelied.label} is the most depended-upon module (${mostRelied.inboundRefs} inbound) and ${deepest.path} sits ${deepest.depth} layers deep from the entrypoint.`;
  }, [hotZones, testGaps, deepest, mostRelied]);

  const selectedNode = useMemo(() => {
    if (!hoverNode || enrichedNodes.length === 0) return enrichedNodes[0];
    const found = enrichedNodes.find((node) => `src/${node.path}` === hoverNode);
    return found ?? enrichedNodes[0];
  }, [hoverNode, enrichedNodes]);

  // Initial hover node
  useEffect(() => {
    if (enrichedNodes.length > 0 && !hoverNode) {
      setHoverNode(`src/${enrichedNodes[0].path}`);
    }
  }, [enrichedNodes, hoverNode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (fullscreen) setFullscreen(false);
      else if (selectedPath) setSelectedPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, selectedPath]);

  const runScan = async (repoOverride?: string) => {
    const input = repoOverride ?? repo;
    setRepo(input);
    const repoUrl = input.startsWith("http") ? input : `https://${input}`;
    if (!repoUrl.includes("github.com") || repoUrl.length < 20) {
      setErrorMessage("Enter a valid GitHub repository URL (e.g. https://github.com/org/repo).");
      setScan("error");
      return;
    }

    setScan("scanning");
    setStep(0);
    setScanResult(null);
    setErrorMessage("");
    setLogs(["Cloning repository archive…"]);
    abortRef.current = new AbortController();

    try {
      // POST /api/scan to start
      const initResp = await fetch(`${SCAN_API}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
        signal: abortRef.current.signal,
      });

      const initPayload = await initResp.json().catch(() => ({}));

      if (!initResp.ok) {
        const err = initPayload as { error?: string };
        throw new Error(err.error || "Failed to start scan.");
      }

      if (initPayload.result) {
        setScanResult(initPayload.result);
        setStep(5);
        setLogs((prev) => [...prev, "Analysis complete."]);
        setTimeout(() => setScan("results"), 400);
        return;
      }

      const { scanId } = initPayload;
      if (!scanId) {
        throw new Error("Scan API returned an invalid response.");
      }
      scanIdRef.current = scanId;

      // Poll status until done
      let done = false;
      while (!done) {
        const statusResp = await fetch(`${SCAN_API}/scan/${scanId}/status`, {
          signal: abortRef.current.signal,
        });

        if (!statusResp.ok) {
          throw new Error("Scan failed.");
        }

        const status = await statusResp.json();

        if (status.status === "error") {
          throw new Error(status.errorMessage || "Scan failed.");
        }

        // Update logs based on stage
        const stageLogs: Record<string, string> = {
          cloning: "Cloning repository archive",
          parsing_imports: "Parsing import graph · resolving dependencies",
          computing_complexity: "Computing cyclomatic complexity",
          scanning_dead_code: "Scanning unused exports · detecting dead code",
          generating_diagnosis: "Generating computed readout",
        };

        const stage = status.stage || status.status;
        if (stage && stageLogs[stage]) {
          setLogs((prev) => {
            if (prev.includes(stageLogs[stage])) return prev;
            return [...prev, stageLogs[stage]];
          });
        }

        // Map stage to step index
        const stageIndex: Record<string, number> = {
          cloning: 0,
          parsing_imports: 1,
          computing_complexity: 2,
          scanning_dead_code: 3,
          generating_diagnosis: 4,
          done: 5,
        };
        const idx = stageIndex[stage] ?? 0;
        setStep(Math.min(idx, 5));

        if (stage === "done" || status.status === "done") {
          done = true;
        } else {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      // Fetch result
      const resultResp = await fetch(`${SCAN_API}/scan/${scanId}/result`, {
        signal: abortRef.current.signal,
      });

      if (!resultResp.ok) {
        throw new Error("Failed to fetch scan result.");
      }

      const result = await resultResp.json();
      setScanResult(result);
      setStep(5);
      setLogs((prev) => [...prev, "Analysis complete."]);
      setTimeout(() => setScan("results"), 400);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setScan("error");
    }
  };

  const layerToggle = (floating = false) => (
    <div className={`flex rounded-[5px] border border-[#2a333d] bg-[#0b0e11] p-1 ${floating ? "shadow-[0_10px_30px_rgba(0,0,0,.5)]" : ""}`}>
      {(["Structure", "Complexity", "Debt"] as Layer[]).map((item) => <button onClick={() => setLayer(item)} key={item} className={`relative px-3 py-1.5 font-mono text-[10px] transition ${layer === item ? "text-[#eaf0f4]" : "text-[#65737f] hover:text-[#b7c2ca]"}`}>{item}{layer === item && <span className={`absolute inset-x-2 bottom-0 h-px ${item === "Structure" ? "bg-[#4fd1e8]" : item === "Complexity" ? "bg-[#f2a65a]" : "bg-[#f0475c]"}`}/>}</button>)}
    </div>
  );

  // The graph stage, shared between the docked panel and the fullscreen portal.
  const stageInner = (isFs: boolean) => <>
    <div className="pointer-events-none absolute inset-0 z-0 opacity-40 [background-image:radial-gradient(#42525d_0.7px,transparent_0.7px)] [background-size:16px_16px]"/>
    <Graph3D nodes={enrichedNodes} links={graphLinks} layer={layer} colorForNode={colorForNode} selectedPath={selectedPath} onSelect={setSelectedPath} onHover={setHoverNode} fullscreen={isFs}/>
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 border border-[#2b3540] bg-[#12161b]/95 px-3 py-2 font-mono text-[10px] text-[#82909c]"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#f0475c]"/>circular</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#4fd1e8]"/>healthy</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full ring-1 ring-[#f2a65a]"/>hot zone</span></div>
    <div className={`pointer-events-none absolute right-4 z-10 w-[220px] border border-[#33404b] bg-[#12161b]/95 p-3 shadow-[0_12px_32px_rgba(0,0,0,.25)] ${isFs ? "top-16" : "top-4"}`}><div className="mb-2 flex items-center justify-between"><FileCode2 size={14} className="text-[#f0475c]"/><span className="font-mono text-[9px] text-[#7c8a99]">MODULE SIGNAL</span></div><p className="truncate font-mono text-[11px] text-[#eaf0f4]">{hoverNode}</p><div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#29333c] pt-2 font-mono text-[10px]"><span><b className="block text-[#eaf0f4]">{selectedNode.loc}</b><em className="not-italic text-[#71808b]">LOC</em></span><span><b className={`block ${selectedNode.complexity > 25 ? "text-[#f0475c]" : selectedNode.complexity > 10 ? "text-[#f2a65a]" : "text-[#4fd1e8]"}`}>{selectedNode.complexity}</b><em className="not-italic text-[#71808b]">COMPLX</em></span><span><b className="block text-[#eaf0f4]">{selectedNode.inboundRefs + selectedNode.outboundRefs}</b><em className="not-italic text-[#71808b]">LINKS</em></span></div></div>
    {isFs && <>
      <div className="absolute left-4 top-4 z-10">{layerToggle(true)}</div>
      <button onClick={() => setFullscreen(false)} aria-label="Exit fullscreen" className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-[5px] border border-[#2a333d] bg-[#12161b]/95 px-3 py-2 font-mono text-[10px] text-[#aab5bf] transition hover:text-white"><Minimize2 size={14}/>Restore</button>
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex max-w-[420px] items-center gap-3 border border-[#232933] bg-[#12161b]/95 px-4 py-3"><span className="font-[Space_Grotesk] text-[26px] leading-none tracking-[-.05em] text-[#f2a65a]">{scanData.healthIndex}<span className="ml-0.5 text-[12px] text-[#7c8a99]">/100</span></span><span className="text-[11px] leading-5 text-[#c5d0d7]">{scanData.diagnosis}</span></div>
    </>}
  </>;

  return <>
    <main className="min-h-screen overflow-hidden bg-[#0b0e11] font-[Inter] text-[#eaf0f4] selection:bg-[#4fd1e8]/30">
    <div className="pointer-events-none fixed inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(89,111,125,.065)_1px,transparent_1px),linear-gradient(90deg,rgba(89,111,125,.055)_1px,transparent_1px)] [background-size:32px_32px]" />
    <header className="relative z-10 flex h-[70px] items-center justify-between border-b border-[#232933] px-5 sm:px-8">
      <div className="flex items-center gap-3"><SignalMark /><div><div className="flex items-baseline gap-2"><span className="font-[Space_Grotesk] text-[16px] font-medium tracking-[-0.025em]">Software MRI</span><span className="font-mono text-[10px] tracking-[.12em] text-[#7c8a99]">BETA 0.4</span></div><p className="font-mono text-[10px] text-[#7c8a99]">CODEBASE DIAGNOSTICS</p></div></div>
      <div className="hidden items-center gap-6 md:flex"><span className="flex items-center gap-2 font-mono text-[11px] text-[#7c8a99]"><span className="size-1.5 rounded-full bg-[#4fd1e8] shadow-[0_0_8px_#4fd1e8]"/>analysis engine online</span><button className="flex items-center gap-2 text-[13px] text-[#aab5bf] hover:text-white"><Github size={15}/>Documentation</button></div>
    </header>

    <section className="relative z-10 mx-auto max-w-[1580px] px-5 pb-8 pt-7 sm:px-8">
      <div className="flex flex-col gap-5 border-b border-[#232933] pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#4fd1e8]"><Crosshair size={12}/>Diagnostic workspace / 01</div><h1 className="font-[Space_Grotesk] text-[clamp(24px,3vw,34px)] font-medium leading-none tracking-[-0.035em]">Codebase scan</h1><p className="mt-2 text-[13px] text-[#7c8a99]">Map structural risk before it becomes operational debt.</p></div>
        <div className="w-full max-w-[700px]"><div className="flex h-12 items-center border border-[#303945] bg-[#12161b] transition focus-within:border-[#4fd1e8]/70 focus-within:shadow-[inset_0_-2px_0_#4fd1e8]"><Github className="ml-4 shrink-0 text-[#7c8a99]" size={16}/><input value={repo} onChange={(event) => setRepo(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runScan()} aria-label="GitHub repository URL" className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-[12px] text-[#dfe8ed] outline-none placeholder:text-[#53616d]" placeholder="github.com/org/repo"/><button onClick={() => runScan()} className="mr-1 flex h-9 items-center gap-2 bg-[#eaf0f4] px-4 text-[12px] font-medium text-[#0b0e11] transition hover:bg-[#4fd1e8]"><Play size={13} fill="currentColor"/>Run scan</button></div></div>
      </div>

      {scan === "error" && <div className="mt-5 flex items-center justify-between border border-[#f0475c]/40 bg-[#f0475c]/10 px-4 py-3 text-[12px]"><span className="flex items-center gap-2 text-[#eab0b7]"><CircleAlert size={15}/>{errorMessage || "This repo couldn't be scanned — check that it is public and contains a package.json."}</span><button onClick={() => setScan("ready")} className="flex items-center gap-1 font-mono text-[#f2a65a]"><RotateCcw size={13}/>RETRY</button></div>}
      {scan === "scanning" && <div className="mt-8 border border-[#232933] bg-[#12161b] p-6"><div className="mb-5 flex items-center justify-between font-mono text-[11px] text-[#7c8a99]"><span>READING SIGNAL / {Math.min(step + 1, 4)} OF 4</span><span className="text-[#4fd1e8]">{25 * (step + 1)}%</span></div><div className="h-[3px] overflow-hidden bg-[#202832]"><div className="h-full animate-[pulse_1.2s_ease-in-out_infinite] bg-[linear-gradient(90deg,#4fd1e8,#f2a65a,#f0475c)] transition-all duration-500" style={{width: `${25 * (step + 1)}%`}}/></div><div className="mt-5 space-y-2 font-mono text-[11px]">{logs.slice(0, step + 1).map((log, index) => <p key={log} className={index === step ? "text-[#eaf0f4]" : "text-[#64717c]"}><Check className="mr-2 inline text-[#4fd1e8]" size={12}/>{log}<span className="text-[#4fd1e8]"> · complete</span></p>)}</div></div>}

      {scan === "results" && scanData && <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 border border-[#232933] bg-[#101419]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#232933] px-5 py-4 sm:flex-row sm:items-center">
            <div><div className="flex items-center gap-2"><Layers3 size={15} className="text-[#4fd1e8]"/><h2 className="font-[Space_Grotesk] text-[15px] font-medium">Cross-sectional map</h2><span className="rounded-full border border-[#26313b] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#7c8a99]">{scanData.filesScanned.toLocaleString()} modules</span></div><p className="mt-1 font-mono text-[10px] text-[#62707c]">Drag to rotate · click a module to zoom and inspect.</p></div>
            <div className="flex items-center gap-2">{layerToggle()}<button onClick={() => setFullscreen(true)} aria-label="Maximize graph" className="flex size-8 items-center justify-center rounded-[5px] border border-[#2a333d] bg-[#0b0e11] text-[#7c8a99] transition hover:text-white"><Maximize2 size={14}/></button></div>
          </div>
          {fullscreen ? (
            <div className="flex h-[440px] items-center justify-center border-t border-[#232933] font-mono text-[11px] text-[#64737e] sm:h-[560px]">Graph maximized — press Esc or Restore to dock</div>
          ) : (
            <div className="relative h-[440px] overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(51,91,100,.14),transparent_56%)] sm:h-[560px]">
              {stageInner(false)}
            </div>
          )}
          <div className="grid grid-cols-2 divide-x divide-[#232933] border-t border-[#232933] sm:grid-cols-4"><Metric label="Files scanned" value={scanData.filesScanned.toLocaleString()}/><Metric label="Dependencies" value={scanData.dependencies.toLocaleString()}/><Metric label="Circular refs" value={String(scanData.circularRefs).padStart(2, "0")} hot/><Metric label="Scan duration" value={`${scanData.scanDurationSeconds}s`}/></div>
        </section>
        <aside className="border border-[#232933] bg-[#12161b]">
          <div className="border-b border-[#232933] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity size={15} className="text-[#f0475c]"/><h2 className="font-[Space_Grotesk] text-[15px] font-medium">Diagnosis</h2></div><span className="font-mono text-[10px] text-[#7c8a99]">v1.0</span></div><div className="mt-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7c8a99]">Health index</p><p className="mt-1 font-[Space_Grotesk] text-[46px] leading-none tracking-[-.06em]">{scanData.healthIndex}<span className="ml-1 text-[17px] text-[#7c8a99]">/100</span></p></div><div className="mb-1 flex size-14 items-center justify-center rounded-full border-2 border-[#f2a65a] font-mono text-[11px] text-[#f2a65a]">{scanData.healthGrade}</div></div><div className="mt-4 h-[3px] overflow-hidden bg-[#28313a]"><div className="h-full bg-[linear-gradient(90deg,#4fd1e8,#f2a65a,#f0475c)]" style={{width: `${scanData.healthIndex}%`}}/></div></div>
          <div className="p-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#7c8a99]">Computed readout</p><p className="mt-2 text-[13px] leading-6 text-[#c5d0d7]">{scanData.diagnosis}</p><p className="mt-3 border-t border-[#232933] pt-3 text-[11px] leading-5 text-[#8b98a3]"><Flame size={11} className="mr-1 inline text-[#f2a65a]"/>{supportingReadout}</p></div>
          <div className="border-y border-[#232933] p-5"><div className="mb-3 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#7c8a99]">Highest signal</p><button className="text-[#7c8a99] hover:text-white"><ChevronDown size={15}/></button></div><div className="space-y-3">{risks.map((risk, index) => <button key={risk.file} onClick={() => { setHoverNode(`src/${risk.file}`); setSelectedPath(risk.file); }} className={`group flex w-full items-start gap-3 text-left ${selectedPath === risk.file ? "opacity-100" : ""}`}><span className="mt-1 font-mono text-[10px] text-[#56636d]">0{index + 1}</span><span className="min-w-0 flex-1"><span className={`block truncate font-mono text-[10px] group-hover:text-[#4fd1e8] ${selectedPath === risk.file ? "text-[#4fd1e8]" : "text-[#d6e0e5]"}`}>{risk.file}</span><span className="mt-1 block text-[10px] text-[#788692]">{risk.note}</span></span><span className={`mt-1 size-2 rounded-full ${risk.tone}`}/></button>)}</div></div>
          <div className="p-5"><button onClick={() => { if (!scanData) return; const blob = new Blob([JSON.stringify(scanData, null, 2)], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${scanData.repo.replace(/[^a-zA-Z0-9]/g, "_")}_mri.json`; a.click(); URL.revokeObjectURL(url); }} className="flex items-center gap-2 text-[12px] text-[#b5c1c9] transition hover:text-[#4fd1e8]"><Database size={14}/>Export analysis <ArrowUpRight size={13}/></button></div>
        </aside>
      </div>}

      {scan === "results" && scanData && (() => {
        const filteredDebt = debt.filter((item) => item.file.toLowerCase().includes(query.toLowerCase()) && (!selectedPath || item.file === selectedPath));
        return <section className="mt-5 border border-[#232933] bg-[#12161b]"><div className="flex flex-col justify-between gap-3 border-b border-[#232933] px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-2"><Sparkles size={15} className="text-[#f2a65a]"/><h2 className="font-[Space_Grotesk] text-[15px] font-medium">Debt layer</h2><span className="font-mono text-[10px] text-[#7c8a99]">{filteredDebt.length} of {debt.length} findings</span>{selectedPath && <button onClick={() => setSelectedPath(null)} className="flex items-center gap-1 rounded-full border border-[#33404b] bg-[#0b0e11] px-2 py-0.5 font-mono text-[9px] text-[#4fd1e8]">focus · {selectedPath.split("/").pop()}<X size={10}/></button>}</div><div className="flex items-center gap-2 font-mono text-[10px] text-[#7c8a99]"><Search size={13}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-32 bg-transparent outline-none placeholder:text-[#586570]" placeholder="filter files"/></div></div>{filteredDebt.length === 0 ? <p className="px-5 py-8 text-center font-mono text-[11px] text-[#64737e]">No static findings for this module.</p> : <div className="grid divide-y divide-[#232933] md:grid-cols-2 md:divide-x md:divide-y-0">{filteredDebt.map((item) => <button key={item.file} onClick={() => setSelectedPath(item.file)} className="flex items-center gap-4 px-5 py-4 text-left transition hover:bg-[#161b21]"><span className="font-mono text-[10px] text-[#64737e]">{String(item.score).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="truncate font-mono text-[11px] text-[#d5dfe5]">src/{item.file}</p><p className="mt-1 text-[10px] text-[#71808a]">{item.tag} · modified {item.lastModified}</p></div><div className="w-20"><div className="h-1 bg-[#253039]"><div className={`h-full ${item.color}`} style={{width: `${item.score}%`}}/></div></div></button>)}</div>}</section>;
      })()}
    </section>
    <footer className="relative z-10 flex items-center justify-between border-t border-[#232933] px-5 py-4 font-mono text-[10px] text-[#586671] sm:px-8"><span>STATIC ANALYSIS ONLY · NO GENERATIVE INFERENCE</span><span className="flex items-center gap-2"><ShieldCheck size={13} className="text-[#4fd1e8]"/>DATA REMAINS LOCAL</span></footer>
  </main>
    {fullscreen && createPortal(
      <div className="fixed inset-0 z-[100] overflow-hidden bg-[#0b0e11]">{stageInner(true)}</div>,
      document.body,
    )}
  </>;
}

function Metric({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return <div className="px-5 py-4"><p className="font-mono text-[9px] uppercase tracking-[.11em] text-[#697883]">{label}</p><p className={`mt-1 font-mono text-[17px] ${hot ? "text-[#f0475c]" : "text-[#eaf0f4]"}`}>{value}</p></div>;
}
