import styles from './ShutdownScreen.module.css'

interface ShutdownScreenProps {
  onRestart: () => void
}

export function ShutdownScreen({ onRestart }: ShutdownScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.box}>
        <div className={styles.title}>Windows 95</div>
        <p className={styles.message}>
          Vous pouvez maintenant éteindre votre ordinateur en toute sécurité.
        </p>
        <button className={styles.restartBtn} onClick={() => { localStorage.clear(); onRestart(); }}>
          Redémarrer
        </button>
      </div>
    </div>
  )
}
