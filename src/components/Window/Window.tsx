import { useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import styles from './Window.module.css'
import { useWindowStore } from '../../store/windowStore'
import { useSound } from '../../hooks/useSound'
import { AppIcon } from '../shared/AppIcon'

interface WindowProps {
  id: string
  title: string
  icon?: string
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  children: ReactNode
}

export function Window({
  id,
  title,
  icon,
  isMinimized,
  isMaximized,
  zIndex,
  position,
  size,
  children,
}: WindowProps) {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, updatePosition, activeWindowId } =
    useWindowStore()
  const { play } = useSound()
  const dragOffset = useRef<{ x: number; y: number } | null>(null)
  const isActive = activeWindowId === id

  const handleMouseDown = useCallback(() => {
    focusWindow(id)
  }, [id, focusWindow])

  const onTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return
      if ((e.target as HTMLElement).closest('button')) return
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }

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
    },
    [id, isMaximized, position, size, updatePosition]
  )

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      play('close')
      closeWindow(id)
    },
    [id, closeWindow, play]
  )

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      minimizeWindow(id)
    },
    [id, minimizeWindow]
  )

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      maximizeWindow(id)
    },
    [id, maximizeWindow]
  )

  const style: React.CSSProperties = isMaximized
    ? { zIndex }
    : {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }

  return (
    <div
      className={`window ${styles.window} ${isMaximized ? styles.maximized : ''} ${isMinimized ? styles.minimized : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-label={title}
    >
      {/* Title bar */}
      <div
        className={`title-bar ${styles.titleBar} ${!isActive ? `inactive ${styles.inactive}` : ''}`}
        onMouseDown={onTitleBarMouseDown}
        onDoubleClick={handleMaximize}
      >
        {icon && (
          <AppIcon name={icon} size={16} className={styles.titleIcon} />
        )}
        <span className={`title-bar-text ${styles.titleText}`}>{title}</span>
        <div className={`title-bar-controls ${styles.titleButtons}`}>
          <button className={styles.titleBtn} onClick={handleMinimize} aria-label="Minimize" title="Réduire" />
          <button
            className={styles.titleBtn}
            onClick={handleMaximize}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            title={isMaximized ? 'Restaurer' : 'Agrandir'}
          />
          <button className={styles.titleBtn} onClick={handleClose} aria-label="Close" title="Fermer" />
        </div>
      </div>

      {/* Content */}
      <div className={`window-body ${styles.content}`}>{children}</div>
    </div>
  )
}
