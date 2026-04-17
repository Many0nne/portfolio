import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './Desktop.module.css'
import { useWindowStore } from '../../store/windowStore'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useSound } from '../../hooks/useSound'
import type { AppType } from '../../data/filesystem'

// Grid constants
const GRID_CELL_W = 80
const GRID_CELL_H = 90
const GRID_OFFSET_X = 8
const GRID_OFFSET_Y = 8

interface GridPos {
  col: number
  row: number
}

interface DesktopIconDef {
  id: string
  label: string
  icon: string
  image?: string
  app: AppType
  props?: Record<string, unknown>
  defaultPos: GridPos
}

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'my-projects', label: 'Mes Projets', icon: 'folder', image: '/img/Windows_95_FOLDER.png', app: 'file-explorer', props: { folderId: 'projects' }, defaultPos: { col: 0, row: 0 } },
  { id: 'skills', label: 'Compétences', icon: 'control', image: '/img/Settings_32x32_4.png', app: 'skills', defaultPos: { col: 0, row: 1 } },
  { id: 'resume', label: 'CV.txt', icon: 'notepad', image: '/img/FileText_32x32_4.png', app: 'resume', defaultPos: { col: 0, row: 2 } },
  { id: 'contact', label: 'Contact', icon: 'cmd', image: '/img/Shell323_32x32_4.png', app: 'contact', defaultPos: { col: 0, row: 3 } },
  { id: 'about', label: 'À propos', icon: 'info', image: '/img/Awfxex32Info_32x32_4.png', app: 'about', defaultPos: { col: 0, row: 4 } },
  { id: 'minesweeper', label: 'Démineur', icon: 'minesweeper', image: '/img/95minesweeper.ico', app: 'minesweeper', defaultPos: { col: 1, row: 0 } },
]

function gridToPixel(col: number, row: number) {
  return {
    x: GRID_OFFSET_X + col * GRID_CELL_W,
    y: GRID_OFFSET_Y + row * GRID_CELL_H,
  }
}

function pixelToGrid(x: number, y: number): GridPos {
  return {
    col: Math.round((x - GRID_OFFSET_X) / GRID_CELL_W),
    row: Math.round((y - GRID_OFFSET_Y) / GRID_CELL_H),
  }
}

function getGridBounds() {
  const maxCols = Math.floor((window.innerWidth - GRID_OFFSET_X) / GRID_CELL_W) - 1
  const maxRows = Math.floor((window.innerHeight - 40 - GRID_OFFSET_Y) / GRID_CELL_H) - 1
  return { maxCols, maxRows }
}

function clampToGrid(pos: GridPos): GridPos {
  const { maxCols, maxRows } = getGridBounds()
  return {
    col: Math.max(0, Math.min(pos.col, maxCols)),
    row: Math.max(0, Math.min(pos.row, maxRows)),
  }
}

function findFreeCell(target: GridPos, occupied: Set<string>): GridPos {
  const key = (c: number, r: number) => `${c},${r}`
  const clamped = clampToGrid(target)

  if (!occupied.has(key(clamped.col, clamped.row))) return clamped

  // Search in expanding rings for the nearest free cell
  for (let radius = 1; radius <= 5; radius++) {
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) {
        if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue
        const candidate = clampToGrid({ col: clamped.col + dc, row: clamped.row + dr })
        if (!occupied.has(key(candidate.col, candidate.row))) return candidate
      }
    }
  }

  return clamped
}

interface ContextMenu {
  x: number
  y: number
}

