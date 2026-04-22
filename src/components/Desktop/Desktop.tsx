import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import styles from './Desktop.module.css'
import { useWindowStore } from '../../store/windowStore'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useSound } from '../../hooks/useSound'
import { useCasinoStore } from '../../store/casinoStore'
import type { AppType } from '../../data/filesystem'

const TASKBAR_H = 40
const MIN_CELL_W = 80
const MIN_CELL_H = 90

interface GridMetrics {
  numCols: number
  numRows: number
  cellW: number
  cellH: number
}

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

const BASE_DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'my-projects', label: 'Mes Projets', icon: 'folder', image: '/img/Windows_95_FOLDER.png', app: 'file-explorer', props: { folderId: 'projects' }, defaultPos: { col: 0, row: 0 } },
  { id: 'skills', label: 'Compétences', icon: 'control', image: '/img/Settings_32x32_4.png', app: 'skills', defaultPos: { col: 0, row: 1 } },
  { id: 'resume', label: 'CV.txt', icon: 'notepad', image: '/img/FileText_32x32_4.png', app: 'resume', defaultPos: { col: 0, row: 2 } },
  { id: 'notes', label: 'Notes.txt', icon: 'notepad', image: '/img/FileText_32x32_4.png', app: 'notes', defaultPos: { col: 2, row: 2 } },
  { id: 'contact', label: 'Contact', icon: 'cmd', image: '/img/Shell323_32x32_4.png', app: 'contact', defaultPos: { col: 0, row: 3 } },
  { id: 'about', label: 'À propos', icon: 'info', image: '/img/Awfxex32Info_32x32_4.png', app: 'about', defaultPos: { col: 0, row: 4 } },
  { id: 'minesweeper', label: 'Démineur', icon: 'minesweeper', image: '/img/95minesweeper.ico', app: 'minesweeper', defaultPos: { col: 1, row: 0 } },
  { id: 'secret-folder', label: 'Terry Files', icon: 'folder', image: '/img/Windows_95_FOLDER.png', app: 'file-explorer', props: { folderId: 'TerryFiles' }, defaultPos: { col: 1, row: 1 } },
  { id: 'mail', label: 'Messagerie', icon: 'mail', image: '/img/Mailnews12_32x32_4.png', app: 'mail', defaultPos: { col: 1, row: 2 } },
  { id: 'paint', label: 'Paint', icon: 'paint', image: '/img/Settings_32x32_4.png', app: 'paint', defaultPos: { col: 2, row: 0 } },
  { id: 'media-player', label: 'Lecteur Multimédia', icon: 'media-player', image: '/icon/w98_media_player.ico', app: 'media-player', defaultPos: { col: 2, row: 1 } },
]

const CASINO_DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'casino', label: 'Casino', icon: '🎰', image: '/img/7.png', app: 'casino', defaultPos: { col: 2, row: 2 } },
  { id: 'bank', label: 'Banque', icon: '🏦', image: '/img/icons8-banque-32.png', app: 'bank', defaultPos: { col: 2, row: 3 } },
]

function computeMetrics(): GridMetrics {
  const numCols = Math.max(1, Math.floor(window.innerWidth / MIN_CELL_W))
  const numRows = Math.max(1, Math.floor((window.innerHeight - TASKBAR_H) / MIN_CELL_H))
  return {
    numCols,
    numRows,
    cellW: window.innerWidth / numCols,
    cellH: (window.innerHeight - TASKBAR_H) / numRows,
  }
}

function gridToPixel(col: number, row: number, m: GridMetrics) {
  return { x: col * m.cellW, y: row * m.cellH }
}

function pixelToGrid(x: number, y: number, m: GridMetrics): GridPos {
  return {
    col: Math.round(x / m.cellW),
    row: Math.round(y / m.cellH),
  }
}

function clampToGrid(pos: GridPos, m: GridMetrics): GridPos {
  return {
    col: Math.max(0, Math.min(pos.col, m.numCols - 1)),
    row: Math.max(0, Math.min(pos.row, m.numRows - 1)),
  }
}

function resolveCollisions(positions: Record<string, GridPos>, m: GridMetrics, icons: DesktopIconDef[]): { result: Record<string, GridPos>; changed: boolean } {
  const result: Record<string, GridPos> = {}
  const occupied = new Set<string>()
  let changed = false

  const getPos = (icon: DesktopIconDef) => {
    const raw = positions[icon.id] && typeof positions[icon.id]?.col === 'number'
      ? positions[icon.id]
      : icon.defaultPos
    return clampToGrid(raw, m)
  }

  // Priority: column-major order (col asc, then row asc)
  const sorted = [...icons].sort((a, b) => {
    const pa = getPos(a)
    const pb = getPos(b)
    return pa.col !== pb.col ? pa.col - pb.col : pa.row - pb.row
  })

  sorted.forEach((icon) => {
    const raw = positions[icon.id] && typeof positions[icon.id]?.col === 'number'
      ? positions[icon.id]
      : icon.defaultPos
    const clamped = clampToGrid(raw, m)
    const free = findFreeCell(clamped, occupied, m)
    result[icon.id] = free
    occupied.add(`${free.col},${free.row}`)
    if (free.col !== raw.col || free.row !== raw.row) changed = true
  })

  return { result, changed }
}

