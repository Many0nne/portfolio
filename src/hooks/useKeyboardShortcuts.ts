import { useEffect } from 'react'
import { useWindowStore } from '../store/windowStore'

export function useKeyboardShortcuts(onToggleStart: () => void) {
  const { windows, minimizeWindow, closeWindow, focusWindow, activeWindowId } = useWindowStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Esc → toggle start menu
      if (e.key === 'Escape' && e.ctrlKey) {
        e.preventDefault()
        onToggleStart()
        return
      }

      // Ctrl+Alt+E → Explorer
      if (e.key === 'e' && e.ctrlKey && e.altKey) {
        e.preventDefault()
        useWindowStore.getState().openApp('explorer')
        return
      }

      // Ctrl+Alt+D → Show desktop (minimize all)
      if (e.key === 'd' && e.ctrlKey && e.altKey) {
        e.preventDefault()
        windows.forEach((w) => { if (!w.isMinimized) minimizeWindow(w.id) })
        return
      }

      // Ctrl+Alt+R → Run dialog
      if (e.key === 'r' && e.ctrlKey && e.altKey) {
        e.preventDefault()
        useWindowStore.getState().openApp('run')
        return
      }

      // Alt+F4 → close active
      if (e.key === 'F4' && e.altKey) {
        e.preventDefault()
        if (activeWindowId) closeWindow(activeWindowId)
        return
      }

      // Alt+Tab → cycle windows
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault()
        const visible = windows.filter((w) => !w.isMinimized)
        if (visible.length < 2) return
        const idx = visible.findIndex((w) => w.id === activeWindowId)
        const next = visible[(idx + 1) % visible.length]
        focusWindow(next.id)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [windows, activeWindowId, onToggleStart, minimizeWindow, closeWindow, focusWindow])
}
