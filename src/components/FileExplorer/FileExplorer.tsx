import { useState, useCallback, useEffect, useRef } from 'react'
import styles from './FileExplorer.module.css'
import { filesystem } from '../../data/filesystem'
import type { VirtualFile } from '../../data/filesystem'
import { useWindowStore } from '../../store/windowStore'
import { useSound } from '../../hooks/useSound'
import { ICON_MAP } from '../../data/icons'
import { findFolderPathById, getPathString } from '../../utils/fsUtils'

const SECRET_PIN = '95'

type ViewMode = 'icons' | 'list'

interface PinState {
  target: VirtualFile
  value: string
  error: boolean
  mode: 'replace' | 'push'
}

export function FileExplorer({ initialFolderId }: { initialFolderId?: string } = {}) {
  const [folderStack, setFolderStack] = useState<VirtualFile[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('icons')
  const [pinState, setPinState] = useState<PinState | null>(null)
  const pinInputRef = useRef<HTMLInputElement>(null)
  const { openWindow } = useWindowStore()
  const { play } = useSound()

  useEffect(() => {
    if (pinState) pinInputRef.current?.focus()
  }, [pinState])

  const currentFiles = folderStack.length ? (folderStack[folderStack.length - 1].children ?? []) : filesystem
  const currentPath = getPathString(folderStack)

  const openFolder = useCallback((file: VirtualFile, mode: 'replace' | 'push') => {
    if (file.locked) {
      setPinState({ target: file, value: '', error: false, mode })
      return
    }
    if (mode === 'replace') {
      setFolderStack([file])
      return
    }
    setFolderStack((prev) => [...prev, file])
  }, [])

  const handlePinSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!pinState) return
    if (pinState.value === SECRET_PIN) {
      if (pinState.mode === 'replace') {
        setFolderStack([pinState.target])
      } else {
        setFolderStack((prev) => [...prev, pinState.target])
      }
      setPinState(null)
    } else {
      setPinState((prev) => prev ? { ...prev, value: '', error: true } : null)
      setTimeout(() => setPinState((prev) => prev ? { ...prev, error: false } : null), 2000)
    }
  }, [pinState])

  const handleFileOpen = useCallback(
    (file: VirtualFile) => {
      if (file.type === 'folder') {
        openFolder(file, 'push')
        return
      }
      if (file.appType) {
        play('open')
        openWindow(file.appType, file.appProps)
      }
    },
    [openWindow, play, openFolder]
  )

  const handleUp = useCallback(() => {
    setFolderStack((prev) => prev.slice(0, -1))
  }, [])

  useEffect(() => {
    if (!initialFolderId) return
    const foundPath = findFolderPathById(filesystem, initialFolderId)
    const found = foundPath?.[foundPath.length - 1]
    if (!found) return
    if (found.locked) {
      setPinState({ target: found, value: '', error: false, mode: 'replace' })
    } else {
      setFolderStack(foundPath)
    }
  }, [initialFolderId])

  const renderIcon = (key: string, className: string) => {
    const src = ICON_MAP[key]
    if (!src) {
      return <span className={className}>📄</span>
    }
    return <img className={className} src={src} alt="" />
  }

  return (
    <div className={styles.container}>
      {pinState && (
        <div className={styles.pinOverlay}>
          <div className={styles.pinBox}>
            <div className={styles.pinBoxTitle}>
              <img src="/img/Windows_95_FOLDER.png" alt="" className={styles.pinBoxTitleIcon} />
              Dossier protégé
            </div>
            <div className={styles.pinBoxBody}>
              <img src="/img/Windows_95_FOLDER.png" alt="" className={styles.pinBoxFolderIcon} />
              <div>
                <p className={styles.pinBoxMessage}>Ce dossier est protégé par un code d'accès.</p>
                <form onSubmit={handlePinSubmit} className={styles.pinBoxForm}>
                  <label className={styles.pinBoxLabel}>Code d'accès :</label>
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    maxLength={2}
                    value={pinState.value}
                    onChange={(e) => setPinState((prev) => prev ? { ...prev, value: e.target.value.replace(/\D/g, '') } : null)}
                    className={`${styles.pinBoxInput} ${pinState.error ? styles.pinBoxInputError : ''}`}
                    autoComplete="off"
                  />
                  <span className={styles.pinBoxError}>{pinState.error ? 'Code incorrect.' : ''}</span>
                  <div className={styles.pinBoxButtons}>
                    <button type="button" className="button" onClick={() => setPinState(null)}>Annuler</button>
                    <button type="submit" className="button">OK</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleUp} disabled={folderStack.length === 0}>
          <img className={styles.toolBtnIcon} src={ICON_MAP.folder} alt="" />
          Dossier parent
        </button>
        <button className={styles.toolBtn} onClick={() => setViewMode('icons')} style={viewMode === 'icons' ? { fontWeight: 'bold' } : {}}>
          <img className={styles.toolBtnIcon} src={ICON_MAP.project} alt="" />
          Icônes
        </button>
        <button className={styles.toolBtn} onClick={() => setViewMode('list')} style={viewMode === 'list' ? { fontWeight: 'bold' } : {}}>
          <img className={styles.toolBtnIcon} src={ICON_MAP.notepad} alt="" />
          Liste
        </button>
      </div>

      {/* Address bar */}
      <div className={styles.addressBar}>
        <span className={styles.addressLabel}>Adresse :</span>
        <input className={styles.addressInput} value={currentPath} readOnly />
      </div>

      <div className={styles.body}>
        {/* Tree */}
        <div className={styles.tree}>
          <div
            className={`${styles.treeItem} ${folderStack.length === 0 ? styles.selected : ''}`}
            onClick={() => setFolderStack([])}
          >
            {renderIcon('computer', styles.treeIcon)}
            Portfolio
          </div>
          {filesystem.filter((f) => f.type === 'folder').map((f) => (
            <div
              key={f.id}
              className={`${styles.treeItem} ${folderStack[0]?.id === f.id ? styles.selected : ''}`}
              style={{ paddingLeft: 16 }}
              onClick={() => openFolder(f, 'replace')}
            >
              {renderIcon('folder', styles.treeIcon)}
              {f.name}
            </div>
          ))}
        </div>

        {/* File grid */}
        <div className={styles.fileGrid}>
          {viewMode === 'icons' ? (
            <div className={styles.viewIcons}>
              {currentFiles.map((file) => (
                <div
                  key={file.id}
                  className={styles.fileIcon}
                  onDoubleClick={() => handleFileOpen(file)}
                  title={file.metadata.description ?? file.name}
                >
                  {renderIcon(file.icon, styles.fileIconImg)}
                  <span className={styles.fileIconName}>{file.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <table className={styles.viewList}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Taille</th>
                  <th>Modifié</th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((file) => (
                  <tr key={file.id} onDoubleClick={() => handleFileOpen(file)}>
                    <td>
                      <span className={styles.listIconWrap}>
                        {renderIcon(file.icon, styles.listIconImg)}
                      </span>
                      {file.name}
                    </td>
                    <td>{file.metadata.size}</td>
                    <td>{file.metadata.modified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.statusBar}>
        {currentFiles.length} objet{currentFiles.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
