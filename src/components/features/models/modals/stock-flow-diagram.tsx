import { useMemo, useState, useRef } from 'react'
import type { ModelSchema, ModelVariable } from '@/services/api/models/types'
import type { DiagramNode, DiagramEdge } from './stock-flow-diagram.types'
import { buildGraphData } from '@/utils/graph-builder'
import { computeLayout } from '@/utils/graph-layout'

// ─── Geometric & Math Helpers ──────────────────────────────────────────────────

interface Point {
  x: number
  y: number
}

/**
 * Calculates the intersection of a line with the boundary of a node.
 * This ensures lines (influence and flow pipes) end clean at the border.
 */
function getNodeBoundaryIntersection(
  node: DiagramNode,
  refX: number,
  refY: number,
  padding = 0
): Point {
  const x2 = node.x
  const y2 = node.y
  const w = node.width
  const h = node.height

  const dx = x2 - refX
  const dy = y2 - refY

  if (dx === 0 && dy === 0) return { x: x2, y: y2 }

  if (node.kind === 'auxiliary') {
    // Ellipse intersection
    const rx = w / 2 + padding
    const ry = h / 2 + padding
    const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
    return {
      x: x2 - dx * t,
      y: y2 - dy * t,
    }
  } else if (node.kind === 'flow') {
    // Flow valve represented as a circle
    const r = 12 + padding
    const dist = Math.sqrt(dx * dx + dy * dy)
    return {
      x: x2 - (dx / dist) * r,
      y: y2 - (dy / dist) * r,
    }
  } else {
    // Rectangle intersection (stock, parameter)
    const halfW = w / 2 + padding
    const halfH = h / 2 + padding

    const tx = dx !== 0 ? Math.abs(halfW / dx) : Infinity
    const ty = dy !== 0 ? Math.abs(halfH / dy) : Infinity

    const t = Math.min(tx, ty)
    return {
      x: x2 - dx * t,
      y: y2 - dy * t,
    }
  }
}

// ─── Cloud Icon ───────────────────────────────────────────────────────────────

function CloudIcon({ x, y }: { x: number; y: number }) {
  return (
    <path
      d="M -20 10 
         C -28 10, -32 4, -32 -2 
         C -32 -8, -26 -14, -18 -14 
         C -18 -22, -10 -26, -2 -26 
         C 6 -26, 12 -20, 14 -14 
         C 20 -14, 26 -8, 26 -2 
         C 26 4, 20 10, 12 10 
         C 8 14, -2 14, -6 10 
         C -10 14, -16 14, -20 10 Z"
      fill="#f1f5f9"
      stroke="#94a3b8"
      strokeWidth={1.5}
      transform={`translate(${x}, ${y}) scale(0.6)`}
    />
  )
}

// ─── Influence Edge Renderer ──────────────────────────────────────────────────

interface InfluenceEdgeRendererProps {
  edge: DiagramEdge
  nodes: DiagramNode[]
}

function InfluenceEdgeRenderer({ edge, nodes }: InfluenceEdgeRendererProps) {
  const source = nodes.find((n) => n.id === edge.source)
  const target = nodes.find((n) => n.id === edge.target)
  if (!source || !target) return null

  // Calculate midpoint
  const mx = (source.x + target.x) / 2
  const my = (source.y + target.y) / 2

  // Calculate perpendicular offset for curved influence arrow
  const dx = target.x - source.x
  const dy = target.y - source.y
  const len = Math.sqrt(dx * dx + dy * dy)

  let cx = mx
  let cy = my - 30

  if (len > 0) {
    const px = -dy / len
    const py = dx / len
    const offset = Math.min(40, len * 0.15 + 10)
    cx = mx + px * offset
    cy = my + py * offset
  }

  // Find start and end points on node boundaries
  const startPt = getNodeBoundaryIntersection(source, cx, cy)
  const endPt = getNodeBoundaryIntersection(target, cx, cy, 2) // slightly pad target boundary

  const d = `M ${startPt.x} ${startPt.y} Q ${cx} ${cy} ${endPt.x} ${endPt.y}`

  return (
    <path
      d={d}
      fill="none"
      stroke="#38bdf8"
      strokeWidth={1.5}
      markerEnd="url(#arrow)"
    />
  )
}

// ─── Flow Pipe Renderer ───────────────────────────────────────────────────────

