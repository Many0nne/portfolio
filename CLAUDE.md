# Project: Win95 Portfolio

## Stack
- Language: TypeScript (React 19)
- Framework: Vite SPA
- State: Zustand (in-memory + localStorage via `persist`)
- Styling: CSS Modules + 98.css
- Package manager: pnpm

## Hard rules
- Never auto-commit
- Always use `pnpm`, never `npm`
- No test framework — do not add one without asking
- All UI labels and user-visible text must be in **French**
- CSS Modules only — never inline styles, never global class overrides on 98.css primitives

## How to run
- Dev: `pnpm dev`
- Build: `pnpm build` (runs `tsc -b && vite build`)
- Lint: `pnpm lint`
- Preview: `pnpm preview`

## Core architecture (one-liner per domain)
- **Window system** — `src/store/windowStore.ts`: Zustand store, `openWindow(appId, opts)`, `WindowState = 'normal' | 'minimized' | 'maximized'`, system lifecycle in same store
- **Virtual FS** — `src/fs/`: Zustand + localStorage persist, flat `nodes` map with `parentId` references, soft-delete to `RECYCLED_ID`
- **App registry** — `src/apps/registry.ts` + `src/apps/types.ts`: `APPS` record, each entry is an `AppDefinition` with lazy component
- **Desktop** — `src/components/Desktop/Desktop.tsx`: icon grid, drag-snap, themes, ContextMenu
- **Shared UI primitives** — `src/components/shared/`: ContextMenu, MenuBar, DialogBox, AppIcon, ProgressBar
- **Data** — `src/data/`: static only, no API calls (`projects.ts`, `mails.ts`, `playlist.ts`, `icons.ts`)

## Available skills
Load the relevant skill before reading source files — it tells you exactly which files matter.

- `window-system` — window lifecycle, z-index, system state, openWindow/openFile API
- `virtual-fs` — FS node structure, store API, seed tree, path resolution, associations
- `app-registry` — adding/modifying apps, AppDefinition fields, lazy loading pattern
- `desktop` — icon grid, drag-snap, themes, localStorage keys, desktop context menu
- `ui-conventions` — 98.css usage, CSS Modules patterns, shared primitives, sound hook
- `data-layer` — static data shape (projects, mails, playlist, icons), how to add/edit entries
