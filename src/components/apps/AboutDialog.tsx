import { useWindowStore } from '../../store/windowStore'
import styles from './AboutDialog.module.css'

interface AboutDialogProps {
  windowId: string
}

export function AboutDialog({ windowId }: AboutDialogProps) {
  const { closeWindow } = useWindowStore()

  return (
    <div className={styles.container}>
      <div className={styles.logoArea}>
        <img src="/img/windows_95_logo.png" alt="Windows 95 logo" className={styles.logo} />
        <div>
          <div className={styles.productName}>Windows 95</div>
          <div className={styles.version}>Version 4.00.950</div>
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.info}>
        <p><strong>Portfolio de Terry BARILLON</strong></p>
        <p>Développeur Full-Stack · TypeScript · React · Vue.js</p>
        <p>Ce portfolio simule un environnement de bureau Windows 95.</p>
      </div>
      <div className={styles.divider} />
      <div className={styles.credits}>
        <p>Construit avec React 19, TypeScript, Vite et 98.css</p>
        <p>© 2026 Terry BARILLON</p>
      </div>
      <div className={styles.buttons}>
        <button className="button" onClick={() => closeWindow(windowId)}>OK</button>
      </div>
    </div>
  )
}
