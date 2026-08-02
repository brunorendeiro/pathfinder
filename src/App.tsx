import { useEffect, useRef, useState } from 'react'
import { algorithms, createGrid, resetSearchState, type AlgorithmKey, type Grid, type GridNode } from './data/algorithms'
import { algorithmInfo } from './data/info'
import { getStoredConsent, loadAnalytics } from './analytics'
import CookieConsent from './CookieConsent'

const ROWS = 18
const COLS = 42
const START = { row: 9, col: 6 }
const END = { row: 9, col: 35 }

type Speed = 'fast' | 'normal' | 'slow'
const speedDelay: Record<Speed, number> = { fast: 4, normal: 12, slow: 35 }
const speedLabel: Record<Speed, string> = { slow: 'Leisurely', normal: 'Steady', fast: 'Brisk' }

type DragMode = 'wall' | 'start' | 'end' | null

function cellId(row: number, col: number) {
  return `cell-${row}-${col}`
}

function classNameFor(node: GridNode): string {
  if (node.isStart) return 'cell start'
  if (node.isEnd) return 'cell end'
  if (node.isWall) return 'cell wall'
  return 'cell'
}

export default function App() {
  const [grid, setGrid] = useState<Grid>(() => createGrid(ROWS, COLS, START, END))
  const [start, setStart] = useState(START)
  const [end, setEnd] = useState(END)
  const [algorithm, setAlgorithm] = useState<AlgorithmKey>('bfs')
  const [speed, setSpeed] = useState<Speed>('normal')
  const [isVisualizing, setIsVisualizing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'visualizing' | 'found' | 'not-found'>('idle')

  const dragMode = useRef<DragMode>(null)

  useEffect(() => {
    if (getStoredConsent() === 'granted') loadAnalytics()
  }, [])
  const wallPaintValue = useRef(false)
  const mouseDown = useRef(false)

  function paintCell(row: number, col: number, className: string) {
    const el = document.getElementById(cellId(row, col))
    if (el) el.className = className
  }

  function clearVisualClasses(sourceGrid: Grid) {
    for (const row of sourceGrid) for (const node of row) paintCell(node.row, node.col, classNameFor(node))
  }

  function setNodeWall(sourceGrid: Grid, row: number, col: number, isWall: boolean): Grid {
    const next = sourceGrid.map(r => r.slice())
    const node = next[row][col]
    if (node.isStart || node.isEnd) return sourceGrid
    next[row][col] = { ...node, isWall }
    return next
  }

  function handleMouseDown(row: number, col: number) {
    if (isVisualizing) return
    mouseDown.current = true
    const node = grid[row][col]
    if (node.isStart) { dragMode.current = 'start'; return }
    if (node.isEnd) { dragMode.current = 'end'; return }
    dragMode.current = 'wall'
    wallPaintValue.current = !node.isWall
    setGrid(g => setNodeWall(g, row, col, wallPaintValue.current))
    paintCell(row, col, wallPaintValue.current ? 'cell wall' : 'cell')
  }

  function handleMouseEnter(row: number, col: number) {
    if (!mouseDown.current || isVisualizing) return
    if (dragMode.current === 'wall') {
      setGrid(g => setNodeWall(g, row, col, wallPaintValue.current))
      const node = grid[row][col]
      if (!node.isStart && !node.isEnd) paintCell(row, col, wallPaintValue.current ? 'cell wall' : 'cell')
    } else if (dragMode.current === 'start') {
      if (grid[row][col].isWall || (row === end.row && col === end.col)) return
      moveMarker('start', row, col)
    } else if (dragMode.current === 'end') {
      if (grid[row][col].isWall || (row === start.row && col === start.col)) return
      moveMarker('end', row, col)
    }
  }

  function moveMarker(which: 'start' | 'end', row: number, col: number) {
    setGrid(g => {
      const next = g.map(r => r.slice())
      const current = which === 'start' ? start : end
      next[current.row][current.col] = { ...next[current.row][current.col], isStart: false, isEnd: false, isWall: next[current.row][current.col].isWall }
      next[row][col] = { ...next[row][col], isStart: which === 'start', isEnd: which === 'end', isWall: false }
      paintCell(current.row, current.col, 'cell')
      paintCell(row, col, which === 'start' ? 'cell start' : 'cell end')
      return next
    })
    if (which === 'start') setStart({ row, col })
    else setEnd({ row, col })
  }

  function handleMouseUp() {
    mouseDown.current = false
    dragMode.current = null
  }

  function clearBoard() {
    if (isVisualizing) return
    const fresh = createGrid(ROWS, COLS, start, end)
    setGrid(fresh)
    setStatus('idle')
    clearVisualClasses(fresh)
  }

  function clearPath() {
    if (isVisualizing) return
    setStatus('idle')
    clearVisualClasses(grid)
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function visualize() {
    if (isVisualizing) return
    clearVisualClasses(grid)
    setIsVisualizing(true)
    setStatus('visualizing')
    const working = resetSearchState(grid)
    const { visitedInOrder, path } = algorithms[algorithm](working, start, end)
    const delay = speedDelay[speed]

    for (const node of visitedInOrder) {
      if (node.isStart || node.isEnd) continue
      paintCell(node.row, node.col, 'cell visited')
      await sleep(delay)
    }
    for (const node of path) {
      if (node.isStart || node.isEnd) continue
      paintCell(node.row, node.col, 'cell path')
      await sleep(Math.max(delay, 25))
    }
    setStatus(path.length > 0 ? 'found' : 'not-found')
    setIsVisualizing(false)
  }

  const info = algorithmInfo[algorithm]

  return <div className="app-shell" onMouseUp={handleMouseUp}>
    <header>
      <h1 className="brand"><span className="brand-mark" aria-hidden="true" /><div><strong>Pathfinder</strong><small>An adventurer's route-finder</small></div></h1>
    </header>

    <main>
      <p className="intro">Drag the compass to move where you start, and the X to move where the treasure lies. Click and drag empty ground to raise mountains. Pick a method of scouting and watch it read the map.</p>

      <section className="controls">
        <div className="control-group">
          <span>Algorithm</span>
          <div className="segmented">
            {(['bfs', 'dijkstra', 'astar'] as AlgorithmKey[]).map(key => (
              <button key={key} className={algorithm === key ? 'active' : ''} disabled={isVisualizing} onClick={() => { setAlgorithm(key); clearPath() }}>{algorithmInfo[key].name}</button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <span>Speed</span>
          <div className="segmented">
            {(['slow', 'normal', 'fast'] as Speed[]).map(key => (
              <button key={key} className={speed === key ? 'active' : ''} disabled={isVisualizing} onClick={() => setSpeed(key)}>{speedLabel[key]}</button>
            ))}
          </div>
        </div>
        <div className="control-actions">
          <button className="primary" disabled={isVisualizing} onClick={visualize}>{isVisualizing ? 'Scouting…' : 'Chart the course'}</button>
          <button className="ghost" disabled={isVisualizing} onClick={clearPath}>Clear route</button>
          <button className="ghost" disabled={isVisualizing} onClick={clearBoard}>Reset map</button>
        </div>
      </section>

      <p className={`status status-${status}`} role="status">
        {status === 'idle' && 'The map is laid out — plot your route.'}
        {status === 'visualizing' && 'Scouting the terrain…'}
        {status === 'found' && 'X marks the spot — shortest route found!'}
        {status === 'not-found' && 'No way through — the mountains have it boxed in.'}
      </p>

      <div className="board-scroll">
        <div className="grid" style={{ '--cols': COLS } as React.CSSProperties}>
          {grid.map(row => row.map(node => (
            <div
              key={cellId(node.row, node.col)}
              id={cellId(node.row, node.col)}
              className={classNameFor(node)}
              onMouseDown={() => handleMouseDown(node.row, node.col)}
              onMouseEnter={() => handleMouseEnter(node.row, node.col)}
            />
          )))}
        </div>
      </div>

      <section className="info-card">
        <h2>{info.name}</h2>
        <p>{info.summary}</p>
        <div className="info-grid">
          <div><span>Guarantees</span><strong>{info.guarantees}</strong></div>
          <div><span>Time</span><strong>{info.time}</strong></div>
          <div><span>Space</span><strong>{info.space}</strong></div>
        </div>
        <pre className="code-block"><code>{info.code}</code></pre>
      </section>
    </main>

    <footer>
      <span>No servers charted here — just paper, ink and a steady hand. Pure client-side rendering, no backend.</span>
      <a href="https://vibe-portfolio-one.vercel.app/" target="_blank" rel="noreferrer">Created by Bruno Rendeiro</a>
      <span className="powered-badge">⚡ Powered by AI</span>
    </footer>
    <CookieConsent />
  </div>
}
