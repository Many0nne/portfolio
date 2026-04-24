import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './TerminalApp.module.css'
import { useFsStore } from '../../fs/fsStore'
import { useWindowStore } from '../../store/windowStore'
import { useCasinoStore } from '../../store/casinoStore'
import { resolveAssociation } from '../../fs/associations'
import type { FsNode } from '../../fs/types'

interface Line {
  text: string
  type: 'output' | 'input' | 'error'
}

interface PendingPin {
  nodeId: string
}

type FsStoreState = ReturnType<typeof useFsStore.getState>

const WELCOME: Line[] = [
  'Microsoft(R) MS-DOS(R) Version 6.22',
  '(C)Copyright Microsoft Corp 1981-1994.',
  '',
  'Tapez HELP pour la liste des commandes.',
  '',
].map((text) => ({ text, type: 'output' as const }))

function buildTree(nodeId: string, prefix: string, isLast: boolean, fsStore: FsStoreState): string[] {
  const node = fsStore.nodes[nodeId]
  if (!node) return []
  const connector = isLast ? '└── ' : '├── '
  const lines: string[] = [`${prefix}${connector}${node.name}`]
  if (node.kind === 'folder' && !node.locked) {
    const children = fsStore.getChildren(nodeId).filter((c) => !c.attrs?.hidden && !c.attrs?.system)
    const extension = isLast ? '    ' : '│   '
    children.forEach((child, i) => {
      lines.push(...buildTree(child.id, prefix + extension, i === children.length - 1, fsStore))
    })
  }
  return lines
}

interface TerminalProps {
  windowId: string
}

