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

`App.tsx` is the root orchestrator. It renders either `<BootScreen>` or the full desktop depending on `isBooted` state. The desktop layer (`<Desktop>`) renders draggable icons; open windows are rendered by iterating `windowStore.windows`, each wrapped in the `<Window>` shell. The `<Taskbar>` sits on top and handles the Start menu and shutdown.

### Window system (`src/store/windowStore.ts`)

Central Zustand store managing all open windows. Key rules:
- Max 8 simultaneous windows.
- Only one instance per `AppType` is allowed (except `project-viewer`).
- `AppType` is the union defined in `src/data/filesystem.ts` — adding a new app requires extending this union, `DEFAULT_SIZES`, `APP_TITLES`, and `APP_ICONS` in the store, and adding a `case` in the `AppContent` switch in `App.tsx`.
- Apps are lazy-loaded via `React.lazy` in `App.tsx`.

### Casino / money system (`src/store/casinoStore.ts`)

Persisted Zustand store (localStorage key `win95-casino-v1`). Players start with 500 credits. Apps can be "pledged" as collateral; if all pledgeable apps are pledged and credits reach 0, `isBankrupt` triggers `<GameOverDialog>`. `bankrupty` clears localStorage and reloads. The casino and bank shortcuts are hidden until `unlocked` is true (`requiresCasinoUnlock` flag on `DesktopShortcut`).

### Virtual filesystem (`src/data/filesystem.ts`)

Defines `DesktopShortcut[]` (what appears on the desktop) and `VirtualFile[]` (the tree browsed in `FileExplorer`). Files/folders carry an optional `appType` + `appProps` to open a window on double-click. Utility functions for navigating the tree live in `src/utils/fsUtils.ts`.

### TextEditor app (`src/components/apps/TextEditorApp.tsx`)

Single component with a `variant` prop (`"skills" | "resume" | "notes"`). Content for each variant is defined in `src/data/text-editor/` as structured documents and exported via `TEXT_EDITOR_DOCUMENTS` in `src/data/text-editor/index.ts`. To add or update displayed text, edit the corresponding file under `src/data/text-editor/`.

### Styling

98.css provides the Win95 widget styles globally. Component-level overrides use CSS Modules (`.module.css` files co-located with components). Global resets and layout live in `src/styles/main.css`.
