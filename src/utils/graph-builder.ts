import type { ModelSchema } from '@/services/api/models/types'
import type {
  DiagramEdge,
  DiagramNode,
  GraphData,
  NodeKind,
} from '@/components/features/models/modals/stock-flow-diagram.types'

/**
 * Converts a variable name into a normalized node ID.
 * Lowercases the string and replaces all whitespace sequences with `_`.
 */
export function normalizeId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_')
}

export function extractReferences(equation: string, knownNames: string[]): string[] {
  const sorted = [...knownNames].sort((a, b) => b.length - a.length)
  const found: string[] = []
  const cleanEquation = equation.toLowerCase()

  for (const name of sorted) {
    const representations = new Set<string>()
    representations.add(name.toLowerCase())
    representations.add(name.toLowerCase().replace(/\s+/g, '_'))
    representations.add(name.toLowerCase().replace(/\s+/g, ''))

    let matched = false
    for (const rep of representations) {
      const escaped = rep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i')
      if (regex.test(cleanEquation)) {
        matched = true
        break
      }
    }

    if (matched) {
      found.push(name)
    }
  }

  return found
}

/** Helper that adds an edge only if the source:target pair is not already present. */
function addEdge(
  edges: DiagramEdge[],
  edgeSet: Set<string>,
  source: string,
  target: string,
  kind: DiagramEdge['kind']
): void {
  const key = `${source}:${target}`
  if (!edgeSet.has(key)) {
    edgeSet.add(key)
    edges.push({ id: key, source, target, kind })
  }
}

/** Node dimensions by kind (static overrides for stock/flow). */
const STATIC_DIMENSIONS: Partial<Record<NodeKind, { width: number; height: number }>> = {
  stock: { width: 120, height: 50 },
  flow: { width: 60, height: 50 },
}

/**
 * Calculates ellipse/rect dimensions for label-dependent node kinds.
 * Uses ~7px per character at fontSize=9 plus fixed vertical padding.
 */
function calcLabelDimensions(label: string): { width: number; height: number } {
  const charWidth = 7
  const hPadding = 28
  const vPadding = 20
  const minW = 80
  const minH = 30
  const rawW = label.length * charWidth + hPadding
  return {
    width: Math.max(minW, rawW),
    height: minH + vPadding / 2,
  }
}

/**
 * Converts a `ModelSchema` into an intermediate `GraphData` representation
 * containing nodes and edges ready for layout and rendering.
 *
 * Pure function — no side effects, no mutation of the input.
 */
export function buildGraphData(model: ModelSchema): GraphData {
  const nodes: DiagramNode[] = []
  const edges: DiagramEdge[] = []
  const edgeSet = new Set<string>()

  const categories: Array<{ vars: ModelSchema[keyof ModelSchema]; kind: NodeKind }> = [
    { vars: model.stocks, kind: 'stock' },
    { vars: model.flows, kind: 'flow' },
    { vars: model.auxiliaries, kind: 'auxiliary' },
    { vars: model.parameters, kind: 'parameter' },
  ]

  for (const { vars, kind } of categories) {
    for (const v of vars as import('@/services/api/models/types').ModelVariable[]) {
      const staticDims = STATIC_DIMENSIONS[kind]
      const { width, height } = staticDims ?? calcLabelDimensions(v.name)
      nodes.push({
        id: normalizeId(v.name),
        label: v.name,
        kind,
        x: 0,
        y: 0,
        width,
        height,
      })
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id))

  for (const stock of model.stocks) {
    const stockId = normalizeId(stock.name)

    for (const inflowName of stock.inflows) {
      const flowId = normalizeId(inflowName)
      if (nodeIds.has(flowId)) {
        addEdge(edges, edgeSet, flowId, stockId, 'flow-pipe')
      }
    }

    for (const outflowName of stock.outflows) {
      const flowId = normalizeId(outflowName)
      if (nodeIds.has(flowId)) {
        addEdge(edges, edgeSet, stockId, flowId, 'flow-pipe')
      }
    }
  }

  const allNames = [...model.stocks, ...model.flows, ...model.auxiliaries, ...model.parameters].map(
    (v) => v.name
  )

  const influencers = [...model.flows, ...model.auxiliaries]
  for (const v of influencers) {
    const targetId = normalizeId(v.name)
    const referencedNames = extractReferences(v.equation, allNames)

    // Detect references to built-in system 'Time' variable
    const hasTimeRef = /(?<![\w])time(?![\w])/i.test(v.equation)
    if (hasTimeRef) {
      if (!nodeIds.has('time')) {
        nodes.push({
          id: 'time',
          label: '<Time>',
          kind: 'shadow',
          x: 0,
          y: 0,
          width: calcLabelDimensions('<Time>').width,
          height: calcLabelDimensions('<Time>').height,
        })
        nodeIds.add('time')
      }
      addEdge(edges, edgeSet, 'time', targetId, 'influence')
    }

    for (const refName of referencedNames) {
      const sourceId = normalizeId(refName)
      if (nodeIds.has(sourceId) && sourceId !== targetId) {
        addEdge(edges, edgeSet, sourceId, targetId, 'influence')
      }
    }
  }

  return { nodes, edges }
}