interface FlowPipeRendererProps {
  flowNode: DiagramNode
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

function FlowPipeRenderer({ flowNode, nodes, edges }: FlowPipeRendererProps) {
  const sourceStockEdge = edges.find((e) => e.kind === 'flow-pipe' && e.target === flowNode.id)
  const targetStockEdge = edges.find((e) => e.kind === 'flow-pipe' && e.source === flowNode.id)

  const sourceStock = sourceStockEdge ? nodes.find((n) => n.id === sourceStockEdge.source) : null
  const targetStock = targetStockEdge ? nodes.find((n) => n.id === targetStockEdge.target) : null

  let startX = flowNode.x
  let startY = flowNode.y

  let hasSourceCloud = false
  let hasTargetCloud = false
  let sourceCloudX = 0
  let sourceCloudY = 0
  let targetCloudX = 0
  let targetCloudY = 0

  // Determine flow direction vector
  let ux = 1
  let uy = 0
  if (sourceStock && targetStock) {
    const dx = targetStock.x - sourceStock.x
    const dy = targetStock.y - sourceStock.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) {
      ux = dx / len
      uy = dy / len
    }
  } else if (sourceStock) {
    const dx = flowNode.x - sourceStock.x
    const dy = flowNode.y - sourceStock.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) {
      ux = dx / len
      uy = dy / len
    }
  } else if (targetStock) {
    const dx = targetStock.x - flowNode.x
    const dy = targetStock.y - flowNode.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) {
      ux = dx / len
      uy = dy / len
    }
  }

  // Calculate start position
  if (sourceStock) {
    const pt = getNodeBoundaryIntersection(sourceStock, flowNode.x, flowNode.y)
    startX = pt.x
    startY = pt.y
  } else {
    hasSourceCloud = true
    sourceCloudX = flowNode.x - ux * 80
    sourceCloudY = flowNode.y - uy * 80
    startX = sourceCloudX
    startY = sourceCloudY
  }

  // Calculate end position
  let arrowEndPt = { x: flowNode.x, y: flowNode.y }
  if (targetStock) {
    const pt = getNodeBoundaryIntersection(targetStock, flowNode.x, flowNode.y)
    arrowEndPt = pt
  } else {
    hasTargetCloud = true
    targetCloudX = flowNode.x + ux * 80
    targetCloudY = flowNode.y + uy * 80
    arrowEndPt = { x: targetCloudX - ux * 15, y: targetCloudY - uy * 15 }
  }

  const angle = Math.atan2(uy, ux)
  const deg = (angle * 180) / Math.PI

  // Shorten the pipe end to prevent overlap with arrowhead tip
  const pipeEndX = arrowEndPt.x - ux * 13
  const pipeEndY = arrowEndPt.y - uy * 13

  return (
    <g>
      {/* Clouds */}
      {hasSourceCloud && <CloudIcon x={sourceCloudX} y={sourceCloudY} />}
      {hasTargetCloud && <CloudIcon x={targetCloudX} y={targetCloudY} />}

      {/* Double Line Pipe - Outline */}
      <path
        d={`M ${startX} ${startY} L ${flowNode.x} ${flowNode.y} L ${pipeEndX} ${pipeEndY}`}
        fill="none"
        stroke="#0284c7"
        strokeWidth={8}
        strokeLinecap="square"
      />

      {/* Double Line Pipe - Inside */}
      <path
        d={`M ${startX} ${startY} L ${flowNode.x} ${flowNode.y} L ${pipeEndX} ${pipeEndY}`}
        fill="none"
        stroke="#e0f2fe"
        strokeWidth={4}
        strokeLinecap="square"
      />

      {/* Arrowhead */}
      <polygon
        points="0,0 -14,-7 -14,7"
        transform={`translate(${arrowEndPt.x}, ${arrowEndPt.y}) rotate(${deg})`}
        fill="#0284c7"
      />
    </g>
  )
}

// ─── Flow Valve Renderer ──────────────────────────────────────────────────────

interface FlowValveRendererProps {
  node: DiagramNode
  edges: DiagramEdge[]
  nodes: DiagramNode[]
  onMouseEnter: (nodeId: string) => void
  onMouseLeave: () => void
}

