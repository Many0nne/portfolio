---
name: window-system
description: Window lifecycle (open, close, minimize, maximize, restore), z-index management, system state (boot/shutdown/restart), and the openWindow/openFile API. Load when the task involves window behavior, focus, title updates, or system lifecycle.
---

# Window System

## Key files
- `src/store/windowStore.ts` — the entire window + system state; read this file first
- `src/App.tsx` — renders windows via `APPS[win.appId].component`
- `src/components/Window/Window.tsx` — draggable/resizable chrome, title bar buttons

## Types

```ts
type WindowState  = 'normal' | 'minimized' | 'maximized'
type SystemState  = 'booting' | 'desktop' | 'shuttingDown'

interface WindowInstance {
  id: string            // `${appId}-${Date.now()}`
  appId: AppId
  title: string
  iconKey: string
  props: Record<string, unknown>
  state: WindowState
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  resizable / minimizable / maximizable: boolean
  prevBounds?: { position; size }   // saved before maximize
}
```

## Store API

| Action | Signature | Notes |
|---|---|---|
| `openWindow` | `(appId, opts?) => string \| null` | opts: `{ fileId?, props? }` |
| `openFile` | `(fileId) => string \| null` | resolves association, then calls openWindow |
| `setTitle` | `(id, title) => void` | use inside app components when file changes |
| `closeWindow` | `(id) => void` | auto-focuses next visible window |
| `focusWindow` | `(id) => void` | bumps zIndex via `zCounter` |
| `minimizeWindow` | `(id) => void` | |
| `maximizeWindow` | `(id) => void` | saves prevBounds |
| `restoreWindow` | `(id) => void` | restores from prevBounds if maximized |
| `moveWindow` / `resizeWindow` | `(id, pos/size) => void` | |
| `boot` / `shutdown` / `restart` | `() => void` | restart calls `localStorage.clear()` |

## Conventions
- Window `id` format: `${appId}-${Date.now()}` — never construct manually, let `openWindow` do it.
- `multiInstance: false` apps are brought to focus if already open — `openWindow` returns existing id.
- `prevBounds` is `undefined` when window is not maximized — do not rely on it otherwise.
- Title for file-backed windows: `${node.name} — ${def.name}`. Call `setTitle` after content loads if the file name changes.
- `systemState` lives in this store — not a separate store. Boot/shutdown/restart are handled here.
- `restart` clears all localStorage, which resets the FS seed and icon positions.

## Common footguns
- Do NOT use boolean flags for window state — always use `'normal' | 'minimized' | 'maximized'`.
- Do NOT read `activeWindowId` to determine "is this window active" inside a window component — compare `win.id === activeWindowId` from the store.
- `openFile` will return `null` if no association exists for the file extension/mimeType.
