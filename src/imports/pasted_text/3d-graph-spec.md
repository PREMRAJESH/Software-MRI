This supersedes the 2D graph section of the earlier build prompt. Keep everything else (design tokens, Diagnosis panel, Debt list, GSAP state transitions) from the original spec — this document only replaces the central visualization and adds analysis depth.

1. The graph becomes a 3D node sphere
Library

Use 3d-force-graph (Three.js-based, built specifically for this — handles orbit controls, force-directed 3D layout, and camera-to-node zoom natively, so you're not hand-building physics/camera math under time pressure). It integrates cleanly with React via react-force-graph-3d.

Layout
Nodes arranged on a sphere surface (not free-floating 3D force layout) — use the library's spherical/fixed-radius constraint so modules sit on a globe rather than drifting in open 3D space. This reads intentional ("scanning a body") rather than chaotic.
Cluster by folder: nodes from the same top-level folder (services, components, utils, etc.) should sit in the same hemisphere/band of the sphere, not scattered randomly — assign each folder a latitude band or angular sector so the folder structure is visible even before any interaction.
Node size = LOC or fan-in/out (bigger = more central to the codebase).
Node color = active layer's signal (cyan/orange/red for Structure health, or the complexity gradient when Complexity layer is active).
Edges: thin (1px), low opacity (~15-20%) by default — dense edge webs across a sphere get unreadable fast in 3D. On hover/select of a node, animate its direct edges to full opacity and a brighter stroke so the connections for that module become the focus, rather than showing all 4,921 edges at full strength simultaneously.
Circular-dependency edges get a distinct treatment always-on (not just on hover) — thicker, --signal-hot, subtle pulsing animation — since those are the highest-priority signal and shouldn't require a hover to notice.
Interaction
Orbit controls: click-drag to rotate the sphere, scroll/pinch to zoom — standard orbit camera (the library gives you this for free via OrbitControls).
Auto-rotate on idle: slow ambient rotation (very slow, ~0.3°/frame) when the user isn't interacting — makes the graph feel alive on a projector/demo screen without anyone touching it. Pause auto-rotate the instant the user starts dragging.
Node click → zoom-to-node: camera animates (smooth GSAP-eased tween, not the library's default snap) to center and push in close to the clicked node, simultaneously updating the Diagnosis panel and Debt list to filter to that module. This is the moment that should feel most "premium" — a deliberate camera move, not a jump cut.
Click empty space / press Escape: camera eases back out to the full sphere view.
Double-click a node: opens a compact inline detail card floating near the node in 3D space (file path, LOC, complexity, inbound/outbound refs) rather than only relying on the side panel — this makes the 3D space itself feel information-rich, not just decorative.
Layer switching in 3D
Structure → Complexity: node colors cross-fade (tween the material color over ~0.4s), sphere layout position stays the same so it reads as "same body, different scan," not a re-shuffle.
Debt layer: non-flagged nodes fade to low opacity/greyscale, flagged (dead code / unused) nodes stay lit and pulse gently — the sphere becomes mostly dim with a handful of glowing problem points, which is a strong, legible "here's what's wrong" visual on its own.
2. Fullscreen / maximize mode
A maximize icon (top-right corner of the graph panel, standard expand-arrows glyph) that transitions the graph panel to fill the viewport using the Fullscreen API (element.requestFullscreen()) or a full-viewport overlay if you want more transition control than the native API gives you.
On entering fullscreen: GSAP-animate the graph panel's bounds from its docked size to full-viewport (scale/position tween, ~0.4s, power2.inOut) rather than an instant snap — this is a natural extension of the "instrument panel" feel.
In fullscreen, keep a minimal floating version of the layer toggle and a compact Diagnosis summary strip so context isn't lost — don't strip the UI down to just the graph, or you lose the "diagnosis" framing.
Exit via Escape key or a visible collapse icon — always give a keyboard-accessible exit, don't rely solely on the browser's native fullscreen exit UI.
This is a genuinely good demo moment — plan for it explicitly in your live walkthrough: expand to fullscreen right as you start narrating the circular dependencies, so the sphere fills the screen while you talk through the finding.
3. Deeper "MRI-grade" analysis pass

Push the actual analysis beyond the three headline metrics (structure/complexity/debt) so the tool earns the "MRI" framing rather than just aesthetically referencing it. Add these as additional computed signals, surfaced in the Diagnosis panel and available per-node in the detail card:

Churn-vs-complexity overlay: cross-reference file modification frequency (from git log) against complexity score. A file that's both high-complexity AND frequently changed is the actual highest-risk combination in real engineering practice (not just complexity alone) — surface these specifically as "hot zones," maybe with their own distinct marker on the sphere (e.g. a subtle warning ring), since this is a genuinely more sophisticated insight than raw complexity and will read as real engineering judgment to judges.
Coupling instability metric: for each module, compute afferent/efferent coupling ratio (how much it depends on others vs. is depended upon) — flags modules that are risky to change because too much relies on them.
Test coverage gap (if test files are detectable in the repo): flag modules with no corresponding test file, especially ones that also show up in the high-complexity or high-churn signals — this is the single most actionable finding you can hand an engineer.
Onion/depth score: how many layers deep a module sits in the import chain from the entry point — surfaces "buried" modules that are hard to reason about in isolation.

Don't try to surface all four as separate visual layers in the sphere (that's scope creep) — pick the churn-vs-complexity hot zone as the one additional signal that gets its own visual treatment (since it's the most impressive/credible to judges), and fold the other two or three into the Diagnosis panel's computed readout text and the per-node detail card as supporting data. This keeps the visual language clean (still just Structure / Complexity / Debt as the three primary "scan sequences") while proving the analysis underneath is genuinely deep.