import type { AlgorithmKey } from './algorithms'

export type AlgorithmInfo = {
  name: string
  summary: string
  guarantees: string
  time: string
  space: string
  code: string
}

export const algorithmInfo: Record<AlgorithmKey, AlgorithmInfo> = {
  bfs: {
    name: 'Breadth-First Search',
    summary: 'Explores the grid level by level from the start node, using a plain FIFO queue. Since every move costs the same, the first time it reaches the end node, that path is guaranteed shortest.',
    guarantees: 'Shortest path (unweighted)',
    time: 'O(V + E)',
    space: 'O(V)',
    code: `const queue = [start]
start.visited = true

while (queue.length > 0) {
  const node = queue.shift()
  if (node === end) break

  for (const neighbor of neighborsOf(node)) {
    if (!neighbor.visited) {
      neighbor.visited = true
      neighbor.previous = node
      queue.push(neighbor)
    }
  }
}`,
  },
  dijkstra: {
    name: "Dijkstra's Algorithm",
    summary: 'Always expands the closest unvisited node first, picked by scanning the frontier for the smallest distance-so-far. With uniform edge weights it explores in the same order as BFS, but the same algorithm scales to weighted graphs (e.g. terrain that costs more to cross). This is the classic array-based version — no binary heap.',
    guarantees: 'Shortest path (weighted, non-negative)',
    time: 'O(V²) — O((V+E) log V) with a binary heap',
    space: 'O(V)',
    code: `start.distance = 0
const unvisited = allNodes()

while (unvisited.length > 0) {
  const node = closestBy(unvisited, 'distance') // linear scan
  if (node.distance === Infinity) break
  remove(unvisited, node)
  if (node === end) break

  for (const neighbor of neighborsOf(node)) {
    const distance = node.distance + 1
    if (distance < neighbor.distance) {
      neighbor.distance = distance
      neighbor.previous = node
    }
  }
}`,
  },
  astar: {
    name: 'A* Search',
    summary: "Like Dijkstra, but prioritizes nodes using distance-so-far plus a heuristic estimate of the remaining distance to the goal (Manhattan distance here). The heuristic steers the search toward the target instead of expanding outward evenly, so it typically visits far fewer nodes than Dijkstra even though both are O(V²) in the worst case here.",
    guarantees: 'Shortest path (with an admissible heuristic)',
    time: 'O(V²) worst case, far fewer nodes visited in practice',
    space: 'O(V)',
    code: `start.distance = 0
const fScore = new Map([[start, heuristic(start, end)]])
const open = [start]

while (open.length > 0) {
  const node = lowestBy(open, fScore) // linear scan
  remove(open, node)
  if (node === end) break

  for (const neighbor of neighborsOf(node)) {
    const distance = node.distance + 1
    if (distance < neighbor.distance) {
      neighbor.distance = distance
      neighbor.previous = node
      fScore.set(neighbor, distance + heuristic(neighbor, end))
      open.push(neighbor)
    }
  }
}`,
  },
}
