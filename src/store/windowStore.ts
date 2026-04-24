import { create } from 'zustand'
import type { AppId } from '../apps/types'
import { APPS } from '../apps/registry'
import { useFsStore } from '../fs/fsStore'
import { resolveAssociation } from '../fs/associations'

export type WindowState = 'normal' | 'minimized' | 'maximized'
export type SystemState = 'booting' | 'desktop' | 'shuttingDown'

export interface WindowInstance {
  id: string
  appId: AppId
  title: string
  iconKey: string
  props: Record<string, unknown>
  state: WindowState
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  resizable: boolean
  minimizable: boolean
  maximizable: boolean
  prevBounds?: { position: { x: number; y: number }; size: { width: number; height: number } }
}

interface Store {
  windows: WindowInstance[]
  activeWindowId: string | null
  zCounter: number
  systemState: SystemState

  openWindow: (appId: AppId, opts?: { fileId?: string; props?: Record<string, unknown> }) => string | null
  openFile: (fileId: string) => string | null
  setTitle: (id: string, title: string) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  moveWindow: (id: string, position: { x: number; y: number }) => void
  resizeWindow: (id: string, size: { width: number; height: number }) => void

  boot: () => void
  shutdown: () => void
  restart: () => void
}

export const useWindowStore = create<Store>((set, get) => ({
  windows: [],
  activeWindowId: null,
  zCounter: 10,
  systemState: 'booting',

  openWindow: (appId, opts = {}) => {
    const def = APPS[appId]
    if (!def) return null
    const { windows } = get()

    if (!def.multiInstance) {
      const existing = windows.find((w) => w.appId === appId)
      if (existing) {
        if (existing.state === 'minimized') {
          set((s) => ({
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, state: 'normal' as WindowState, zIndex: s.zCounter + 1 } : w
            ),
            activeWindowId: existing.id,
            zCounter: s.zCounter + 1,
          }))
        } else {
          get().focusWindow(existing.id)
        }
        return existing.id
      }
    }

    const { zCounter } = get()
    const newZ = zCounter + 1
    const offset = windows.filter((w) => w.state !== 'minimized').length * 20
    const id = `${appId}-${Date.now()}`

    const allProps: Record<string, unknown> = {
      ...(opts.props ?? {}),
      ...(opts.fileId ? { fileId: opts.fileId } : {}),
    }

    let title = def.name
    if (opts.fileId) {
      const node = useFsStore.getState().nodes[opts.fileId]
      if (node) title = `${node.name} — ${def.name}`
    }
    if (allProps.projectId) {
      title = String(allProps.projectId)
    }

    const newWindow: WindowInstance = {
      id,
      appId,
      title,
      iconKey: def.iconKey,
      props: allProps,
      state: 'normal',
      zIndex: newZ,
      position: {
        x: Math.min(80 + offset, Math.max(0, window.innerWidth - def.defaultSize.width - 40)),
        y: Math.min(60 + offset, Math.max(0, window.innerHeight - def.defaultSize.height - 80)),
      },
      size: def.defaultSize,
      resizable: def.resizable,
      minimizable: def.minimizable,
      maximizable: def.maximizable,
    }

    set((s) => ({
      windows: [...s.windows, newWindow],
      activeWindowId: id,
      zCounter: newZ,
    }))

    return id
  },

  openFile: (fileId) => {
    const node = useFsStore.getState().nodes[fileId]
    if (!node) return null
    const assoc = resolveAssociation(node)
    if (!assoc) return null
    return get().openWindow(assoc.app, {
      fileId: node.kind === 'file' ? fileId : undefined,
      props: assoc.props ?? {},
    })
  },

  setTitle: (id, title) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, title } : w)) }))
  },

  closeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id)
      const top = remaining.filter((w) => w.state !== 'minimized').sort((a, b) => b.zIndex - a.zIndex)[0]
      return { windows: remaining, activeWindowId: top?.id ?? null }
    })
  },

  focusWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: s.zCounter + 1 } : w)),
      activeWindowId: id,
      zCounter: s.zCounter + 1,
    }))
  },

  minimizeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id && w.state !== 'minimized')
      const top = remaining.sort((a, b) => b.zIndex - a.zIndex)[0]
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, state: 'minimized' as WindowState } : w)),
        activeWindowId: top?.id ?? null,
      }
    })
  },

  maximizeWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, state: 'maximized' as WindowState, prevBounds: { position: w.position, size: w.size } }
          : w
      ),
    }))
  },

  restoreWindow: (id) => {
    set((s) => {
      const win = s.windows.find((w) => w.id === id)
      if (!win) return s
      const wasMinimized = win.state === 'minimized'
      const restored = {
        ...win,
        state: 'normal' as WindowState,
        ...(win.prevBounds ?? {}),
        prevBounds: undefined,
        zIndex: wasMinimized ? s.zCounter + 1 : win.zIndex,
      }
      return {
        windows: s.windows.map((w) => (w.id === id ? restored : w)),
        activeWindowId: wasMinimized ? id : s.activeWindowId,
        zCounter: wasMinimized ? s.zCounter + 1 : s.zCounter,
      }
    })
  },

  moveWindow: (id, position) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, position } : w)) }))
  },

  resizeWindow: (id, size) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)) }))
  },

  boot: () => {
    set({ systemState: 'desktop' })
  },

  shutdown: () => {
    set({ windows: [], activeWindowId: null, systemState: 'shuttingDown' })
  },

  restart: () => {
    localStorage.clear()
    set({ windows: [], activeWindowId: null, systemState: 'booting' })
  },
}))
