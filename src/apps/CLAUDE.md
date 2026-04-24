# src/apps

App registry — defines every launchable app in one place.

## Files

- `types.ts` — `AppId` union (12 values: `notepad`, `explorer`, `terminal`, `paint`, `media-player`, `mail`, `minesweeper`, `project-viewer`, `casino`, `bank`, `about`, `run`)
- `registry.ts` — `APPS: Record<AppId, AppDescriptor>` with `title`, `iconKey`, `defaultSize`, `multiInstance`, `isDialog`

## How to add a new app

1. Add the id to `AppId` in `types.ts`
2. Add a descriptor entry in `APPS` in `registry.ts`
3. Add a `case` in the `AppContent` switch in `src/App.tsx` (lazy-import + render)
4. Create the component in `src/components/apps/`

## Notes

- `multiInstance: false` → only one window at a time; focusing an existing one instead of opening a new one
- `isDialog: true` → rendered without resize handles in the `<Window>` shell (used by `about`, `run`)
- `iconKey` is resolved via `ICON_MAP` in `src/data/icons.ts`
