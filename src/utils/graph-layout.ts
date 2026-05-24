import type {
  DiagramNode,
  DiagramEdge,
} from '@/components/features/models/modals/stock-flow-diagram.types'

const CANVAS_W = 900
const CANVAS_H = 500
const STOCK_Y = CANVAS_H / 2

/**
 * Pushes two overlapping nodes apart so their bounding boxes no longer overlap,
 * maintaining at least `padding` pixels of space between them.
 * Stock nodes are treated as heavy (fixed in position relative to non-stocks).
 *
 * Mutates `a` and `b` in place.
 */
function separateNodes(a: DiagramNode, b: DiagramNode, padding: number): void {
  // Half-extents including padding
  const halfWA = a.width / 2 + padding / 2
  const halfHA = a.height / 2 + padding / 2
  const halfWB = b.width / 2 + padding / 2
  const halfHB = b.height / 2 + padding / 2

  const overlapX = halfWA + halfWB - Math.abs(a.x - b.x)
  const overlapY = halfHA + halfHB - Math.abs(a.y - b.y)

  // Only separate if both axes overlap (i.e. bounding boxes intersect)
  if (overlapX <= 0 || overlapY <= 0) return

  // Determine weight/shift factor
  // Stocks are heavy. If one is a stock and the other is not, only the non-stock moves.
  let shiftA = 0.5
  let shiftB = 0.5

  if (a.kind === 'stock' && b.kind !== 'stock') {
    shiftA = 0
    shiftB = 1
  } else if (a.kind !== 'stock' && b.kind === 'stock') {
    shiftA = 1
    shiftB = 0
  }

  // Push along the axis with the smaller overlap (minimum translation vector)
  if (overlapX < overlapY) {
    const shift = overlapX
    if (a.x < b.x) {
      a.x -= shift * shiftA
      b.x += shift * shiftB
    } else {
      a.x += shift * shiftA
      b.x -= shift * shiftB
    }
  } else {
    const shift = overlapY
    if (a.y < b.y) {
      a.y -= shift * shiftA
      b.y += shift * shiftB
    } else {
      a.y += shift * shiftA
      b.y -= shift * shiftB
    }
  }
}

/**
 * Assigns `x` and `y` positions to a copy of the input nodes.
 *
 * Layout strategy:
 * 1. Stocks are placed in a horizontal row centred vertically at `CANVAS_H / 2`.
 * 2. Flows are placed adjacent to the stock they are connected to via a `flow-pipe` edge.
 * 3. Auxiliaries and parameters are localized near the stocks/flows they connect to.
 * 4. Twenty passes of collision separation (padding 30 px) ensure no bounding-box overlap.
 *
 * The original `nodes` array is never mutated — a shallow copy is returned.
 */
export function computeLayout(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode[] {
  // Deep-copy each node so the originals are never mutated
  const result: DiagramNode[] = nodes.map((n) => ({ ...n }))

  // ── 1. Position stocks in a centred horizontal row ──────────────────────────
  const stocks = result.filter((n) => n.kind === 'stock')
  const stockSpacing = stocks.length > 0 ? Math.max(160, CANVAS_W / (stocks.length + 1)) : 160

  stocks.forEach((s, i) => {
    s.x = stockSpacing * (i + 1)
    s.y = STOCK_Y
  })

  // ── 2. Position flows adjacent to their connected stock ─────────────────────
  const flows = result.filter((n) => n.kind === 'flow')

  for (const flow of flows) {
    const connectedEdge = edges.find(
      (e) => e.kind === 'flow-pipe' && (e.source === flow.id || e.target === flow.id)
    )

    if (connectedEdge) {
      const stockId = connectedEdge.source === flow.id ? connectedEdge.target : connectedEdge.source
      const stock = result.find((n) => n.id === stockId)

      if (stock) {
        // Place the flow to the left of the stock when it is the source (outflow),
        // or to the right when it is the target (inflow).
        const offset = connectedEdge.source === flow.id ? -120 : 120
        flow.x = stock.x + offset
        flow.y = STOCK_Y
      } else {
        // Stock node not found — use safe fallback
        flow.x = CANVAS_W / 2
        flow.y = STOCK_Y - 120
      }
    } else {
      // Flow has no connected stock — place it above the canvas centre
      flow.x = CANVAS_W / 2
      flow.y = STOCK_Y - 120
    }
  }

  // ── 3. Localize auxiliaries and parameters near their connections ───────────
  const periphery = result.filter((n) => n.kind === 'auxiliary' || n.kind === 'parameter')
  const stocksAndFlows = result.filter((n) => n.kind === 'stock' || n.kind === 'flow')

  periphery.forEach((node, i) => {
    // Find all connected stocks and flows
    const connectedNodeIds = new Set<string>()
    for (const edge of edges) {
      if (edge.source === node.id) {
        connectedNodeIds.add(edge.target)
      } else if (edge.target === node.id) {
        connectedNodeIds.add(edge.source)
      }
    }

    const connectedNodes = stocksAndFlows.filter((n) => connectedNodeIds.has(n.id))

    if (connectedNodes.length > 0) {
      // Calculate average position of connected stocks/flows
      let sumX = 0
      let sumY = 0
      for (const conn of connectedNodes) {
        sumX += conn.x
        sumY += conn.y
      }
      const avgX = sumX / connectedNodes.length
      const avgY = sumY / connectedNodes.length

      // Place them with a small offset/jitter distributed in 8 angles
      const angle = (i * 2 * Math.PI) / 8
      const r = 60 // 60px distance
      node.x = avgX + r * Math.cos(angle)
      node.y = avgY + r * Math.sin(angle)
    } else {
      // Fallback: place on a global ellipse
      const rx = CANVAS_W * 0.35
      const ry = CANVAS_H * 0.3
      const angle = (2 * Math.PI * i) / Math.max(1, periphery.length)
      node.x = CANVAS_W / 2 + rx * Math.cos(angle)
      node.y = CANVAS_H / 2 + ry * Math.sin(angle)
    }
  })

  // ── 4. Collision separation — 20 iterations with 30 px padding ──────────────
  for (let iter = 0; iter < 20; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        separateNodes(result[i], result[j], 30)
      }
    }
  }

  // ── 5. Guard: replace any NaN / Infinity with safe finite values ─────────────
  for (const node of result) {
    if (!Number.isFinite(node.x)) node.x = CANVAS_W / 2
    if (!Number.isFinite(node.y)) node.y = CANVAS_H / 2
  }

  return result
}
