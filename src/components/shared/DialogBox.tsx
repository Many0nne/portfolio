import { useEffect, useRef } from 'react'
import styles from './DialogBox.module.css'
import type { DialogButton } from '../../types'

interface DialogBoxProps {
  title: string
  message: string
  variant?: 'info' | 'warning' | 'error' | 'question'
  buttons?: DialogButton[]
  onOk?: () => void
  onCancel?: () => void
}

const VARIANT_ICON: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  question: '❓',
}

export function DialogBox({ title, message, variant = 'info', buttons, onOk, onCancel }: DialogBoxProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primaryRef.current?.focus()
  }, [])

  const resolvedButtons: DialogButton[] = buttons ?? [
    ...(onCancel ? [{ label: 'Annuler', onClick: onCancel }] : []),
    { label: 'OK', onClick: onOk ?? (() => {}), primary: true },
  ]

  return (
    <div className={styles.overlay} role="alertdialog" aria-label={title}>
      <div className={styles.dialog}>
        <div className={styles.titleBar}>
          <span>{title}</span>
        </div>
        <div className={styles.body}>
          <span className={styles.icon}>{VARIANT_ICON[variant]}</span>
          <p>{message}</p>
        </div>
        <div className={styles.buttons}>
          {resolvedButtons.map((btn, i) => (
            <button
              key={i}
              ref={btn.primary ? primaryRef : undefined}
              className="button"
              onClick={btn.onClick}
              autoFocus={btn.primary}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
