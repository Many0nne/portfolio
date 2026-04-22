import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './TerminalApp.module.css'
import { filesystem } from '../../data/filesystem'
import type { VirtualFile } from '../../data/filesystem'
import { useWindowStore } from '../../store/windowStore'
import { getPathString, getCurrentChildren, resolveEntry } from '../../utils/fsUtils'

interface Line {
  text: string
  type: 'output' | 'input' | 'error'
}

interface PendingPin {
  targetCwd: VirtualFile[]
}

interface ShellLocation {
  atDriveRoot: boolean
  cwd: VirtualFile[]
}

type CdResolution =
  | { kind: 'ok'; location: ShellLocation }
  | { kind: 'locked'; entry: VirtualFile; parentCwd: VirtualFile[] }
  | { kind: 'not-directory'; entry: VirtualFile }
  | { kind: 'not-found' }

function getChildrenForLocation(location: ShellLocation): VirtualFile[] {
  if (location.atDriveRoot) return DRIVE_ROOT_CHILDREN
  return getCurrentChildren(location.cwd, filesystem)
}

function pickBestCandidate(partial: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null
  const normalizedPartial = partial.toLowerCase()

  const prefixMatches = candidates
    .filter((candidate) => candidate.toLowerCase().startsWith(normalizedPartial))
    .sort((a, b) => {
      const extraA = a.length - normalizedPartial.length
      const extraB = b.length - normalizedPartial.length
      if (extraA !== extraB) return extraA - extraB
      return a.localeCompare(b)
    })

  if (prefixMatches.length > 0) return prefixMatches[0]

  return null
}

