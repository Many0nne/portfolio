import { useState, useCallback, useEffect } from 'react'
import styles from './Minesweeper.module.css'
import { useWindowStore } from '../../store/windowStore'

const MODES = {
  beginner:     { rows: 9,  cols: 9,  mines: 10, width: 262, height: 340 },
  intermediate: { rows: 16, cols: 16, mines: 40, width: 414, height: 510 },
  expert:       { rows: 16, cols: 30, mines: 99, width: 750, height: 510 },
} as const

type Mode = keyof typeof MODES
const MODE_CYCLE: Mode[] = ['beginner', 'intermediate', 'expert']

type CellState = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

function createBoard(rows: number, cols: number, mines: number, firstClick?: { r: number; c: number }): CellState[][] {
  const board: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  )

  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (board[r][c].isMine) continue
    if (firstClick && Math.abs(r - firstClick.r) <= 1 && Math.abs(c - firstClick.c) <= 1) continue
    board[r][c].isMine = true
    placed++
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) count++
        }
      }
      board[r][c].adjacentMines = count
    }
  }

  return board
}

function revealCells(board: CellState[][], rows: number, cols: number, r: number, c: number): CellState[][] {
  const next = board.map((row) => row.map((cell) => ({ ...cell })))

  const flood = (row: number, col: number) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return
    const cell = next[row][col]
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return
    cell.isRevealed = true
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          flood(row + dr, col + dc)
        }
      }
    }
  }

  flood(r, c)
  return next
}

// Win95 Minesweeper canonical number colors
const COLORS = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080']

interface MinesweeperProps {
  windowId: string
}

export function Minesweeper({ windowId }: MinesweeperProps) {
  const { updateSize } = useWindowStore()
  const [mode, setMode] = useState<Mode>('beginner')
  const [board, setBoard] = useState<CellState[][] | null>(null)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [flagsLeft, setFlagsLeft] = useState<number>(MODES.beginner.mines)
  const [seconds, setSeconds] = useState(0)

  const { rows, cols, mines } = MODES[mode]

  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => setSeconds((s) => Math.min(s + 1, 999)), 1000)
    return () => clearInterval(interval)
  }, [status])

  const startGame = useCallback((nextMode: Mode) => {
    setBoard(null)
    setStatus('idle')
    setFlagsLeft(MODES[nextMode].mines)
    setSeconds(0)
    setMode(nextMode)
    updateSize(windowId, { width: MODES[nextMode].width, height: MODES[nextMode].height })
  }, [windowId, updateSize])

  const handleSmileyClick = useCallback(() => {
    const nextMode = MODE_CYCLE[(MODE_CYCLE.indexOf(mode) + 1) % MODE_CYCLE.length]
    startGame(nextMode)
  }, [mode, startGame])

  const handleClick = useCallback(
    (r: number, c: number) => {
      if (status === 'won' || status === 'lost') return

      setBoard((prev) => {
        let current = prev
        if (!current) {
          current = createBoard(rows, cols, mines, { r, c })
          setStatus('playing')
        }

        const cell = current[r][c]
        if (cell.isRevealed || cell.isFlagged) return current

        if (cell.isMine) {
          const revealed = current.map((row) =>
            row.map((cl) => (cl.isMine ? { ...cl, isRevealed: true } : cl))
          )
          setStatus('lost')
          return revealed
        }

        const next = revealCells(current, rows, cols, r, c)

        const unrevealed = next.flat().filter((cl) => !cl.isRevealed && !cl.isMine).length
        if (unrevealed === 0) setStatus('won')

        return next
      })
    },
    [status, rows, cols, mines]
  )

  const handleRightClick = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault()
      if (status === 'won' || status === 'lost' || !board) return
      const cell = board[r][c]
      if (cell.isRevealed) return

      setBoard((prev) =>
        prev!.map((row, ri) =>
          row.map((cl, ci) =>
            ri === r && ci === c ? { ...cl, isFlagged: !cl.isFlagged } : cl
          )
        )
      )
      setFlagsLeft((f) => (board[r][c].isFlagged ? f + 1 : f - 1))
    },
    [board, status]
  )

  const smiley = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂'

  const emptyRow = Array.from({ length: cols }, () => ({
    isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0,
  }))
  const displayBoard = board ?? Array.from({ length: rows }, () => emptyRow)

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <div className={styles.counter}>{String(flagsLeft).padStart(3, '0')}</div>
        <button className={styles.smileyBtn} onClick={handleSmileyClick} title="Changer de mode / Nouvelle partie">
          {smiley}
        </button>
        <div className={styles.counter}>{String(seconds).padStart(3, '0')}</div>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${cols}, 24px)` }}
      >
        {displayBoard.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`${styles.cell} ${cell.isRevealed ? styles.revealed : ''} ${cell.isMine && cell.isRevealed ? styles.mine : ''}`}
              onClick={() => handleClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)}
            >
              {cell.isFlagged && !cell.isRevealed
                ? '🚩'
                : cell.isRevealed && cell.isMine
                ? '💣'
                : cell.isRevealed && cell.adjacentMines > 0
                ? <span style={{ color: COLORS[cell.adjacentMines], fontWeight: 'bold' }}>{cell.adjacentMines}</span>
                : null}
            </button>
          ))
        )}
      </div>

      {(status === 'won' || status === 'lost') && (
        <div className={styles.message}>
          {status === 'won' ? '🎉 Félicitations !' : '💥 Perdu !'}
          <button className={styles.retryBtn} onClick={() => startGame(mode)}>Rejouer</button>
        </div>
      )}
    </div>
  )
}
