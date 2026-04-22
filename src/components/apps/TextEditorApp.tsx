import styles from './TextEditorApp.module.css'
import { TEXT_EDITOR_DOCUMENTS, type TextEditorVariant } from '../../data/text-editor'

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function TextEditorApp({ variant }: { variant: TextEditorVariant }) {
  const documentContent = TEXT_EDITOR_DOCUMENTS[variant]

  return (
    <div className={styles.container}>
      <div className={styles.menuBar}>
        <div className={styles.menu}>
          <span>Fichier</span>
          <div className={styles.dropdown}>
            <div
              className={styles.dropdownItem}
              onClick={() => downloadText(documentContent.content, documentContent.downloadFileName)}
            >
              Télécharger…
            </div>
          </div>
        </div>
        <div className={styles.menu}><span>Édition</span></div>
        <div className={styles.menu}><span>Aide</span></div>
      </div>
      <pre className={styles.content}>{documentContent.content}</pre>
    </div>
  )
}