import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import styles from './Desktop.module.css'
import { useWindowStore } from '../../store/windowStore'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useSound } from '../../hooks/useSound'
import { useFsStore } from '../../fs/fsStore'
import { BUREAU_ID } from '../../fs/seed'
import { ICON_MAP } from '../../data/icons'
import { ContextMenu } from '../shared/ContextMenu'
import type { FsNode, ContextMenuItem } from '../../types'

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

interface DesktopTheme {
  id: DesktopThemeId
  label: string
  backgroundColor: string
  backgroundImage: string
}

type DesktopThemeId = 'emerald' | 'azure' | 'sunset' | 'graphite'

const TASKBAR_H = 40
const MIN_CELL_W = 80
const MIN_CELL_H = 90

const DESKTOP_THEMES: DesktopTheme[] = [
  { id: 'emerald', label: 'Classique', backgroundColor: '#008080', backgroundImage: 'linear-gradient(160deg, rgba(0,128,128,.95) 0%, rgba(0,102,102,.95) 100%)' },
  { id: 'azure', label: 'Azure', backgroundColor: '#0b4f8a', backgroundImage: 'linear-gradient(165deg, rgba(11,79,138,.95) 0%, rgba(45,126,196,.95) 100%)' },
  { id: 'sunset', label: 'Sunset', backgroundColor: '#8a3f2f', backgroundImage: 'linear-gradient(170deg, rgba(163,66,43,.95) 0%, rgba(224,123,57,.95) 100%)' },
  { id: 'graphite', label: 'Graphite', backgroundColor: '#3c4751', backgroundImage: 'linear-gradient(170deg, rgba(60,71,81,.95) 0%, rgba(91,106,119,.95) 100%)' },
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
  return { col: Math.round(x / m.cellW), row: Math.round(y / m.cellH) }
}

function clampToGrid(pos: GridPos, m: GridMetrics): GridPos {
  return {
    col: Math.max(0, Math.min(pos.col, m.numCols - 1)),
    row: Math.max(0, Math.min(pos.row, m.numRows - 1)),
  }
}

function findFreeCell(target: GridPos, occupied: Set<string>, m: GridMetrics): GridPos {
  const key = (c: number, r: number) => `${c},${r}`
  const clamped = clampToGrid(target, m)
  if (!occupied.has(key(clamped.col, clamped.row))) return clamped
  for (let radius = 1; radius <= 10; radius++) {
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

function getGridCapacity(m: GridMetrics): number {
  return m.numCols * m.numRows
}

function computeDefaultPosition(index: number, m: GridMetrics): GridPos {
  return {
    col: Math.floor(index / m.numRows),
    row: index % m.numRows,
  }
}

function assertGridCapacity(requiredCount: number, m: GridMetrics) {
  const capacity = getGridCapacity(m)
  if (requiredCount > capacity) {
    throw new Error(`L'ecran n'est pas assez grand pour afficher toutes les applications existantes (${requiredCount}/${capacity}).`)
  }
}

function computeDynamicSeedPositions(ids: string[], m: GridMetrics, existing: Record<string, GridPos> = {}): Record<string, GridPos> {
  assertGridCapacity(ids.length, m)

  const res: Record<string, GridPos> = {}
  const occupied = new Set<string>()
  const key = (c: number, r: number) => `${c},${r}`

  Object.entries(existing).forEach(([k, p]) => {
    const clamped = clampToGrid(p, m)
    occupied.add(key(clamped.col, clamped.row))
    res[k] = clamped
  })

  let scanIndex = 0
  for (const id of ids) {
    if (res[id]) { scanIndex++; continue }

    const preferred = clampToGrid(computeDefaultPosition(scanIndex, m), m)
    const free = findFreeCell(preferred, occupied, m)
    res[id] = free
    occupied.add(key(free.col, free.row))

    scanIndex++
  }

  return res
}

function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) }
}

