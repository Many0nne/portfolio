import { useState, useRef, useEffect } from 'react'
import styles from './RunDialog.module.css'
import { useWindowStore } from '../../store/windowStore'
import { useFsStore } from '../../fs/fsStore'
import { resolveAssociation } from '../../fs/associations'
import type { AppId } from '../../apps/types'

const APP_ALIASES: Record<string, AppId> = {
  notepad: 'notepad',
  mspaint: 'paint',
  paint: 'paint',
  cmd: 'terminal',
  terminal: 'terminal',
  explorer: 'explorer',
  winmine: 'minesweeper',
  minesweeper: 'minesweeper',
  winamp: 'media-player',
  mplayer: 'media-player',
  outlook: 'mail',
  mail: 'mail',
  casino: 'casino',
  bank: 'bank',
}

interface RunDialogProps {
  windowId: string
}

export function RunDialog({ windowId }: RunDialogProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const { openApp, closeWindow } = useWindowStore()
  const fsStore = useFsStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleRun = () => {
    const trimmed = value.trim()
    if (!trimmed) return

    const lower = trimmed.toLowerCase()
    if (APP_ALIASES[lower]) {
      openApp(APP_ALIASES[lower])
      closeWindow(windowId)
      return
    }

    // Try as file path
    const result = fsStore.resolvePath(trimmed, fsStore.rootId)
    if (result.ok) {
      const assoc = resolveAssociation(result.node)
      if (assoc) {
        openApp(assoc.app, { fileId: result.node.kind === 'file' ? result.node.id : undefined, props: assoc.props ?? {} })
        closeWindow(windowId)
        return
      }
    }

    setError(`Impossible de trouver '${trimmed}'.`)
  }

  return (
    <div className={styles.dialog}>
      <div className={styles.header}>
        <img src="/img/windows_95_logo.png" alt="" className={styles.icon} />
        <p className={styles.description}>
          Entrez le nom du programme, dossier ou document que vous souhaitez ouvrir.
        </p>
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Ouvrir :</label>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRun() }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.buttons}>
        <button className="button" onClick={handleRun}>OK</button>
        <button className="button" onClick={() => closeWindow(windowId)}>Annuler</button>
      </div>
    </div>
  )
}
