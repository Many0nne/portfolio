import { useState, useEffect } from 'react'
import styles from './Taskbar.module.css'

interface TaskbarClockProps {
  soundEnabled: boolean
  onToggleSound: () => void
}

export function TaskbarClock({ soundEnabled, onToggleSound }: TaskbarClockProps) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className={styles.clock} title={dateStr}>
      <button className={styles.soundBtn} onClick={onToggleSound} title={soundEnabled ? 'Couper le son' : 'Activer le son'}>
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      <span className={styles.timeText}>{timeStr}</span>
    </div>
  )
}
