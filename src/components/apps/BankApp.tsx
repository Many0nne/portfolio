import { useState } from 'react'
import styles from './BankApp.module.css'
import { useCasinoStore, PLEDGEABLE_LABELS } from '../../store/casinoStore'

type Tab = 'borrow' | 'repay'

export function BankApp() {
  const { credits, pledgedFiles, addCredits, deductCredits, pledgeFiles, redeemFiles } = useCasinoStore()
  const [activeTab, setActiveTab] = useState<Tab>('borrow')
  const [selectedBorrow, setSelectedBorrow] = useState<string[]>([])
  const [selectedRepay, setSelectedRepay] = useState<string[]>([])

  const availableToBorrow = PLEDGEABLE_LABELS.filter(({ id }) => !pledgedFiles.includes(id))
  const borrowTotal = selectedBorrow.length * 100
  const repayTotal = selectedRepay.length * 100
  const canRepay = repayTotal > 0 && repayTotal <= credits

  const toggleBorrow = (id: string) =>
    setSelectedBorrow((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const toggleRepay = (id: string) =>
    setSelectedRepay((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const handleConfirmLoan = () => {
    if (selectedBorrow.length === 0) return
    pledgeFiles(selectedBorrow)
    addCredits(borrowTotal)
    setSelectedBorrow([])
  }

  const handleRepayRecover = () => {
    if (!canRepay) return
    redeemFiles(selectedRepay)
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
        <div className={styles.balance}>Credits : {credits}</div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'borrow' ? styles.activeTab : ''}`} onClick={() => setActiveTab('borrow')}>Emprunter</button>
        <button className={`${styles.tab} ${activeTab === 'repay' ? styles.activeTab : ''}`} onClick={() => setActiveTab('repay')}>Rembourser</button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'borrow' && (
          <div className={styles.panel}>
            <p className={styles.hint}>Mettez des droits d'accès en gage — 100 crédits par item.</p>
            {availableToBorrow.length === 0 ? (
              <div className={styles.empty}>Tous vos items sont déjà engagés.</div>
            ) : (
              <div className={styles.appList}>
                {availableToBorrow.map(({ id, label }) => (
                  <label key={id} className={styles.appRow} onClick={() => toggleBorrow(id)}>
                    <span className={styles.radio}>
                      <img src="/icon/radio-border.svg" alt="" width={12} height={12} />
                      {selectedBorrow.includes(id) && <img src="/icon/radio-dot.svg" alt="" width={4} height={4} className={styles.radioDot} />}
                    </span>
                    <span className={styles.appLabel}>{label}</span>
                    <span className={styles.appValue}>+100 cr.</span>
                  </label>
                ))}
              </div>
            )}
            <div className={styles.footer}>
              <span className={styles.total}>Total : <strong>+{borrowTotal} crédits</strong></span>
              <button className={styles.actionBtn} disabled={selectedBorrow.length === 0} onClick={handleConfirmLoan}>Confirmer le prêt</button>
            </div>
          </div>
        )}

        {activeTab === 'repay' && (
          <div className={styles.panel}>
            <p className={styles.hint}>Récupérez vos accès — 100 crédits par item.</p>
            {pledgedFiles.length === 0 ? (
              <div className={styles.empty}>Aucun item engagé.</div>
            ) : (
              <div className={styles.appList}>
                {PLEDGEABLE_LABELS.filter(({ id }) => pledgedFiles.includes(id)).map(({ id, label }) => (
                  <label key={id} className={styles.appRow} onClick={() => toggleRepay(id)}>
                    <span className={styles.radio}>
                      <img src="/icon/radio-border.svg" alt="" width={12} height={12} />
                      {selectedRepay.includes(id) && <img src="/icon/radio-dot.svg" alt="" width={4} height={4} className={styles.radioDot} />}
                    </span>
                    <span className={styles.appLabel}>{label}</span>
                    <span className={styles.appValue}>-100 cr.</span>
                  </label>
                ))}
              </div>
            )}
            <div className={styles.footer}>
              <span className={styles.total}>
                Coût : <strong>{repayTotal} crédits</strong>
                {repayTotal > credits && <span className={styles.insufficient}> (solde insuffisant)</span>}
              </span>
              <button className={styles.actionBtn} disabled={!canRepay} onClick={handleRepayRecover}>Rembourser & Récupérer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
