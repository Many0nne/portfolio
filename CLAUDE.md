# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture

This is a Windows 95 desktop simulation built with React 19, TypeScript, Vite, Zustand, and 98.css.

### Application lifecycle

`App.tsx` is the root orchestrator. It manages `phase: 'boot' | 'desktop' | 'shutdown'`. The desktop layer (`<Desktop>`) renders draggable icons; open windows are rendered by iterating `windowStore.windows`, each wrapped in the `<Window>` shell. The `<Taskbar>` sits on top and handles the Start menu and shutdown.

### App registry (`src/apps/`)

`AppId` union and `APPS: Record<AppId, AppDescriptor>` live here. See `src/apps/CLAUDE.md` for how to add a new app.

### Window system (`src/store/windowStore.ts`)

Central Zustand store managing all open windows. Key rules:
- Only one instance per `AppId` unless `multiInstance: true` in the registry.
- `openApp(appId)` / `openFile(fileId)` are the two entry points; `openFile` resolves the app via `src/fs/associations.ts`.
- Apps are lazy-loaded via `React.lazy` in `App.tsx`; each needs a `case` in the `AppContent` switch.

### Casino / money system (`src/store/casinoStore.ts`)

Persisted Zustand store (localStorage key `win95-casino-v1`). Players start with 500 credits. Apps can be "pledged" as collateral; if all pledgeable apps are pledged and credits reach 0, `isBankrupt` triggers `<GameOverDialog>`. `bankrupty` clears localStorage and reloads. The casino and bank shortcuts are hidden until `unlocked` is true (`requiresCasinoUnlock` flag on `DesktopShortcut`).

### Virtual filesystem (`src/fs/`)

Zustand store persisted under localStorage key `win95-fs-v1`. Seeded from `src/fs/seed.ts` on first load. See `src/fs/CLAUDE.md` for the full API and how file-to-app associations work.

### Notepad app (`src/components/apps/NotepadApp.tsx`)

Opens a file from the virtual filesystem via `fileId` prop. Content is stored in `FsNode.content` (plain text). To pre-populate a file, edit `src/fs/seed.ts`.

### Styling

98.css provides the Win95 widget styles globally. Component-level overrides use CSS Modules (`.module.css` files co-located with components). Global resets and layout live in `src/styles/main.css`.
