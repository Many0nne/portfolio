import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  value: number // 0–100
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={styles.container} title={label}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${clamped}%` }} />
      </div>
      <span className={styles.pct}>{label ?? `${clamped}%`}</span>
    </div>
  )
}
