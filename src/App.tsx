import { lazy, Suspense, useState } from 'react'
import './App.css'
import { Desktop } from './components/Desktop/Desktop'
import { BootScreen } from './components/BootScreen/BootScreen'
import { ShutdownScreen } from './components/BootScreen/ShutdownScreen'
import { Taskbar } from './components/Taskbar/Taskbar'
import { Window } from './components/Window/Window'
import { useWindowStore } from './store/windowStore'
import { useCasinoStore } from './store/casinoStore'
import { GameOverDialog } from './components/GameOverDialog'
import type { AppId } from './apps/types'

const NotepadApp = lazy(() =>
  import('./components/apps/NotepadApp').then((m) => ({ default: m.NotepadApp }))
)
const ProjectViewer = lazy(() =>
  import('./components/apps/ProjectViewer').then((m) => ({ default: m.ProjectViewer }))
)
const TerminalApp = lazy(() =>
  import('./components/apps/TerminalApp').then((m) => ({ default: m.TerminalApp }))
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
const MailApp = lazy(() =>
  import('./components/apps/MailApp').then((m) => ({ default: m.MailApp }))
)
const PaintApp = lazy(() =>
  import('./components/apps/PaintApp').then((m) => ({ default: m.PaintApp }))
)
const MediaPlayer = lazy(() =>
  import('./components/apps/MediaPlayer').then((m) => ({ default: m.MediaPlayer }))
)
const CasinoApp = lazy(() =>
  import('./components/apps/CasinoApp').then((m) => ({ default: m.CasinoApp }))
)
const BankApp = lazy(() =>
  import('./components/apps/BankApp').then((m) => ({ default: m.BankApp }))
)
const RunDialog = lazy(() =>
  import('./components/apps/RunDialog').then((m) => ({ default: m.RunDialog }))
)

function AppContent({ app, props, windowId }: { app: AppId; props: Record<string, unknown>; windowId: string }) {
  switch (app) {
    case 'notepad':
      return <NotepadApp windowId={windowId} fileId={props.fileId as string | undefined} />
    case 'project-viewer':
      return <ProjectViewer fileId={props.fileId as string | undefined} projectId={props.projectId as string | undefined} />
    case 'terminal':
      return <TerminalApp windowId={windowId} />
    case 'about':
      return <AboutDialog windowId={windowId} />
    case 'explorer':
      return <FileExplorer windowId={windowId} folderId={props.folderId as string | undefined} />
    case 'minesweeper':
      return <Minesweeper windowId={windowId} />
    case 'mail':
      return <MailApp />
    case 'paint':
      return <PaintApp windowId={windowId} fileId={props.fileId as string | undefined} />
    case 'media-player':
      return <MediaPlayer fileId={props.fileId as string | undefined} />
    case 'casino':
      return <CasinoApp />
    case 'bank':
      return <BankApp />
    case 'run':
      return <RunDialog windowId={windowId} />
    default:
      return <div style={{ padding: 16 }}>Application inconnue.</div>
  }
}

type AppPhase = 'boot' | 'desktop' | 'shutdown'

export default function App() {
  const { windows } = useWindowStore()
  const { isBankrupt } = useCasinoStore()
  const [phase, setPhase] = useState<AppPhase>('boot')

  const handleBoot = () => setPhase('desktop')

  const handleShutdown = () => {
    useWindowStore.setState({ windows: [], activeWindowId: null })
    setPhase('shutdown')
  }

  if (phase === 'boot') return <BootScreen onBoot={handleBoot} />
  if (phase === 'shutdown') return <ShutdownScreen onRestart={() => setPhase('boot')} />

  return (
    <>
      <Desktop />
      {windows.map((win) => (
        <Window key={win.id} id={win.id} title={win.title} iconKey={win.iconKey} isMinimized={win.isMinimized} isMaximized={win.isMaximized} zIndex={win.zIndex} position={win.position} size={win.size}>
          <Suspense fallback={<div style={{ padding: 16 }}>Chargement...</div>}>
            <AppContent app={win.app} props={win.props} windowId={win.id} />
          </Suspense>
        </Window>
      ))}
      <Taskbar onShutdown={handleShutdown} />
      {isBankrupt && <GameOverDialog />}
    </>
  )
}
