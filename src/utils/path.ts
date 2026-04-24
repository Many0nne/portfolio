export function splitPath(p: string): string[] {
  const normalized = p.replace(/\//g, '\\')
  const parts = normalized.split('\\').filter(Boolean)
  if (parts.length > 0 && /^[a-zA-Z]:$/.test(parts[0])) return parts.slice(1)
  return parts
}

export function joinPath(...parts: string[]): string {
  const allParts: string[] = []
  for (const part of parts) {
    const segs = part.replace(/\//g, '\\').split('\\').filter(Boolean)
    for (const seg of segs) {
      if (!/^[a-zA-Z]:$/.test(seg)) allParts.push(seg)
    }
  }
  const first = parts[0] ?? ''
  const hasDrive = /^[a-zA-Z]:/.test(first)
  const drive = hasDrive ? first.slice(0, 2) : ''
  return drive ? `${drive}\\${allParts.join('\\')}` : allParts.join('\\')
}

export function normalize(p: string): string {
  const normalized = p.replace(/\//g, '\\')
  const hasDrive = /^[a-zA-Z]:/.test(normalized)
  const drive = hasDrive ? normalized.slice(0, 2) : ''
  const parts = normalized.replace(/^[a-zA-Z]:/, '').split('\\').filter(Boolean)
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') { resolved.pop(); continue }
    resolved.push(part)
  }
  const result = resolved.join('\\')
  return drive ? (result ? `${drive}\\${result}` : `${drive}\\`) : result
}

export function isAbsolute(p: string): boolean {
  return /^[a-zA-Z]:/.test(p) || p.startsWith('\\')
}

export function dirname(p: string): string {
  const normalized = p.replace(/\//g, '\\').replace(/\\+$/, '')
  const lastSlash = normalized.lastIndexOf('\\')
  if (lastSlash < 0) return '.'
  if (lastSlash === 2 && /^[a-zA-Z]:\\$/.test(normalized.slice(0, 3))) return normalized.slice(0, 3)
  const result = normalized.slice(0, lastSlash)
  return result || '\\'
}

export function basename(p: string, ext?: string): string {
  const normalized = p.replace(/\//g, '\\').replace(/\\+$/, '')
  const lastSlash = normalized.lastIndexOf('\\')
  const base = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized
  if (ext && base.toLowerCase().endsWith(ext.toLowerCase())) return base.slice(0, base.length - ext.length)
  return base
}

export function extname(p: string): string {
  const base = basename(p)
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot).toLowerCase()
}
