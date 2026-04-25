import { lazy } from 'react'
import type { AppId, AppDefinition } from '../types'

const NotepadApp = lazy(() => import('../components/apps/NotepadApp').then((m) => ({ default: m.NotepadApp })))
const ProjectViewer = lazy(() => import('../components/apps/ProjectViewer').then((m) => ({ default: m.ProjectViewer })))
const TerminalApp = lazy(() => import('../components/apps/TerminalApp').then((m) => ({ default: m.TerminalApp })))
const AboutDialog = lazy(() => import('../components/apps/AboutDialog').then((m) => ({ default: m.AboutDialog })))
const FileExplorer = lazy(() => import('../components/FileExplorer/FileExplorer').then((m) => ({ default: m.FileExplorer })))
const Minesweeper = lazy(() => import('../components/apps/Minesweeper').then((m) => ({ default: m.Minesweeper })))
const MailApp = lazy(() => import('../components/apps/MailApp').then((m) => ({ default: m.MailApp })))
const PaintApp = lazy(() => import('../components/apps/PaintApp').then((m) => ({ default: m.PaintApp })))
const MediaPlayer = lazy(() => import('../components/apps/MediaPlayer').then((m) => ({ default: m.MediaPlayer })))
const RunDialog = lazy(() => import('../components/apps/RunDialog').then((m) => ({ default: m.RunDialog })))

export const APPS: Record<AppId, AppDefinition> = {
  notepad: {
    id: 'notepad',
    name: 'Notepad',
    iconKey: 'notepad',
    component: NotepadApp,
    defaultSize: { width: 500, height: 400 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    multiInstance: true,
  },
  explorer: {
    id: 'explorer',
    name: 'Explorateur',
    iconKey: 'folder',
    component: FileExplorer,
    defaultSize: { width: 680, height: 460 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    multiInstance: true,
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    iconKey: 'cmd',
    component: TerminalApp,
    defaultSize: { width: 580, height: 400 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    multiInstance: false,
  },
  paint: {
    id: 'paint',
    name: 'Paint',
    iconKey: 'paint',
    component: PaintApp,
    defaultSize: { width: 800, height: 580 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    multiInstance: true,
  },
  'media-player': {
    id: 'media-player',
    name: 'Lecteur Multimédia',
    iconKey: 'media-player',
    component: MediaPlayer,
    defaultSize: { width: 275, height: 230 },
    resizable: false,
    minimizable: true,
    maximizable: false,
    multiInstance: false,
  },
  mail: {
    id: 'mail',
    name: 'Boîte de réception - MailBox',
    iconKey: 'mail',
    component: MailApp,
    defaultSize: { width: 660, height: 480 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    multiInstance: false,
  },
  minesweeper: {
    id: 'minesweeper',
    name: 'Démineur',
    iconKey: 'minesweeper',
    component: Minesweeper,
    defaultSize: { width: 262, height: 340 },
    resizable: false,
    minimizable: true,
    maximizable: false,
    multiInstance: false,
  },
  'project-viewer': {
    id: 'project-viewer',
    name: 'Projet',
    iconKey: 'project',
    component: ProjectViewer,
    defaultSize: { width: 560, height: 520 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    multiInstance: true,
  },
  about: {
    id: 'about',
    name: 'À propos de Windows 95',
    iconKey: 'info',
    component: AboutDialog,
    defaultSize: { width: 380, height: 280 },
    resizable: false,
    minimizable: false,
    maximizable: false,
    multiInstance: false,
    isDialog: true,
  },
  run: {
    id: 'run',
    name: 'Exécuter',
    iconKey: 'cmd',
    component: RunDialog,
    defaultSize: { width: 320, height: 165 },
    resizable: false,
    minimizable: false,
    maximizable: false,
    multiInstance: false,
    isDialog: true,
  },
}
