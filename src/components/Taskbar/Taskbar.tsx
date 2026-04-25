import { useState, useEffect, useCallback } from 'react'
import styles from './Taskbar.module.css'
import { TaskbarClock } from './TaskbarClock'
import { StartMenu } from './StartMenu'
import { useWindowStore } from '../../store/windowStore'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { AppIcon } from '../shared/AppIcon'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import type { WindowState } from '../../types'

export function Taskbar() {
  const [startOpen, setStartOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useLocalStorage('win95-sound', true)
  const { windows, focusWindow, minimizeWindow, restoreWindow, activeWindowId } = useWindowStore()

  const toggleStart = useCallback(() => setStartOpen((v) => !v), [])
  useKeyboardShortcuts(toggleStart)

  const handleTrayClick = useCallback((id: string, state: WindowState, isActive: boolean) => {
    if (state === 'minimized') {
      restoreWindow(id)
    } else if (!isActive) {
      focusWindow(id)
    } else {
      minimizeWindow(id)
    }
  }, [focusWindow, minimizeWindow, restoreWindow])

  useEffect(() => {
    if (!startOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-startmenu]') && !target.closest('[data-startbtn]')) setStartOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [startOpen])

  return (
    <>
      {startOpen && (
        <div data-startmenu>
          <StartMenu onClose={() => setStartOpen(false)} />
        </div>
      )}
      <div className={styles.taskbar}>
        <button className={`${styles.startBtn} ${startOpen ? styles.active : ''}`} onClick={toggleStart} data-startbtn>
          <img src="/img/windows_95_logo.png" alt="Windows 95" style={{ width: '20px', height: '20px' }} className={styles.startIcon} />
          Démarrer
        </button>

        <div className={styles.divider} />

        <div className={styles.tray}>
          {windows.map((w) => (
            <div
              key={w.id}
              className={`${styles.trayItem} ${w.id === activeWindowId && w.state !== 'minimized' ? styles.active : ''}`}
              onClick={() => handleTrayClick(w.id, w.state, w.id === activeWindowId)}
              title={w.title}
            >
              {w.iconKey && <AppIcon name={w.iconKey} size={14} />}
              <span className={styles.trayItemLabel}>{w.title}</span>
            </div>
          ))}
        </div>

        <TaskbarClock
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
        />
      </div>
    </>
  )
}
