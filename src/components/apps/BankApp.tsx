import { useState } from 'react'
import styles from './BankApp.module.css'
import { useCasinoStore, PLEDGEABLE_APPS } from '../../store/casinoStore'
import type { AppType } from '../../data/filesystem'

type Tab = 'borrow' | 'repay'

export function BankApp() {
  const { credits, pledgedApps, addCredits, deductCredits, pledgeApps, redeemApps } =
    useCasinoStore()
  const [activeTab, setActiveTab] = useState<Tab>('borrow')
  const [selectedBorrow, setSelectedBorrow] = useState<AppType[]>([])
  const [selectedRepay, setSelectedRepay] = useState<AppType[]>([])

  const availableToBorrow = PLEDGEABLE_APPS.filter(
    ({ type }) => !pledgedApps.includes(type)
  )

  const borrowTotal = selectedBorrow.length * 100
  const repayTotal = selectedRepay.length * 100
  const canRepay = repayTotal > 0 && repayTotal <= credits

  const toggleBorrow = (type: AppType) => {
    setSelectedBorrow((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleRepay = (type: AppType) => {
    setSelectedRepay((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleConfirmLoan = () => {
    if (selectedBorrow.length === 0) return
    pledgeApps(selectedBorrow)
    addCredits(borrowTotal)
    setSelectedBorrow([])
  }

  const handleRepayRecover = () => {
    if (!canRepay) return
    redeemApps(selectedRepay)
    deductCredits(repayTotal)
    setSelectedRepay([])
  }

  return (
    <div className={styles.bank}>
      <div className={styles.header}>
        <div className={styles.logo} />
        <div>
          <div className={styles.bankName}>First National Bank of Win95</div>
          <div className={styles.tagline}>Vos actifs, notre garantie™</div>
        </div>
        <div className={styles.balance}>💰 {credits} crédits</div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'borrow' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('borrow')}
        >
          Emprunter
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'repay' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('repay')}
        >
          Rembourser
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'borrow' && (
          <div className={styles.panel}>
            <p className={styles.hint}>
              Mettez vos applications en gage — 100 crédits par application.
            </p>
            {availableToBorrow.length === 0 ? (
              <div className={styles.empty}>Toutes vos applications sont déjà engagées.</div>
            ) : (
              <div className={styles.appList}>
                {availableToBorrow.map(({ type, label }) => (
                  <label key={type} className={styles.appRow} onClick={() => toggleBorrow(type)}>
                    <span className={styles.radio}>
                      <img src="/icon/radio-border.svg" alt="" width={12} height={12} />
                      {selectedBorrow.includes(type) && (
                        <img src="/icon/radio-dot.svg" alt="" width={4} height={4} className={styles.radioDot} />
                      )}
                    </span>
                    <span className={styles.appLabel}>{label}</span>
                    <span className={styles.appValue}>+100 cr.</span>
                  </label>
                ))}
              </div>
            )}
            <div className={styles.footer}>
              <span className={styles.total}>
                Total : <strong>+{borrowTotal} crédits</strong>
              </span>
              <button
                className={styles.actionBtn}
                disabled={selectedBorrow.length === 0}
                onClick={handleConfirmLoan}
              >
                Confirmer le prêt
              </button>
            </div>
          </div>
        )}

        {activeTab === 'repay' && (
          <div className={styles.panel}>
            <p className={styles.hint}>
              Récupérez vos applications — 100 crédits par application.
            </p>
            {pledgedApps.length === 0 ? (
              <div className={styles.empty}>Aucune application engagée.</div>
            ) : (
              <div className={styles.appList}>
                {PLEDGEABLE_APPS.filter(({ type }) => pledgedApps.includes(type)).map(
                  ({ type, label }) => (
                    <label key={type} className={styles.appRow} onClick={() => toggleRepay(type)}>
                      <span className={styles.radio}>
                        <img src="/icon/radio-border.svg" alt="" width={12} height={12} />
                        {selectedRepay.includes(type) && (
                          <img src="/icon/radio-dot.svg" alt="" width={4} height={4} className={styles.radioDot} />
                        )}
                      </span>
                      <span className={styles.appLabel}>🔒 {label}</span>
                      <span className={styles.appValue}>-100 cr.</span>
                    </label>
                  )
                )}
              </div>
            )}
            <div className={styles.footer}>
              <span className={styles.total}>
                Coût : <strong>{repayTotal} crédits</strong>
                {repayTotal > credits && (
                  <span className={styles.insufficient}> (solde insuffisant)</span>
                )}
              </span>
              <button
                className={styles.actionBtn}
                disabled={!canRepay}
                onClick={handleRepayRecover}
              >
                Rembourser & Récupérer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
