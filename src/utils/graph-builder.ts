import type { ModelSchema } from '@/services/api/models/types'
import type { DiagramEdge, DiagramNode, GraphData, NodeKind } from '@/components/features/models/modals/stock-flow-diagram.types'

/**
 * Converts a variable name into a normalized node ID.
 * Lowercases the string and replaces all whitespace sequences with `_`.
 */
export function normalizeId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_')
}

export function extractReferences(equation: string, knownNames: string[]): string[] {
  // Sort longest-first so "Birth Rate" is matched before "Birth"
  const sorted = [...knownNames].sort((a, b) => b.length - a.length)
  const found: string[] = []
  const cleanEquation = equation.toLowerCase()

  for (const name of sorted) {
    // Generate different possible representations of the variable name in the equation:
    // 1. Original name lowercased
    // 2. Snake case (e.g., "Birth Rate" -> "birth_rate")
    // 3. Replaced space with nothing (e.g., "Birth Rate" -> "birthrate")
    const representations = new Set<string>()
    representations.add(name.toLowerCase())
    representations.add(name.toLowerCase().replace(/\s+/g, '_'))
    representations.add(name.toLowerCase().replace(/\s+/g, ''))

    let matched = false
    for (const rep of representations) {
      // Escape regex special characters in the variable name representation
      const escaped = rep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Use a negative lookbehind/lookahead for word characters to avoid partial matches
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
  kind: DiagramEdge['kind'],
): void {
  const key = `${source}:${target}`
  if (!edgeSet.has(key)) {
    edgeSet.add(key)
    edges.push({ id: key, source, target, kind })
  }
}

/** Node dimensions by kind. */
const NODE_DIMENSIONS: Record<NodeKind, { width: number; height: number }> = {
  stock: { width: 120, height: 50 },
  flow: { width: 60, height: 50 },
  auxiliary: { width: 90, height: 36 },
  parameter: { width: 90, height: 36 },
  shadow: { width: 90, height: 36 },
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

  // 1. Create one DiagramNode per variable across all four categories
  const categories: Array<{ vars: ModelSchema[keyof ModelSchema]; kind: NodeKind }> = [
    { vars: model.stocks, kind: 'stock' },
    { vars: model.flows, kind: 'flow' },
    { vars: model.auxiliaries, kind: 'auxiliary' },
    { vars: model.parameters, kind: 'parameter' },
  ]

  for (const { vars, kind } of categories) {
    for (const v of vars as import('@/services/api/models/types').ModelVariable[]) {
      const { width, height } = NODE_DIMENSIONS[kind]
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

  // 2. Flow-pipe edges from stock inflows / outflows
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

  // 3. Influence edges parsed from flow and auxiliary equations
  const allNames = [
    ...model.stocks,
    ...model.flows,
    ...model.auxiliaries,
    ...model.parameters,
  ].map((v) => v.name)

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
          width: NODE_DIMENSIONS.shadow.width,
          height: NODE_DIMENSIONS.shadow.height,
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
