import { useState, useEffect } from 'react'
import styles from './Taskbar.module.css'

interface TaskbarClockProps {
  soundEnabled: boolean
  onToggleSound: () => void
  credits?: number
  debt?: number
}

export function TaskbarClock({ soundEnabled, onToggleSound, credits, debt }: TaskbarClockProps) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className={styles.clock} title={dateStr}>
      {typeof credits === 'number' && <span>💰 {credits}</span>}
      {typeof credits === 'number' && <span>|</span>}
      <button className={styles.soundBtn} onClick={onToggleSound} title={soundEnabled ? 'Couper le son' : 'Activer le son'}>
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      {typeof debt === 'number' && debt > 0 && <span>|</span>}
      {typeof debt === 'number' && debt > 0 && <span>🚨 -{debt}</span>}
      {(typeof credits === 'number' || (typeof debt === 'number' && debt > 0)) && <span>|</span>}
      <span className={styles.timeText}>{timeStr}</span>
    </div>
  )
}
