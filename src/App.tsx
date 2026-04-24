import { Suspense } from 'react'
import './App.css'
import { Desktop } from './components/Desktop/Desktop'
import { BootScreen } from './components/BootScreen/BootScreen'
import { ShutdownScreen } from './components/BootScreen/ShutdownScreen'
import { Taskbar } from './components/Taskbar/Taskbar'
import { Window } from './components/Window/Window'
import { useWindowStore } from './store/windowStore'
import { APPS } from './apps/registry'

export default function App() {
  const { windows, systemState } = useWindowStore()

  if (systemState === 'booting') return <BootScreen />
  if (systemState === 'shuttingDown') return <ShutdownScreen />

  return (
    <>
      <Desktop />
      {windows.map((win) => {
        const Component = APPS[win.appId].component
        return (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            iconKey={win.iconKey}
            state={win.state}
            zIndex={win.zIndex}
            position={win.position}
            size={win.size}
            resizable={win.resizable}
            minimizable={win.minimizable}
            maximizable={win.maximizable}
          >
            <Suspense fallback={<div style={{ padding: 16 }}>Chargement...</div>}>
              <Component windowId={win.id} {...win.props} />
            </Suspense>
          </Window>
        )
      })}
      <Taskbar />
    </>
  )
}
