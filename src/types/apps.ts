import type { ComponentType } from 'react'

export type AppId =
  | 'notepad'
  | 'explorer'
  | 'terminal'
  | 'paint'
  | 'media-player'
  | 'mail'
  | 'minesweeper'
  | 'project-viewer'
  | 'about'
  | 'run'

export type AppDefinition = {
  id: AppId
  name: string
  iconKey: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  defaultSize: { width: number; height: number }
  resizable: boolean
  minimizable: boolean
  maximizable: boolean
  multiInstance: boolean
  isDialog?: boolean
  initialState?: unknown
}
