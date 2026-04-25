---
name: virtual-fs
description: Virtual file system structure, Zustand store API (create/rename/move/remove/writeContent), seed tree constants, path resolution, and file-to-app associations. Load when the task involves files, folders, the Recycle Bin, FS mutations, or opening files from the FS.
---

# Virtual File System

## Key files
- `src/fs/types.ts` — `FsNode` type definition
- `src/fs/fsStore.ts` — Zustand store with all queries and mutations
- `src/fs/seed.ts` — initial tree + exported folder ID constants
- `src/fs/associations.ts` — maps extensions/mimeTypes to AppId
- `src/utils/path.ts` — `extname()` and other path helpers

## FsNode shape

```ts
interface FsNode {
  id: string              // `fs-${Date.now()}-${random}`
  name: string
  kind: 'folder' | 'file'
  parentId: string | null  // null only for root
  content?: string         // file text content
  mimeType?: string
  createdAt: number
  modifiedAt: number
  sizeBytes: number
  shortcut?: { app: AppId; props?: Record<string, unknown> }
  attrs?: { hidden?: boolean; readOnly?: boolean; system?: boolean }
}
```

## Seed folder IDs (import from `src/fs/seed.ts`)

| Constant | Path |
|---|---|
| `ROOT_ID` | `C:\` |
| `BUREAU_ID` | Desktop shortcuts (shown on desktop) |
| `DOCUMENTS_ID` | `C:\Users\Terry\Documents` |
| `MES_PROJETS_ID` | `C:\Users\Terry\Mes Projets` |
| `RECYCLED_ID` | Recycle Bin |

## Store API

```ts
// Queries
getChildren(parentId): FsNode[]
getByPath(path): FsNode | null
getPath(id): string              // returns "C:\path\to\node"
resolvePath(path, cwdId): { ok: true; node } | { ok: false; reason }

// Mutations
create(parentId, partial): string   // returns new node id
rename(id, newName): void
move(id, newParentId): void
remove(id): void                    // soft-delete → RECYCLED_ID; second call hard-deletes
writeContent(id, content): void     // updates sizeBytes and modifiedAt
setAttrs(id, attrs): void
```

## Recycle Bin
`remove(id)` moves node to `RECYCLED_ID` (soft-delete). Calling `remove` again on a node already in `RECYCLED_ID` hard-deletes it (removes from `nodes` map). There is no "restore from recycle bin" action yet.

## Persistence
The store key is `'win95-fs-v1'` in localStorage. On empty state (first load or after `localStorage.clear()`), `buildSeedTree()` is called to populate the initial tree.

## File associations (`src/fs/associations.ts`)
Extension map: `.txt .lst .ini .m3u .md` → `notepad`; `.bmp` → `paint`; `.mp3 .wav` → `media-player`; `.proj` → `project-viewer`.
Folders always resolve to `explorer` with `{ folderId: node.id }` prop.
Shortcuts (`mimeType === 'application/x-shortcut'`) resolve via `node.shortcut.app`.

## Conventions
- Always create files/folders with `fsStore.create(parentId, partial)` — never construct a node object manually.
- `sizeBytes` for text files: pass `0` on create; `writeContent` updates it automatically.
- Path resolution is case-insensitive. Separator can be `\` or `/` — the store normalizes.
- Do not import `RECYCLED_ID` from `fsStore.ts` — import it from `seed.ts`.
