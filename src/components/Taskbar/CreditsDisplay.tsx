import styles from './CreditsDisplay.module.css'
import { useCasinoStore } from '../../store/casinoStore'

export function CreditsDisplay() {
  const { credits, debt } = useCasinoStore()

  return (
    <div className={styles.credits}>
      <span className={styles.item}>💰 {credits}</span>
      {debt > 0 && <span className={styles.debt}>🚨 -{debt}</span>}
    </div>
  )
}
