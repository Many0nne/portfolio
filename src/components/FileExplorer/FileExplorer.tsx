import { useState, useCallback, useEffect, useRef } from 'react'
import styles from './FileExplorer.module.css'
import { useFsStore } from '../../fs/fsStore'
import { useWindowStore } from '../../store/windowStore'
import { useSound } from '../../hooks/useSound'
import { ICON_MAP } from '../../data/icons'
import { ContextMenu } from '../shared/ContextMenu'
import { DialogBox } from '../shared/DialogBox'
import { MenuBar } from '../shared/MenuBar'
import type { FsNode } from '../../fs/types'
import type { ContextMenuItem } from '../shared/ContextMenu'

type ViewMode = 'icons' | 'list'

interface PinState {
  nodeId: string
  value: string
  error: boolean
  onSuccess: () => void
}

interface ExplorerProps {
  windowId: string
  folderId?: string
}

function getFolderIcon() { return ICON_MAP.folder ?? '/img/Windows_95_FOLDER.png' }

function getFileIcon(node: FsNode): string {
  if (node.kind === 'folder') return getFolderIcon()
  if (node.mimeType === 'application/x-shortcut') {
    const app = node.shortcut?.app
    const map: Record<string, string> = {
      notepad: ICON_MAP.notepad,
      explorer: ICON_MAP.folder,
      terminal: ICON_MAP.cmd,
      paint: ICON_MAP.paint,
      'media-player': ICON_MAP['media-player'],
      mail: ICON_MAP.mail,
      minesweeper: ICON_MAP.minesweeper,
      casino: ICON_MAP.casino,
      bank: ICON_MAP.bank,
      about: ICON_MAP.info,
    }
    return (app && map[app]) ? map[app] : ICON_MAP.notepad
  }
  if (node.mimeType?.startsWith('image/')) return ICON_MAP.paint ?? ICON_MAP.notepad
  if (node.mimeType?.startsWith('audio/')) return ICON_MAP['media-player'] ?? ICON_MAP.notepad
  return ICON_MAP.notepad ?? '/img/FileText_32x32_4.png'
}

