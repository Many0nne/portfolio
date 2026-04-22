import styles from './NotesApp.module.css'

const noteLines = ['777', '95']

export function NotesApp() {
  return (
    <div className={styles.container}>
      <div className={styles.menuBar}>
        <div className={styles.menu}><span>Fichier</span></div>
        <div className={styles.menu}><span>Édition</span></div>
        <div className={styles.menu}><span>Aide</span></div>
      </div>
      <pre className={styles.content}>
{noteLines.join('\n')}
      </pre>
    </div>
  )
}