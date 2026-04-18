import { create } from 'zustand'
import type { AppType } from '../data/filesystem'

export interface WindowState {
  id: string
  app: AppType
  title: string
  icon?: string
  props?: Record<string, unknown>
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
}

const DEFAULT_SIZES: Record<AppType, { width: number; height: number }> = {
  projects: { width: 640, height: 480 },
  'project-viewer': { width: 560, height: 520 },
  'file-explorer': { width: 680, height: 460 },
  skills: { width: 500, height: 420 },
  resume: { width: 560, height: 500 },
  contact: { width: 520, height: 380 },
  about: { width: 380, height: 240 },
  minesweeper: { width: 262, height: 340 },
  movies: { width: 480, height: 380 },
  mail: { width: 660, height: 480 },
  paint: { width: 800, height: 580 },
}

const APP_TITLES: Record<AppType, string> = {
  projects: 'Mes Projets',
  'project-viewer': 'Projet',
  'file-explorer': 'Explorateur',
  skills: 'Compétences',
  resume: 'CV — Notepad',
  contact: 'Terminal',
  about: 'À propos',
  minesweeper: 'Démineur',
  movies: 'Films favoris',
  mail: 'Boîte de réception - MailBox',
  paint: 'Paint',
}

const APP_ICONS: Record<AppType, string> = {
  projects: 'folder',
  'project-viewer': 'project',
  'file-explorer': 'folder',
  skills: 'control',
  resume: 'notepad',
  contact: 'cmd',
  about: 'info',
  minesweeper: 'minesweeper',
  movies: 'notepad',
  mail: 'mail',
  paint: 'paint',
}

let zCounter = 10

interface WindowStore {
  windows: WindowState[]
  activeWindowId: string | null
  openWindow: (app: AppType, props?: Record<string, unknown>) => void
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

  openWindow: (app, props) => {
    const { windows } = get()

    // Check if already open (except project-viewer which can open multiple)
    if (app !== 'project-viewer') {
      const existing = windows.find((w) => w.app === app && !w.isMinimized)
      if (existing) {
        get().focusWindow(existing.id)
        return
      }
      // Un-minimize if minimized
      const minimized = windows.find((w) => w.app === app && w.isMinimized)
      if (minimized) {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === minimized.id ? { ...w, isMinimized: false, zIndex: ++zCounter } : w
          ),
          activeWindowId: minimized.id,
        }))
        return
      }
    }

    if (windows.length >= 8) return

    const offset = windows.filter((w) => !w.isMinimized).length * 20
    const defaultSize = DEFAULT_SIZES[app]
    const id = `${app}-${Date.now()}`
    const title =
      app === 'project-viewer' && props?.projectId
        ? String(props.projectId)
        : APP_TITLES[app]

    const newWindow: WindowState = {
      id,
      app,
      title,
      icon: APP_ICONS[app],
      props,
      isMinimized: false,
      isMaximized: false,
      zIndex: ++zCounter,
      position: {
        x: Math.min(80 + offset, window.innerWidth - defaultSize.width - 40),
        y: Math.min(60 + offset, window.innerHeight - defaultSize.height - 80),
      },
      size: defaultSize,
    }

    set((s) => ({
      windows: [...s.windows, newWindow],
      activeWindowId: id,
    }))
  },

  closeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id)
      const topWindow = remaining
        .filter((w) => !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0]
      return {
        windows: remaining,
        activeWindowId: topWindow?.id ?? null,
      }
    })
  },

  focusWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, zIndex: ++zCounter } : w
      ),
      activeWindowId: id,
    }))
  },

  minimizeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id && !w.isMinimized)
      const topWindow = remaining.sort((a, b) => b.zIndex - a.zIndex)[0]
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, isMinimized: true } : w
        ),
        activeWindowId: topWindow?.id ?? null,
      }
    })
  },

  maximizeWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    }))
  },

  updatePosition: (id, position) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position } : w)),
    }))
  },

  updateSize: (id, size) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    }))
  },
}))
