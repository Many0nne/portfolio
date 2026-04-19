import { lazy, Suspense, useState } from 'react'
import './App.css'
import { Desktop } from './components/Desktop/Desktop'
import { BootScreen } from './components/BootScreen/BootScreen'
import { Taskbar } from './components/Taskbar/Taskbar'
import { Window } from './components/Window/Window'
import { useWindowStore } from './store/windowStore'
import type { AppType } from './data/filesystem'

const ProjectViewer = lazy(() =>
  import('./components/apps/ProjectViewer').then((m) => ({ default: m.ProjectViewer }))
)
const SkillsApp = lazy(() =>
  import('./components/apps/SkillsApp').then((m) => ({ default: m.SkillsApp }))
)
const ResumeApp = lazy(() =>
  import('./components/apps/ResumeApp').then((m) => ({ default: m.ResumeApp }))
)
const ContactApp = lazy(() =>
  import('./components/apps/ContactApp').then((m) => ({ default: m.ContactApp }))
)
const AboutDialog = lazy(() =>
  import('./components/apps/AboutDialog').then((m) => ({ default: m.AboutDialog }))
)
const FileExplorer = lazy(() =>
  import('./components/FileExplorer/FileExplorer').then((m) => ({ default: m.FileExplorer }))
)
const Minesweeper = lazy(() =>
  import('./components/apps/Minesweeper').then((m) => ({ default: m.Minesweeper }))
)
const MoviesApp = lazy(() =>
  import('./components/apps/MoviesApp').then((m) => ({ default: m.MoviesApp }))
)
const MailApp = lazy(() =>
  import('./components/apps/MailApp').then((m) => ({ default: m.MailApp }))
)
const PaintApp = lazy(() =>
  import('./components/apps/PaintApp').then((m) => ({ default: m.PaintApp }))
)
const MediaPlayer = lazy(() =>
  import('./components/apps/MediaPlayer').then((m) => ({ default: m.MediaPlayer }))
)

function AppContent({ app, props, windowId }: { app: AppType; props?: Record<string, unknown>; windowId: string }) {
  switch (app) {
    case 'project-viewer':
      return <ProjectViewer projectId={props?.projectId as string | undefined} />
    case 'skills':
      return <SkillsApp />
    case 'resume':
      return <ResumeApp />
    case 'contact':
      return <ContactApp />
    case 'about':
      return <AboutDialog />
    case 'file-explorer':
    case 'projects':
      return <FileExplorer initialFolderId={props?.folderId as string | undefined} />
    case 'minesweeper':
      return <Minesweeper windowId={windowId} />
    case 'movies':
      return <MoviesApp />
    case 'mail':
      return <MailApp />
    case 'paint':
      return <PaintApp />
    case 'media-player':
      return <MediaPlayer />
    default:
      return <div style={{ padding: 16 }}>Application inconnue.</div>
  }
}

export default function App() {
  const { windows } = useWindowStore()
  const [isBooted, setIsBooted] = useState(false)

  const handleBoot = () => {
    setIsBooted(true)
  }

  const handleShutdown = () => {
    useWindowStore.setState({ windows: [], activeWindowId: null })
    setIsBooted(false)
  }

  if (!isBooted) {
    return <BootScreen onBoot={handleBoot} />
  }

  return (
    <>
      <Desktop />
      {windows.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          icon={win.icon}
          isMinimized={win.isMinimized}
          isMaximized={win.isMaximized}
          zIndex={win.zIndex}
          position={win.position}
          size={win.size}
        >
          <Suspense fallback={<div style={{ padding: 16 }}>Chargement...</div>}>
            <AppContent app={win.app} props={win.props} windowId={win.id} />
          </Suspense>
        </Window>
      ))}
      <Taskbar onShutdown={handleShutdown} />
    </>
  )
}