export function FileExplorer({ windowId, folderId }: ExplorerProps) {
  const fsStore = useFsStore()
  const { openFile, setTitle } = useWindowStore()
  const { play } = useSound()

  const rootId = fsStore.rootId
  const [historyStack, setHistoryStack] = useState<string[]>([folderId ?? rootId])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('icons')
  const [pinState, setPinState] = useState<PinState | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [addressInput, setAddressInput] = useState('')
  const [editingAddress, setEditingAddress] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const pinInputRef = useRef<HTMLInputElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  const currentId = historyStack[historyIndex]
  const currentNode = fsStore.nodes[currentId]
  const currentPath = fsStore.getPath(currentId)

  const allChildren = fsStore.getChildren(currentId)
  const visibleChildren = allChildren.filter((n) => !n.attrs?.hidden)

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < historyStack.length - 1
  const canGoUp = currentNode?.parentId !== null

  useEffect(() => {
    if (pinState) pinInputRef.current?.focus()
  }, [pinState])

  useEffect(() => {
    if (renaming) renameRef.current?.select()
  }, [renaming])

  useEffect(() => {
    if (!editingAddress) setAddressInput(currentPath)
  }, [currentPath, editingAddress])

  useEffect(() => {
    setTitle(windowId, `${currentNode?.name ?? 'Explorateur'} — Explorateur`)
  }, [currentId, currentNode?.name, setTitle, windowId])

  const navigate = useCallback((id: string, force = false) => {
    const node = fsStore.nodes[id]
    if (!node) return
    if (node.locked && !force) {
      setPinState({ nodeId: id, value: '', error: false, onSuccess: () => navigate(id, true) })
      return
    }
    setHistoryStack((prev) => {
      const newStack = [...prev.slice(0, historyIndex + 1), id]
      return newStack
    })
    setHistoryIndex((prev) => {
      const newPrev = prev + 1
      setHistoryStack((stack) => [...stack.slice(0, newPrev), id])
      return newPrev
    })
    setSelectedIds(new Set())
  }, [historyIndex, fsStore.nodes])

  const goBack = () => { if (canGoBack) { setHistoryIndex((i) => i - 1); setSelectedIds(new Set()) } }
  const goForward = () => { if (canGoForward) { setHistoryIndex((i) => i + 1); setSelectedIds(new Set()) } }
  const goUp = () => { if (canGoUp && currentNode?.parentId) navigate(currentNode.parentId) }

  const handleOpen = useCallback((node: FsNode) => {
    if (node.kind === 'folder') { navigate(node.id); return }
    if (node.locked) {
      setPinState({ nodeId: node.id, value: '', error: false, onSuccess: () => handleOpenForced(node) })
      return
    }
    handleOpenForced(node)
  }, [navigate])

  const handleOpenForced = (node: FsNode) => {
    play('open')
    openFile(node.id)
  }

  const handlePinSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!pinState) return
    const node = fsStore.nodes[pinState.nodeId]
    if (node?.locked && pinState.value === node.locked.pin) {
      pinState.onSuccess()
      setPinState(null)
    } else {
      setPinState((p) => p ? { ...p, value: '', error: true } : null)
      setTimeout(() => setPinState((p) => p ? { ...p, error: false } : null), 2000)
    }
  }, [pinState, fsStore.nodes])

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditingAddress(false)
    const result = fsStore.resolvePath(addressInput, currentId)
    if (result.ok && result.node.kind === 'folder') {
      navigate(result.node.id, true)
    } else if (result.ok) {
      openFile(result.node.id)
    }
  }

  const startRename = (id: string) => {
    const node = fsStore.nodes[id]
    if (!node) return
    setRenaming(id)
    setRenameValue(node.name)
  }

  const confirmRename = () => {
    if (renaming && renameValue.trim()) {
      fsStore.rename(renaming, renameValue.trim())
    }
    setRenaming(null)
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId })
  }, [])

  const buildNodeContextItems = (nodeId: string): ContextMenuItem[] => {
    const node = fsStore.nodes[nodeId]
    if (!node) return []
    return [
      { label: 'Ouvrir', onClick: () => handleOpen(node) },
      { separator: true },
      { label: 'Renommer', onClick: () => startRename(nodeId) },
      { label: 'Supprimer', onClick: () => setDeleteConfirm(nodeId) },
      { separator: true },
      { label: 'Propriétés', onClick: () => alert(`${node.name}\nTaille : ${node.sizeBytes} octets\nModifié : ${new Date(node.modifiedAt).toLocaleString('fr-FR')}`) },
    ]
  }

  const buildBgContextItems = (): ContextMenuItem[] => [
    {
      label: 'Nouveau dossier',
      onClick: () => {
        fsStore.create(currentId, { name: 'Nouveau dossier', kind: 'folder', sizeBytes: 0 })
      },
    },
    {
      label: 'Nouveau document texte',
      onClick: () => {
        fsStore.create(currentId, { name: 'Nouveau document.txt', kind: 'file', content: '', mimeType: 'text/plain', sizeBytes: 0 })
      },
    },
    { separator: true },
    { label: 'Actualiser', onClick: () => {} },
  ]

  const menus = [
    {
      label: 'Fichier',
      items: [
        { label: 'Nouveau dossier', onClick: () => fsStore.create(currentId, { name: 'Nouveau dossier', kind: 'folder', sizeBytes: 0 }) },
        { label: 'Nouveau document', onClick: () => fsStore.create(currentId, { name: 'Nouveau document.txt', kind: 'file', content: '', mimeType: 'text/plain', sizeBytes: 0 }) },
      ],
    },
    {
      label: 'Affichage',
      items: [
        { label: 'Grandes icônes', onClick: () => setViewMode('icons'), checked: viewMode === 'icons' },
        { label: 'Liste', onClick: () => setViewMode('list'), checked: viewMode === 'list' },
      ],
    },
  ]

  // Build left tree
  const rootFolders = fsStore.getChildren(rootId).filter((n) => n.kind === 'folder' && !n.attrs?.system && !n.attrs?.hidden)

  return (
    <div className={styles.container}>
      {pinState && (
        <div className={styles.pinOverlay}>
          <div className={styles.pinBox}>
            <div className={styles.pinBoxTitle}>
              <img src={getFolderIcon()} alt="" className={styles.pinBoxTitleIcon} />
              Dossier protégé
            </div>
            <div className={styles.pinBoxBody}>
              <img src={getFolderIcon()} alt="" className={styles.pinBoxFolderIcon} />
              <div>
                <p className={styles.pinBoxMessage}>Ce dossier est protégé par un code d'accès.</p>
                <form onSubmit={handlePinSubmit} className={styles.pinBoxForm}>
                  <label className={styles.pinBoxLabel}>Code d'accès :</label>
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinState.value}
                    onChange={(e) => setPinState((p) => p ? { ...p, value: e.target.value } : null)}
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

      {deleteConfirm && (
        <DialogBox
          title="Confirmer la suppression"
          message={`Supprimer '${fsStore.nodes[deleteConfirm]?.name}' ?`}
          variant="question"
          buttons={[
            { label: 'Oui', onClick: () => { fsStore.remove(deleteConfirm); setDeleteConfirm(null) }, primary: true },
            { label: 'Non', onClick: () => setDeleteConfirm(null) },
          ]}
        />
      )}

      <MenuBar menus={menus} />

      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={goBack} disabled={!canGoBack} title="Précédent">
          <img className={styles.toolBtnIcon} src={ICON_MAP.folder} alt="" />◄
        </button>
        <button className={styles.toolBtn} onClick={goForward} disabled={!canGoForward} title="Suivant">
          ►
        </button>
        <button className={styles.toolBtn} onClick={goUp} disabled={!canGoUp} title="Dossier parent">
          <img className={styles.toolBtnIcon} src={ICON_MAP.folder} alt="" />
          Dossier parent
        </button>
      </div>

      <div className={styles.addressBar}>
        <span className={styles.addressLabel}>Adresse :</span>
        {editingAddress ? (
          <form onSubmit={handleAddressSubmit} style={{ flex: 1, display: 'flex' }}>
            <input
              className={styles.addressInput}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onBlur={() => setEditingAddress(false)}
              autoFocus
            />
          </form>
        ) : (
          <div className={styles.addressInput} onClick={() => { setAddressInput(currentPath); setEditingAddress(true) }} style={{ cursor: 'text' }}>
            {currentPath}
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.tree}>
          <div
            className={`${styles.treeItem} ${currentId === rootId ? styles.selected : ''}`}
            onClick={() => navigate(rootId, true)}
          >
            <img className={styles.treeIcon} src={ICON_MAP.computer ?? ICON_MAP.folder} alt="" />
            Poste de travail
          </div>
          {rootFolders.map((f) => (
            <div key={f.id}>
              <div
                className={`${styles.treeItem} ${currentId === f.id ? styles.selected : ''}`}
                style={{ paddingLeft: 16 }}
                onClick={() => navigate(f.id, !f.locked)}
              >
                <img className={styles.treeIcon} src={getFolderIcon()} alt="" />
                {f.name}
              </div>
            </div>
          ))}
        </div>

        <div
          className={styles.fileGrid}
          onContextMenu={(e) => handleContextMenu(e)}
          onClick={() => setSelectedIds(new Set())}
        >
          {viewMode === 'icons' ? (
            <div className={styles.viewIcons}>
              {visibleChildren.map((node) => (
                <div
                  key={node.id}
                  className={`${styles.fileIcon} ${selectedIds.has(node.id) ? styles.fileIconSelected : ''}`}
                  onDoubleClick={() => handleOpen(node)}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (e.ctrlKey) {
                      setSelectedIds((s) => { const n = new Set(s); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n })
                    } else {
                      setSelectedIds(new Set([node.id]))
                    }
                  }}
                  onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, node.id) }}
                  title={node.name}
                >
                  {renaming === node.id ? (
                    <input
                      ref={renameRef}
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenaming(null) }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <img className={styles.fileIconImg} src={getFileIcon(node)} alt="" />
                      <span className={styles.fileIconName}>{node.name}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <table className={styles.viewList}>
              <thead>
                <tr><th>Nom</th><th>Taille</th><th>Modifié</th></tr>
              </thead>
              <tbody>
                {visibleChildren.map((node) => (
                  <tr
                    key={node.id}
                    className={selectedIds.has(node.id) ? styles.listRowSelected : ''}
                    onDoubleClick={() => handleOpen(node)}
                    onClick={(e) => { e.stopPropagation(); setSelectedIds(new Set([node.id])) }}
                    onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, node.id) }}
                  >
                    <td>
                      <span className={styles.listIconWrap}>
                        <img className={styles.listIconImg} src={getFileIcon(node)} alt="" />
                      </span>
                      {node.name}
                    </td>
                    <td>{node.kind === 'file' ? `${node.sizeBytes} o` : '—'}</td>
                    <td>{new Date(node.modifiedAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.statusBar}>
        {visibleChildren.length} objet{visibleChildren.length !== 1 ? 's' : ''}
        {selectedIds.size > 0 && ` — ${selectedIds.size} sélectionné(s)`}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.nodeId ? buildNodeContextItems(contextMenu.nodeId) : buildBgContextItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
