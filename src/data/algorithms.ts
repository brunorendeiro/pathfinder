export type GridNode = {
  row: number
  col: number
  isWall: boolean
  isStart: boolean
  isEnd: boolean
  distance: number
  isVisited: boolean
  previousNode: GridNode | null
}

export type Grid = GridNode[][]

export function createNode(row: number, col: number, startRow: number, startCol: number, endRow: number, endCol: number): GridNode {
  return {
    row,
    col,
    isWall: false,
    isStart: row === startRow && col === startCol,
    isEnd: row === endRow && col === endCol,
    distance: Infinity,
    isVisited: false,
    previousNode: null,
  }
}

export function createGrid(rows: number, cols: number, start: { row: number; col: number }, end: { row: number; col: number }): Grid {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => createNode(row, col, start.row, start.col, end.row, end.col)),
  )
}

/** Deep-clones the grid and resets per-run search state, keeping walls and start/end. */
export function resetSearchState(grid: Grid): Grid {
  return grid.map(row => row.map(node => ({ ...node, distance: Infinity, isVisited: false, previousNode: null })))
}

function neighborsOf(grid: Grid, node: GridNode): GridNode[] {
  const { row, col } = node
  const rows = grid.length
  const cols = grid[0].length
  const deltas: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  const result: GridNode[] = []
  for (const [dr, dc] of deltas) {
    const nr = row + dr
    const nc = col + dc
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall) result.push(grid[nr][nc])
  }
  return result
}

function reconstructPath(endNode: GridNode): GridNode[] {
  const path: GridNode[] = []
  let current: GridNode | null = endNode
  while (current !== null) {
    path.unshift(current)
    current = current.previousNode
  }
  return path
}

export type SearchResult = { visitedInOrder: GridNode[]; path: GridNode[] }

export function bfs(grid: Grid, start: { row: number; col: number }, end: { row: number; col: number }): SearchResult {
  const visitedInOrder: GridNode[] = []
  const startNode = grid[start.row][start.col]
  const endNode = grid[end.row][end.col]
  const queue: GridNode[] = [startNode]
  startNode.isVisited = true
  startNode.distance = 0
  while (queue.length > 0) {
    const current = queue.shift()!
    visitedInOrder.push(current)
    if (current === endNode) break
    for (const neighbor of neighborsOf(grid, current)) {
      if (!neighbor.isVisited) {
        neighbor.isVisited = true
        neighbor.distance = current.distance + 1
        neighbor.previousNode = current
        queue.push(neighbor)
      }
    }
  }
  return { visitedInOrder, path: endNode.isVisited ? reconstructPath(endNode) : [] }
}

/** Uniform edge weights (1) — with unweighted edges it explores in the same
 * order as BFS, but the algorithm itself generalizes to weighted graphs.
 * Extracts the minimum by linear scan each round (the classic array-based
 * Dijkstra, O(V²) — no binary heap), which is both simpler to read and
 * faster in practice here than re-sorting the whole frontier every step. */
export function dijkstra(grid: Grid, start: { row: number; col: number }, end: { row: number; col: number }): SearchResult {
  const visitedInOrder: GridNode[] = []
  const startNode = grid[start.row][start.col]
  const endNode = grid[end.row][end.col]
  startNode.distance = 0
  const unvisited: GridNode[] = grid.flat().filter(node => !node.isWall)

  while (unvisited.length > 0) {
    let minIndex = 0
    for (let i = 1; i < unvisited.length; i++) {
      if (unvisited[i].distance < unvisited[minIndex].distance) minIndex = i
    }
    const current = unvisited[minIndex]
    if (current.distance === Infinity) break
    unvisited[minIndex] = unvisited[unvisited.length - 1]
    unvisited.pop()
    current.isVisited = true
    visitedInOrder.push(current)
    if (current === endNode) break
    for (const neighbor of neighborsOf(grid, current)) {
      const candidateDistance = current.distance + 1
      if (candidateDistance < neighbor.distance) {
        neighbor.distance = candidateDistance
        neighbor.previousNode = current
      }
    }
  }
  return { visitedInOrder, path: endNode.isVisited ? reconstructPath(endNode) : [] }
}

function manhattan(a: { row: number; col: number }, b: { row: number; col: number }): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
}

export function astar(grid: Grid, start: { row: number; col: number }, end: { row: number; col: number }): SearchResult {
  const visitedInOrder: GridNode[] = []
  const startNode = grid[start.row][start.col]
  const endNode = grid[end.row][end.col]
  startNode.distance = 0
  const fScore = new Map<GridNode, number>([[startNode, manhattan(start, end)]])
  const open: GridNode[] = [startNode]

  while (open.length > 0) {
    let minIndex = 0
    for (let i = 1; i < open.length; i++) {
      if ((fScore.get(open[i]) ?? Infinity) < (fScore.get(open[minIndex]) ?? Infinity)) minIndex = i
    }
    const current = open[minIndex]
    open[minIndex] = open[open.length - 1]
    open.pop()
    if (current.isVisited) continue
    current.isVisited = true
    visitedInOrder.push(current)
    if (current === endNode) break
    for (const neighbor of neighborsOf(grid, current)) {
      const candidateDistance = current.distance + 1
      if (candidateDistance < neighbor.distance) {
        neighbor.distance = candidateDistance
        neighbor.previousNode = current
        fScore.set(neighbor, candidateDistance + manhattan(neighbor, end))
        open.push(neighbor)
      }
    }
  }
  return { visitedInOrder, path: endNode.isVisited ? reconstructPath(endNode) : [] }
}

export type AlgorithmKey = 'bfs' | 'dijkstra' | 'astar'

export const algorithms: Record<AlgorithmKey, (grid: Grid, start: { row: number; col: number }, end: { row: number; col: number }) => SearchResult> = {
  bfs,
  dijkstra,
  astar,
}
