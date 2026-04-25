---
name: ui-conventions
description: CSS Modules patterns, 98.css usage rules, shared UI primitives (ContextMenu, MenuBar, DialogBox, AppIcon, ProgressBar), sound hook, and Win95 aesthetic conventions. Load when the task involves styling, building UI components, or using shared primitives.
---

# UI Conventions

## Key files
- `src/components/shared/CLAUDE.md` — canonical docs for all shared primitives (read this)
- `src/components/shared/*.tsx` — ContextMenu, MenuBar, DialogBox, AppIcon, ProgressBar
- `src/data/icons.ts` — `ICON_MAP` record mapping icon keys to image paths
- `src/hooks/useSound.ts` — `useSound()` hook
- `src/hooks/useLocalStorage.ts` — typed localStorage hook
- `src/index.css` + `src/styles/main.css` — global reset and base styles

## CSS Modules
Every component has a collocated `.module.css` file. Use `styles.className` — never `className="hardcoded"` for component-specific styles.

```tsx
import styles from './MyApp.module.css'
// ...
<div className={styles.container}>
```

## 98.css
Import is global (in `main.tsx` or `index.css`). It provides Win95 primitives via class names:
- `window`, `title-bar`, `title-bar-controls` — window chrome
- `field-row`, `field-row-stacked` — form layout
- `button` — Win95 button appearance

**Do not override 98.css class names directly in CSS Modules.** If you need to adjust a 98.css primitive, wrap it in a container div and style the container.

## Shared primitives (src/components/shared/)

**ContextMenu** — right-click menu
```tsx
<ContextMenu x={x} y={y} items={items} onClose={() => setCtx(null)} />
// ContextMenuItem: { label: string; onClick: () => void; disabled?: boolean } | { separator: true }
```

**MenuBar** — Win95 dropdown menu bar
```tsx
<MenuBar menus={[{ label: 'Fichier', items: [{ label: 'Enregistrer', onClick: save }] }]} />
// MenuItem also supports: checked (renders ✓), disabled, separator
```

**DialogBox** — modal confirmation/alert
```tsx
<DialogBox title="Attention" onClose={close}>contenu</DialogBox>
```

**AppIcon** — renders an icon by key
```tsx
<AppIcon iconKey="notepad" size={32} />
// Resolves via ICON_MAP from src/data/icons.ts
```

**ProgressBar** — value 0–100
```tsx
<ProgressBar value={progress} />
```

## Sound hook
```tsx
const { play } = useSound()
play('startup')   // plays src/assets/sounds/startup.mp3 (or similar)
play('open')
play('error')
```
Failures are silently swallowed — never guard `play()` calls with try/catch.

## Win95 aesthetic conventions
- Title bar text: `AppName` or `FileName — AppName`
- All labels in French (buttons, menus, dialogs, context menu items)
- Icons from `ICON_MAP` — always use `<img src={ICON_MAP.key} alt="..." />`; do not use emoji or Unicode symbols as icons
- Scrollbars: rely on 98.css defaults; do not style them manually

## useLocalStorage hook
```ts
const [value, setValue] = useLocalStorage<T>(key, defaultValue)
// setValue accepts a value or an updater function (T | (prev: T) => T)
```