function FlowValveRenderer({
  node,
  edges,
  nodes,
  onMouseEnter,
  onMouseLeave,
}: FlowValveRendererProps) {
  const { x, y, label } = node
  const handlers = {
    onMouseEnter: () => onMouseEnter(node.id),
    onMouseLeave,
  }

  const sourceStockEdge = edges.find((e) => e.kind === 'flow-pipe' && e.target === node.id)
  const targetStockEdge = edges.find((e) => e.kind === 'flow-pipe' && e.source === node.id)
  const sourceStock = sourceStockEdge ? nodes.find((n) => n.id === sourceStockEdge.source) : null
  const targetStock = targetStockEdge ? nodes.find((n) => n.id === targetStockEdge.target) : null

  let ux = 1
  let uy = 0
  if (sourceStock && targetStock) {
    const dx = targetStock.x - sourceStock.x
    const dy = targetStock.y - sourceStock.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) { ux = dx / len; uy = dy / len }
  } else if (sourceStock) {
    const dx = node.x - sourceStock.x
    const dy = node.y - sourceStock.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) { ux = dx / len; uy = dy / len }
  } else if (targetStock) {
    const dx = targetStock.x - node.x
    const dy = targetStock.y - node.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) { ux = dx / len; uy = dy / len }
  }

  const angle = Math.atan2(uy, ux)
  const deg = (angle * 180) / Math.PI

  return (
    <g {...handlers} className="cursor-pointer">
      {/* Invisible hover hotspot */}
      <circle cx={x} cy={y} r={18} fill="transparent" />

      {/* Butterfly Valve Symbol (rotated) */}
      <g transform={`translate(${x}, ${y}) rotate(${deg})`}>
        <polygon
          points="-12,-8 -12,8 0,0"
          fill="#ede9fe"
          stroke="#7c3aed"
          strokeWidth={2}
        />
        <polygon
          points="12,-8 12,8 0,0"
          fill="#ede9fe"
          stroke="#7c3aed"
          strokeWidth={2}
        />
        <circle
          cx="0"
          cy="0"
          r="3.5"
          fill="#7c3aed"
        />
      </g>

      {/* Flow Label Offset Below */}
      <text
        x={x}
        y={y + 24}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight="600"
        fill="#4d1d95"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}

// ─── Node Renderer ────────────────────────────────────────────────────────────

interface NodeRendererProps {
  node: DiagramNode
  onMouseEnter: (nodeId: string) => void
  onMouseLeave: () => void
}

function NodeRenderer({ node, onMouseEnter, onMouseLeave }: NodeRendererProps) {
  const { x, y, width, height, kind, label } = node
  if (kind === 'flow') return null // rendered separately by FlowValveRenderer

  const left = x - width / 2
  const top = y - height / 2

  const handlers = {
    onMouseEnter: () => onMouseEnter(node.id),
    onMouseLeave,
  }

  const labelEl = (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={11}
      fill="#1e293b"
      fontWeight={kind === 'stock' ? '600' : 'normal'}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {label}
    </text>
  )

  if (kind === 'stock') {
    return (
      <g {...handlers} className="cursor-pointer">
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={6}
          fill="#e0f2fe"
          stroke="#0284c7"
          strokeWidth={2}
        />
        {labelEl}
      </g>
    )
  }

  if (kind === 'auxiliary') {
    return (
      <g {...handlers} className="cursor-pointer">
        <ellipse
          cx={x}
          cy={y}
          rx={width / 2}
          ry={height / 2}
          fill="#fef3c7"
          stroke="#d97706"
          strokeWidth={2}
        />
        {labelEl}
      </g>
    )
  }

  if (kind === 'shadow') {
    return (
      <g {...handlers} className="cursor-pointer">
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#64748b"
          fontWeight="normal"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      </g>
    )
  }

  // parameter
  return (
    <g {...handlers} className="cursor-pointer">
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={4}
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />
      {labelEl}
    </g>
  )
}

// ─── Tooltip Overlay ──────────────────────────────────────────────────────────

interface TooltipOverlayProps {
  nodeId: string
  nodes: DiagramNode[]
  model: ModelSchema
}

function findVariable(model: ModelSchema, nodeId: string): ModelVariable | undefined {
  const all = [...model.stocks, ...model.flows, ...model.auxiliaries, ...model.parameters]
  return all.find((v) => v.name.toLowerCase().replace(/\s+/g, '_') === nodeId)
}