function autocompletePathArg(
  rawArg: string,
  location: ShellLocation,
  foldersOnly: boolean,
): string | null {
  const arg = rawArg.trim()
  if (!arg) return null

  const normalized = arg.replace(/\//g, '\\')
  const lastSlash = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'))
  const parentPart = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : ''
  const partial = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized

  const parentLocation = parentPart
    ? resolveCdPath(parentPart, location)
    : ({ kind: 'ok', location } as const)

  if (parentLocation.kind !== 'ok') return null

  const children = getChildrenForLocation(parentLocation.location)
  const pool = foldersOnly ? children.filter((entry) => entry.type === 'folder') : children
  const best = pickBestCandidate(partial, pool.map((entry) => entry.name))
  if (!best) return null

  return `${parentPart}${best}`
}

const STATIC_COMMANDS: Record<string, () => string[]> = {
  help: () => [
    'Commandes disponibles :',
    "  cd <nom>    — naviguer dans un sous-dossier",
    "  cd ..       — remonter au dossier parent",
    "  chdir       — alias de cd",
    "  dir         — lister le contenu du répertoire courant",
    "  ls          — alias de dir",
    "  pwd         — afficher le chemin courant",
    "  start <nom> — ouvrir un fichier ou dossier",
    "  open <nom>  — alias de start",
    "  cls         — effacer l'écran",
    "  clear       — alias de cls",
    "  ver         — version du système",
    "  help        — afficher cette aide",
    '',
  ],
  ver: () => [
    'Microsoft(R) MS-DOS(R) Version 6.22',
    '(C)Copyright Microsoft Corp 1981-1994.',
    '',
  ],
}

const WELCOME: Line[] = [
  'Microsoft(R) MS-DOS(R) Version 6.22',
  '(C)Copyright Microsoft Corp 1981-1994.',
  '',
  'Tapez HELP pour la liste des commandes.',
  '',
].map((text) => ({ text, type: 'output' as const }))

const DRIVE_ROOT_CHILDREN: VirtualFile[] = [
  {
    id: 'portfolio-root',
    name: 'portfolio',
    type: 'folder',
    icon: 'folder',
    metadata: { size: '—', modified: '22/04/2026' },
  },
]

function getLocationSegments(location: ShellLocation): string[] {
  if (location.atDriveRoot) return []
  return ['portfolio', ...location.cwd.map((entry) => entry.name.toLowerCase())]
}

function resolveCdPath(inputPath: string, location: ShellLocation): CdResolution {
  let normalized = inputPath.trim().replace(/\//g, '\\')
  if (!normalized) return { kind: 'ok', location }

  let absolute = false
  if (/^[a-z]:/i.test(normalized)) {
    if (!/^c:/i.test(normalized)) return { kind: 'not-found' }
    absolute = true
    normalized = normalized.slice(2)
  }

  if (normalized.startsWith('\\')) {
    absolute = true
    normalized = normalized.replace(/^\\+/, '')
  }

  const tokens = normalized.split('\\').filter(Boolean)
  const segments = absolute ? [] : getLocationSegments(location)

  for (const rawToken of tokens) {
    const token = rawToken.toLowerCase()
    if (token === '.') continue
    if (token === '..') {
      if (segments.length > 0) segments.pop()
      continue
    }
    segments.push(token)
  }

  if (segments.length === 0) {
    return { kind: 'ok', location: { atDriveRoot: true, cwd: [] } }
  }

  if (segments[0] !== 'portfolio') {
    return { kind: 'not-found' }
  }

  if (segments.length === 1) {
    return { kind: 'ok', location: { atDriveRoot: false, cwd: [] } }
  }

  const resolvedCwd: VirtualFile[] = []
  let children = filesystem

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    const entry = children.find((candidate) => candidate.name.toLowerCase() === segment)

    if (!entry) return { kind: 'not-found' }
    if (entry.type !== 'folder') return { kind: 'not-directory', entry }
    if (entry.locked) return { kind: 'locked', entry, parentCwd: [...resolvedCwd] }

    resolvedCwd.push(entry)
    children = entry.children ?? []
  }

  return { kind: 'ok', location: { atDriveRoot: false, cwd: resolvedCwd } }
}

export function TerminalApp() {
  const [atDriveRoot, setAtDriveRoot] = useState(false)
  const [cwd, setCwd] = useState<VirtualFile[]>([])
  const [lines, setLines] = useState<Line[]>(WELCOME)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [awaitingPin, setAwaitingPin] = useState<PendingPin | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const { openWindow } = useWindowStore()

  const isNearBottom = useCallback((el: HTMLDivElement) => {
    return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) <= 4
  }, [])

  useEffect(() => {
    const output = outputRef.current
    if (!output || !shouldAutoScrollRef.current) return
    output.scrollTop = output.scrollHeight
  }, [lines])

  const handleOutputScroll = useCallback(() => {
    const output = outputRef.current
    if (!output) return
    shouldAutoScrollRef.current = isNearBottom(output)
  }, [isNearBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const getTerminalPath = useCallback(() => {
    return atDriveRoot ? 'C:\\' : getPathString(cwd)
  }, [atDriveRoot, cwd])

  const getVisibleChildren = useCallback(() => {
    return atDriveRoot ? DRIVE_ROOT_CHILDREN : getCurrentChildren(cwd, filesystem)
  }, [atDriveRoot, cwd])

  const handlePin = useCallback(
    (pin: string) => {
      if (!awaitingPin) return
      const inputLine: Line = { text: `PIN: ${'*'.repeat(pin.length)}`, type: 'input' }
      if (pin === '95') {
        setAtDriveRoot(false)
        setCwd(awaitingPin.targetCwd)
        setAwaitingPin(null)
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: 'Accès autorisé.', type: 'output' },
          { text: '', type: 'output' },
        ])
      } else {
        setAwaitingPin(null)
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: 'PIN incorrect. Accès refusé.', type: 'error' },
          { text: '', type: 'output' },
        ])
      }
    },
    [awaitingPin],
  )

  const handleCd = useCallback(
    (inputLine: Line, arg: string) => {
      const resolution = resolveCdPath(arg, { atDriveRoot, cwd })

      if (resolution.kind === 'not-found') {
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: "Le chemin d'accès spécifié est introuvable.", type: 'error' },
          { text: '', type: 'output' },
        ])
        return
      }

      if (resolution.kind === 'not-directory') {
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: `'${resolution.entry.name}' n'est pas un répertoire.`, type: 'error' },
          { text: '', type: 'output' },
        ])
        return
      }

      if (resolution.kind === 'locked') {
        setAwaitingPin({
          targetCwd: [...resolution.parentCwd, resolution.entry],
        })
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: 'Dossier protégé. Entrez le PIN :', type: 'output' },
        ])
        return
      }

      setAtDriveRoot(resolution.location.atDriveRoot)
      setCwd(resolution.location.cwd)
      setLines((prev) => [...prev, inputLine])
    },
    [atDriveRoot, cwd],
  )

  const handleDir = useCallback(
    (inputLine: Line) => {
      const children = getVisibleChildren()
      const path = getTerminalPath()
      const header: Line[] = [
        { text: ` Répertoire de ${path}`, type: 'output' },
        { text: '', type: 'output' },
      ]
      const entries: Line[] = children.map((f) => {
        const tag = f.type === 'folder' ? '<REP>  ' : '       '
        const size = f.type === 'folder' ? '' : f.metadata.size
        const date = f.metadata.modified
        return { text: ` ${date}  ${tag}  ${size.padStart(7)}  ${f.name}`, type: 'output' as const }
      })
      const footer: Line[] = [
        { text: '', type: 'output' },
        { text: `    ${children.length} élément(s)`, type: 'output' },
        { text: '', type: 'output' },
      ]
      setLines((prev) => [...prev, inputLine, ...header, ...entries, ...footer])
    },
    [getTerminalPath, getVisibleChildren],
  )

  const handleStart = useCallback(
    (inputLine: Line, arg: string) => {
      if (!arg) {
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: 'Usage : start <nom_fichier>', type: 'error' },
          { text: '', type: 'output' },
        ])
        return
      }

      const normalizedArg = arg.trim().replace(/\//g, '\\').toLowerCase()
      const target = normalizedArg.replace(/\\+$/, '')

      if (atDriveRoot) {
        if (target === 'portfolio' || target === '\\portfolio' || target === 'c:\\portfolio') {
          setAtDriveRoot(false)
          setCwd([])
          setLines((prev) => [...prev, inputLine])
          return
        }

        setLines((prev) => [
          ...prev,
          inputLine,
          { text: `Fichier introuvable : '${arg}'`, type: 'error' },
          { text: '', type: 'output' },
        ])
        return
      }

      const entry = resolveEntry(target, cwd, filesystem)
      if (!entry) {
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: `Fichier introuvable : '${arg}'`, type: 'error' },
          { text: '', type: 'output' },
        ])
        return
      }
      if (entry.type === 'folder') {
        if (entry.locked) {
          setAwaitingPin({ targetCwd: [...cwd, entry] })
          setLines((prev) => [
            ...prev,
            inputLine,
            { text: 'Dossier protégé. Entrez le PIN :', type: 'output' },
          ])
        } else {
          setCwd((prev) => [...prev, entry])
          setLines((prev) => [...prev, inputLine])
        }
        return
      }
      if (!entry.appType) {
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: "Impossible d'ouvrir : aucune application associée.", type: 'error' },
          { text: '', type: 'output' },
        ])
        return
      }
      openWindow(entry.appType, entry.appProps)
      setLines((prev) => [
        ...prev,
        inputLine,
        { text: `Lancement de ${entry.name}...`, type: 'output' },
        { text: '', type: 'output' },
      ])
    },
    [atDriveRoot, cwd, openWindow],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const raw = input.trim()
      if (!raw) return

      setInput('')

      if (awaitingPin) {
        handlePin(raw)
        return
      }

      const lower = raw.toLowerCase()
      const spaceIdx = lower.indexOf(' ')
      const command = spaceIdx >= 0 ? lower.slice(0, spaceIdx) : lower
      const arg = spaceIdx >= 0 ? raw.slice(spaceIdx + 1).trim() : ''

      const newHistory = [raw, ...history].slice(0, 50)
      setHistory(newHistory)
      setHistoryIndex(-1)

      const inputLine: Line = { text: `${getTerminalPath()}> ${raw}`, type: 'input' }

      if (command === 'cls' || command === 'clear') {
        setLines([])
        return
      }

      if (command === 'cd' || command === 'chdir') {
        if (!arg) {
          setLines((prev) => [
            ...prev,
            inputLine,
            { text: getTerminalPath(), type: 'output' },
            { text: '', type: 'output' },
          ])
        } else {
          handleCd(inputLine, arg)
        }
        return
      }

      if (command === 'dir' || command === 'ls') {
        handleDir(inputLine)
        return
      }

      if (command === 'pwd') {
        setLines((prev) => [
          ...prev,
          inputLine,
          { text: getTerminalPath(), type: 'output' },
          { text: '', type: 'output' },
        ])
        return
      }

      if (command === 'start' || command === 'open') {
        handleStart(inputLine, arg)
        return
      }

      const handler = STATIC_COMMANDS[command]
      const outputLines: Line[] = handler
        ? handler().map((t) => ({ text: t, type: 'output' as const }))
        : [
            { text: `'${command}' n'est pas reconnu comme commande interne`, type: 'error' },
            { text: 'ou externe, un programme exécutable ou un fichier de commandes.', type: 'error' },
            { text: '', type: 'output' },
          ]

      setLines((prev) => [...prev, inputLine, ...outputLines])
    },
    [input, history, awaitingPin, handlePin, handleCd, handleDir, handleStart, getTerminalPath],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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

        const location: ShellLocation = { atDriveRoot, cwd }
        const foldersOnly = command === 'cd' || command === 'chdir'
        const supportsPathCompletion = foldersOnly || command === 'start' || command === 'open'
        if (!supportsPathCompletion) return

        const completedArg = autocompletePathArg(rawArg, location, foldersOnly)
        if (!completedArg || completedArg.toLowerCase() === rawArg.toLowerCase()) return

        setInput(`${rawCommand} ${completedArg}`)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = Math.min(historyIndex + 1, history.length - 1)
        setHistoryIndex(next)
        setInput(history[next] ?? '')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = historyIndex - 1
        if (next < 0) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(next)
          setInput(history[next] ?? '')
        }
      }
    },
    [awaitingPin, input, atDriveRoot, cwd, history, historyIndex],
  )

  const prompt = awaitingPin ? 'PIN:' : `${getTerminalPath()}>`

  return (
    <div
      className={styles.terminal}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const selection = window.getSelection()
        const hasTextSelection = Boolean(selection && !selection.isCollapsed)
        if (target.closest(`.${styles.output}`) && hasTextSelection) return
        inputRef.current?.focus()
      }}
    >
      <div
        ref={outputRef}
        className={styles.output}
        aria-live="polite"
        onScroll={handleOutputScroll}
      >
        {lines.map((line, i) => (
          <div key={i} className={`${styles.line} ${styles[line.type]}`}>
            {line.text || ' '}
          </div>
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
