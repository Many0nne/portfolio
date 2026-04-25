import type { AppId } from './apps'
export type { AppId }

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
  shortcut?: { app: AppId; props?: Record<string, unknown> }
  attrs?: { hidden?: boolean; readOnly?: boolean; system?: boolean }
}

export interface Association {
  app: AppId
  props?: Record<string, unknown>
}
