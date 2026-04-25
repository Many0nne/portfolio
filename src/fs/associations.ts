import type { AppId, FsNode, Association } from '../types'
import { extname } from '../utils/path'

const EXT_MAP: Record<string, AppId> = {
  '.txt': 'notepad',
  '.lst': 'notepad',
  '.ini': 'notepad',
  '.m3u': 'notepad',
  '.md': 'notepad',
  '.bmp': 'paint',
  '.mp3': 'media-player',
  '.wav': 'media-player',
  '.proj': 'project-viewer',
}

const MIME_MAP: Record<string, AppId> = {
  'text/plain': 'notepad',
  'text/': 'notepad',
  'image/bmp': 'paint',
  'audio/mpeg': 'media-player',
  'audio/': 'media-player',
  'application/x-project': 'project-viewer',
}

function resolveAppByMimeOrExt(node: FsNode): AppId | null {
  if (node.mimeType) {
    if (MIME_MAP[node.mimeType]) return MIME_MAP[node.mimeType]
    const prefix = node.mimeType.split('/')[0] + '/'
    if (MIME_MAP[prefix]) return MIME_MAP[prefix]
  }
  const ext = extname(node.name)
  if (ext && EXT_MAP[ext]) return EXT_MAP[ext]
  return null
}

export function resolveAssociation(node: FsNode): Association | null {
  if (node.kind === 'folder') {
    return { app: 'explorer', props: { folderId: node.id } }
  }

  if (node.mimeType === 'application/x-shortcut' && node.shortcut) {
    return { app: node.shortcut.app, props: node.shortcut.props }
  }

  const app = resolveAppByMimeOrExt(node)
  if (!app) return null

  if (app === 'notepad') return { app, props: { fileId: node.id } }
  if (app === 'paint') return { app, props: { fileId: node.id } }
  if (app === 'media-player') return { app, props: { fileId: node.id } }
  if (app === 'project-viewer') return { app, props: { projectId: node.content } }

  return { app, props: { fileId: node.id } }
}
