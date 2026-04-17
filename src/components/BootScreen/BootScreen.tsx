import styles from './BootScreen.module.css'

interface BootScreenProps {
  onBoot: () => void
}

export function BootScreen({ onBoot }: BootScreenProps) {
  return (
    <div className={styles.bootScreen}>
      <div className={styles.panel}>
        <div className={styles.brand}>Windows 95</div>
        <button className={styles.bootButton} onClick={onBoot}>
          Boot
        </button>
      </div>
    </div>
  )
}