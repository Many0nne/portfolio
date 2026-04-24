import { useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import styles from './Window.module.css'
import { useWindowStore } from '../../store/windowStore'
import { useSound } from '../../hooks/useSound'
import { AppIcon } from '../shared/AppIcon'

interface WindowProps {
  id: string
  title: string
  iconKey?: string
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  children: ReactNode
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_WIDTH = 200
const MIN_HEIGHT = 120

export function Window({ id, title, iconKey, isMinimized, isMaximized, zIndex, position, size, children }: WindowProps) {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, updatePosition, updateSize, activeWindowId } = useWindowStore()
  const { play } = useSound()
  const dragOffset = useRef<{ x: number; y: number } | null>(null)
  const isActive = activeWindowId === id

  const handleMouseDown = useCallback(() => { focusWindow(id) }, [id, focusWindow])

  const onTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return
    if ((e.target as HTMLElement).closest('button')) return
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }

    const onMove = (me: MouseEvent) => {
      if (!dragOffset.current) return
      updatePosition(id, {
        x: Math.max(0, Math.min(me.clientX - dragOffset.current.x, window.innerWidth - size.width)),
        y: Math.max(0, Math.min(me.clientY - dragOffset.current.y, window.innerHeight - 80)),
      })
    }

    const onUp = () => {
      dragOffset.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [id, isMaximized, position, size, updatePosition])

  const onResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault()
    e.stopPropagation()
    if (isMaximized) return

    const startX = e.clientX
    const startY = e.clientY
    const startPos = { ...position }
    const startSize = { ...size }

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY

      let newX = startPos.x
      let newY = startPos.y
      let newW = startSize.width
      let newH = startSize.height

      if (handle.includes('e')) newW = Math.max(MIN_WIDTH, startSize.width + dx)
      if (handle.includes('s')) newH = Math.max(MIN_HEIGHT, startSize.height + dy)
      if (handle.includes('w')) {
        const delta = Math.min(dx, startSize.width - MIN_WIDTH)
        newX = startPos.x + delta
        newW = startSize.width - delta
      }
      if (handle.includes('n')) {
        const delta = Math.min(dy, startSize.height - MIN_HEIGHT)
        newY = startPos.y + delta
        newH = startSize.height - delta
      }

      updatePosition(id, { x: newX, y: newY })
      updateSize(id, { width: newW, height: newH })
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [id, isMaximized, position, size, updatePosition, updateSize])

  const handleClose = useCallback((e: React.MouseEvent) => { e.stopPropagation(); play('close'); closeWindow(id) }, [id, closeWindow, play])
  const handleMinimize = useCallback((e: React.MouseEvent) => { e.stopPropagation(); minimizeWindow(id) }, [id, minimizeWindow])
  const handleMaximize = useCallback((e: React.MouseEvent) => { e.stopPropagation(); maximizeWindow(id) }, [id, maximizeWindow])

  const style: React.CSSProperties = isMaximized
    ? { zIndex }
    : { left: position.x, top: position.y, width: size.width, height: size.height, zIndex }

  const HANDLE_CLASSES: Record<ResizeHandle, string> = {
    n: styles.resizeN,
    s: styles.resizeS,
    e: styles.resizeE,
    w: styles.resizeW,
    ne: styles.resizeNE,
    nw: styles.resizeNW,
    se: styles.resizeSE,
    sw: styles.resizeSW,
  }

  const handles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

  return (
    <div
      className={`window ${styles.window} ${isMaximized ? styles.maximized : ''} ${isMinimized ? styles.minimized : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-label={title}
    >
      {!isMaximized && handles.map((h) => (
        <div
          key={h}
          className={HANDLE_CLASSES[h]}
          onMouseDown={(e) => onResizeMouseDown(e, h)}
        />
      ))}

      <div
        className={`title-bar ${styles.titleBar} ${!isActive ? `inactive ${styles.inactive}` : ''}`}
        onMouseDown={onTitleBarMouseDown}
        onDoubleClick={handleMaximize}
      >
        {iconKey && <AppIcon name={iconKey} size={16} className={styles.titleIcon} />}
        <span className={`title-bar-text ${styles.titleText}`}>{title}</span>
        <div className={`title-bar-controls ${styles.titleButtons}`}>
          <button className={styles.titleBtn} onClick={handleMinimize} aria-label="Minimize" title="Réduire" />
          <button className={styles.titleBtn} onClick={handleMaximize} aria-label={isMaximized ? 'Restore' : 'Maximize'} title={isMaximized ? 'Restaurer' : 'Agrandir'} />
          <button className={styles.titleBtn} onClick={handleClose} aria-label="Close" title="Fermer" />
        </div>
      </div>

      <div className={`window-body ${styles.content}`}>{children}</div>
    </div>
  )
}