export function Desktop() {
  const { openWindow } = useWindowStore()
  const { play } = useSound()
  const [iconPositions, setIconPositions] = useLocalStorage<Record<string, GridPos>>(
    'win95-icon-positions-v2',
    {}
  )
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  // Live pixel position during drag for visual feedback
  const [draggingPixel, setDraggingPixel] = useState<{ id: string; x: number; y: number } | null>(null)
  const lastClick = useRef<{ id: string; time: number } | null>(null)
  const dragStart = useRef<{ mx: number; my: number; ix: number; iy: number; iconId: string; pointerId: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)

  // Play startup sound once
  useEffect(() => {
    play('startup')
  }, [play])

  // Close context menu on click
  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const getGridPos = (id: string, def: GridPos): GridPos => {
    const stored = iconPositions[id]
    // Validate stored value has grid format
    if (stored && typeof stored.col === 'number' && typeof stored.row === 'number') {
      return stored
    }
    return def
  }

  const handleIconPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, icon: DesktopIconDef) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedIcon(icon.id)

      const sourceEl = e.currentTarget

      try {
        sourceEl.setPointerCapture(e.pointerId)
      } catch {
        // No-op: some browsers can throw if capture cannot be set.
      }

      const gridPos = iconPositions[icon.id] && typeof iconPositions[icon.id].col === 'number'
        ? iconPositions[icon.id]
        : icon.defaultPos
      const pixel = gridToPixel(gridPos.col, gridPos.row)

      dragStart.current = { mx: e.clientX, my: e.clientY, ix: pixel.x, iy: pixel.y, iconId: icon.id, pointerId: e.pointerId }
      lastPointer.current = { x: e.clientX, y: e.clientY }

      const cleanupDragListeners = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('blur', onWindowBlur)

        if (sourceEl.hasPointerCapture(e.pointerId)) {
          try {
            sourceEl.releasePointerCapture(e.pointerId)
          } catch {
            // No-op when capture is already released.
          }
        }
      }

      const finalizeDrag = (clientX: number, clientY: number) => {
        if (!dragStart.current) {
          cleanupDragListeners()
          setDraggingPixel(null)
          return
        }

        const dx = clientX - dragStart.current.mx
        const dy = clientY - dragStart.current.my
        const didDrag = Math.abs(dx) >= 4 || Math.abs(dy) >= 4

        if (didDrag) {
          // Snap to grid on release
          const rawX = Math.max(0, dragStart.current.ix + dx)
          const rawY = Math.max(0, dragStart.current.iy + dy)
          const targetCell = pixelToGrid(rawX, rawY)

          setIconPositions((prev) => {
            // Build occupied set (excluding the dragged icon)
            const occupied = new Set<string>()
            DESKTOP_ICONS.forEach((ic) => {
              if (ic.id === icon.id) return
              const pos = prev[ic.id] && typeof prev[ic.id].col === 'number'
                ? prev[ic.id]
                : ic.defaultPos
              occupied.add(`${pos.col},${pos.row}`)
            })
            const freeCell = findFreeCell(targetCell, occupied)
            return { ...prev, [icon.id]: freeCell }
          })
        }

        dragStart.current = null
        setDraggingPixel(null)
        cleanupDragListeners()
      }

      const onMove = (me: PointerEvent) => {
        if (!dragStart.current || me.pointerId !== dragStart.current.pointerId) return
        lastPointer.current = { x: me.clientX, y: me.clientY }
        const dx = me.clientX - dragStart.current.mx
        const dy = me.clientY - dragStart.current.my
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
        setDraggingPixel({
          id: icon.id,
          x: Math.max(0, dragStart.current.ix + dx),
          y: Math.max(0, dragStart.current.iy + dy),
        })
      }

      const onUp = (me: PointerEvent) => {
        if (!dragStart.current || me.pointerId !== dragStart.current.pointerId) return
        finalizeDrag(me.clientX, me.clientY)
      }

      const onCancel = (me: PointerEvent) => {
        if (!dragStart.current || me.pointerId !== dragStart.current.pointerId) return
        finalizeDrag(me.clientX, me.clientY)
      }

      const onWindowBlur = () => {
        const fallback = lastPointer.current ?? { x: e.clientX, y: e.clientY }
        finalizeDrag(fallback.x, fallback.y)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      window.addEventListener('blur', onWindowBlur)
    },
    [iconPositions, setIconPositions]
  )

  const handleIconClick = useCallback(
    (e: React.MouseEvent, icon: DesktopIconDef) => {
      e.stopPropagation()
      const now = Date.now()
      const last = lastClick.current

      if (last && last.id === icon.id && now - last.time < 500) {
        // Double click
        play('open')
        openWindow(icon.app, icon.props)
        lastClick.current = null
      } else {
        lastClick.current = { id: icon.id, time: now }
      }
    },
    [openWindow, play]
  )

  const handleDesktopClick = useCallback(() => {
    setSelectedIcon(null)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleRefresh = useCallback(() => {
    setContextMenu(null)
    document.body.style.opacity = '0.9'
    setTimeout(() => { document.body.style.opacity = '1' }, 150)
  }, [])

  return (
    <div
      className={styles.desktop}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.iconsGrid}>
        {DESKTOP_ICONS.map((icon) => {
          const isDragging = draggingPixel?.id === icon.id
          let left: number
          let top: number

          if (isDragging && draggingPixel) {
            left = draggingPixel.x
            top = draggingPixel.y
          } else {
            const pos = getGridPos(icon.id, icon.defaultPos)
            const pixel = gridToPixel(pos.col, pos.row)
            left = pixel.x
            top = pixel.y
          }

          return (
            <div
              key={icon.id}
              className={`${styles.icon} ${selectedIcon === icon.id ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
              style={{ left, top }}
              onPointerDown={(e) => handleIconPointerDown(e, icon)}
              onClick={(e) => handleIconClick(e, icon)}
              onDragStart={(e) => e.preventDefault()}
              title={`Double-cliquer pour ouvrir ${icon.label}`}
            >
              {icon.image ? (
                <img src={icon.image} alt={icon.label} className={styles.iconImage} draggable={false} />
              ) : (
                <span className={styles.iconEmoji}>{icon.icon}</span>
              )}
              <span className={styles.iconLabel}>{icon.label}</span>
            </div>
          )
        })}
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.contextMenuItem} onClick={handleRefresh}>
            Actualiser
          </div>
          <div className={styles.contextSeparator} />
          <div className={styles.contextMenuItem} onClick={() => { openWindow('about'); setContextMenu(null) }}>
            Propriétés
          </div>
        </div>
      )}
    </div>
  )
}
