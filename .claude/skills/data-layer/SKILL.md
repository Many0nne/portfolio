---
name: data-layer
description: Static data files shape and conventions — projects portfolio, mails, playlist, icon map. Load when the task involves adding or editing projects, mails, tracks, or icons; or when you need to know the data structure for any of these.
---

# Data Layer

All data is static (no API calls). Files live in `src/data/`.

## Key files
- `src/data/projects.ts` — portfolio projects
- `src/data/mails.ts` — inbox mail items
- `src/data/playlist.ts` — media player track list
- `src/data/icons.ts` — `ICON_MAP` record

## projects.ts

```ts
interface Project {
  id: string                          // kebab-case, unique
  title: string
  shortDesc: string                   // one-liner shown in list
  description: string                 // full text shown in detail view
  screenshot: string                  // path under /img/ (public folder)
  techStack: string[]
  date: string                        // year as string e.g. '2026'
  role: string                        // e.g. 'Auteur · Conception & développement complet'
  links: { label: 'GitHub' | 'Demo' | 'Article'; url: string }[]
  category: 'web' | 'mobile' | 'autre'
  featured: boolean
}
```

Projects are displayed in `src/components/apps/ProjectViewer.tsx`. The `featured` flag controls prominence in the list.

## mails.ts
Read the file directly for the exact shape — it is short. Each mail item has sender, subject, date, and body text. All content is in French.

## playlist.ts
Track list for the media player. Each track has a title, artist, and `src` path (under `/music/` in public). Read the file directly for the exact shape.

## icons.ts — ICON_MAP
```ts
export const ICON_MAP: Record<string, string> = {
  notepad: '/icons/notepad.png',
  folder: '/icons/folder.png',
  // ...
}
```
To add an icon: place the image in `public/icons/`, add the key-path entry to `ICON_MAP`. The key is then usable as `iconKey` in `AppDefinition` and as the `iconKey` prop of `<AppIcon />`.

## Conventions
- No runtime fetching — all data is imported at build time.
- Text content is in French (titles, descriptions, mail bodies, etc.).
- Screenshot images go in `public/img/`. Reference them as `/img/filename.png` (absolute from public root).
- `project.id` must be unique and stable — it is used as a key in React lists and may be passed as a prop to `project-viewer`.
