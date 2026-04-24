import type { AppId } from '../apps/types'

export type FsNodeKind = 'folder' | 'file'

export interface FsNode {
  id: string
  name: string
  kind: FsNodeKind
  parentId: string | null
  content?: string
  mimeType?: string
  createdAt: number
  modifiedAt: number
  sizeBytes: number
  locked?: { pin: string }
  shortcut?: { app: AppId; props?: Record<string, unknown> }
  attrs?: { hidden?: boolean; readOnly?: boolean; system?: boolean }
}
