import styles from './DialogBox.module.css'
import { AppIcon } from './AppIcon'

interface DialogBoxProps {
  title: string
  message: string
  icon?: 'info' | 'error' | 'question'
  onOk: () => void
  onCancel?: () => void
}

export function DialogBox({ title, message, icon = 'info', onOk, onCancel }: DialogBoxProps) {
  const iconName = icon === 'error' ? '❌' : icon === 'question' ? '❓' : 'ℹ️'

  return (
    <div className={styles.overlay} role="alertdialog" aria-label={title}>
      <div className={styles.dialog}>
        <div className={styles.titleBar}>
          <AppIcon name="info" size={14} />
          <span>{title}</span>
        </div>
        <div className={styles.body}>
          <span className={styles.icon}>{iconName}</span>
          <p>{message}</p>
        </div>
        <div className={styles.buttons}>
          {onCancel && (
            <button className="button" onClick={onCancel}>
              Annuler
            </button>
          )}
          <button className="button" onClick={onOk} autoFocus>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