export function TerminalApp({ windowId }: TerminalProps) {
  const fsStore = useFsStore() as FsStoreState
  const { openApp, closeWindow } = useWindowStore()
  const casinoStore = useCasinoStore()

  const rootId = fsStore.rootId
  const [cwdId, setCwdId] = useState(rootId)
  const [lines, setLines] = useState<Line[]>(WELCOME)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [awaitingPin, setAwaitingPin] = useState<PendingPin | null>(null)

  const outputRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const isNearBottom = useCallback((el: HTMLDivElement) => {
    return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) <= 4
  }, [])

  useEffect(() => {
    const output = outputRef.current
    if (!output || !shouldAutoScrollRef.current) return
    output.scrollTop = output.scrollHeight
  }, [lines])

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleOutputScroll = useCallback(() => {
    const output = outputRef.current
    if (!output) return
    shouldAutoScrollRef.current = isNearBottom(output)
  }, [isNearBottom])

  const getPromptPath = useCallback(() => {
    return fsStore.getPath(cwdId)
  }, [cwdId, fsStore])

  const push = useCallback((...newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines])
  }, [])

  const out = (text: string) => ({ text, type: 'output' as const })
  const err = (text: string) => ({ text, type: 'error' as const })

  const handlePin = useCallback((pin: string) => {
    if (!awaitingPin) return
    const inputLine: Line = { text: `PIN: ${'*'.repeat(pin.length)}`, type: 'input' }
    const node = fsStore.nodes[awaitingPin.nodeId]
    if (node?.locked && pin === node.locked.pin) {
      setCwdId(awaitingPin.nodeId)
      setAwaitingPin(null)
      push(inputLine, out('Accès autorisé.'), out(''))
    } else {
      setAwaitingPin(null)
      push(inputLine, err('PIN incorrect. Accès refusé.'), out(''))
    }
  }, [awaitingPin, fsStore.nodes, push])

  const resolvePathArg = useCallback((arg: string): { ok: true; node: FsNode } | { ok: false; msg: string } => {
    const result = fsStore.resolvePath(arg, cwdId)
    if (!result.ok) {
      if (result.reason === 'locked') return { ok: false, msg: 'Accès refusé : dossier protégé.' }
      return { ok: false, msg: `Le chemin spécifié est introuvable.` }
    }
    return result
  }, [cwdId, fsStore])

  const handleEcho = useCallback((inputLine: Line, raw: string) => {
    const gtgt = raw.indexOf('>>')
    const gt = raw.indexOf('>')

    if (gtgt > 0) {
      const text = raw.slice(0, gtgt).trim()
      const filePart = raw.slice(gtgt + 2).trim()
      const result = fsStore.resolvePath(filePart, cwdId)
      if (result.ok && result.node.kind === 'file') {
        fsStore.writeContent(result.node.id, (result.node.content ?? '') + '\n' + text)
        push(inputLine, out(''))
      } else {
        const parentPath = filePart.includes('\\') ? filePart.slice(0, filePart.lastIndexOf('\\')) : ''
        const parentId = parentPath ? fsStore.resolvePath(parentPath, cwdId) : { ok: true as const, node: fsStore.nodes[cwdId] }
        const fileName = filePart.includes('\\') ? filePart.slice(filePart.lastIndexOf('\\') + 1) : filePart
        if (parentId.ok && parentId.node.kind === 'folder') {
          fsStore.create(parentId.node.id, { name: fileName, kind: 'file', content: text, mimeType: 'text/plain', sizeBytes: new TextEncoder().encode(text).length })
          push(inputLine, out(''))
        } else {
          push(inputLine, err('Impossible d\'écrire le fichier.'), out(''))
        }
      }
      return
    }

    if (gt > 0) {
      const text = raw.slice(0, gt).trim()
      const filePart = raw.slice(gt + 1).trim()
      const result = fsStore.resolvePath(filePart, cwdId)
      if (result.ok && result.node.kind === 'file') {
        fsStore.writeContent(result.node.id, text)
        push(inputLine, out(''))
      } else {
        const parentPath = filePart.includes('\\') ? filePart.slice(0, filePart.lastIndexOf('\\')) : ''
        const parentId = parentPath ? fsStore.resolvePath(parentPath, cwdId) : { ok: true as const, node: fsStore.nodes[cwdId] }
        const fileName = filePart.includes('\\') ? filePart.slice(filePart.lastIndexOf('\\') + 1) : filePart
        if (parentId.ok && parentId.node.kind === 'folder') {
          fsStore.create(parentId.node.id, { name: fileName, kind: 'file', content: text, mimeType: 'text/plain', sizeBytes: new TextEncoder().encode(text).length })
          push(inputLine, out(''))
        } else {
          push(inputLine, err('Impossible d\'écrire le fichier.'), out(''))
        }
      }
      return
    }

    push(inputLine, out(raw), out(''))
  }, [cwdId, fsStore, push])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const raw = input.trim()
    if (!raw) return
    setInput('')

    if (awaitingPin) { handlePin(raw); return }

    const newHistory = [raw, ...history].slice(0, 50)
    setHistory(newHistory)
    setHistoryIndex(-1)

    const inputLine: Line = { text: `${getPromptPath()}> ${raw}`, type: 'input' }
    const lower = raw.toLowerCase()
    const spaceIdx = lower.indexOf(' ')
    const command = spaceIdx >= 0 ? lower.slice(0, spaceIdx) : lower
    const arg = spaceIdx >= 0 ? raw.slice(spaceIdx + 1).trim() : ''

    // Easter egg
    if (raw === '777') {
      casinoStore.unlockCasino()
      push(
        inputLine,
        out(''),
        out('  *** CASINO DÉVERROUILLÉ ***'),
        out('  Le Casino et la Banque sont maintenant accessibles.'),
        out('')
      )
      return
    }

    if (command === 'cls' || command === 'clear') { setLines([]); return }

    if (command === 'exit') { closeWindow(windowId); return }

    if (command === 'cd' || command === 'chdir') {
      if (!arg) {
        push(inputLine, out(getPromptPath()), out(''))
        return
      }
      const result = fsStore.resolvePath(arg, cwdId)
      if (!result.ok) {
        if (result.reason === 'locked') {
          const target = findLockedNode(arg, cwdId, fsStore)
          if (target) {
            setAwaitingPin({ nodeId: target.id })
            push(inputLine, out('Dossier protégé. Entrez le PIN :'))
            return
          }
        }
        push(inputLine, err('Le chemin spécifié est introuvable.'), out(''))
        return
      }
      if (result.node.kind !== 'folder') {
        push(inputLine, err(`'${arg}' n'est pas un répertoire.`), out(''))
        return
      }
      setCwdId(result.node.id)
      push(inputLine)
      return
    }

    if (command === 'dir' || command === 'ls') {
      const targetId = arg ? fsStore.resolvePath(arg, cwdId) : { ok: true as const, node: fsStore.nodes[cwdId] }
      if (!targetId.ok || targetId.node.kind !== 'folder') {
        push(inputLine, err('Chemin introuvable.'), out(''))
        return
      }
      const children = fsStore.getChildren(targetId.node.id)
      const path = fsStore.getPath(targetId.node.id)
      const header = [out(` Répertoire de ${path}`), out('')]
      const entries = children
        .filter((f) => !f.attrs?.hidden)
        .map((f) => {
          const tag = f.kind === 'folder' ? '<REP>  ' : '       '
          const date = new Date(f.modifiedAt).toLocaleDateString('fr-FR')
          const size = f.kind === 'folder' ? '' : `${f.sizeBytes} o`
          return out(` ${date}  ${tag}  ${size.padStart(10)}  ${f.name}`)
        })
      const footer = [out(''), out(`    ${children.length} élément(s)`), out('')]
      push(inputLine, ...header, ...entries, ...footer)
      return
    }

    if (command === 'pwd') {
      push(inputLine, out(getPromptPath()), out(''))
      return
    }

    if (command === 'type' || command === 'cat') {
      if (!arg) { push(inputLine, err('Usage : type <fichier>'), out('')); return }
      const r = resolvePathArg(arg)
      if (!r.ok) { push(inputLine, err(r.msg), out('')); return }
      if (r.node.kind !== 'file') { push(inputLine, err(`'${arg}' est un répertoire.`), out('')); return }
      const lines = (r.node.content ?? '').split('\n')
      push(inputLine, ...lines.map(out), out(''))
      return
    }

    if (command === 'echo') {
      handleEcho(inputLine, arg)
      return
    }

    if (command === 'mkdir' || command === 'md') {
      if (!arg) { push(inputLine, err('Usage : mkdir <nom>'), out('')); return }
      const existing = fsStore.resolvePath(arg, cwdId)
      if (existing.ok) { push(inputLine, err('Le dossier existe déjà.'), out('')); return }
      const parentPath = arg.includes('\\') ? arg.slice(0, arg.lastIndexOf('\\')) : ''
      const name = arg.includes('\\') ? arg.slice(arg.lastIndexOf('\\') + 1) : arg
      const parentId = parentPath ? fsStore.resolvePath(parentPath, cwdId) : { ok: true as const, node: fsStore.nodes[cwdId] }
      if (!parentId.ok || parentId.node.kind !== 'folder') { push(inputLine, err('Chemin parent introuvable.'), out('')); return }
      fsStore.create(parentId.node.id, { name, kind: 'folder', sizeBytes: 0 })
      push(inputLine, out(''))
      return
    }

    if (command === 'rmdir' || command === 'rd') {
      if (!arg) { push(inputLine, err('Usage : rmdir <nom>'), out('')); return }
      const r = resolvePathArg(arg)
      if (!r.ok) { push(inputLine, err(r.msg), out('')); return }
      if (r.node.kind !== 'folder') { push(inputLine, err(`'${arg}' n'est pas un répertoire.`), out('')); return }
      const children = fsStore.getChildren(r.node.id)
      if (children.length > 0 && !lower.includes('/s')) { push(inputLine, err('Le dossier n\'est pas vide. Utilisez rmdir /S pour supprimer récursivement.'), out('')); return }
      fsStore.remove(r.node.id)
      push(inputLine, out(''))
      return
    }

    if (command === 'del' || command === 'erase') {
      if (!arg) { push(inputLine, err('Usage : del <fichier>'), out('')); return }
      const r = resolvePathArg(arg)
      if (!r.ok) { push(inputLine, err(r.msg), out('')); return }
      if (r.node.kind !== 'file') { push(inputLine, err(`'${arg}' est un répertoire. Utilisez rmdir.`), out('')); return }
      fsStore.remove(r.node.id)
      push(inputLine, out(''))
      return
    }

    if (command === 'ren' || command === 'rename') {
      const parts = arg.split(/\s+/)
      if (parts.length < 2) { push(inputLine, err('Usage : ren <source> <dest>'), out('')); return }
      const r = resolvePathArg(parts[0])
      if (!r.ok) { push(inputLine, err(r.msg), out('')); return }
      fsStore.rename(r.node.id, parts[1])
      push(inputLine, out(''))
      return
    }

    if (command === 'copy') {
      const parts = arg.split(/\s+/)
      if (parts.length < 2) { push(inputLine, err('Usage : copy <source> <dest>'), out('')); return }
      const src = resolvePathArg(parts[0])
      if (!src.ok) { push(inputLine, err(src.msg), out('')); return }
      if (src.node.kind !== 'file') { push(inputLine, err('copy ne supporte que les fichiers.'), out('')); return }
      const destPath = parts[1]
      const destDir = destPath.includes('\\') ? fsStore.resolvePath(destPath.slice(0, destPath.lastIndexOf('\\')), cwdId) : { ok: true as const, node: fsStore.nodes[cwdId] }
      const destName = destPath.includes('\\') ? destPath.slice(destPath.lastIndexOf('\\') + 1) : destPath
      if (!destDir.ok || destDir.node.kind !== 'folder') { push(inputLine, err('Dossier destination introuvable.'), out('')); return }
      fsStore.create(destDir.node.id, { name: destName, kind: 'file', content: src.node.content ?? '', mimeType: src.node.mimeType, sizeBytes: src.node.sizeBytes })
      push(inputLine, out(`1 fichier(s) copié(s).`), out(''))
      return
    }

    if (command === 'move') {
      const parts = arg.split(/\s+/)
      if (parts.length < 2) { push(inputLine, err('Usage : move <source> <dest>'), out('')); return }
      const src = resolvePathArg(parts[0])
      if (!src.ok) { push(inputLine, err(src.msg), out('')); return }
      const destDir = fsStore.resolvePath(parts[1], cwdId)
      if (!destDir.ok || destDir.node.kind !== 'folder') { push(inputLine, err('Dossier destination introuvable.'), out('')); return }
      fsStore.move(src.node.id, destDir.node.id)
      push(inputLine, out(''))
      return
    }

    if (command === 'start' || command === 'open') {
      if (!arg) { push(inputLine, err('Usage : start <fichier>'), out('')); return }
      const r = resolvePathArg(arg)
      if (!r.ok) { push(inputLine, err(`Fichier introuvable : '${arg}'`), out('')); return }
      if (r.node.kind === 'folder' && r.node.locked) {
        setAwaitingPin({ nodeId: r.node.id })
        push(inputLine, out('Dossier protégé. Entrez le PIN :'))
        return
      }
      const assoc = resolveAssociation(r.node)
      if (!assoc) { push(inputLine, err('Aucune application associée.'), out('')); return }
      openApp(assoc.app, { fileId: r.node.kind === 'file' ? r.node.id : undefined, props: assoc.props ?? {} })
      push(inputLine, out(`Lancement de ${r.node.name}...`), out(''))
      return
    }

    if (command === 'tree') {
      const targetId = arg ? fsStore.resolvePath(arg, cwdId) : { ok: true as const, node: fsStore.nodes[cwdId] }
      if (!targetId.ok) { push(inputLine, err('Chemin introuvable.'), out('')); return }
      const treeLines = buildTree(targetId.node.id, '', true, fsStore)
      push(inputLine, out(fsStore.getPath(targetId.node.id)), ...treeLines.map(out), out(''))
      return
    }

    if (command === 'ver') {
      push(inputLine, out('Microsoft(R) MS-DOS(R) Version 6.22'), out('(C)Copyright Microsoft Corp 1981-1994.'), out(''))
      return
    }

    if (command === 'whoami') {
      push(inputLine, out('TERRY\\terry'), out(''))
      return
    }

    if (command === 'date') {
      push(inputLine, out(new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })), out(''))
      return
    }

    if (command === 'time') {
      push(inputLine, out(new Date().toLocaleTimeString('fr-FR')), out(''))
      return
    }

    if (command === 'help') {
      push(
        inputLine,
        out('Commandes disponibles :'),
        out('  cd <path>      — naviguer (alias : chdir)'),
        out('  dir [path]     — lister le répertoire (alias : ls)'),
        out('  pwd            — afficher le chemin courant'),
        out('  type <file>    — afficher le contenu (alias : cat)'),
        out('  echo <txt>     — afficher du texte'),
        out('  echo <txt> > <file>  — écrire dans un fichier'),
        out('  echo <txt> >> <file> — ajouter à un fichier'),
        out('  mkdir <name>   — créer un dossier (alias : md)'),
        out('  rmdir <name>   — supprimer un dossier (alias : rd)'),
        out('  del <file>     — supprimer un fichier (alias : erase)'),
        out('  ren <a> <b>    — renommer (alias : rename)'),
        out('  copy <src> <dst> — copier un fichier'),
        out('  move <src> <dst> — déplacer un fichier'),
        out('  start <file>   — ouvrir avec app associée (alias : open)'),
        out('  tree [path]    — arbre ASCII'),
        out('  whoami         — utilisateur courant'),
        out('  date / time    — date et heure'),
        out('  ver            — version du système'),
        out('  cls / clear    — effacer l\'écran'),
        out('  exit           — fermer le terminal'),
        out('  help           — cette aide'),
        out('')
      )
      return
    }

    push(
      inputLine,
      err(`'${command}' n'est pas reconnu comme commande interne`),
      err('ou externe, un programme exécutable ou un fichier de commandes.'),
      out('')
    )
  }, [input, history, awaitingPin, handlePin, handleEcho, getPromptPath, cwdId, fsStore, openApp, closeWindow, windowId, casinoStore, resolvePathArg, push])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (awaitingPin) return
      const raw = input.trim()
      if (!raw) return
      const firstSpace = raw.indexOf(' ')
      const rawCommand = firstSpace >= 0 ? raw.slice(0, firstSpace) : raw
      const command = rawCommand.toLowerCase()
      const rawArg = firstSpace >= 0 ? raw.slice(firstSpace + 1) : ''
      if (!rawArg) return

      const pathCommands = ['cd', 'chdir', 'dir', 'ls', 'type', 'cat', 'start', 'open', 'del', 'erase', 'ren', 'rename', 'copy', 'move', 'rmdir', 'rd', 'mkdir', 'md', 'tree']
      if (!pathCommands.includes(command)) return

      const foldersOnly = ['cd', 'chdir', 'rmdir', 'rd'].includes(command)
      const normalized = rawArg.replace(/\//g, '\\')
      const lastSlash = normalized.lastIndexOf('\\')
      const parentPart = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : ''
      const partial = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized

      const parentResult = parentPart
        ? fsStore.resolvePath(parentPart, cwdId)
        : { ok: true as const, node: fsStore.nodes[cwdId] }

      if (!parentResult.ok || parentResult.node.kind !== 'folder') return

      const children = fsStore.getChildren(parentResult.node.id)
      const pool = foldersOnly ? children.filter((n) => n.kind === 'folder') : children
      const lower2 = partial.toLowerCase()
      const match = pool.find((n) => n.name.toLowerCase().startsWith(lower2))
      if (match && match.name.toLowerCase() !== partial.toLowerCase()) {
        setInput(`${rawCommand} ${parentPart}${match.name}`)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(historyIndex + 1, history.length - 1)
      setHistoryIndex(next)
      setInput(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = historyIndex - 1
      if (next < 0) { setHistoryIndex(-1); setInput('') }
      else { setHistoryIndex(next); setInput(history[next] ?? '') }
    }
  }, [awaitingPin, input, cwdId, fsStore, history, historyIndex])

  const prompt = awaitingPin ? 'PIN:' : `${getPromptPath()}>`

  return (
    <div
      className={styles.terminal}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const selection = window.getSelection()
        const hasSelection = Boolean(selection && !selection.isCollapsed)
        if (target.closest(`.${styles.output}`) && hasSelection) return
        inputRef.current?.focus()
      }}
    >
      <div ref={outputRef} className={styles.output} aria-live="polite" onScroll={handleOutputScroll}>
        {lines.map((line, i) => (
          <div key={i} className={`${styles.line} ${styles[line.type]}`}>{line.text || ' '}</div>
        ))}
      </div>
      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <span className={styles.prompt}>{prompt}</span>
        <input
          ref={inputRef}
          className={styles.input}
          type={awaitingPin ? 'password' : 'text'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-label="Commande terminal"
        />
      </form>
    </div>
  )
}

function findLockedNode(path: string, cwdId: string, fsStore: FsStoreState): FsNode | null {
  const normalized = path.replace(/\//g, '\\')
  let currentId = /^[cC]:/.test(normalized) ? fsStore.rootId : cwdId
  const segments = (normalized.replace(/^[cC]:\\?/, '').split('\\').filter(Boolean))

  for (const seg of segments) {
    if (seg === '.' || seg === '..') continue
    const children = fsStore.getChildren(currentId)
    const child = children.find((n) => n.name.toLowerCase() === seg.toLowerCase())
    if (!child) return null
    if (child.locked) return child
    currentId = child.id
  }
  return null
}
