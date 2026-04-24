import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './NotepadApp.module.css'
import { useFsStore } from '../../fs/fsStore'
import { useWindowStore } from '../../store/windowStore'
import { MenuBar } from '../shared/MenuBar'
import { DialogBox } from '../shared/DialogBox'

interface NotepadProps {
  windowId: string
  fileId?: string
}

interface FilePicker {
  mode: 'open' | 'save'
  currentParentId: string
  nameInput: string
}

export function NotepadApp({ windowId, fileId }: NotepadProps) {
  const fsStore = useFsStore()
  const { setTitle, closeWindow } = useWindowStore()

  const getInitialContent = () => {
    if (!fileId) return ''
    return fsStore.nodes[fileId]?.content ?? ''
  }

  const [content, setContent] = useState(getInitialContent)
  const [currentFileId, setCurrentFileId] = useState<string | undefined>(fileId)
  const [isDirty, setIsDirty] = useState(false)
  const [filePicker, setFilePicker] = useState<FilePicker | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const updateTitle = useCallback((fId: string | undefined, dirty: boolean) => {
    const name = fId ? (fsStore.nodes[fId]?.name ?? 'Sans titre') : 'Sans titre'
    setTitle(windowId, `${dirty ? '*' : ''}${name} — Notepad`)
  }, [fsStore.nodes, setTitle, windowId])

  useEffect(() => {
    updateTitle(currentFileId, isDirty)
  }, [currentFileId, isDirty, updateTitle])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (!isDirty) setIsDirty(true)
  }

  const handleSave = useCallback(() => {
    if (!currentFileId) {
      setFilePicker({ mode: 'save', currentParentId: fsStore.rootId, nameInput: 'Sans titre.txt' })
      return
    }
    fsStore.writeContent(currentFileId, content)
    setIsDirty(false)
  }, [currentFileId, content, fsStore])

  const handleSaveAs = () => {
    const name = currentFileId ? (fsStore.nodes[currentFileId]?.name ?? 'Sans titre.txt') : 'Sans titre.txt'
    setFilePicker({ mode: 'save', currentParentId: fsStore.rootId, nameInput: name })
  }

  const handleOpen = () => {
    setFilePicker({ mode: 'open', currentParentId: fsStore.rootId, nameInput: '' })
  }

  const handleNew = () => {
    if (isDirty) {
      setConfirmClose(true)
      return
    }
    setCurrentFileId(undefined)
    setContent('')
    setIsDirty(false)
  }

  const handlePickerConfirm = () => {
    if (!filePicker) return
    if (filePicker.mode === 'open') {
      const children = fsStore.getChildren(filePicker.currentParentId)
      const target = children.find(
        (n) => n.name.toLowerCase() === filePicker.nameInput.toLowerCase() && n.kind === 'file'
      )
      if (target) {
        setCurrentFileId(target.id)
        setContent(target.content ?? '')
        setIsDirty(false)
        setFilePicker(null)
      }
    } else {
      const name = filePicker.nameInput || 'Sans titre.txt'
      const id = fsStore.create(filePicker.currentParentId, {
        name,
        kind: 'file',
        content,
        mimeType: 'text/plain',
        sizeBytes: new TextEncoder().encode(content).length,
      })
      setCurrentFileId(id)
      setIsDirty(false)
      setFilePicker(null)
    }
  }

  const menus = [
    {
      label: 'Fichier',
      items: [
        { label: 'Nouveau', onClick: handleNew },
        { label: 'Ouvrir…', onClick: handleOpen },
        { separator: true as const },
        { label: 'Enregistrer', onClick: handleSave, disabled: !isDirty && !!currentFileId },
        { label: 'Enregistrer sous…', onClick: handleSaveAs },
        { separator: true as const },
        { label: 'Fermer', onClick: () => closeWindow(windowId) },
      ],
    },
    {
      label: 'Édition',
      items: [
        {
          label: 'Tout sélectionner',
          onClick: () => {
            const ta = textareaRef.current
            if (ta) { ta.select() }
          },
        },
      ],
    },
  ]

  return (
    <div className={styles.container}>
      <MenuBar menus={menus} />
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={content}
        onChange={handleChange}
        spellCheck={false}
        autoComplete="off"
        wrap="off"
      />

      {filePicker && (
        <FilePickerDialog
          mode={filePicker.mode}
          currentParentId={filePicker.currentParentId}
          nameInput={filePicker.nameInput}
          onNavigate={(id) => setFilePicker((p) => p ? { ...p, currentParentId: id } : null)}
          onNameChange={(name) => setFilePicker((p) => p ? { ...p, nameInput: name } : null)}
          onConfirm={handlePickerConfirm}
          onCancel={() => setFilePicker(null)}
        />
      )}

      {confirmClose && (
        <DialogBox
          title="Notepad"
          message="Voulez-vous enregistrer les modifications ?"
          variant="question"
          buttons={[
            { label: 'Oui', onClick: () => { handleSave(); setConfirmClose(false) }, primary: true },
            { label: 'Non', onClick: () => { setCurrentFileId(undefined); setContent(''); setIsDirty(false); setConfirmClose(false) } },
            { label: 'Annuler', onClick: () => setConfirmClose(false) },
          ]}
        />
      )}
    </div>
  )
}

interface FilePickerProps {
  mode: 'open' | 'save'
  currentParentId: string
  nameInput: string
  onNavigate: (id: string) => void
  onNameChange: (name: string) => void
  onConfirm: () => void
  onCancel: () => void
}

function FilePickerDialog({ mode, currentParentId, nameInput, onNavigate, onNameChange, onConfirm, onCancel }: FilePickerProps) {
  const fsStore = useFsStore()
  const children = fsStore.getChildren(currentParentId)
  const path = fsStore.getPath(currentParentId)
  const parent = fsStore.nodes[currentParentId]

  const folders = children.filter((n) => n.kind === 'folder' && !n.attrs?.hidden)
  const files = children.filter((n) => n.kind === 'file' && !n.attrs?.hidden)

  return (
    <div className={styles.pickerOverlay}>
      <div className={styles.picker}>
        <div className={styles.pickerTitle}>
          {mode === 'open' ? 'Ouvrir' : 'Enregistrer sous'}
        </div>
        <div className={styles.pickerPath}>{path}</div>
        <div className={styles.pickerNav}>
          {parent?.parentId && (
            <button className="button" onClick={() => onNavigate(parent.parentId!)}>
              Dossier parent
            </button>
          )}
        </div>
        <div className={styles.pickerFiles}>
          {folders.map((n) => (
            <div key={n.id} className={styles.pickerItem} onDoubleClick={() => onNavigate(n.id)}>
              📁 {n.name}
            </div>
          ))}
          {files.map((n) => (
            <div
              key={n.id}
              className={styles.pickerItem}
              onClick={() => mode === 'open' && onNameChange(n.name)}
              onDoubleClick={() => {
                if (mode === 'open') { onNameChange(n.name); onConfirm() }
              }}
            >
              📄 {n.name}
            </div>
          ))}
        </div>
        <div className={styles.pickerFooter}>
          <input
            className={styles.pickerInput}
            value={nameInput}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nom du fichier"
          />
          <button className="button" onClick={onConfirm}>
            {mode === 'open' ? 'Ouvrir' : 'Enregistrer'}
          </button>
          <button className="button" onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
