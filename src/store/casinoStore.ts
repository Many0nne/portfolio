import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppType } from '../data/filesystem'

export const PLEDGEABLE_APPS: { type: AppType; label: string }[] = [
  { type: 'file-explorer', label: 'Explorateur' },
  { type: 'skills', label: 'Compétences' },
  { type: 'resume', label: 'CV.txt' },
  { type: 'about', label: 'À propos' },
  { type: 'minesweeper', label: 'Démineur' },
  { type: 'mail', label: 'Messagerie' },
  { type: 'paint', label: 'Paint' },
  { type: 'media-player', label: 'Lecteur Multimédia' },
]

interface CasinoState {
  unlocked: boolean
  credits: number
  debt: number
  pledgedApps: AppType[]
  isBankrupt: boolean
  unlockCasino: () => void
  addCredits: (amount: number) => void
  deductCredits: (amount: number) => void
  pledgeApps: (apps: AppType[]) => void
  redeemApps: (apps: AppType[]) => void
  declareBankruptcy: () => void
}

export const useCasinoStore = create<CasinoState>()(
  persist(
    (set) => ({
      unlocked: false,
      credits: 500,
      debt: 0,
      pledgedApps: [],
      isBankrupt: false,

      unlockCasino: () => set({ unlocked: true }),

      addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

      deductCredits: (amount) =>
        set((s) => {
          const newCredits = Math.max(0, s.credits - amount)
          const allPledged = PLEDGEABLE_APPS.every(({ type }) => s.pledgedApps.includes(type))
          return { credits: newCredits, isBankrupt: allPledged && newCredits === 0 }
        }),

      pledgeApps: (apps) =>
        set((s) => {
          const newPledged = [...new Set([...s.pledgedApps, ...apps])]
          const newDebt = s.debt + apps.length * 100
          const allPledged = PLEDGEABLE_APPS.every(({ type }) => newPledged.includes(type))
          return { pledgedApps: newPledged, debt: newDebt, isBankrupt: allPledged && s.credits === 0 }
        }),

      redeemApps: (apps) =>
        set((s) => ({
          pledgedApps: s.pledgedApps.filter((a) => !apps.includes(a)),
          debt: Math.max(0, s.debt - apps.length * 100),
          isBankrupt: false,
        })),

      declareBankruptcy: () => {
        localStorage.clear()
        window.location.reload()
      },
    }),
    { name: 'win95-casino-v1' }
  )
)
