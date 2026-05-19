import { useMemo, useState, useRef, useEffect } from 'react'
import { IconArrowsMove, IconCheck, IconRefresh } from '@tabler/icons-react'
import type { ModelSchema, ModelVariable } from '@/services/api/models/types'
import type { DiagramNode, DiagramEdge } from './stock-flow-diagram.types'
import { buildGraphData, normalizeId } from '@/utils/graph-builder'
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
  isEditMode: boolean
  offset?: number
  onMouseDown: (e: React.MouseEvent, cx: number, cy: number) => void
  isActive?: boolean
  isFaded?: boolean
  animateFlows?: boolean
}

function InfluenceEdgeRenderer({
  edge,
  nodes,
  isEditMode,
  offset,
  onMouseDown,
  isActive = false,
  isFaded = false,
  animateFlows = false,
}: InfluenceEdgeRendererProps) {
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
    const finalOffset = offset !== undefined ? offset : Math.min(40, len * 0.15 + 10)
    cx = mx + px * finalOffset
    cy = my + py * finalOffset
  }

  // Find start and end points on node boundaries
  const startPt = getNodeBoundaryIntersection(source, cx, cy)
  const endPt = getNodeBoundaryIntersection(target, cx, cy, 2) // slightly pad target boundary

  const d = `M ${startPt.x} ${startPt.y} Q ${cx} ${cy} ${endPt.x} ${endPt.y}`

  const strokeColor = isActive ? '#f59e0b' : '#38bdf8'
  const strokeWidth = isActive ? 2.5 : 1.5
  const markerEnd = isActive ? 'url(#arrow-active)' : 'url(#arrow)'
  const opacity = isFaded ? 0.25 : 1.0

  return (
    <g style={{ opacity, transition: 'opacity 0.2s ease' }}>
      {/* Causal line path */}
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        markerEnd={markerEnd}
        className={isActive && animateFlows ? 'flow-active-pipe-flow-line' : undefined}
      />

      {/* Edit mode helpers */}
      {isEditMode && len > 0 && (
        <>
          {/* Dashed projection line from midpoint of straight segment to curve control point */}
          <line
            x1={mx}
            y1={my}
            x2={cx}
            y2={cy}
            stroke="#93c5fd"
            strokeWidth={1}
            strokeDasharray="2 2"
            style={{ pointerEvents: 'none' }}
          />
          {/* Interaction handle at the control point */}
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill="#ffffff"
            stroke="#0284c7"
            strokeWidth={2}
            className="cursor-pointer transition-colors duration-150 hover:fill-[#0284c7] hover:stroke-[#025a87]"
            onMouseDown={(e) => onMouseDown(e, cx, cy)}
          />
        </>
      )}
    </g>
  )
}

// ─── Flow Pipe Renderer ───────────────────────────────────────────────────────

interface FlowPipeRendererProps {
  flowNode: DiagramNode
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  activeEdgeIds?: Set<string>
  isFaded?: boolean
  animateFlows?: boolean
}

