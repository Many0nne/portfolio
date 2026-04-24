import styles from './GameOverDialog.module.css'
import { useCasinoStore } from '../store/casinoStore'

export function GameOverDialog() {
  const { declareBankruptcy } = useCasinoStore()

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.titleBar}>
          <span>Game Over</span>
        </div>
        <div className={styles.body}>
          <div className={styles.icon}>!</div>
          <p className={styles.title}>Faillite déclarée.</p>
          <p className={styles.text}>
            Tous vos actifs ont été saisis.
            <br />
            Le casino est maintenant verrouillé.
          </p>
          <button className={styles.restartBtn} onClick={declareBankruptcy}>
            Recommencer
          </button>
        </div>
      </div>
    </div>
  )
}
