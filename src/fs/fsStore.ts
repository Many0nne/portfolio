import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FsNode } from './types'
import { buildSeedTree, RECYCLED_ID } from './seed'

type ResolveResult =
  | { ok: true; node: FsNode }
  | { ok: false; reason: 'not-found' | 'not-dir' | 'locked' }

interface FsStore {
  nodes: Record<string, FsNode>
  rootId: string
  // queries
  getChildren: (parentId: string) => FsNode[]
  getByPath: (path: string) => FsNode | null
  getPath: (id: string) => string
  resolvePath: (path: string, cwdId: string) => ResolveResult
  // mutations
  create: (parentId: string, partial: Omit<FsNode, 'id' | 'parentId' | 'createdAt' | 'modifiedAt'>) => string
  rename: (id: string, newName: string) => void
  move: (id: string, newParentId: string) => void
  remove: (id: string) => void
  writeContent: (id: string, content: string) => void
  setAttrs: (id: string, attrs: FsNode['attrs']) => void
  updateModifiedAt: (id: string) => void
}

function generateId(): string {
  return `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useFsStore = create<FsStore>()(
  persist(
    (set, get) => ({
      nodes: {},
      rootId: '',

      getChildren: (parentId) => {
        return Object.values(get().nodes).filter((n) => n.parentId === parentId)
      },

      getPath: (id) => {
        const { nodes, rootId } = get()
        if (id === rootId) return 'C:\\'
        const parts: string[] = []
        let currentId: string | null = id
        while (currentId !== null && currentId !== rootId) {
          const node: FsNode | undefined = nodes[currentId]
          if (!node) break
          parts.push(node.name)
          currentId = node.parentId
        }
        return 'C:\\' + parts.reverse().join('\\')
      },

      getByPath: (path) => {
        const result = get().resolvePath(path, get().rootId)
        return result.ok ? result.node : null
      },

      resolvePath: (path, cwdId) => {
        const { nodes, rootId } = get()
        const normalized = path.replace(/\//g, '\\')

        let currentId: string
        let segments: string[]

        if (/^[cC]:\\/.test(normalized)) {
          currentId = rootId
          const rest = normalized.slice(3)
          segments = rest ? rest.split('\\').filter(Boolean) : []
        } else if (normalized.startsWith('\\')) {
          currentId = rootId
          segments = normalized.slice(1).split('\\').filter(Boolean)
        } else {
          currentId = cwdId
          segments = normalized.split('\\').filter(Boolean)
        }

        for (const seg of segments) {
          if (seg === '.') continue
          if (seg === '..') {
            const current = nodes[currentId]
            if (current && current.parentId !== null) currentId = current.parentId
            continue
          }

          const children = get().getChildren(currentId)
          const child = children.find((n) => n.name.toLowerCase() === seg.toLowerCase())
          if (!child) return { ok: false, reason: 'not-found' }
          if (child.locked) return { ok: false, reason: 'locked' }
          currentId = child.id
        }

        const node = nodes[currentId]
        if (!node) return { ok: false, reason: 'not-found' }
        return { ok: true, node }
      },

      create: (parentId, partial) => {
        const id = generateId()
        const now = Date.now()
        const node: FsNode = {
          ...partial,
          id,
          parentId,
          createdAt: now,
          modifiedAt: now,
        }
        set((s) => ({ nodes: { ...s.nodes, [id]: node } }))
        get().updateModifiedAt(parentId)
        return id
      },

      rename: (id, newName) => {
        set((s) => ({
          nodes: {
            ...s.nodes,
            [id]: { ...s.nodes[id], name: newName, modifiedAt: Date.now() },
          },
        }))
      },

      move: (id, newParentId) => {
        const now = Date.now()
        set((s) => ({
          nodes: {
            ...s.nodes,
            [id]: { ...s.nodes[id], parentId: newParentId, modifiedAt: now },
          },
        }))
        get().updateModifiedAt(newParentId)
      },

      remove: (id) => {
        const node = get().nodes[id]
        if (!node) return
        const { recycledId } = { recycledId: RECYCLED_ID }
        if (node.parentId === recycledId) {
          // Already in recycle bin — hard delete
          set((s) => {
            const next = { ...s.nodes }
            delete next[id]
            return { nodes: next }
          })
        } else {
          get().move(id, recycledId)
        }
      },

      writeContent: (id, content) => {
        const now = Date.now()
        set((s) => ({
          nodes: {
            ...s.nodes,
            [id]: {
              ...s.nodes[id],
              content,
              sizeBytes: new TextEncoder().encode(content).length,
              modifiedAt: now,
            },
          },
        }))
        const node = get().nodes[id]
        if (node?.parentId) get().updateModifiedAt(node.parentId)
      },

      setAttrs: (id, attrs) => {
        set((s) => ({
          nodes: {
            ...s.nodes,
            [id]: { ...s.nodes[id], attrs: { ...s.nodes[id]?.attrs, ...attrs } },
          },
        }))
      },

      updateModifiedAt: (id) => {
        const now = Date.now()
        set((s) => {
          if (!s.nodes[id]) return s
          return {
            nodes: { ...s.nodes, [id]: { ...s.nodes[id], modifiedAt: now } },
          }
        })
      },
    }),
    {
      name: 'win95-fs-v1',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (Object.keys(state.nodes).length === 0) {
          const seed = buildSeedTree()
          state.nodes = seed.nodes
          state.rootId = seed.rootId
        }
      },
    }
  )
)

// Initialize immediately if store is empty (not yet rehydrated)
const initFs = () => {
  const s = useFsStore.getState()
  if (Object.keys(s.nodes).length === 0) {
    const seed = buildSeedTree()
    useFsStore.setState({ nodes: seed.nodes, rootId: seed.rootId })
  }
}
initFs()
