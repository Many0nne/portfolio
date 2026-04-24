import { useEffect } from 'react'
import { useWindowStore } from '../store/windowStore'

export function useKeyboardShortcuts(onToggleStart: () => void) {
  const { windows, minimizeWindow, closeWindow, focusWindow, activeWindowId } = useWindowStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && e.ctrlKey) {
        e.preventDefault()
        onToggleStart()
        return
      }

      if (e.key === 'e' && e.ctrlKey && e.altKey) {
        e.preventDefault()
        useWindowStore.getState().openWindow('explorer')
        return
      }

      if (e.key === 'd' && e.ctrlKey && e.altKey) {
        e.preventDefault()
        windows.forEach((w) => { if (w.state !== 'minimized') minimizeWindow(w.id) })
        return
      }

      if (e.key === 'r' && e.ctrlKey && e.altKey) {
        e.preventDefault()
        useWindowStore.getState().openWindow('run')
        return
      }

      if (e.key === 'F4' && e.altKey) {
        e.preventDefault()
        if (activeWindowId) closeWindow(activeWindowId)
        return
      }

      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault()
        const visible = windows.filter((w) => w.state !== 'minimized')
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
