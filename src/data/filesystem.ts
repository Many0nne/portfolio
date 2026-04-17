export type AppType =
  | 'projects'
  | 'project-viewer'
  | 'file-explorer'
  | 'skills'
  | 'resume'
  | 'contact'
  | 'about'
  | 'minesweeper'

export interface VirtualFile {
  id: string
  name: string
  type: 'folder' | 'project' | 'document'
  icon: string
  metadata: {
    size: string
    modified: string
    description?: string
  }
  children?: VirtualFile[]
  appType?: AppType
  appProps?: Record<string, unknown>
}

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
    name: 'Compétences',
    type: 'document',
    icon: 'control',
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
    id: 'contact',
    name: 'Contact',
    type: 'document',
    icon: 'cmd',
    metadata: { size: '0.5 Ko', modified: '01/04/2026', description: 'Terminal de contact' },
    appType: 'contact',
  },
]
