# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Vite HMR)
pnpm build        # tsc -b && vite build
pnpm lint         # ESLint with TypeScript + React rules
pnpm preview      # Preview production build
```

No test framework is configured.

## Architecture

This is a **Windows 95-themed interactive portfolio** — a fully simulated desktop environment running as a browser SPA. React 19 + TypeScript + Vite + Zustand + 98.css.

### Core abstraction layers

**Window system** (`src/store/windowStore.ts`): Zustand store tracking all open windows. `openWindow(appId, options)` creates new window instances. Window state uses `state: 'normal' | 'minimized' | 'maximized'` (not booleans). Actions: `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `maximizeWindow`, `restoreWindow`, `moveWindow`, `resizeWindow`. System lifecycle (`boot`, `shutdown`, `restart`) is also in this store via `systemState: 'booting' | 'desktop' | 'shuttingDown'`.

**Virtual file system** (`src/fs/`):
- `fsStore.ts` — Zustand store with `persist` middleware (localStorage). Nodes have `parentId` references forming a tree.
- `seed.ts` — Initial FS tree seeded on first load (C:\, Users\Terry\, system folders, embedded text content).
- `associations.ts` — Maps file extensions to app IDs.
- Recycle Bin is a soft-delete: nodes are moved to `RECYCLED_ID`, hard-deleted on second removal.

**App registry** (`src/apps/registry.ts`): Single source of truth for all apps. Each `AppDefinition` declares `name`, `iconKey`, `component` (lazy-loaded via `React.lazy`), `defaultSize`, `resizable`, `minimizable`, `maximizable`, `multiInstance`, `isDialog?`. `App.tsx` renders `APPS[win.appId].component` directly — no switch statement needed.

**Desktop grid** (`src/components/Desktop/`): Icon positions are stored in localStorage separately from the FS. The grid is computed from viewport dimensions; icons snap to cells and the store prevents overlaps.

### State persistence strategy

| What             | How                                   |
| ---------------- | ------------------------------------- |
| Open windows     | Zustand in-memory only                |
| File system tree | Zustand + `persist` (localStorage)    |
| Icon positions   | `useLocalStorage` hook (localStorage) |
| Desktop theme    | `useLocalStorage` hook (localStorage) |

`localStorage` is cleared on boot (see recent commit) to reset stale state.

### Adding a new app

1. Add the app ID to the `AppId` union in `src/apps/types.ts`.
2. Register it in `src/apps/registry.ts` with `component` (lazy import), icon, size, and flags.
3. Create the component under `src/components/apps/`.
4. Optionally add a desktop icon entry referencing the app ID.

No other files need modification.

### UI conventions

- **CSS Modules** for all component styles (`.module.css`).
- **98.css** provides Windows 95 primitives (buttons, title bars, inputs) — avoid overriding its class names directly.
- All UI labels and content are in **French**.
- Sound effects via `useSound()` hook (`src/hooks/useSound.ts`); failures are silently swallowed.

### Data files (`src/data/`)

Static data only — no API calls. `projects.ts` holds the full portfolio (20+ projects with title, description, stack, links). `mails.ts`, `playlist.ts`, `icons.ts` are similarly static.
