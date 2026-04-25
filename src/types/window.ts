import type { AppId } from './apps'

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

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