function rectsIntersect(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function getIconImage(node: FsNode): string | null {
  if (node.shortcut) {
    const appId = node.shortcut.app
    const iconMap: Record<string, string> = {
      notepad: ICON_MAP.notepad,
      explorer: ICON_MAP.folder,
      terminal: ICON_MAP.cmd,
      paint: ICON_MAP.paint,
      'media-player': ICON_MAP['media-player'],
      mail: ICON_MAP.mail,
      minesweeper: ICON_MAP.minesweeper,
      'project-viewer': ICON_MAP.project,
      about: ICON_MAP.info,
    }
    return iconMap[appId] ?? null
  }
  if (node.kind === 'folder') return ICON_MAP.folder
  if (node.mimeType === 'text/plain' || node.name.endsWith('.txt')) return ICON_MAP.notepad
  return ICON_MAP.folder
}

function getIconLabel(node: FsNode): string {
  const name = node.name
  if (name.endsWith('.lnk')) return name.slice(0, -4)
  return name
}

export function Desktop() {
  const { openWindow, openFile } = useWindowStore()
  const { play } = useSound()
  const fsStore = useFsStore()
  const [desktopTheme] = useLocalStorage<DesktopThemeId>('win95-desktop-theme-v1', 'emerald')
  const [iconPositions, setIconPositions] = useLocalStorage<Record<string, GridPos>>('win95-icon-positions-v2', {})
  const [metrics, setMetrics] = useState<GridMetrics>(computeMetrics)
  const metricsRef = useRef(metrics)

  const bureauIcons: FsNode[] = useMemo(() => {
    return fsStore.getChildren(BUREAU_ID)
  }, [fsStore, fsStore.nodes])

  const bureauIconsRef = useRef(bureauIcons)
  useEffect(() => { bureauIconsRef.current = bureauIcons }, [bureauIcons])

  const iconPositionsRef = useRef(iconPositions)
  useEffect(() => { iconPositionsRef.current = iconPositions }, [iconPositions])

  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set())
  const selectedIconsRef = useRef(selectedIcons)
  useEffect(() => { selectedIconsRef.current = selectedIcons }, [selectedIcons])

  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)
  const [draggingGroupPixels, setDraggingGroupPixels] = useState<Record<string, { x: number; y: number }> | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)
  const [gridError, setGridError] = useState<string | null>(null)
  const [draggingPixel, setDraggingPixel] = useState<{ id: string; x: number; y: number } | null>(null)
  const lastClick = useRef<{ id: string; time: number } | null>(null)
  const dragStart = useRef<{ mx: number; my: number; ix: number; iy: number; iconId: string; pointerId: number } | null>(null)
  const groupDragStart = useRef<{ mx: number; my: number; pixels: Record<string, { x: number; y: number }>; pointerId: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => { metricsRef.current = metrics }, [metrics])

  useEffect(() => {
    play('startup')
  }, [play])

  useEffect(() => {
    const handleResize = () => {
      const m = computeMetrics()
      setMetrics(m)
      metricsRef.current = m
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const [seededPositions, setSeededPositions] = useState<Record<string, GridPos>>({})
  const seededPositionsRef = useRef(seededPositions)
  useEffect(() => { seededPositionsRef.current = seededPositions }, [seededPositions])

  useEffect(() => {
    const ids = bureauIcons.map((b) => b.id)
    const m = metricsRef.current
    try {
      const computed = computeDynamicSeedPositions(ids, m, iconPositions ?? {})
      setSeededPositions(computed)
      setGridError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "L'ecran n'est pas assez grand pour afficher toutes les applications existantes."
      setGridError(message)
      setSeededPositions({})
    }
  }, [bureauIcons, metrics, iconPositions])

  const getGridPos = (id: string): GridPos => {
    const stored = iconPositions[id]
    if (stored && typeof stored.col === 'number') return stored
    if (seededPositions[id]) return seededPositions[id]
    return { col: 0, row: 0 }
  }

  const handleIconPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, icon: FsNode) => {
      e.preventDefault()
      e.stopPropagation()

      const isCtrl = e.ctrlKey || e.metaKey
      const currentSelected = selectedIconsRef.current
      const isAlreadySelected = currentSelected.has(icon.id)

      if (isCtrl) {
        setSelectedIcons(prev => {
          const next = new Set(prev)
          if (next.has(icon.id)) next.delete(icon.id)
          else next.add(icon.id)
          return next
        })
        return
      }

      if (!isAlreadySelected) {
        setSelectedIcons(new Set([icon.id]))
      }

      const isGroupDrag = isAlreadySelected && currentSelected.size > 1

      const sourceEl = e.currentTarget
      try { sourceEl.setPointerCapture(e.pointerId) } catch { /* no-op */ }

      const m = metricsRef.current

      if (isGroupDrag) {
        const pixels: Record<string, { x: number; y: number }> = {}
        currentSelected.forEach(id => {
          const storedPos = iconPositionsRef.current[id]
          const gridPos = (storedPos && typeof storedPos.col === 'number')
            ? storedPos
            : (seededPositionsRef.current[id] ?? { col: 0, row: 0 })
          pixels[id] = gridToPixel(gridPos.col, gridPos.row, m)
        })

        groupDragStart.current = { mx: e.clientX, my: e.clientY, pixels, pointerId: e.pointerId }

        const cleanupGroupListeners = () => {
          window.removeEventListener('pointermove', onGroupMove)
          window.removeEventListener('pointerup', onGroupUp)
          window.removeEventListener('pointercancel', onGroupCancel)
          window.removeEventListener('blur', onGroupBlur)
          if (sourceEl.hasPointerCapture(e.pointerId)) {
            try { sourceEl.releasePointerCapture(e.pointerId) } catch { /* no-op */ }
          }
        }

        const finalizeGroupDrag = (clientX: number, clientY: number) => {
          if (!groupDragStart.current) { cleanupGroupListeners(); setDraggingGroupPixels(null); return }
          const dx = clientX - groupDragStart.current.mx
          const dy = clientY - groupDragStart.current.my
          const didDrag = Math.abs(dx) >= 4 || Math.abs(dy) >= 4

          if (didDrag) {
            const currentMetrics = metricsRef.current
            const startPixels = groupDragStart.current.pixels
            const groupIds = Object.keys(startPixels)

            setIconPositions((prev) => {
              const occupied = new Set<string>()
              bureauIconsRef.current.forEach((ic) => {
                if (groupIds.includes(ic.id)) return
                const pos = prev[ic.id] && typeof prev[ic.id].col === 'number' ? prev[ic.id] : seededPositionsRef.current[ic.id] ?? { col: 0, row: 0 }
                occupied.add(`${pos.col},${pos.row}`)
              })

              const next = { ...prev }
              const groupAssigned = new Set<string>()

              groupIds.forEach(id => {
                const rawX = Math.max(0, startPixels[id].x + dx)
                const rawY = Math.max(0, startPixels[id].y + dy)
                const target = clampToGrid(pixelToGrid(rawX, rawY, currentMetrics), currentMetrics)
                const key = `${target.col},${target.row}`
                if (!occupied.has(key) && !groupAssigned.has(key)) {
                  next[id] = target
                  groupAssigned.add(key)
                } else {
                  const orig = prev[id] && typeof prev[id].col === 'number' ? prev[id] : seededPositionsRef.current[id] ?? { col: 0, row: 0 }
                  next[id] = orig
                  groupAssigned.add(`${orig.col},${orig.row}`)
                }
              })

              return next
            })
          } else {
            // Click without drag on a selected icon: reduce selection to this icon
            setSelectedIcons(new Set([icon.id]))
          }

          groupDragStart.current = null
          setDraggingGroupPixels(null)
          cleanupGroupListeners()
        }

        const onGroupMove = (me: PointerEvent) => {
          if (!groupDragStart.current || me.pointerId !== groupDragStart.current.pointerId) return
          lastPointer.current = { x: me.clientX, y: me.clientY }
          const dx = me.clientX - groupDragStart.current.mx
          const dy = me.clientY - groupDragStart.current.my
          if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
          const newPixels: Record<string, { x: number; y: number }> = {}
          Object.entries(groupDragStart.current.pixels).forEach(([id, p]) => {
            newPixels[id] = { x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) }
          })
          setDraggingGroupPixels(newPixels)
        }

        const onGroupUp = (me: PointerEvent) => {
          if (!groupDragStart.current || me.pointerId !== groupDragStart.current.pointerId) return
          finalizeGroupDrag(me.clientX, me.clientY)
        }

        const onGroupCancel = (me: PointerEvent) => {
          if (!groupDragStart.current || me.pointerId !== groupDragStart.current.pointerId) return
          finalizeGroupDrag(me.clientX, me.clientY)
        }

        const onGroupBlur = () => {
          const fallback = lastPointer.current ?? { x: e.clientX, y: e.clientY }
          finalizeGroupDrag(fallback.x, fallback.y)
        }

        window.addEventListener('pointermove', onGroupMove)
        window.addEventListener('pointerup', onGroupUp)
        window.addEventListener('pointercancel', onGroupCancel)
        window.addEventListener('blur', onGroupBlur)

      } else {
        // Solo drag
        const storedPos = iconPositions[icon.id]
        const gridPos = (storedPos && typeof storedPos.col === 'number')
          ? storedPos
          : (seededPositionsRef.current[icon.id] ?? { col: 0, row: 0 })
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
          if (!dragStart.current) { cleanupDragListeners(); setDraggingPixel(null); return }
          const dx = clientX - dragStart.current.mx
          const dy = clientY - dragStart.current.my
          const didDrag = Math.abs(dx) >= 4 || Math.abs(dy) >= 4
          if (didDrag) {
            const rawX = Math.max(0, dragStart.current.ix + dx)
            const rawY = Math.max(0, dragStart.current.iy + dy)
            const currentMetrics = metricsRef.current
            const targetCell = clampToGrid(pixelToGrid(rawX, rawY, currentMetrics), currentMetrics)
            const originalCell = clampToGrid(pixelToGrid(dragStart.current.ix, dragStart.current.iy, currentMetrics), currentMetrics)
            setIconPositions((prev) => {
              const occupied = new Set<string>()
              bureauIconsRef.current.forEach((ic) => {
                if (ic.id === icon.id) return
                const pos = prev[ic.id] && typeof prev[ic.id].col === 'number' ? prev[ic.id] : seededPositionsRef.current[ic.id] ?? { col: 0, row: 0 }
                occupied.add(`${pos.col},${pos.row}`)
              })
              const dest = occupied.has(`${targetCell.col},${targetCell.row}`) ? originalCell : targetCell
              return { ...prev, [icon.id]: dest }
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
          setDraggingPixel({ id: icon.id, x: Math.max(0, dragStart.current.ix + dx), y: Math.max(0, dragStart.current.iy + dy) })
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
      }
    },
    [iconPositions, setIconPositions]
  )

  const handleIconClick = useCallback(
    (e: React.MouseEvent, icon: FsNode) => {
      e.stopPropagation()
      if (e.ctrlKey || e.metaKey) return
      const now = Date.now()
      const last = lastClick.current
      if (last && last.id === icon.id && now - last.time < 500) {
        play('open')
        openFile(icon.id)
        lastClick.current = null
      } else {
        lastClick.current = { id: icon.id, time: now }
      }
    },
    [openFile, play]
  )

  const handleIconContextMenu = useCallback((e: React.MouseEvent, icon: FsNode) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedIconsRef.current.has(icon.id)) {
      setSelectedIcons(new Set([icon.id]))
    }
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: icon.id })
  }, [])

  const handleDesktopPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return

    const startX = e.clientX
    const startY = e.clientY
    let didDrag = false

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      if (!didDrag && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      didDrag = true

      setSelectionRect({ startX, startY, currentX: me.clientX, currentY: me.clientY })

      const rect = normalizeRect(startX, startY, me.clientX, me.clientY)
      const m = metricsRef.current
      const selected = new Set<string>()
      bureauIconsRef.current.forEach(icon => {
        const storedPos = iconPositionsRef.current[icon.id]
        const gridPos = (storedPos && typeof storedPos.col === 'number')
          ? storedPos
          : (seededPositionsRef.current[icon.id] ?? { col: 0, row: 0 })
        const pixel = gridToPixel(gridPos.col, gridPos.row, m)
        if (rectsIntersect(pixel.x, pixel.y, m.cellW, m.cellH, rect.x, rect.y, rect.w, rect.h)) {
          selected.add(icon.id)
        }
      })
      setSelectedIcons(selected)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setSelectionRect(null)
      if (!didDrag) {
        setSelectedIcons(new Set())
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const selectedTheme = DESKTOP_THEMES.find((t) => t.id === desktopTheme) ?? DESKTOP_THEMES[0]

  const buildIconContextItems = (nodeId: string): ContextMenuItem[] => {
    const node = fsStore.nodes[nodeId]
    if (!node) return []

    const isMultiSelection = selectedIcons.size > 1 && selectedIcons.has(nodeId)

    if (isMultiSelection) {
      return [
        {
          label: `Supprimer la sélection (${selectedIcons.size} éléments)`,
          onClick: () => {
            const toDelete = new Set(selectedIcons)
            toDelete.forEach(id => fsStore.remove(id))
            setSelectedIcons(new Set())
          },
        },
      ]
    }

    return [
      { label: 'Ouvrir', onClick: () => { play('open'); openFile(nodeId) } },
      { separator: true },
      {
        label: 'Renommer',
        onClick: () => {
          const newName = prompt('Nouveau nom :', node.name)
          if (newName && newName !== node.name) fsStore.rename(nodeId, newName)
        },
      },
      {
        label: 'Supprimer',
        onClick: () => fsStore.remove(nodeId),
      },
    ]
  }

  const buildDesktopContextItems = (): ContextMenuItem[] => [
    { label: 'Actualiser', onClick: () => { document.body.style.opacity = '0.9'; setTimeout(() => { document.body.style.opacity = '1' }, 150) } },
    { separator: true },
    {
      label: 'Fonds d\'écran',
      onClick: () => {},
      disabled: true,
    },
    { separator: true },
    {
      label: 'Nouveau > Dossier',
      onClick: () => {
        const m = metricsRef.current
        const nextCount = bureauIconsRef.current.length + 1
        try {
          assertGridCapacity(nextCount, m)
        } catch (error) {
          const message = error instanceof Error ? error.message : "L'ecran n'est pas assez grand pour afficher toutes les applications existantes."
          setGridError(message)
          return
        }

        const id = fsStore.create(BUREAU_ID, { name: 'Nouveau dossier', kind: 'folder', sizeBytes: 0 })
        const existing = { ...(iconPositions ?? {}), ...(seededPositions ?? {}) }
        const ids = [...bureauIconsRef.current.map((b) => b.id), id]
        const computed = computeDynamicSeedPositions(ids, m, existing)
        setIconPositions((prev) => ({ ...prev, [id]: computed[id] }))
      },
    },
    {
      label: 'Nouveau > Document texte',
      onClick: () => {
        const m = metricsRef.current
        const nextCount = bureauIconsRef.current.length + 1
        try {
          assertGridCapacity(nextCount, m)
        } catch (error) {
          const message = error instanceof Error ? error.message : "L'ecran n'est pas assez grand pour afficher toutes les applications existantes."
          setGridError(message)
          return
        }

        const id = fsStore.create(BUREAU_ID, { name: 'Nouveau document.txt', kind: 'file', content: '', mimeType: 'text/plain', sizeBytes: 0 })
        const existing = { ...(iconPositions ?? {}), ...(seededPositions ?? {}) }
        const ids = [...bureauIconsRef.current.map((b) => b.id), id]
        const computed = computeDynamicSeedPositions(ids, m, existing)
        setIconPositions((prev) => ({ ...prev, [id]: computed[id] }))
      },
    },
    { separator: true },
    {
      label: 'Propriétés',
      onClick: () => openWindow('about'),
    },
  ]

  return (
    <div
      className={styles.desktop}
      style={{ backgroundColor: selectedTheme.backgroundColor, backgroundImage: selectedTheme.backgroundImage }}
      onPointerDown={handleDesktopPointerDown}
      onContextMenu={handleDesktopContextMenu}
    >
      <div
        className={styles.iconsGrid}
        style={{ '--cell-w': `${metrics.cellW}px`, '--cell-h': `${metrics.cellH}px` } as React.CSSProperties}
      >
        {!gridError && bureauIcons.map((icon) => {
          const isSoloDragging = draggingPixel?.id === icon.id
          const groupPixel = draggingGroupPixels?.[icon.id]
          const isDragging = isSoloDragging || groupPixel !== undefined
          const iconImage = getIconImage(icon)
          const label = getIconLabel(icon)
          let left: number
          let top: number

          if (isSoloDragging && draggingPixel) {
            left = draggingPixel.x
            top = draggingPixel.y
          } else if (groupPixel) {
            left = groupPixel.x
            top = groupPixel.y
          } else {
            const pos = getGridPos(icon.id)
            const pixel = gridToPixel(pos.col, pos.row, metrics)
            left = pixel.x
            top = pixel.y
          }

          return (
            <div
              key={icon.id}
              className={`${styles.icon} ${selectedIcons.has(icon.id) ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
              style={{ left, top, width: metrics.cellW, height: metrics.cellH }}
              onPointerDown={(e) => handleIconPointerDown(e, icon)}
              onClick={(e) => handleIconClick(e, icon)}
              onContextMenu={(e) => handleIconContextMenu(e, icon)}
              onDragStart={(e) => e.preventDefault()}
              title={`Double-cliquer pour ouvrir ${label}`}
            >
              <img src={iconImage ?? ICON_MAP.folder} alt={label} className={styles.iconImage} draggable={false} />
              <span className={styles.iconLabel}>{label}</span>
            </div>
          )
        })}

        {selectionRect && (() => {
          const r = normalizeRect(selectionRect.startX, selectionRect.startY, selectionRect.currentX, selectionRect.currentY)
          return <div className={styles.selectionRect} style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />
        })()}
      </div>

      {gridError && (
        <div
          className={styles.tooSmallOverlay}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setGridError(null)}
        >
          <div className={styles.tooSmallDialog} onClick={(e) => e.stopPropagation()} role="alert" aria-live="assertive">
            <div className={styles.tooSmallTitleBar}>Espace insuffisant</div>
            <div className={styles.tooSmallBody}>
              <img src={ICON_MAP['dialog-warning']} alt="Avertissement" className={styles.tooSmallIcon} />
              <p>{gridError}</p>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.nodeId ? buildIconContextItems(contextMenu.nodeId) : buildDesktopContextItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
