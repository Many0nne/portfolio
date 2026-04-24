import { create } from 'zustand'
import type { AppId } from '../apps/types'
import { APPS } from '../apps/registry'
import { useFsStore } from '../fs/fsStore'
import { resolveAssociation } from '../fs/associations'

export interface WindowState {
  id: string
  app: AppId
  title: string
  iconKey: string
  fileId?: string
  props: Record<string, unknown>
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  prevBounds?: { position: { x: number; y: number }; size: { width: number; height: number } }
}

interface WindowStore {
  windows: WindowState[]
  activeWindowId: string | null
  zCounter: number
  openApp: (app: AppId, opts?: { fileId?: string; props?: Record<string, unknown> }) => string | null
  openFile: (fileId: string) => string | null
  setTitle: (id: string, title: string) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  updatePosition: (id: string, position: { x: number; y: number }) => void
  updateSize: (id: string, size: { width: number; height: number }) => void
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  zCounter: 10,

  openApp: (app, opts = {}) => {
    const descriptor = APPS[app]
    if (!descriptor) return null
    const { windows } = get()

    if (!descriptor.multiInstance) {
      const existing = windows.find((w) => w.app === app)
      if (existing) {
        if (existing.isMinimized) {
          set((s) => ({
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, isMinimized: false, zIndex: s.zCounter + 1 } : w
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
    const offset = windows.filter((w) => !w.isMinimized).length * 20
    const defaultSize = descriptor.defaultSize
    const id = `${app}-${Date.now()}`

    let title = descriptor.title
    if (opts.fileId) {
      const node = useFsStore.getState().nodes[opts.fileId]
      if (node) title = `${node.name} — ${descriptor.title}`
    }
    if (opts.props?.projectId) {
      title = String(opts.props.projectId)
    }

    const newWindow: WindowState = {
      id,
      app,
      title,
      iconKey: descriptor.iconKey,
      fileId: opts.fileId,
      props: opts.props ?? {},
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
      position: {
        x: Math.min(80 + offset, Math.max(0, window.innerWidth - defaultSize.width - 40)),
        y: Math.min(60 + offset, Math.max(0, window.innerHeight - defaultSize.height - 80)),
      },
      size: defaultSize,
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
    return get().openApp(assoc.app, { fileId: node.kind === 'file' ? fileId : undefined, props: assoc.props ?? {} })
  },

  setTitle: (id, title) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, title } : w)),
    }))
  },

  closeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id)
      const topWindow = remaining.filter((w) => !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0]
      return { windows: remaining, activeWindowId: topWindow?.id ?? null }
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
      const remaining = s.windows.filter((w) => w.id !== id && !w.isMinimized)
      const topWindow = remaining.sort((a, b) => b.zIndex - a.zIndex)[0]
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
        activeWindowId: topWindow?.id ?? null,
      }
    })
  },

  maximizeWindow: (id) => {
    set((s) => {
      const win = s.windows.find((w) => w.id === id)
      if (!win) return s
      if (win.isMaximized) {
        return {
          windows: s.windows.map((w) =>
            w.id === id
              ? { ...w, isMaximized: false, ...(w.prevBounds ?? {}), prevBounds: undefined }
              : w
          ),
        }
      }
      return {
        windows: s.windows.map((w) =>
          w.id === id
            ? { ...w, isMaximized: true, prevBounds: { position: w.position, size: w.size } }
            : w
        ),
      }
    })
  },

  updatePosition: (id, position) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, position } : w)) }))
  },

  updateSize: (id, size) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)) }))
  },
}))
