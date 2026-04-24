import type { AppId } from './types'

export interface AppDescriptor {
  id: AppId
  title: string
  iconKey: string
  defaultSize: { width: number; height: number }
  multiInstance: boolean
  isDialog?: boolean
}

export const APPS: Record<AppId, AppDescriptor> = {
  notepad: {
    id: 'notepad',
    title: 'Notepad',
    iconKey: 'notepad',
    defaultSize: { width: 500, height: 400 },
    multiInstance: true,
  },
  explorer: {
    id: 'explorer',
    title: 'Explorateur',
    iconKey: 'folder',
    defaultSize: { width: 680, height: 460 },
    multiInstance: true,
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    iconKey: 'cmd',
    defaultSize: { width: 580, height: 400 },
    multiInstance: false,
  },
  paint: {
    id: 'paint',
    title: 'Paint',
    iconKey: 'paint',
    defaultSize: { width: 800, height: 580 },
    multiInstance: true,
  },
  'media-player': {
    id: 'media-player',
    title: 'Lecteur Multimédia',
    iconKey: 'media-player',
    defaultSize: { width: 275, height: 230 },
    multiInstance: false,
  },
  mail: {
    id: 'mail',
    title: 'Boîte de réception - MailBox',
    iconKey: 'mail',
    defaultSize: { width: 660, height: 480 },
    multiInstance: false,
  },
  minesweeper: {
    id: 'minesweeper',
    title: 'Démineur',
    iconKey: 'minesweeper',
    defaultSize: { width: 262, height: 340 },
    multiInstance: false,
  },
  'project-viewer': {
    id: 'project-viewer',
    title: 'Projet',
    iconKey: 'project',
    defaultSize: { width: 560, height: 520 },
    multiInstance: true,
  },
  casino: {
    id: 'casino',
    title: 'Casino',
    iconKey: 'casino',
    defaultSize: { width: 480, height: 400 },
    multiInstance: false,
  },
  bank: {
    id: 'bank',
    title: 'First National Bank of Win95',
    iconKey: 'bank',
    defaultSize: { width: 420, height: 360 },
    multiInstance: false,
  },
  about: {
    id: 'about',
    title: 'À propos de Windows 95',
    iconKey: 'info',
    defaultSize: { width: 380, height: 260 },
    multiInstance: false,
    isDialog: true,
  },
  run: {
    id: 'run',
    title: 'Exécuter',
    iconKey: 'cmd',
    defaultSize: { width: 320, height: 140 },
    multiInstance: false,
    isDialog: true,
  },
}
