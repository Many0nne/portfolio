import { useState, useCallback, useEffect } from 'react'
import styles from './FileExplorer.module.css'
import { filesystem } from '../../data/filesystem'
import type { VirtualFile } from '../../data/filesystem'
import { useWindowStore } from '../../store/windowStore'
import { useSound } from '../../hooks/useSound'
import { ICON_MAP } from '../../data/icons'

type ViewMode = 'icons' | 'list'

export function FileExplorer({ initialFolderId }: { initialFolderId?: string } = {}) {
  const [selectedFolder, setSelectedFolder] = useState<VirtualFile | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('icons')
  const { openWindow } = useWindowStore()
  const { play } = useSound()

  const currentFiles = selectedFolder?.children ?? filesystem

  const currentPath = selectedFolder
    ? `C:\\PORTFOLIO\\${selectedFolder.name.toUpperCase()}`
    : 'C:\\PORTFOLIO'

  const handleFileOpen = useCallback(
    (file: VirtualFile) => {
      if (file.type === 'folder') {
        setSelectedFolder(file)
        return
      }
      if (file.appType) {
        play('open')
        openWindow(file.appType, file.appProps)
      }
    },
    [openWindow, play]
  )

  const handleUp = useCallback(() => {
    setSelectedFolder(null)
  }, [])

  useEffect(() => {
    if (!initialFolderId) return
    const found = filesystem.find((f) => f.id === initialFolderId && f.type === 'folder')
    if (found) setSelectedFolder(found)
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
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleUp} disabled={!selectedFolder}>
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
            className={`${styles.treeItem} ${!selectedFolder ? styles.selected : ''}`}
            onClick={() => setSelectedFolder(null)}
          >
            {renderIcon('computer', styles.treeIcon)}
            Portfolio
          </div>
          {filesystem.filter((f) => f.type === 'folder').map((f) => (
            <div
              key={f.id}
              className={`${styles.treeItem} ${selectedFolder?.id === f.id ? styles.selected : ''}`}
              style={{ paddingLeft: 16 }}
              onClick={() => setSelectedFolder(f)}
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
