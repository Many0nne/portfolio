# src/fs

Virtual filesystem — persisted Zustand store modelling a Win95 C:\ drive.

## Files

- `types.ts` — `FsNode` shape: `id`, `parentId`, `name`, `kind` (`folder|file`), `content`, `mimeType`, `shortcut`, `locked` (pin), `attrs` (hidden/readOnly/system)
- `fsStore.ts` — `useFsStore`, persisted under localStorage key `win95-fs-v1`, seeded from `seed.ts` on first load
- `seed.ts` — builds the initial node tree; exports stable ID constants (`ROOT_ID`, `BUREAU_ID`, `RECYCLED_ID`, `DOCUMENTS_ID`, etc.) used across the codebase
- `associations.ts` — `resolveAssociation(node)` → `{ app, props } | null`; folders always open `explorer`, files resolve by extension/mimeType via `EXT_MAP` and `MIME_MAP`

## Store API

```ts
useFsStore.getState()
  .getChildren(parentId)          // direct children
  .getByPath('C:\\Users\\Terry')  // absolute path lookup
  .resolvePath(path, cwdId)       // returns { ok, node } | { ok, reason }
  .create(parentId, partial)      // returns new node id
  .rename(id, newName)
  .move(id, newParentId)
  .remove(id)                     // moves to RECYCLED_ID; second call = hard delete
  .writeContent(id, text)         // updates content + sizeBytes + modifiedAt
  .setAttrs(id, attrs)
```

## Recycling

`remove()` soft-deletes by moving to `RECYCLED_ID`. Calling `remove()` again on a node already in the recycle bin performs a hard delete.

## Adding content

To add pre-seeded files or folders, edit `src/fs/seed.ts`. Use the exported ID constants when other parts of the app need to reference a known node (e.g., `BUREAU_ID` for the desktop folder).
