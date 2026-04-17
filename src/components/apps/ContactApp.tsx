import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './ContactApp.module.css'

interface Line {
  text: string
  type: 'output' | 'input' | 'error'
}

const COMMANDS: Record<string, () => string[]> = {
  help: () => [
    'Commandes disponibles :',
    '  help      — affiche cette aide',
    '  whoami    — affiche le profil',
    '  email     — adresse e-mail',
    '  github    — URL GitHub',
    '  linkedin  — URL LinkedIn',
    '  clear     — efface le terminal',
    '',
  ],
  whoami: () => [
    'Terry BARILLON',
    'Full-Stack Developer · TypeScript · React · Node.js',
    '',
  ],
  email: () => ['terrybarillon.akajoule@gmail.com', ''],
  github: () => ['https://github.com/Many0nne', ''],
  linkedin: () => ['https://linkedin.com/in/terry-barillon', ''],
}

const WELCOME = [
  'Microsoft(R) MS-DOS(R) Version 6.22',
  '(C)Copyright Microsoft Corp 1981-1994.',
  '',
  'Bienvenue dans le terminal de contact.',
  'Tapez HELP pour la liste des commandes.',
  '',
]

export function ContactApp() {
  const [lines, setLines] = useState<Line[]>(WELCOME.map((t) => ({ text: t, type: 'output' })))
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const cmd = input.trim().toLowerCase()
      if (!cmd) return

      const newHistory = [cmd, ...history].slice(0, 50)
      setHistory(newHistory)
      setHistoryIndex(-1)

      const inputLine: Line = { text: `C:\\CONTACT> ${cmd}`, type: 'input' }

      if (cmd === 'clear') {
        setLines([])
        setInput('')
        return
      }

      const handler = COMMANDS[cmd]
      const outputLines: Line[] = handler
        ? handler().map((t) => ({ text: t, type: 'output' }))
        : [
            { text: `'${cmd}' n'est pas reconnu comme commande interne`, type: 'error' },
            { text: "ou externe, un programme exécutable ou un fichier de commandes.", type: 'error' },
            { text: '', type: 'output' },
          ]

      setLines((prev) => [...prev, inputLine, ...outputLines])
      setInput('')
    },
    [input, history]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
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
    [history, historyIndex]
  )

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
      <div className={styles.output} aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className={`${styles.line} ${styles[line.type]}`}>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>
      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <span className={styles.prompt}>C:\CONTACT&gt;</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-label="Commande terminal"
        />
      </form>
      <div ref={bottomRef} />
    </div>
  )
}
