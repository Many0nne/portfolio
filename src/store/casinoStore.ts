import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useFsStore } from '../fs/fsStore'
import { LNK_CASINO_ID, LNK_BANK_ID } from '../fs/seed'

export const PLEDGEABLE_LABELS: { id: string; label: string }[] = [
  { id: 'explorer', label: 'Explorateur' },
  { id: 'notepad', label: 'Notepad' },
  { id: 'about', label: 'À propos' },
  { id: 'minesweeper', label: 'Démineur' },
  { id: 'mail', label: 'Messagerie' },
  { id: 'paint', label: 'Paint' },
  { id: 'media-player', label: 'Lecteur Multimédia' },
]

interface CasinoState {
  unlocked: boolean
  credits: number
  debt: number
  pledgedFiles: string[]
  isBankrupt: boolean
  unlockCasino: () => void
  addCredits: (amount: number) => void
  deductCredits: (amount: number) => void
  pledgeFiles: (fileIds: string[]) => void
  redeemFiles: (fileIds: string[]) => void
  declareBankruptcy: () => void
}

export const useCasinoStore = create<CasinoState>()(
  persist(
    (set) => ({
      unlocked: false,
      credits: 500,
      debt: 0,
      pledgedFiles: [],
      isBankrupt: false,

      unlockCasino: () => {
        set({ unlocked: true })
        const fs = useFsStore.getState()
        fs.setAttrs(LNK_CASINO_ID, { hidden: false })
        fs.setAttrs(LNK_BANK_ID, { hidden: false })
      },

      addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

      deductCredits: (amount) =>
        set((s) => {
          const newCredits = Math.max(0, s.credits - amount)
          const allPledged = PLEDGEABLE_LABELS.every(({ id }) => s.pledgedFiles.includes(id))
          return { credits: newCredits, isBankrupt: allPledged && newCredits === 0 }
        }),

      pledgeFiles: (fileIds) =>
        set((s) => {
          const newPledged = [...new Set([...s.pledgedFiles, ...fileIds])]
          const newDebt = s.debt + fileIds.length * 100
          const allPledged = PLEDGEABLE_LABELS.every(({ id }) => newPledged.includes(id))
          return { pledgedFiles: newPledged, debt: newDebt, isBankrupt: allPledged && s.credits === 0 }
        }),

      redeemFiles: (fileIds) =>
        set((s) => ({
          pledgedFiles: s.pledgedFiles.filter((id) => !fileIds.includes(id)),
          debt: Math.max(0, s.debt - fileIds.length * 100),
          isBankrupt: false,
        })),

      declareBankruptcy: () => {
        localStorage.removeItem('win95-casino-v1')
        set({
          unlocked: false,
          credits: 500,
          debt: 0,
          pledgedFiles: [],
          isBankrupt: false,
        })
        const fs = useFsStore.getState()
        fs.setAttrs(LNK_CASINO_ID, { hidden: true })
        fs.setAttrs(LNK_BANK_ID, { hidden: true })
      },
    }),
    { name: 'win95-casino-v1' }
  )
)
