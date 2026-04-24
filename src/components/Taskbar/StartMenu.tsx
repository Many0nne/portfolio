import { useState } from 'react'
import styles from './Taskbar.module.css'
import { useWindowStore } from '../../store/windowStore'
import { AppIcon } from '../shared/AppIcon'
import { projects } from '../../data/projects'
import { useFsStore } from '../../fs/fsStore'
import { DOCUMENTS_ID } from '../../fs/seed'
import type { AppId } from '../../apps/types'

interface StartMenuProps {
  onClose: () => void
}

type SubmenuKey = 'projects' | 'programmes' | 'jeux' | null

export function StartMenu({ onClose }: StartMenuProps) {
  const [openSubmenu, setOpenSubmenu] = useState<SubmenuKey>(null)
  const { openWindow, openFile, shutdown } = useWindowStore()
  const fsStore = useFsStore()

  const open = (app: AppId, opts?: { fileId?: string; props?: Record<string, unknown> }) => {
    openWindow(app, opts)
    onClose()
  }

  const docChildren = fsStore.getChildren(DOCUMENTS_ID)

  return (
    <div className={styles.startMenu}>
      <div className={styles.startMenuSidebar}>
        <span className={styles.startMenuSidebarText}>Windows 95</span>
      </div>
      <div className={styles.startMenuContent}>
        {/* Programmes */}
        <div className={styles.menuItem} onMouseEnter={() => setOpenSubmenu('programmes')}>
          <span className={styles.menuItemIcon}><AppIcon name="folder" size={16} className={styles.menuItemIconImg} /></span>
          Programmes
          <span className={styles.menuItemArrow}>▶</span>
          {openSubmenu === 'programmes' && (
            <div className={styles.submenu}>
              {docChildren.map((n) => (
                <div key={n.id} className={styles.menuItem} onClick={() => { openFile(n.id); onClose() }}>
                  <span className={styles.menuItemIcon}><AppIcon name="notepad" size={16} className={styles.menuItemIconImg} /></span>
                  {n.name}
                </div>
              ))}
              <div className={styles.menuSeparator} />
              <div className={styles.menuItem} onClick={() => open('terminal')}>
                <span className={styles.menuItemIcon}><AppIcon name="cmd" size={16} className={styles.menuItemIconImg} /></span>
                Terminal
              </div>
              <div className={styles.menuItem} onClick={() => open('mail')}>
                <span className={styles.menuItemIcon}><img className={styles.menuItemIconImg} src="/img/Mailnews12_32x32_4.png" alt="" /></span>
                Messagerie
              </div>
              <div className={styles.menuItem} onClick={() => open('paint')}>
                <span className={styles.menuItemIcon}><AppIcon name="paint" size={16} className={styles.menuItemIconImg} /></span>
                Paint
              </div>
              <div className={styles.menuItem} onClick={() => open('media-player')}>
                <span className={styles.menuItemIcon}><AppIcon name="media-player" size={16} className={styles.menuItemIconImg} /></span>
                Lecteur Multimédia
              </div>
            </div>
          )}
        </div>

        {/* Projets */}
        <div className={styles.menuItem} onMouseEnter={() => setOpenSubmenu('projects')}>
          <span className={styles.menuItemIcon}><AppIcon name="folder" size={16} className={styles.menuItemIconImg} /></span>
          Projets
          <span className={styles.menuItemArrow}>▶</span>
          {openSubmenu === 'projects' && (
            <div className={styles.submenu}>
              {projects.map((p) => (
                <div key={p.id} className={styles.menuItem} onClick={() => open('project-viewer', { props: { projectId: p.id } })}>
                  <span className={styles.menuItemIcon}><AppIcon name="project" size={16} className={styles.menuItemIconImg} /></span>
                  {p.title}
                </div>
              ))}
              <div className={styles.menuSeparator} />
              <div className={styles.menuItem} onClick={() => open('explorer')}>
                <span className={styles.menuItemIcon}><AppIcon name="folder" size={16} className={styles.menuItemIconImg} /></span>
                Explorateur…
              </div>
            </div>
          )}
        </div>

        {/* Jeux */}
        <div className={styles.menuItem} onMouseEnter={() => setOpenSubmenu('jeux')}>
          <span className={styles.menuItemIcon}><img className={styles.menuItemIconImg} src="/img/MyGames.png" alt="" /></span>
          Jeux
          <span className={styles.menuItemArrow}>▶</span>
          {openSubmenu === 'jeux' && (
            <div className={styles.submenu}>
              <div className={styles.menuItem} onClick={() => open('minesweeper')}>
                <span className={styles.menuItemIcon}><AppIcon name="minesweeper" size={16} className={styles.menuItemIconImg} /></span>
                Démineur
              </div>
            </div>
          )}
        </div>

        <div className={styles.menuSeparator} />

        <div className={styles.menuItem} onMouseEnter={() => setOpenSubmenu(null)} onClick={() => open('run')}>
          <span className={styles.menuItemIcon}><AppIcon name="cmd" size={16} className={styles.menuItemIconImg} /></span>
          Exécuter…
        </div>

        <div className={styles.menuItem} onMouseEnter={() => setOpenSubmenu(null)} onClick={() => open('about')}>
          <span className={styles.menuItemIcon}><AppIcon name="info" size={16} className={styles.menuItemIconImg} /></span>
          À propos
        </div>

        <div className={styles.menuSeparator} />

        <div className={styles.menuItem} onMouseEnter={() => setOpenSubmenu(null)} onClick={() => { onClose(); shutdown() }}>
          <span className={styles.menuItemIcon}>■</span>
          Éteindre…
        </div>
      </div>
    </div>
  )
}
