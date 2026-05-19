import type { ModelSchema } from '@/services/api/models/types'

/** Discriminated union of all node categories in a stock-flow diagram. */
export type NodeKind = 'stock' | 'flow' | 'auxiliary' | 'parameter' | 'shadow'

/** A single node in the diagram graph, with position and dimensions. */
export interface DiagramNode {
  /** Normalized identifier: `name.toLowerCase().replace(/\s+/g, '_')` */
  id: string
  /** Original variable name used as the visible label. */
  label: string
  kind: NodeKind
  /** Center x coordinate (assigned by `computeLayout`). */
  x: number
  /** Center y coordinate (assigned by `computeLayout`). */
  y: number
  width: number
  height: number
}

/** An edge connecting two nodes in the diagram graph. */
export interface DiagramEdge {
  id: string
  /** ID of the source `DiagramNode`. */
  source: string
  /** ID of the target `DiagramNode`. */
  target: string
  /**
   * - `flow-pipe`: physical flow between a stock and a flow variable.
   * - `influence`: causal dependency parsed from an equation.
   */
  kind: 'flow-pipe' | 'influence'
}

/** Intermediate graph representation derived from a `ModelSchema`. */
export interface GraphData {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

/** State for the hover tooltip overlay. */
export interface TooltipState {
  /** ID of the node currently being hovered. */
  nodeId: string
  /** Viewport x position for tooltip placement. */
  x: number
  /** Viewport y position for tooltip placement. */
  y: number
}

/** Props accepted by the `StockFlowDiagram` component. */
export interface StockFlowDiagramProps {
  model: ModelSchema
}