function findFreeCell(target: GridPos, occupied: Set<string>, m: GridMetrics): GridPos {
  const key = (c: number, r: number) => `${c},${r}`
  const clamped = clampToGrid(target, m)
  if (!occupied.has(key(clamped.col, clamped.row))) return clamped
  for (let radius = 1; radius <= 5; radius++) {
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) {
        if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue
        const candidate = clampToGrid({ col: clamped.col + dc, row: clamped.row + dr }, m)
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

type DesktopThemeId = 'emerald' | 'azure' | 'sunset' | 'graphite'

interface DesktopTheme {
  id: DesktopThemeId
  label: string
  backgroundColor: string
  backgroundImage: string
}

const DESKTOP_THEMES: DesktopTheme[] = [
  {
    id: 'emerald',
    label: 'Classique',
    backgroundColor: '#008080',
    backgroundImage: 'linear-gradient(160deg, rgba(0, 128, 128, 0.95) 0%, rgba(0, 102, 102, 0.95) 100%)',
  },
  {
    id: 'azure',
    label: 'Azure',
    backgroundColor: '#0b4f8a',
    backgroundImage: 'linear-gradient(165deg, rgba(11, 79, 138, 0.95) 0%, rgba(45, 126, 196, 0.95) 100%)',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    backgroundColor: '#8a3f2f',
    backgroundImage: 'linear-gradient(170deg, rgba(163, 66, 43, 0.95) 0%, rgba(224, 123, 57, 0.95) 100%)',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    backgroundColor: '#3c4751',
    backgroundImage: 'linear-gradient(170deg, rgba(60, 71, 81, 0.95) 0%, rgba(91, 106, 119, 0.95) 100%)',
  },
]

export function Desktop() {
  const { openWindow } = useWindowStore()
  const { play } = useSound()
  const { unlocked, pledgedApps } = useCasinoStore()
  const [desktopTheme, setDesktopTheme] = useLocalStorage<DesktopThemeId>('win95-desktop-theme-v1', 'emerald')
  const [iconPositions, setIconPositions] = useLocalStorage<Record<string, GridPos>>(
    'win95-icon-positions-v2',
    {}
  )
  const [metrics, setMetrics] = useState<GridMetrics>(computeMetrics)
  const metricsRef = useRef(metrics)

  const activeIcons = useMemo(
    () => (unlocked ? [...BASE_DESKTOP_ICONS, ...CASINO_DESKTOP_ICONS] : BASE_DESKTOP_ICONS),
    [unlocked]
  )
  const activeIconsRef = useRef(activeIcons)
  useEffect(() => { activeIconsRef.current = activeIcons }, [activeIcons])

  const [tooSmall, setTooSmall] = useState(() => {
    const m = computeMetrics()
    return m.numCols * m.numRows < BASE_DESKTOP_ICONS.length
  })
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [draggingPixel, setDraggingPixel] = useState<{ id: string; x: number; y: number } | null>(null)
  const lastClick = useRef<{ id: string; time: number } | null>(null)
  const dragStart = useRef<{ mx: number; my: number; ix: number; iy: number; iconId: string; pointerId: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    metricsRef.current = metrics
  }, [metrics])

  useEffect(() => {
    setIconPositions((prev) => {
      const { result, changed } = resolveCollisions(prev, metricsRef.current, activeIcons)
      return changed ? result : prev
    })
  }, [activeIcons, setIconPositions])

  useEffect(() => {
    play('startup')
  }, [play])

  useEffect(() => {
    const handleResize = () => {
      const m = computeMetrics()
      if (m.numCols * m.numRows < activeIconsRef.current.length) {
        setTooSmall(true)
        return
      }
      setTooSmall(false)
      setMetrics(m)
      metricsRef.current = m
      setIconPositions((prev) => {
        const { result, changed } = resolveCollisions(prev, m, activeIconsRef.current)
        return changed ? result : prev
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIconPositions])

  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const getGridPos = (id: string, def: GridPos): GridPos => {
    const stored = iconPositions[id]
    if (stored && typeof stored.col === 'number' && typeof stored.row === 'number') return stored
    return def
  }

  const handleIconPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, icon: DesktopIconDef) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedIcon(icon.id)

      const sourceEl = e.currentTarget
      try { sourceEl.setPointerCapture(e.pointerId) } catch { /* no-op */ }

      const m = metricsRef.current
      const gridPos = iconPositions[icon.id] && typeof iconPositions[icon.id].col === 'number'
        ? iconPositions[icon.id]
        : icon.defaultPos
      const pixel = gridToPixel(gridPos.col, gridPos.row, m)

      dragStart.current = { mx: e.clientX, my: e.clientY, ix: pixel.x, iy: pixel.y, iconId: icon.id, pointerId: e.pointerId }
      lastPointer.current = { x: e.clientX, y: e.clientY }

      const cleanupDragListeners = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('blur', onWindowBlur)
        if (sourceEl.hasPointerCapture(e.pointerId)) {
          try { sourceEl.releasePointerCapture(e.pointerId) } catch { /* no-op */ }
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
          const rawX = Math.max(0, dragStart.current.ix + dx)
          const rawY = Math.max(0, dragStart.current.iy + dy)
          const currentMetrics = metricsRef.current
          const targetCell = pixelToGrid(rawX, rawY, currentMetrics)

          setIconPositions((prev) => {
            const occupied = new Set<string>()
            activeIconsRef.current.forEach((ic) => {
              if (ic.id === icon.id) return
              const pos = prev[ic.id] && typeof prev[ic.id].col === 'number'
                ? prev[ic.id]
                : ic.defaultPos
              occupied.add(`${pos.col},${pos.row}`)
            })
            const freeCell = findFreeCell(targetCell, occupied, currentMetrics)
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
      if (pledgedApps.includes(icon.app)) return
      const now = Date.now()
      const last = lastClick.current
      if (last && last.id === icon.id && now - last.time < 500) {
        play('open')
        openWindow(icon.app, icon.props)
        lastClick.current = null
      } else {
        lastClick.current = { id: icon.id, time: now }
      }
    },
    [openWindow, play, pledgedApps]
  )

  const handleDesktopClick = useCallback(() => setSelectedIcon(null), [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleRefresh = useCallback(() => {
    setContextMenu(null)
    document.body.style.opacity = '0.9'
    setTimeout(() => { document.body.style.opacity = '1' }, 150)
  }, [])

  const selectedTheme = DESKTOP_THEMES.find((theme) => theme.id === desktopTheme) ?? DESKTOP_THEMES[0]

  return (
    <div
      className={styles.desktop}
      style={{
        backgroundColor: selectedTheme.backgroundColor,
        backgroundImage: selectedTheme.backgroundImage,
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      <div
        className={styles.iconsGrid}
        style={{
          '--cell-w': `${metrics.cellW}px`,
          '--cell-h': `${metrics.cellH}px`,
        } as React.CSSProperties}
      >
        {activeIcons.map((icon) => {
          const isDragging = draggingPixel?.id === icon.id
          const isPledged = pledgedApps.includes(icon.app)
          let left: number
          let top: number

          if (isDragging && draggingPixel) {
            left = draggingPixel.x
            top = draggingPixel.y
          } else {
            const pos = getGridPos(icon.id, icon.defaultPos)
            const pixel = gridToPixel(pos.col, pos.row, metrics)
            left = pixel.x
            top = pixel.y
          }

          return (
            <div
              key={icon.id}
              className={`${styles.icon} ${selectedIcon === icon.id ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${isPledged ? styles.pledged : ''}`}
              style={{ left, top, width: metrics.cellW, height: metrics.cellH }}
              onPointerDown={(e) => handleIconPointerDown(e, icon)}
              onClick={(e) => handleIconClick(e, icon)}
              onDragStart={(e) => e.preventDefault()}
              title={isPledged ? `${icon.label} (engagé)` : `Double-cliquer pour ouvrir ${icon.label}`}
            >
              {icon.image ? (
                <img src={icon.image} alt={icon.label} className={styles.iconImage} draggable={false} />
              ) : (
                <span className={styles.iconEmoji}>{icon.icon}</span>
              )}
              <span className={styles.iconLabel}>{icon.label}</span>
              {isPledged && <span className={styles.pledgeLock}>🔒</span>}
            </div>
          )
        })}
      </div>

      {tooSmall && (
        <div className={styles.tooSmallOverlay}>
          <div className={styles.tooSmallDialog}>
            <div className={styles.tooSmallTitleBar}>
              <span>Résolution insuffisante</span>
            </div>
            <div className={styles.tooSmallBody}>
              <img src="/img/Windows_95_FOLDER.png" alt="" className={styles.tooSmallIcon} />
              <p>
                La fenêtre est trop petite pour afficher toutes les icônes du bureau ({activeIcons.length} icônes requises).
                Agrandissez la fenêtre pour continuer.
              </p>
            </div>
          </div>
        </div>
      )}

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
          <div className={styles.contextSubmenuTrigger}>
            <div className={styles.contextMenuItem}>
              Fonds d'ecran
              <span className={styles.contextMenuArrow}>▶</span>
            </div>
            <div className={styles.contextSubmenu}>
              {DESKTOP_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className={styles.contextMenuItem}
                  onClick={() => {
                    setDesktopTheme(theme.id)
                    setContextMenu(null)
                  }}
                >
                  {desktopTheme === theme.id ? '✓ ' : ''}
                  {theme.label}
                </div>
              ))}
            </div>
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
