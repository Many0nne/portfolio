import type { VirtualFile } from '../data/filesystem'

export function getPathString(cwd: VirtualFile[]): string {
  if (cwd.length === 0) return 'C:\\PORTFOLIO'
  return 'C:\\PORTFOLIO\\' + cwd.map((f) => f.name.toUpperCase()).join('\\')
}

export function getCurrentChildren(cwd: VirtualFile[], root: VirtualFile[]): VirtualFile[] {
  if (cwd.length === 0) return root
  return cwd[cwd.length - 1].children ?? []
}

export function resolveEntry(name: string, cwd: VirtualFile[], root: VirtualFile[]): VirtualFile | null {
  const children = getCurrentChildren(cwd, root)
  const normalized = name.toLowerCase()
  return children.find((f) => f.name.toLowerCase() === normalized) ?? null
}

export function findFolderPathById(root: VirtualFile[], folderId: string): VirtualFile[] | null {
  const walk = (nodes: VirtualFile[], path: VirtualFile[]): VirtualFile[] | null => {
    for (const node of nodes) {
      if (node.type !== 'folder') continue

      const nextPath = [...path, node]
      if (node.id === folderId) return nextPath

      const found = walk(node.children ?? [], nextPath)
      if (found) return found
    }

    return null
  }

  return walk(root, [])
}
