import { useState, useEffect, useCallback } from 'react'
import styles from './Taskbar.module.css'
import { TaskbarClock } from './TaskbarClock'
import { StartMenu } from './StartMenu'
import { useWindowStore } from '../../store/windowStore'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { AppIcon } from '../shared/AppIcon'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

interface TaskbarProps {
  onShutdown: () => void
}

export function Taskbar({ onShutdown }: TaskbarProps) {
  const [startOpen, setStartOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useLocalStorage('win95-sound', true)
  const { windows, focusWindow, minimizeWindow, activeWindowId } = useWindowStore()

  const toggleStart = useCallback(() => setStartOpen((v) => !v), [])

  useKeyboardShortcuts(toggleStart)

  const handleTrayClick = useCallback(
    (id: string, isMinimized: boolean, isActive: boolean) => {
      if (isMinimized || !isActive) {
        useWindowStore.setState((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: false } : w)),
          activeWindowId: id,
        }))
        focusWindow(id)
      } else {
        minimizeWindow(id)
      }
    },
    [focusWindow, minimizeWindow]
  )

  // Close start menu on outside click
  useEffect(() => {
    if (!startOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-startmenu]') && !target.closest('[data-startbtn]')) {
        setStartOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [startOpen])

  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => !v)
  }, [setSoundEnabled])

  return (
    <>
      {startOpen && (
        <div data-startmenu>
          <StartMenu onClose={() => setStartOpen(false)} onShutdown={onShutdown} />
        </div>
      )}
      <div className={styles.taskbar}>
        <button
          className={`${styles.startBtn} ${startOpen ? styles.active : ''}`}
          onClick={toggleStart}
          data-startbtn
        >
          <img src="/img/windows_95_logo.png" alt="Windows 95" style={{ width: '20px', height: '20px' }} className={styles.startIcon} />
          Démarrer
        </button>

        <div className={styles.divider} />

        <div className={styles.tray}>
          {windows.map((w) => (
            <div
              key={w.id}
              className={`${styles.trayItem} ${w.id === activeWindowId && !w.isMinimized ? styles.active : ''}`}
              onClick={() => handleTrayClick(w.id, w.isMinimized, w.id === activeWindowId)}
              title={w.title}
            >
              {w.icon && <AppIcon name={w.icon} size={14} />}
              <span className={styles.trayItemLabel}>{w.title}</span>
            </div>
          ))}
        </div>

        <TaskbarClock soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      </div>
    </>
  )
}