function FlowPipeRenderer({
  flowNode,
  nodes,
  edges,
  activeEdgeIds,
  isFaded = false,
  animateFlows = false,
}: FlowPipeRendererProps) {
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

  // Active status calculation
  const isSourceActive = sourceStockEdge && activeEdgeIds ? activeEdgeIds.has(sourceStockEdge.id) : false
  const isTargetActive = targetStockEdge && activeEdgeIds ? activeEdgeIds.has(targetStockEdge.id) : false
  const isActive = isSourceActive || isTargetActive

  const outerStroke = isActive ? '#d97706' : '#0284c7'
  const innerStroke = isActive ? '#fef3c7' : '#e0f2fe'
  const arrowheadFill = isActive ? '#d97706' : '#0284c7'
  const opacity = isFaded ? 0.25 : 1.0

  return (
    <g style={{ opacity, transition: 'opacity 0.2s ease' }}>
      {/* Clouds */}
      {hasSourceCloud && <CloudIcon x={sourceCloudX} y={sourceCloudY} />}
      {hasTargetCloud && <CloudIcon x={targetCloudX} y={targetCloudY} />}

      {/* Double Line Pipe - Outline */}
      <path
        d={`M ${startX} ${startY} L ${flowNode.x} ${flowNode.y} L ${pipeEndX} ${pipeEndY}`}
        fill="none"
        stroke={outerStroke}
        strokeWidth={8}
        strokeLinecap="square"
      />

      {/* Double Line Pipe - Inside */}
      <path
        d={`M ${startX} ${startY} L ${flowNode.x} ${flowNode.y} L ${pipeEndX} ${pipeEndY}`}
        fill="none"
        stroke={innerStroke}
        strokeWidth={4}
        strokeLinecap="square"
      />

      {/* Dynamic Liquid Flow line inside active pipe */}
      {isActive && (
        <path
          d={`M ${startX} ${startY} L ${flowNode.x} ${flowNode.y} L ${pipeEndX} ${pipeEndY}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeLinecap="round"
          className={animateFlows ? "flow-active-pipe-flow-line" : undefined}
        />
      )}

      {/* Arrowhead */}
      <polygon
        points="0,0 -14,-7 -14,7"
        transform={`translate(${arrowEndPt.x}, ${arrowEndPt.y}) rotate(${deg})`}
        fill={arrowheadFill}
      />
    </g>
  )
}

// ─── Flow Valve Renderer ──────────────────────────────────────────────────────

interface FlowValveRendererProps {
  node: DiagramNode
  edges: DiagramEdge[]
  nodes: DiagramNode[]
  isEditMode: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: (nodeId: string) => void
  onMouseLeave: () => void
  isActive?: boolean
  isFaded?: boolean
}

function FlowValveRenderer({
  node,
  edges,
  nodes,
  isEditMode,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  isActive = false,
  isFaded = false,
}: FlowValveRendererProps) {
  const { x, y, label } = node
  const handlers = {
    onMouseDown,
    onMouseEnter: () => !isEditMode && onMouseEnter(node.id),
    onMouseLeave: () => !isEditMode && onMouseLeave(),
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

  const className = `cursor-pointer ${isEditMode ? 'cursor-move select-none' : ''}`

  const fillVal = isActive ? '#fef3c7' : '#ede9fe'
  const strokeVal = isActive ? '#d97706' : '#7c3aed'
  const labelFill = isActive ? '#b45309' : '#4d1d95'
  const opacity = isFaded ? 0.25 : 1.0

  return (
    <g {...handlers} className={className} style={{ opacity, transition: 'opacity 0.2s ease' }}>
      {/* Invisible hover hotspot */}
      <circle cx={x} cy={y} r={18} fill="transparent" />

      {isEditMode && (
        <circle
          cx={x}
          cy={y}
          r={16}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}

      {/* Butterfly Valve Symbol (rotated) */}
      <g transform={`translate(${x}, ${y}) rotate(${deg})`}>
        <polygon
          points="-12,-8 -12,8 0,0"
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={2}
        />
        <polygon
          points="12,-8 12,8 0,0"
          fill={fillVal}
          stroke={strokeVal}
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
        fill={labelFill}
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
  isEditMode: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: (nodeId: string) => void
  onMouseLeave: () => void
  isActive?: boolean
  isStartNode?: boolean
  isFaded?: boolean
  isOverridden?: boolean
  animateFlows?: boolean
}

function NodeRenderer({
  node,
  isEditMode,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  isActive = false,
  isStartNode = false,
  isFaded = false,
  isOverridden = false,
  animateFlows = false,
}: NodeRendererProps) {
  const { x, y, width, height, kind, label } = node
  if (kind === 'flow') return null // rendered separately by FlowValveRenderer

  const left = x - width / 2
  const top = y - height / 2

  const handlers = {
    onMouseDown,
    onMouseEnter: () => !isEditMode && onMouseEnter(node.id),
    onMouseLeave: () => !isEditMode && onMouseLeave(),
  }

  const className = `cursor-pointer ${isEditMode ? 'cursor-move select-none' : ''}`

  const labelEl = (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={11}
      fill={isStartNode ? '#78350f' : '#1e293b'}
      fontWeight={kind === 'stock' || isStartNode || isActive ? '600' : 'normal'}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {label}
    </text>
  )

  const opacity = isFaded ? 0.25 : 1.0

  if (kind === 'stock') {
    const strokeColor = isStartNode || isActive ? '#d97706' : '#0284c7'
    const strokeWidth = isStartNode ? 3 : isActive ? 2.5 : 2
    const fillVal = isStartNode || isActive ? '#fffbeb' : '#e0f2fe'
    const extraClass = isStartNode && animateFlows ? 'pulse-active-node' : undefined

    return (
      <g {...handlers} className={className} style={{ opacity, transition: 'opacity 0.2s ease' }}>
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={6}
          fill={fillVal}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={isEditMode ? '4 2' : undefined}
          className={extraClass}
        />
        {labelEl}
      </g>
    )
  }

  if (kind === 'auxiliary') {
    const strokeColor = isStartNode || isActive ? '#d97706' : '#d97706'
    const strokeWidth = isStartNode ? 3 : isActive ? 2.5 : 2
    const fillVal = isStartNode || isActive ? '#fffbeb' : '#fef3c7'
    const extraClass = isStartNode && animateFlows ? 'pulse-active-node' : undefined

    return (
      <g {...handlers} className={className} style={{ opacity, transition: 'opacity 0.2s ease' }}>
        <ellipse
          cx={x}
          cy={y}
          rx={width / 2}
          ry={height / 2}
          fill={fillVal}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={isEditMode ? '4 2' : undefined}
          className={extraClass}
        />
        {labelEl}
      </g>
    )
  }

  if (kind === 'shadow') {
    const fillVal = isStartNode || isActive ? '#fffbeb' : 'transparent'
    const strokeVal = isStartNode || isActive ? '#d97706' : '#94a3b8'
    const textFill = isStartNode || isActive ? '#d97706' : '#64748b'

    return (
      <g {...handlers} className={className} style={{ opacity, transition: 'opacity 0.2s ease' }}>
        {/* Invisible hotspot for mouse capture */}
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          fill={fillVal}
          rx={4}
          stroke={isStartNode || isActive ? strokeVal : 'none'}
          strokeWidth={1.5}
        />
        {isEditMode && (
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill={textFill}
          fontWeight={isStartNode || isActive ? '600' : 'normal'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      </g>
    )
  }

  // parameter
  const strokeColor = isStartNode || isActive ? '#d97706' : isOverridden ? '#d97706' : '#94a3b8'
  const strokeWidth = isStartNode ? 3 : isActive || isOverridden ? 2.5 : 1.5
  const fillVal = isStartNode || isActive ? '#fffbeb' : isOverridden ? '#fffbeb' : '#f8fafc'
  const extraClass = isStartNode && animateFlows ? 'pulse-active-node' : undefined

  return (
    <g {...handlers} className={className} style={{ opacity, transition: 'opacity 0.2s ease' }}>
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={4}
        fill={fillVal}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isEditMode ? '2 2' : isOverridden ? undefined : '4 2'}
        className={extraClass}
      />
      {/* Overridden indicator dot */}
      {isOverridden && !isStartNode && !isActive && (
        <circle
          cx={left + width - 6}
          cy={top + 6}
          r={3}
          fill="#d97706"
        />
      )}
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
  activeParam?: string | null
  parameterOverrides?: Record<string, string>
  readOnly?: boolean
  animateFlows?: boolean
}

export function StockFlowDiagram({
  model,
  activeParam = null,
  parameterOverrides = {},
  readOnly = false,
  animateFlows = false,
}: StockFlowDiagramProps) {
  const graphData = useMemo(() => buildGraphData(model), [model])
  const [nodes, setNodes] = useState<DiagramNode[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [draggingEdgeId, setDraggingEdgeId] = useState<string | null>(null)
  const [edgeOffsets, setEdgeOffsets] = useState<Record<string, number>>({})

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // Causal feedback highlighting
  const startNodeId = useMemo(() => {
    if (!animateFlows) return null
    if (activeParam) {
      return normalizeId(activeParam)
    }
    return hoveredNodeId
  }, [activeParam, hoveredNodeId, animateFlows])

  const downstreamNodeIds = useMemo(() => {
    if (!startNodeId) return new Set<string>()
    const visited = new Set<string>()
    const queue = [startNodeId]
    while (queue.length > 0) {
      const curr = queue.shift()!
      for (const edge of graphData.edges) {
        if (edge.source === curr && !visited.has(edge.target)) {
          visited.add(edge.target)
          queue.push(edge.target)
        }
      }
    }
    return visited
  }, [startNodeId, graphData.edges])

  const activeNodeIds = useMemo(() => {
    const set = new Set<string>()
    if (startNodeId) {
      set.add(startNodeId)
      downstreamNodeIds.forEach((id) => set.add(id))
    }
    return set
  }, [startNodeId, downstreamNodeIds])

  const activeEdgeIds = useMemo(() => {
    const set = new Set<string>()
    if (!startNodeId) return set
    for (const edge of graphData.edges) {
      const isSrcActive = edge.source === startNodeId || downstreamNodeIds.has(edge.source)
      const isTgtActive = downstreamNodeIds.has(edge.target)
      if (isSrcActive && isTgtActive) {
        set.add(edge.id)
      }
    }
    return set
  }, [startNodeId, downstreamNodeIds, graphData.edges])

  const hasAnyActive = Boolean(startNodeId)

  const dragRef = useRef<{ active: boolean; startX: number; startY: number; panX: number; panY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  })

  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const handleSaveLayout = (updatedNodes: DiagramNode[], offsets: Record<string, number>) => {
    try {
      const layoutData = {
        nodes: updatedNodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
        edgeOffsets: offsets,
      }
      localStorage.setItem(`sd_layout_${model.file_name}`, JSON.stringify(layoutData))
    } catch (e) {
      console.error('Failed to save diagram layout', e)
    }
  }

  // Initialize and reset nodes when graph structure or model changes (or when loading from storage)
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const defaultNodes = computeLayout(graphData.nodes, graphData.edges)
      let initialNodes = defaultNodes
      let initialOffsets = {}

      try {
        const saved = localStorage.getItem(`sd_layout_${model.file_name}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.nodes)) {
              const savedCoords = new Map<string, { x: number; y: number }>()
              parsed.nodes.forEach((n: any) => {
                if (n && typeof n.id === 'string' && typeof n.x === 'number' && typeof n.y === 'number') {
                  savedCoords.set(n.id, { x: n.x, y: n.y })
                }
              })

              initialNodes = defaultNodes.map((node) => {
                const savedPos = savedCoords.get(node.id)
                if (savedPos) {
                  return { ...node, x: savedPos.x, y: savedPos.y }
                }
                return node
              })
            }
            if (parsed.edgeOffsets && typeof parsed.edgeOffsets === 'object') {
              initialOffsets = parsed.edgeOffsets
            }
          }
        }
      } catch (e) {
        console.error('Failed to load saved diagram layout', e)
      }

      setNodes(initialNodes)
      setEdgeOffsets(initialOffsets)
    } else {
      setNodes([])
      setEdgeOffsets({})
    }
  }, [graphData, model.file_name])

  // ── Pan handlers ────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // If edit mode is active and we clicked on a node or edge handle, dragging is handled separately
    if (draggingNodeId || draggingEdgeId) return
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeId) {
      e.preventDefault()
      const newX = (e.clientX - dragOffsetRef.current.x) / zoom
      const newY = (e.clientY - dragOffsetRef.current.y) / zoom
      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
      )
    } else if (draggingEdgeId) {
      e.preventDefault()
      const edge = influenceEdges.find((e) => e.id === draggingEdgeId)
      if (!edge) return
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!sourceNode || !targetNode) return

      const cx = (e.clientX - dragOffsetRef.current.x) / zoom
      const cy = (e.clientY - dragOffsetRef.current.y) / zoom

      const dx = targetNode.x - sourceNode.x
      const dy = targetNode.y - sourceNode.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len > 0) {
        const mx = (sourceNode.x + targetNode.x) / 2
        const my = (sourceNode.y + targetNode.y) / 2
        const px = -dy / len
        const py = dx / len
        const newOffset = (cx - mx) * px + (cy - my) * py
        setEdgeOffsets((prev) => ({ ...prev, [draggingEdgeId]: newOffset }))
      }
    } else {
      const d = dragRef.current
      if (!d.active) return
      setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) })
    }
  }

  const stopDrag = () => {
    dragRef.current.active = false
    setDraggingNodeId(null)
    setDraggingEdgeId(null)
  }

  // ── Node drag handler ───────────────────────────────────────────────────────
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!isEditMode) return
    e.stopPropagation()
    e.preventDefault()
    setDraggingNodeId(nodeId)
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    dragOffsetRef.current = {
      x: e.clientX - node.x * zoom,
      y: e.clientY - node.y * zoom,
    }
  }

  // ── Edge drag handler ───────────────────────────────────────────────────────
  const handleEdgeMouseDown = (e: React.MouseEvent, edgeId: string, cx: number, cy: number) => {
    if (!isEditMode) return
    e.stopPropagation()
    e.preventDefault()
    setDraggingEdgeId(edgeId)
    dragOffsetRef.current = {
      x: e.clientX - cx * zoom,
      y: e.clientY - cy * zoom,
    }
  }

  // ── Zoom handler ────────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    setZoom((z) => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)))
  }

  const handleNodeEnter = (nodeId: string) => setHoveredNodeId(nodeId)
  const handleNodeLeave = () => setHoveredNodeId(null)

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-primary-500">
        No variables to display.
      </div>
    )
  }

  if (graphData.nodes.length > 0 && nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-primary-500">
        Cargando diagrama...
      </div>
    )
  }

  // Filter edges and nodes for custom layering
  const influenceEdges = graphData.edges.filter((e) => e.kind === 'influence')
  const flowNodes = nodes.filter((n) => n.kind === 'flow')

  const svgCursorClass = (draggingNodeId || draggingEdgeId)
    ? 'cursor-grabbing'
    : isEditMode
    ? 'cursor-default'
    : 'cursor-grab active:cursor-grabbing'

  return (
    <div className="relative">
      {/* Controls Overlay */}
      {!readOnly && (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                if (graphData.nodes.length > 0) {
                  const defaultNodes = computeLayout(graphData.nodes, graphData.edges)
                  setNodes(defaultNodes)
                  setEdgeOffsets({})
                  try {
                    localStorage.removeItem(`sd_layout_${model.file_name}`)
                  } catch (e) {
                    console.error('Failed to reset saved layout', e)
                  }
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition-all hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Restaurar distribución automática"
            >
              <IconRefresh className="h-3.5 w-3.5" />
              Reiniciar
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isEditMode) {
                handleSaveLayout(nodes, edgeOffsets)
              }
              setIsEditMode(!isEditMode)
              setHoveredNodeId(null)
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 ${
              isEditMode
                ? 'border-amber-600 bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
                : 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50 focus:ring-primary-500'
            }`}
          >
            {isEditMode ? (
              <>
                <IconCheck className="h-3.5 w-3.5" />
                Guardar Distribución
              </>
            ) : (
              <>
                <IconArrowsMove className="h-3.5 w-3.5" />
                Editar Distribución
              </>
            )}
          </button>
        </div>
      )}

      <svg
        viewBox="0 0 900 500"
        className={`w-full rounded-lg border border-primary-200 bg-primary-50 transition-colors duration-200 ${svgCursorClass}`}
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
          <marker
            id="arrow-active"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
          </marker>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <style>{`
            @keyframes flow-dash {
              to {
                stroke-dashoffset: -20;
              }
            }
            .flow-active-pipe-flow-line {
              stroke-dasharray: 6 4;
              animation: flow-dash 1.2s linear infinite;
            }
            @keyframes node-glow {
              0%, 100% {
                stroke-width: 3px;
                filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.4));
              }
              50% {
                stroke-width: 4px;
                filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.7));
              }
            }
            .pulse-active-node {
              animation: node-glow 2s infinite ease-in-out;
            }
          `}</style>
        </defs>

        {/* Pan/zoom wrapper */}
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Subtle design grid pattern in edit mode */}
          {isEditMode && (
            <rect
              x={-5000}
              y={-5000}
              width={10000}
              height={10000}
              fill="url(#grid)"
              className="pointer-events-none opacity-50"
            />
          )}

          {/* Layer 1: Causal Influence lines (at the back) */}
          {influenceEdges.map((edge) => (
            <InfluenceEdgeRenderer
              key={edge.id}
              edge={edge}
              nodes={nodes}
              isEditMode={isEditMode}
              offset={edgeOffsets[edge.id]}
              onMouseDown={(e, cx, cy) => handleEdgeMouseDown(e, edge.id, cx, cy)}
              isActive={activeEdgeIds.has(edge.id)}
              isFaded={hasAnyActive && !activeEdgeIds.has(edge.id)}
              animateFlows={animateFlows}
            />
          ))}

          {/* Layer 2: Flow pipes and clouds */}
          {flowNodes.map((flowNode) => (
            <FlowPipeRenderer
              key={flowNode.id}
              flowNode={flowNode}
              nodes={nodes}
              edges={graphData.edges}
              activeEdgeIds={activeEdgeIds}
              isFaded={hasAnyActive && !activeNodeIds.has(flowNode.id)}
              animateFlows={animateFlows}
            />
          ))}

          {/* Layer 3: Stocks, Auxiliaries, and Parameters */}
          {nodes.map((node) => (
            <NodeRenderer
              key={node.id}
              node={node}
              isEditMode={isEditMode}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onMouseEnter={handleNodeEnter}
              onMouseLeave={handleNodeLeave}
              isActive={activeNodeIds.has(node.id)}
              isStartNode={node.id === startNodeId}
              isFaded={hasAnyActive && !activeNodeIds.has(node.id)}
              isOverridden={node.kind === 'parameter' && node.label in parameterOverrides}
              animateFlows={animateFlows}
            />
          ))}

          {/* Layer 4: Flow valves and labels */}
          {flowNodes.map((flowNode) => (
            <FlowValveRenderer
              key={flowNode.id}
              node={flowNode}
              edges={graphData.edges}
              nodes={nodes}
              isEditMode={isEditMode}
              onMouseDown={(e) => handleNodeMouseDown(e, flowNode.id)}
              onMouseEnter={handleNodeEnter}
              onMouseLeave={handleNodeLeave}
              isActive={activeNodeIds.has(flowNode.id)}
              isFaded={hasAnyActive && !activeNodeIds.has(flowNode.id)}
            />
          ))}

          {/* Layer 5: Tooltip overlay (drawn relative to hovered node inside SVG space) */}
          {hoveredNodeId && (
            <TooltipOverlay
              nodeId={hoveredNodeId}
              nodes={nodes}
              model={model}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
