---
name: app-registry
description: How to add a new app or modify an existing one — AppId union, AppDefinition fields, lazy import pattern, and the 4-step checklist. Load when the task involves creating, registering, or modifying an app.
---

# App Registry

## Key files
- `src/apps/types.ts` — `AppId` union type + `AppDefinition` interface
- `src/apps/registry.ts` — `APPS` record, all lazy imports
- `src/components/apps/` — one file per app component (+ optional `.module.css`)
- `src/components/FileExplorer/` — FileExplorer lives here, not under `apps/`

## AppDefinition fields

```ts
type AppDefinition = {
  id: AppId
  name: string            // shown in title bar and taskbar (French)
  iconKey: string         // key into ICON_MAP from src/data/icons.ts
  component: ComponentType<any>   // must be React.lazy(...)
  defaultSize: { width: number; height: number }
  resizable: boolean
  minimizable: boolean
  maximizable: boolean
  multiInstance: boolean  // false = only one window at a time
  isDialog?: boolean      // true = no taskbar entry, no minimize/maximize
  initialState?: unknown  // rarely used
}
```

## Adding a new app — 4 steps

1. **`src/apps/types.ts`** — add the new string literal to the `AppId` union.
2. **`src/apps/registry.ts`** — add a `const MyApp = lazy(...)` at the top, then add the `AppDefinition` entry to the `APPS` record.
3. **`src/components/apps/MyApp.tsx`** — create the component. Export it as a named export matching the lazy import.
4. Optionally: add a shortcut node in `src/fs/seed.ts` with `mimeType: 'application/x-shortcut'` and `shortcut: { app: 'my-app' }` so it appears on the desktop.

No other files need modification — `App.tsx` renders `APPS[win.appId].component` dynamically.

## Lazy import pattern

```ts
const MyApp = lazy(() =>
  import('../components/apps/MyApp').then((m) => ({ default: m.MyApp }))
)
```

Always use the `.then((m) => ({ default: m.MyApp }))` form — named exports require this re-wrap.

## Icon keys
Valid `iconKey` values come from `ICON_MAP` in `src/data/icons.ts`. Read that file to see available keys before choosing one. Load the `data-layer` skill if you need to add a new icon.

## Dialog apps
Set `isDialog: true`, `resizable: false`, `minimizable: false`, `maximizable: false`. Dialogs do not appear in the Taskbar.

## multiInstance behavior
`false`: `openWindow` returns the existing window's id and focuses it (or restores if minimized). The component is not re-mounted. Pass updated props via the `openWindow` opts if needed — but the component must re-read them.

## Conventions
- App component props come from `WindowInstance.props` (a `Record<string, unknown>`) — cast them inside the component.
- File-backed apps receive `fileId: string` in props; read content via `useFsStore`.
- Name (French) goes in `AppDefinition.name`. The component itself can use any internal labels in French.
