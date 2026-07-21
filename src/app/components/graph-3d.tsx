import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import * as THREE from "three";
import type { EnrichedNode } from "../lib/analysis";

type Layer = "Structure" | "Complexity" | "Debt";

export type GraphLink = { source: string; target: string; circular: boolean };

type GraphNode = EnrichedNode & {
  fx: number;
  fy: number;
  fz: number;
  label: string;
  __rank: number;
};

const R = 150; // sphere radius

// Place every module on the surface of a globe so all nodes stay evenly spread
// (no clumping, nothing buried inside). We lay them down folder-by-folder and walk
// a Fibonacci spiral, so consecutive nodes — i.e. same-folder nodes — land in the
// same patch of the sphere. The architecture stays legible without overlap.
function spherePositions(nodes: EnrichedNode[]): GraphNode[] {
  const clusters = Array.from(new Set(nodes.map((n) => n.cluster)));
  const ordered = clusters.flatMap((cluster) => nodes.filter((n) => n.cluster === cluster));
  const total = ordered.length;
  const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle

  return ordered.map((node, i) => {
    const y = 1 - (i / Math.max(1, total - 1)) * 2; // 1 → -1
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    return {
      ...node,
      label: node.path.split("/").pop() ?? node.path,
      __rank: node.inboundRefs + node.outboundRefs,
      fx: R * Math.cos(theta) * ring,
      fy: R * y,
      fz: R * Math.sin(theta) * ring,
    };
  });
}

