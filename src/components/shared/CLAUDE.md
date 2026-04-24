# src/components/shared

Reusable Win95 UI primitives used across multiple app components.

## Components

- `ContextMenu.tsx` — right-click menu, positioned at `(x, y)`, closes on outside click or Escape
  - Props: `x`, `y`, `items: ContextMenuItem[]`, `onClose`
  - Item type: `{ label, onClick, disabled }` or `{ separator: true }`

- `MenuBar.tsx` — Win95-style dropdown menu bar
  - Props: `menus: Menu[]` where each `Menu` has `label` + `items: MenuItem[]`
  - Items support `checked` (renders a ✓), `disabled`, and `separator`

- `DialogBox.tsx` — modal Win95 dialog for confirmations/alerts
  - Wraps `98.css` dialog styles

- `AppIcon.tsx` — renders an app icon by key; resolves path via `ICON_MAP` from `src/data/icons.ts`

- `ProgressBar.tsx` — Win95 progress bar, value 0–100
