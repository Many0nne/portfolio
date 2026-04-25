---
name: desktop
description: Desktop icon grid system, drag-snap mechanics, icon position persistence, desktop themes, and the desktop context menu. Load when the task involves desktop layout, icon placement, themes, or the desktop right-click menu.
---

# Desktop

## Key files
- `src/components/Desktop/Desktop.tsx` — all desktop logic (grid, drag, themes, context menu)
- `src/components/Desktop/Desktop.module.css` — desktop styles

## localStorage keys

| Key | Value type | Purpose |
|---|---|---|
| `'win95-icon-positions-v2'` | `Record<string, GridPos>` | Persisted icon grid positions |
| `'win95-desktop-theme-v1'` | `DesktopThemeId` | Active theme id |

Both are managed via the `useLocalStorage` hook from `src/hooks/useLocalStorage.ts`.

## Grid system
Icons snap to a cell grid computed from viewport size. Cell dimensions are derived at runtime:
- `cellW = innerWidth / numCols` — `numCols = floor(innerWidth / 80)`
- `cellH = (innerHeight - 40) / numRows` — `numRows = floor((innerHeight - 40) / 90)` (40px taskbar)

`GridPos = { col: number; row: number }` — stored positions, not pixels.

`DEFAULT_POSITIONS` in `Desktop.tsx` defines preferred positions for the seeded shortcuts by their FS node id (e.g. `'lnk-mes-projets': { col: 0, row: 0 }`). When adding a new seeded shortcut, add its id here too.

## Desktop icons source
Icons on the desktop are the direct children of `BUREAU_ID` in the FS (`src/fs/seed.ts`). To add a permanent desktop icon, add a node under `BUREAU_ID` in `seed.ts`. The Desktop component reads them via `fsStore.getChildren(BUREAU_ID)`.

## Desktop themes

```ts
type DesktopThemeId = 'emerald' | 'azure' | 'sunset' | 'graphite'
```

Themes are defined inline in `Desktop.tsx` as `DESKTOP_THEMES`. Each has `backgroundColor` and `backgroundImage` (gradient). The selected theme id is persisted to localStorage.

## Drag mechanics
- `onPointerDown` → captures pointer → tracks `pointermove` globally → on `pointerup` snaps to nearest free grid cell.
- Drag threshold: 4px movement before drag is recognised (prevents mis-clicks from moving icons).
- Overlap is prevented: `findFreeCell` scans outward from the target cell if it is occupied.

## Context menu
Right-click on desktop: Actualiser, Fonds d'écran (disabled), Nouveau > Dossier, Nouveau > Document texte, Propriétés (opens `about` dialog).
Right-click on icon: Ouvrir, Renommer (uses `prompt()`), Supprimer.

## Conventions
- Never hard-code pixel positions for icons. Always use the grid system.
- When creating a new item from the context menu, compute its position with `computeDynamicSeedPositions` and persist immediately via `setIconPositions`.
- The grid throws if capacity is exceeded — the Desktop shows an error overlay in that case.
