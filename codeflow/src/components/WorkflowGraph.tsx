import { useState, useRef, useCallback, useMemo } from "react";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ===================== TYPES =====================
interface WorkflowNode {
  id: string;
  label: string;
  sublabel?: string;
  type: "start" | "end" | "function" | "process" | "decision" | "loop" | "return";
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

interface WorkflowGraphProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodeClick?: (node: WorkflowNode) => void;
}

// ===================== COLOR MAP =====================
const NODE_COLORS: Record<WorkflowNode["type"], { bg: string; border: string; text: string; glow: string }> = {
  start:    { bg: "#10b981", border: "#059669", text: "#ffffff", glow: "rgba(16,185,129,0.35)" },
  end:      { bg: "#ef4444", border: "#dc2626", text: "#ffffff", glow: "rgba(239,68,68,0.35)" },
  function: { bg: "#6366f1", border: "#4f46e5", text: "#ffffff", glow: "rgba(99,102,241,0.35)" },
  process:  { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff", glow: "rgba(139,92,246,0.35)" },
  decision: { bg: "#f59e0b", border: "#d97706", text: "#1a1a1a", glow: "rgba(245,158,11,0.35)" },
  loop:     { bg: "#0ea5e9", border: "#0284c7", text: "#ffffff", glow: "rgba(14,165,233,0.35)" },
  return:   { bg: "#f97316", border: "#ea580c", text: "#ffffff", glow: "rgba(249,115,22,0.35)" },
};

const LEGEND_ITEMS = [
  { type: "start" as const, label: "Start / End" },
  { type: "function" as const, label: "Function" },
  { type: "process" as const, label: "Process" },
  { type: "decision" as const, label: "Decision" },
  { type: "loop" as const, label: "Loop" },
  { type: "return" as const, label: "Return" },
];

// ===================== AUTO LAYOUT (simple layered) =====================
function autoLayout(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  if (nodes.length === 0) return [];

  // Build adjacency for topological sort
  const adj: Record<string, string[]> = {};
  const inDeg: Record<string, number> = {};
  nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
  edges.forEach(e => {
    if (adj[e.source]) adj[e.source].push(e.target);
    if (inDeg[e.target] !== undefined) inDeg[e.target]++;
  });

  // BFS topological layering
  const layers: string[][] = [];
  const visited = new Set<string>();
  let queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  if (queue.length === 0) queue = [nodes[0].id]; // fallback

  while (queue.length > 0) {
    layers.push([...queue]);
    queue.forEach(id => visited.add(id));
    const next: string[] = [];
    queue.forEach(id => {
      (adj[id] || []).forEach(target => {
        if (!visited.has(target)) {
          inDeg[target]--;
          if (inDeg[target] <= 0 && !next.includes(target)) {
            next.push(target);
          }
        }
      });
    });
    queue = next;
  }

  // Place unvisited nodes in last layer
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      if (layers.length === 0) layers.push([]);
      layers[layers.length - 1].push(n.id);
    }
  });

  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
  const LAYER_GAP_X = 280;
  const NODE_GAP_Y = 130;

  layers.forEach((layer, li) => {
    const totalHeight = layer.length * NODE_GAP_Y;
    const startY = -totalHeight / 2 + NODE_GAP_Y / 2;
    layer.forEach((id, ni) => {
      const node = nodeMap.get(id);
      if (node) {
        node.x = li * LAYER_GAP_X + 80;
        node.y = startY + ni * NODE_GAP_Y + 200;
      }
    });
  });

  return Array.from(nodeMap.values());
}

// ===================== EDGE PATH CALCULATION =====================
function computeEdgePath(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
): string {
  const sx = sourceNode.x + sourceNode.width;
  const sy = sourceNode.y + sourceNode.height / 2;
  const tx = targetNode.x;
  const ty = targetNode.y + targetNode.height / 2;

  const dx = tx - sx;
  const midX = sx + dx * 0.5;

  // If target is to the right (normal flow)
  if (dx > 40) {
    return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
  }
  // Backward edge (loop)
  const offset = 50;
  return `M ${sx} ${sy} C ${sx + offset} ${sy}, ${sx + offset} ${sy - offset * 2}, ${(sx + tx) / 2} ${Math.min(sy, ty) - offset * 2} S ${tx - offset} ${ty}, ${tx} ${ty}`;
}

