import { useState } from 'react'
import styles from './MailApp.module.css'
import { mails } from '../../data/mails'
import type { Mail } from '../../data/mails'

type Folder = Mail['folder']

const FOLDERS: { id: Folder; label: string }[] = [
  { id: 'inbox', label: 'Boîte de réception' },
  { id: 'sent', label: 'Éléments envoyés' },
  { id: 'deleted', label: 'Éléments supprimés' },
]

function unreadCount(folder: Folder) {
  return mails.filter((m) => m.folder === folder && !m.read).length
}

export function MailApp() {
  const [selectedFolder, setSelectedFolder] = useState<Folder>('inbox')
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null)

  const folderMails = mails.filter((m) => m.folder === selectedFolder)
  const selectedMail = mails.find((m) => m.id === selectedMailId) ?? null

  const handleFolderClick = (folder: Folder) => {
    setSelectedFolder(folder)
    setSelectedMailId(null)
  }

  const totalUnread = unreadCount(selectedFolder)

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn}>📝 Nouveau</button>
        <button className={styles.toolBtn}>↩ Répondre</button>
        <button className={styles.toolBtn}>🗑 Supprimer</button>
      </div>

      <div className={styles.body}>
        <div className={styles.folderTree}>
          <div className={styles.treeRoot}>
            <img src="/img/Windows_95_FOLDER.png" alt="" className={styles.treeRootIcon} />
            Dossiers personnels
          </div>
          {FOLDERS.map((folder) => {
            const count = unreadCount(folder.id)
            return (
              <div
                key={folder.id}
                className={`${styles.treeItem} ${selectedFolder === folder.id ? styles.treeItemActive : ''}`}
                onClick={() => handleFolderClick(folder.id)}
              >
                <img src="/img/Windows_95_FOLDER.png" alt="" className={styles.treeItemIcon} />
                <span className={styles.treeItemLabel}>{folder.label}</span>
                {count > 0 && <span className={styles.treeItemBadge}>({count})</span>}
              </div>
            )
          })}
        </div>

        <div className={styles.rightPane}>
          <div className={styles.mailListWrapper}>
            <table className={styles.mailTable}>
              <thead>
                <tr>
                  <th className={styles.colFlag}>!</th>
                  <th className={styles.colFrom}>De</th>
                  <th className={styles.colSubject}>Objet</th>
                  <th className={styles.colDate}>Reçu</th>
                </tr>
              </thead>
              <tbody>
                {folderMails.map((mail) => (
                  <tr
                    key={mail.id}
                    className={[
                      styles.mailRow,
                      !mail.read ? styles.mailRowUnread : '',
                      selectedMailId === mail.id ? styles.mailRowSelected : '',
                    ].join(' ')}
                    onClick={() => setSelectedMailId(mail.id)}
                  >
                    <td className={styles.colFlag}>
                      {!mail.read && <span className={styles.flagIcon}>✉</span>}
                    </td>
                    <td className={styles.colFrom}>{mail.from}</td>
                    <td className={styles.colSubject}>{mail.subject}</td>
                    <td className={styles.colDate}>{mail.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mailPreview}>
            {selectedMail ? (
              <>
                <div className={styles.mailMeta}>
                  <div className={styles.mailMetaRow}>
                    <span className={styles.mailMetaLabel}>De :</span>
                    <span className={styles.mailMetaValue}>{selectedMail.from}</span>
                  </div>
                  <div className={styles.mailMetaRow}>
                    <span className={styles.mailMetaLabel}>Envoyé :</span>
                    <span className={styles.mailMetaValue}>{selectedMail.date}</span>
                  </div>
                  <div className={styles.mailMetaRow}>
                    <span className={styles.mailMetaLabel}>À :</span>
                    <span className={styles.mailMetaValue}>{selectedMail.to ?? 'terry.barillon@portfolio.dev'}</span>
                  </div>
                  <div className={styles.mailMetaRow}>
                    <span className={styles.mailMetaLabel}>Objet :</span>
                    <span className={styles.mailMetaValue}>{selectedMail.subject}</span>
                  </div>
                </div>
                {selectedMail.previewImage && (
                  <div className={styles.mailImagePreview}>
                    <img
                      src={selectedMail.previewImage}
                      alt={selectedMail.previewImageAlt ?? selectedMail.subject}
                      className={styles.mailPreviewImage}
                    />
                  </div>
                )}
                <div className={styles.mailBody}>{selectedMail.body}</div>
              </>
            ) : (
              <div className={styles.emptyPreview}>Aucun message sélectionné</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.statusBar}>
        {folderMails.length} message{folderMails.length !== 1 ? 's' : ''}
        {totalUnread > 0 ? `, ${totalUnread} non lu${totalUnread !== 1 ? 's' : ''}` : ''}
      </div>
    </div>
  )
}
