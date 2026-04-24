import { useState } from 'react'
import styles from './BootScreen.module.css'
import { useWindowStore } from '../../store/windowStore'

type Phase = 'bios' | 'loading' | 'done'

export function BootScreen() {
  const boot = useWindowStore((s) => s.boot)
  const [phase, setPhase] = useState<Phase>('bios')
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)

  const handleBoot = () => {
    if (started) return
    setStarted(true)
    setPhase('bios')
    setTimeout(() => {
      setPhase('loading')
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval)
            setTimeout(boot, 200)
            return 100
          }
          return p + 8
        })
      }, 80)
    }, 1000)
  }

  if (!started) {
    return (
      <div className={styles.bootScreen}>
        <div className={styles.panel}>
          <div className={styles.brand}>Windows 95</div>
          <button className={styles.bootButton} onClick={handleBoot}>
            Boot
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'bios') {
    return (
      <div className={styles.bios}>
        <div className={styles.biosText}>Award Modular BIOS v4.51PG, An Energy Star Ally</div>
        <div className={styles.biosText}>Copyright (C) 1984-95, Award Software, Inc.</div>
        <div className={styles.biosText}>&nbsp;</div>
        <div className={styles.biosText}>Win95 Portfolio BIOS v1.0</div>
        <div className={styles.biosText}>&nbsp;</div>
        <div className={styles.biosText}>Memory Test : 65535K OK</div>
        <div className={styles.biosText}>&nbsp;</div>
        <div className={styles.biosText}>Starting Windows 95...</div>
      </div>
    )
  }

  return (
    <div className={styles.win95loading}>
      <img src="/img/windows_95_logo.png" alt="Windows 95" className={styles.win95logo} />
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