// ===================== MAIN COMPONENT =====================
export default function WorkflowGraph({ nodes: rawNodes, edges, onNodeClick }: WorkflowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Auto-layout nodes
  const nodes = useMemo(() => {
    const sized = rawNodes.map(n => ({
      ...n,
      width: n.width || 200,
      height: n.height || 70,
    }));
    return autoLayout(sized, edges);
  }, [rawNodes, edges]);

  // Calculate bounding box for viewBox
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - 40);
      minY = Math.min(minY, n.y - 40);
      maxX = Math.max(maxX, n.x + n.width + 40);
      maxY = Math.max(maxY, n.y + n.height + 40);
    });
    return { minX, minY, maxX, maxY };
  }, [nodes]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom with scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(prev => Math.max(0.2, Math.min(2.5, prev + delta)));
  }, []);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <div className="workflow-graph-container" ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: 500, background: "#0f1117", borderRadius: 8, overflow: "hidden", userSelect: "none" }}>
      {/* Top info bar */}
      <div style={{ position: "absolute", top: 12, left: 16, zIndex: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8b5cf6", fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} />
          {nodes.length} nodes
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6b7280", display: "inline-block" }} />
          {edges.length} edges
        </span>
      </div>

      {/* Zoom controls */}
      <div style={{ position: "absolute", top: 12, right: 16, zIndex: 20, display: "flex", gap: 4 }}>
        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="wf-ctrl-btn" title="Zoom In">
          <ZoomIn size={14} />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.15))} className="wf-ctrl-btn" title="Zoom Out">
          <ZoomOut size={14} />
        </button>
        <button onClick={resetView} className="wf-ctrl-btn" title="Reset View">
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: isPanning ? "grabbing" : "grab", minHeight: 500 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Animated dash pattern */}
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow marker */}
          <marker id="wf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5b6078" />
          </marker>
          <marker id="wf-arrow-highlight" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
          </marker>

          {/* Grid pattern */}
          <pattern id="wf-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="0.6" fill="#1e2030" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background grid */}
          <rect x={bounds.minX - 200} y={bounds.minY - 200} width={bounds.maxX - bounds.minX + 400} height={bounds.maxY - bounds.minY + 400} fill="url(#wf-grid)" />

          {/* Edges */}
          {edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const path = computeEdgePath(src, tgt);
            const isHighlighted = selectedNode === edge.source || selectedNode === edge.target ||
              hoveredNode === edge.source || hoveredNode === edge.target;

            return (
              <g key={edge.id}>
                {/* Glow layer */}
                {isHighlighted && (
                  <path
                    d={path}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={4}
                    opacity={0.3}
                    filter="url(#glow-filter)"
                  />
                )}
                {/* Main dashed line */}
                <path
                  d={path}
                  fill="none"
                  stroke={isHighlighted ? "#8b5cf6" : "#3a3f5c"}
                  strokeWidth={isHighlighted ? 2.5 : 1.8}
                  strokeDasharray="8 5"
                  markerEnd={isHighlighted ? "url(#wf-arrow-highlight)" : "url(#wf-arrow)"}
                  className="wf-edge-animated"
                  opacity={isHighlighted ? 1 : 0.7}
                />
                {/* Edge label */}
                {edge.label && (
                  <text
                    x={(src.x + src.width + tgt.x) / 2}
                    y={(src.y + src.height / 2 + tgt.y + tgt.height / 2) / 2 - 8}
                    fill={isHighlighted ? "#c4b5fd" : "#5b6078"}
                    fontSize={10}
                    fontWeight={600}
                    fontFamily="'Space Grotesk', sans-serif"
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = NODE_COLORS[node.type] || NODE_COLORS.process;
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const isActive = isSelected || isHovered;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(selectedNode === node.id ? null : node.id);
                  onNodeClick?.(node);
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Glow background */}
                {isActive && (
                  <rect
                    x={-6}
                    y={-6}
                    width={node.width + 12}
                    height={node.height + 12}
                    rx={12}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth={2}
                    opacity={0.5}
                    className="wf-node-glow"
                  />
                )}

                {/* Node body */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx={8}
                  fill="#181b2e"
                  stroke={isActive ? colors.border : "#2a2d45"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />

                {/* Top accent bar */}
                <rect
                  width={node.width}
                  height={3}
                  rx={0}
                  fill={colors.bg}
                  clipPath={`inset(0 0 0 0 round 8px 8px 0 0)`}
                />
                {/* Rounded top corners for accent */}
                <rect x={0} y={0} width={node.width} height={8} rx={8} fill={colors.bg} />
                <rect x={0} y={4} width={node.width} height={4} fill="#181b2e" />

                {/* Type badge */}
                <g transform={`translate(10, 16)`}>
                  <rect width={10} height={10} rx={5} fill={colors.bg} opacity={0.9} />
                </g>

                {/* Label */}
                <text
                  x={28}
                  y={24}
                  fill="#e2e8f0"
                  fontSize={13}
                  fontWeight={700}
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {node.label.length > 22 ? node.label.slice(0, 20) + "…" : node.label}
                </text>

                {/* Sublabel */}
                {node.sublabel && (
                  <text
                    x={12}
                    y={44}
                    fill="#6b7994"
                    fontSize={10}
                    fontWeight={500}
                    fontFamily="'Inter', sans-serif"
                  >
                    {node.sublabel.length > 35 ? node.sublabel.slice(0, 33) + "…" : node.sublabel}
                  </text>
                )}

                {/* Line info */}
                <text
                  x={12}
                  y={node.height - 8}
                  fill="#4a5074"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {node.type.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Minimap */}
      <div style={{
        position: "absolute",
        bottom: 50,
        right: 16,
        width: 140,
        height: 100,
        background: "#13152280",
        border: "1px solid #2a2d45",
        borderRadius: 6,
        overflow: "hidden",
        zIndex: 20,
        backdropFilter: "blur(8px)",
      }}>
        <svg width="100%" height="100%" viewBox={`${bounds.minX - 20} ${bounds.minY - 20} ${bounds.maxX - bounds.minX + 40} ${bounds.maxY - bounds.minY + 40}`} preserveAspectRatio="xMidYMid meet">
          {edges.map(edge => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            return (
              <line
                key={`mm-${edge.id}`}
                x1={src.x + src.width / 2}
                y1={src.y + src.height / 2}
                x2={tgt.x + tgt.width / 2}
                y2={tgt.y + tgt.height / 2}
                stroke="#3a3f5c"
                strokeWidth={3}
              />
            );
          })}
          {nodes.map(node => {
            const colors = NODE_COLORS[node.type] || NODE_COLORS.process;
            return (
              <rect
                key={`mm-${node.id}`}
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={colors.bg}
                rx={4}
                opacity={0.8}
              />
            );
          })}
          {/* Viewport indicator */}
          <rect
            x={bounds.minX - pan.x / zoom}
            y={bounds.minY - pan.y / zoom}
            width={(bounds.maxX - bounds.minX) / zoom * 0.5}
            height={(bounds.maxY - bounds.minY) / zoom * 0.5}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={6}
            opacity={0.5}
            rx={3}
          />
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: 12,
        left: 16,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 11,
        color: "#6b7994",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#4a5074", fontWeight: 800 }}>Legend</span>
        {LEGEND_ITEMS.map(item => {
          const c = NODE_COLORS[item.type];
          return (
            <span key={item.type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.bg, display: "inline-block", boxShadow: `0 0 6px ${c.glow}` }} />
              {item.label}
            </span>
          );
        })}
      </div>

      {/* Plus button */}
      <div style={{ position: "absolute", bottom: 50, left: 16, zIndex: 20 }}>
        <button className="wf-ctrl-btn" onClick={resetView} title="Fit View" style={{ width: 32, height: 32 }}>
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ===================== HELPER: Convert FlowSteps to Workflow data =====================
export function flowStepsToWorkflow(
  flowSteps: { step: number; title: string; description: string; relatedCodeSnippet: string; role: string }[],
  functions?: { name: string; calls: string[]; lineRange: string; purpose: string }[]
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  const roleToType = (role: string): WorkflowNode["type"] => {
    const r = role?.toLowerCase();
    if (r === "init" || r === "input") return "start";
    if (r === "output") return "end";
    if (r === "condition") return "decision";
    if (r === "loop") return "loop";
    if (r === "process") return "process";
    if (r === "error") return "return";
    return "process";
  };

  // Add function nodes first if available
  if (functions && functions.length > 0) {
    functions.forEach((fn, i) => {
      nodes.push({
        id: `fn-${i}`,
        label: `${fn.name}()`,
        sublabel: `${fn.purpose.slice(0, 40)}...`,
        type: "function",
        x: 0,
        y: 0,
        width: 210,
        height: 70,
      });
    });

    // Add function call edges
    functions.forEach((fn, i) => {
      fn.calls.forEach(call => {
        const targetIdx = functions.findIndex(f => f.name === call);
        if (targetIdx >= 0 && targetIdx !== i) {
          edges.push({
            id: `fn-edge-${i}-${targetIdx}`,
            source: `fn-${i}`,
            target: `fn-${targetIdx}`,
            label: "calls",
            animated: true,
          });
        }
      });
    });
  }

  // Add flow step nodes
  flowSteps.forEach((step, i) => {
    const nodeType = roleToType(step.role);
    nodes.push({
      id: `step-${step.step}`,
      label: step.title,
      sublabel: step.relatedCodeSnippet?.slice(0, 35),
      type: nodeType,
      x: 0,
      y: 0,
      width: 200,
      height: 70,
    });

    // Connect sequential steps
    if (i > 0) {
      const prev = flowSteps[i - 1];
      edges.push({
        id: `step-edge-${prev.step}-${step.step}`,
        source: `step-${prev.step}`,
        target: `step-${step.step}`,
        animated: true,
      });
    }
  });

  // Connect first function to first step
  if (functions && functions.length > 0 && flowSteps.length > 0) {
    edges.push({
      id: `fn-to-step`,
      source: `fn-0`,
      target: `step-${flowSteps[0].step}`,
      label: "enters",
      animated: true,
    });
  }

  // Add loop-back edges for loop nodes
  flowSteps.forEach((step, i) => {
    if (step.role === "loop" && i > 1) {
      const loopBackTarget = flowSteps[Math.max(0, i - 2)];
      edges.push({
        id: `loop-back-${step.step}`,
        source: `step-${step.step}`,
        target: `step-${loopBackTarget.step}`,
        label: "iterate",
        animated: true,
      });
    }
  });

  // Add "done" edges from loops to after-loop nodes
  flowSteps.forEach((step, i) => {
    if (step.role === "loop" && i < flowSteps.length - 1) {
      const afterLoop = flowSteps[i + 1];
      if (afterLoop.role !== "loop") {
        edges.push({
          id: `done-${step.step}`,
          source: `step-${step.step}`,
          target: `step-${afterLoop.step}`,
          label: "done ✓",
          animated: true,
        });
      }
    }
  });

  // Connect last step to "Program End" node
  if (flowSteps.length > 0) {
    const lastStep = flowSteps[flowSteps.length - 1];
    nodes.push({
      id: "program-end",
      label: "Program End",
      type: "end",
      x: 0,
      y: 0,
      width: 140,
      height: 55,
    });
    edges.push({
      id: `to-end`,
      source: `step-${lastStep.step}`,
      target: "program-end",
      animated: true,
    });
  }

  return { nodes, edges };
}