export function Graph3D({
  nodes,
  links,
  layer,
  colorForNode,
  selectedPath,
  onSelect,
  onHover,
  fullscreen,
}: {
  nodes: EnrichedNode[];
  links: GraphLink[];
  layer: Layer;
  colorForNode: (node: EnrichedNode, layer: Layer) => string;
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
  onHover: (path: string) => void;
  fullscreen: boolean;
}) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 480 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const idleTimer = useRef<number | undefined>(undefined);

  const graphData = useMemo(() => {
    const placed = spherePositions(nodes);
    return { nodes: placed, links: links.map((l) => ({ ...l })) };
  }, [nodes, links]);

  const nodeById = useMemo(() => new Map(graphData.nodes.map((n) => [n.id, n])), [graphData]);
  const pathToId = useMemo(() => new Map(nodes.map((n) => [n.path, n.id])), [nodes]);

  // The force engine rewrites link.source/target from id strings to node objects,
  // so resolve the endpoint id defensively.
  const endId = (end: unknown) =>
    typeof end === "object" && end !== null ? (end as { id: string }).id : (end as string);
  const linkTouchesHover = (link: GraphLink) =>
    hoverId !== null && (endId(link.source) === hoverId || endId(link.target) === hoverId);

  // Responsive sizing.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Ambient auto-rotate on idle; pause the instant the user grabs the sphere.
  useEffect(() => {
    let raf = 0;
    const attach = () => {
      const controls = fgRef.current?.controls() as
        | (THREE.EventDispatcher & { autoRotate: boolean; autoRotateSpeed: number })
        | undefined;
      if (!controls) {
        raf = requestAnimationFrame(attach);
        return;
      }
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.55;
      const onStart = () => {
        controls.autoRotate = false;
        window.clearTimeout(idleTimer.current);
      };
      const onEnd = () => {
        window.clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => {
          controls.autoRotate = true;
        }, 2500);
      };
      controls.addEventListener("start", onStart);
      controls.addEventListener("end", onEnd);
    };
    raf = requestAnimationFrame(attach);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pull the initial camera back so the whole globe is framed.
  useEffect(() => {
    const t = window.setTimeout(() => {
      fgRef.current?.cameraPosition({ x: 0, y: 0, z: R * 2.6 }, { x: 0, y: 0, z: 0 }, 0);
    }, 60);
    return () => window.clearTimeout(t);
  }, []);

  // Keep the floating detail card pinned to the selected node as the sphere moves.
  useEffect(() => {
    if (!selectedPath) {
      setCardPos(null);
      return;
    }
    const id = pathToId.get(selectedPath);
    const node = id ? nodeById.get(id) : undefined;
    if (!node) {
      setCardPos(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const coords = fgRef.current?.graph2ScreenCoords(node.fx, node.fy, node.fz);
      if (coords) setCardPos({ x: coords.x, y: coords.y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectedPath, nodeById, pathToId]);

  const selectedNode = selectedPath ? nodeById.get(pathToId.get(selectedPath) ?? "") : undefined;

  const focusNode = (node: GraphNode) => {
    const dist = 60;
    const len = Math.hypot(node.fx, node.fy, node.fz) || 1;
    const ratio = 1 + dist / len;
    const controls = fgRef.current?.controls() as { autoRotate: boolean } | undefined;
    if (controls) controls.autoRotate = false;
    fgRef.current?.cameraPosition(
      { x: node.fx * ratio, y: node.fy * ratio, z: node.fz * ratio },
      { x: node.fx, y: node.fy, z: node.fz },
      900,
    );
    onSelect(node.path);
    onHover(`src/${node.path}`);
  };

  const resetView = () => {
    fgRef.current?.cameraPosition({ x: 0, y: 0, z: R * 2.6 }, { x: 0, y: 0, z: 0 }, 900);
    onSelect(null);
  };

  // Hot zones (high churn + high complexity) get an always-on warning ring.
  const nodeThreeObject = (node: GraphNode) => {
    if (!node.hotZone) return undefined as unknown as THREE.Object3D;
    const size = 4 + Math.cbrt(Math.max(1, node.loc / 40 + node.__rank)) * 2.2;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size, 0.5, 8, 32),
      new THREE.MeshBasicMaterial({ color: "#f2a65a", transparent: true, opacity: 0.85 }),
    );
    return ring;
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <ForceGraph3D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        nodeId="id"
        nodeLabel={(n) => `src/${(n as GraphNode).path}`}
        nodeRelSize={4}
        nodeVal={(n) => {
          const node = n as GraphNode;
          return Math.max(1, node.loc / 40 + node.__rank);
        }}
        nodeOpacity={0.92}
        nodeColor={(n) => colorForNode(n as GraphNode, layer)}
        nodeThreeObjectExtend
        nodeThreeObject={nodeThreeObject}
        linkColor={(l) => {
          const link = l as GraphLink;
          if (link.circular) return "#f0475c";
          if (linkTouchesHover(link)) return "#4fd1e8";
          return "#39454e";
        }}
        linkWidth={(l) => {
          const link = l as GraphLink;
          if (link.circular) return 2.2;
          if (linkTouchesHover(link)) return 1.6;
          return 0.9;
        }}
        linkOpacity={0.65}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.6}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleColor={(l) => ((l as GraphLink).circular ? "#f0475c" : "#4fd1e8")}
        onNodeHover={(n) => {
          const node = n as GraphNode | null;
          setHoverId(node?.id ?? null);
          if (node) onHover(`src/${node.path}`);
          if (containerRef.current) containerRef.current.style.cursor = node ? "pointer" : "grab";
        }}
        onNodeClick={(n) => focusNode(n as GraphNode)}
        onBackgroundClick={resetView}
      />

      {selectedNode && cardPos && (
        <div
          className="pointer-events-none absolute z-20 w-[210px] -translate-x-1/2 border border-[#33404b] bg-[#0d1216]/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,.45)] backdrop-blur-sm"
          style={{ left: cardPos.x, top: cardPos.y + 18 }}
        >
          <p className="truncate font-mono text-[11px] text-[#eaf0f4]">src/{selectedNode.path}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#29333c] pt-2 font-mono text-[10px]">
            <span>
              <b className="block text-[#eaf0f4]">{selectedNode.loc}</b>
              <em className="not-italic text-[#71808b]">LOC</em>
            </span>
            <span>
              <b
                className={`block ${
                  selectedNode.complexity > 25
                    ? "text-[#f0475c]"
                    : selectedNode.complexity > 10
                      ? "text-[#f2a65a]"
                      : "text-[#4fd1e8]"
                }`}
              >
                {selectedNode.complexity}
              </b>
              <em className="not-italic text-[#71808b]">CPLX</em>
            </span>
            <span>
              <b className="block text-[#eaf0f4]">
                {selectedNode.inboundRefs}/{selectedNode.outboundRefs}
              </b>
              <em className="not-italic text-[#71808b]">IN/OUT</em>
            </span>
            <span>
              <b className="block text-[#eaf0f4]">{selectedNode.instability.toFixed(2)}</b>
              <em className="not-italic text-[#71808b]">INSTAB</em>
            </span>
            <span>
              <b className="block text-[#eaf0f4]">{selectedNode.churn}</b>
              <em className="not-italic text-[#71808b]">CHURN</em>
            </span>
            <span>
              <b className={`block ${selectedNode.hasTest ? "text-[#4fd1e8]" : "text-[#f0475c]"}`}>
                {selectedNode.hasTest ? "yes" : "none"}
              </b>
              <em className="not-italic text-[#71808b]">TESTS</em>
            </span>
          </div>
          {selectedNode.hotZone && (
            <p className="mt-2 border-t border-[#29333c] pt-2 font-mono text-[9px] uppercase tracking-[.1em] text-[#f2a65a]">
              ⚠ hot zone · high churn × complexity
            </p>
          )}
        </div>
      )}
    </div>
  );
}
