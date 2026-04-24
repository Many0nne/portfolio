# src/data

Static data files — no store logic, plain exports.

## Files

- `icons.ts` — `ICON_MAP: Record<string, string>` maps icon keys (e.g. `'folder'`, `'notepad'`, `'casino'`) to image paths under `/img/` or `/icon/`; used by `AppIcon` and the `Window` title bar
- `mails.ts` — array of mail objects displayed in `MailApp`; edit here to change inbox content
- `playlist.ts` — track list for `MediaPlayer`
- `projects.ts` — project cards shown in `ProjectViewer`; each entry has id, title, description, tech stack, links