function TooltipOverlay({ nodeId, nodes, model }: TooltipOverlayProps) {
  const node = nodes.find((n) => n.id === nodeId)
  const variable = findVariable(model, nodeId)
  if (!node || !variable) return null

  const lines = [
    { label: 'Label', value: variable.name },
    { label: 'Equation', value: variable.equation || '—' },
    { label: 'Unit', value: variable.unit || '—' },
  ]

  const lineHeight = 18
  const padding = 10
  const boxWidth = 220
  const boxHeight = lines.length * lineHeight + padding * 2

  // Intelligently position the tooltip to prevent overflowing screen boundaries
  const showOnLeft = node.x > 450
  const tooltipX = showOnLeft ? node.x - node.width / 2 - boxWidth - 10 : node.x + node.width / 2 + 10
  const tooltipY = node.y - boxHeight / 2

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={tooltipX}
        y={tooltipY}
        width={boxWidth}
        height={boxHeight}
        rx={6}
        fill="#1e293b"
        fillOpacity={0.92}
        stroke="#475569"
        strokeWidth={1}
      />
      {lines.map((line, i) => (
        <text
          key={line.label}
          x={tooltipX + padding}
          y={tooltipY + padding + i * lineHeight + 12}
          fontSize={11}
          fill="#f1f5f9"
          style={{ userSelect: 'none' }}
        >
          <tspan fontWeight="600" fill="#94a3b8">{line.label}: </tspan>
          {line.value}
        </text>
      ))}
    </g>
  )
}

// ─── StockFlowDiagram ─────────────────────────────────────────────────────────

interface StockFlowDiagramProps {
  model: ModelSchema
}

export function StockFlowDiagram({ model }: StockFlowDiagramProps) {
  const graphData = useMemo(() => buildGraphData(model), [model])
  const laidOut = useMemo(
    () => ({ ...graphData, nodes: computeLayout(graphData.nodes, graphData.edges) }),
    [graphData],
  )

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const dragRef = useRef<{ active: boolean; startX: number; startY: number; panX: number; panY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  })

  // ── Pan handlers ────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d.active) return
    setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) })
  }

  const stopDrag = () => { dragRef.current.active = false }

  // ── Zoom handler ────────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    setZoom((z) => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)))
  }

  const handleNodeEnter = (nodeId: string) => setHoveredNodeId(nodeId)
  const handleNodeLeave = () => setHoveredNodeId(null)

  if (laidOut.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-primary-500">
        No variables to display.
      </div>
    )
  }

  // Filter edges for custom layering
  const influenceEdges = laidOut.edges.filter((e) => e.kind === 'influence')
  const flowNodes = laidOut.nodes.filter((n) => n.kind === 'flow')

  return (
    <svg
      viewBox="0 0 900 500"
      className="w-full rounded-lg border border-primary-200 bg-primary-50 cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onWheel={handleWheel}
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
        </marker>
      </defs>

      {/* Pan/zoom wrapper */}
      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {/* Layer 1: Causal Influence lines (at the back) */}
        {influenceEdges.map((edge) => (
          <InfluenceEdgeRenderer key={edge.id} edge={edge} nodes={laidOut.nodes} />
        ))}

        {/* Layer 2: Flow pipes and clouds */}
        {flowNodes.map((flowNode) => (
          <FlowPipeRenderer
            key={flowNode.id}
            flowNode={flowNode}
            nodes={laidOut.nodes}
            edges={laidOut.edges}
          />
        ))}

        {/* Layer 3: Stocks, Auxiliaries, and Parameters */}
        {laidOut.nodes.map((node) => (
          <NodeRenderer
            key={node.id}
            node={node}
            onMouseEnter={handleNodeEnter}
            onMouseLeave={handleNodeLeave}
          />
        ))}

        {/* Layer 4: Flow valves and labels */}
        {flowNodes.map((flowNode) => (
          <FlowValveRenderer
            key={flowNode.id}
            node={flowNode}
            edges={laidOut.edges}
            nodes={laidOut.nodes}
            onMouseEnter={handleNodeEnter}
            onMouseLeave={handleNodeLeave}
          />
        ))}

        {/* Layer 5: Tooltip overlay (drawn relative to hovered node inside SVG space) */}
        {hoveredNodeId && (
          <TooltipOverlay
            nodeId={hoveredNodeId}
            nodes={laidOut.nodes}
            model={model}
          />
        )}
      </g>
    </svg>
  )
}
