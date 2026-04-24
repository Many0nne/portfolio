import { useState, useEffect, useRef } from 'react'
import styles from './MenuBar.module.css'

export type MenuItem =
  | {
      separator: true
      label?: string
      onClick?: () => void
      disabled?: boolean
      checked?: boolean
    }
  | {
      label: string
      onClick?: () => void
      separator?: false
      disabled?: boolean
      checked?: boolean
    }

export interface Menu {
  label: string
  items: MenuItem[]
}

interface MenuBarProps {
  menus: Menu[]
}

export function MenuBar({ menus }: MenuBarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openIndex === null) return
    const handler = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenIndex(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openIndex])

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <div className={styles.bar} ref={barRef}>
      {menus.map((menu, i) => (
        <div key={menu.label} className={styles.menuItem}>
          <button
            className={`${styles.trigger} ${openIndex === i ? styles.open : ''}`}
            onClick={() => toggle(i)}
            onMouseEnter={() => openIndex !== null && setOpenIndex(i)}
          >
            {menu.label}
          </button>
          {openIndex === i && (
            <div className={styles.dropdown}>
              {menu.items.map((item, j) =>
                item.separator ? (
                  <div key={j} className={styles.separator} />
                ) : (
                  <button
                    key={j}
                    className={`${styles.dropdownItem} ${item.disabled ? styles.disabled : ''}`}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick?.()
                        setOpenIndex(null)
                      }
                    }}
                  >
                    {item.checked ? <span className={styles.check}>✓</span> : <span className={styles.check} />}
                    {item.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
