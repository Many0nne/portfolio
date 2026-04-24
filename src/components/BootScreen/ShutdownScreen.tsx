import styles from './ShutdownScreen.module.css'
import { useWindowStore } from '../../store/windowStore'

export function ShutdownScreen() {
  const restart = useWindowStore((s) => s.restart)

  return (
    <div className={styles.screen}>
      <div className={styles.box}>
        <div className={styles.title}>Windows 95</div>
        <p className={styles.message}>
          Vous pouvez maintenant éteindre votre ordinateur en toute sécurité.
        </p>
        <button className={styles.restartBtn} onClick={restart}>
          Redémarrer
        </button>
      </div>
    </div>
  )
}
