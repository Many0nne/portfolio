export type AppType =
  | 'projects'
  | 'project-viewer'
  | 'file-explorer'
  | 'skills'
  | 'resume'
  | 'notes'
  | 'terminal'
  | 'about'
  | 'minesweeper'
  | 'movies'
  | 'mail'
  | 'paint'
  | 'media-player'
  | 'casino'
  | 'bank'

export interface VirtualFile {
  id: string
  name: string
  type: 'folder' | 'project' | 'document'
  icon: string
  locked?: boolean
  metadata: {
    size: string
    modified: string
    description?: string
  }
  children?: VirtualFile[]
  appType?: AppType
  appProps?: Record<string, unknown>
}

export interface GridPos {
  col: number
  row: number
}

export interface DesktopShortcut {
  id: string
  label: string
  icon: string
  image?: string
  app: AppType
  props?: Record<string, unknown>
  defaultPos: GridPos
  requiresCasinoUnlock?: boolean
}

export const desktopShortcuts: DesktopShortcut[] = [
  { id: 'my-projects', label: 'Mes Projets', icon: 'folder', image: '/img/Windows_95_FOLDER.png', app: 'file-explorer', props: { folderId: 'projects' }, defaultPos: { col: 0, row: 0 } },
  { id: 'skills', label: 'Compétences.txt', icon: 'notepad', image: '/img/FileText_32x32_4.png', app: 'skills', defaultPos: { col: 0, row: 1 } },
  { id: 'resume', label: 'CV.txt', icon: 'notepad', image: '/img/FileText_32x32_4.png', app: 'resume', defaultPos: { col: 0, row: 2 } },
  { id: 'notes', label: 'Notes.txt', icon: 'notepad', image: '/img/FileText_32x32_4.png', app: 'notes', defaultPos: { col: 2, row: 2 } },
  { id: 'about', label: 'À propos', icon: 'info', image: '/img/Awfxex32Info_32x32_4.png', app: 'about', defaultPos: { col: 0, row: 4 } },
  { id: 'minesweeper', label: 'Démineur', icon: 'minesweeper', image: '/img/95minesweeper.ico', app: 'minesweeper', defaultPos: { col: 1, row: 0 } },
  { id: 'secret-folder', label: 'Terry Files', icon: 'folder', image: '/img/Windows_95_FOLDER.png', app: 'file-explorer', props: { folderId: 'TerryFiles' }, defaultPos: { col: 1, row: 1 } },
  { id: 'mail', label: 'Messagerie', icon: 'mail', image: '/img/Mailnews12_32x32_4.png', app: 'mail', defaultPos: { col: 1, row: 2 } },
  { id: 'paint', label: 'Paint', icon: 'paint', image: '/img/Settings_32x32_4.png', app: 'paint', defaultPos: { col: 2, row: 0 } },
  { id: 'media-player', label: 'Lecteur Multimédia', icon: 'media-player', image: '/icon/w98_media_player.ico', app: 'media-player', defaultPos: { col: 2, row: 1 } },
  { id: 'terminal', label: 'Terminal', icon: 'cmd', image: '/img/Shell323_32x32_4.png', app: 'terminal', defaultPos: { col: 3, row: 0 } },
  { id: 'casino', label: 'Casino', icon: '🎰', image: '/img/7.png', app: 'casino', defaultPos: { col: 2, row: 2 }, requiresCasinoUnlock: true },
  { id: 'bank', label: 'Banque', icon: '🏦', image: '/img/icons8-banque-32.png', app: 'bank', defaultPos: { col: 2, row: 3 }, requiresCasinoUnlock: true },
]

export const filesystem: VirtualFile[] = [
  {
    id: 'projects',
    name: 'Projets',
    type: 'folder',
    icon: 'folder',
    metadata: { size: '—', modified: '01/04/2026' },
    children: [
      {
        id: 'ts-mock-api',
        name: 'TS-Mock-API',
        type: 'project',
        icon: 'project',
        metadata: {
          size: '1.2 Ko',
          modified: '1/04/2026',
          description: "Génère une API REST complète à partir d'interfaces TypeScript.",
        },
        appType: 'project-viewer',
        appProps: { projectId: 'ts-mock-api' },
      },
      {
        id: 'graceful-errors',
        name: 'GracefulErrors',
        type: 'project',
        icon: 'project',
        metadata: {
          size: '2.1 Ko',
          modified: '01/04/2026',
          description: "Moteur d'erreurs TypeScript pour des expériences utilisateur cohérentes.",
        },
        appType: 'project-viewer',
        appProps: { projectId: 'graceful-errors' },
      },
    ],
  },
  {
    id: 'competences',
    name: 'Compétences.txt',
    type: 'document',
    icon: 'notepad',
    metadata: { size: '3.4 Ko', modified: '01/04/2026', description: 'Mes compétences techniques' },
    appType: 'skills',
  },
  {
    id: 'cv',
    name: 'CV.txt',
    type: 'document',
    icon: 'notepad',
    metadata: { size: '8.0 Ko', modified: '01/04/2026', description: 'Curriculum vitæ' },
    appType: 'resume',
  },
  {
    id: 'notes',
    name: 'Notes.txt',
    type: 'document',
    icon: 'notepad',
    metadata: { size: '0.2 Ko', modified: '22/04/2026', description: 'Codes 777 et 95' },
    appType: 'notes',
  },
  {
    id: 'terminal',
    name: 'Terminal.exe',
    type: 'document',
    icon: 'cmd',
    metadata: { size: '1.0 Ko', modified: '01/04/2026', description: 'Invite de commandes' },
    appType: 'terminal',
  },
  {
    id: 'TerryFiles',
    name: 'Terry Files',
    type: 'folder',
    icon: 'folder',
    locked: true,
    metadata: { size: '—', modified: '17/04/2026', description: 'Dossier protégé' },
    children: [
      {
        id: 'films',
        name: 'films-favoris.lst',
        type: 'document',
        icon: 'notepad',
        metadata: { size: '0.8 Ko', modified: '17/04/2026', description: '4 films favoris' },
        appType: 'movies',
      },
    ],
  },
]
