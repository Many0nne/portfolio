import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AudioStore } from '../types'

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      volume: 0.5,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setVolume: (v) => set({ volume: v }),
    }),
    { name: 'win95-audio' }
  )
)
