import { useCallback } from 'react'

type SoundName = 'open' | 'close' | 'error' | 'notify' | 'startup' | 'click'

// Simple sound hook — plays audio files from /sounds/ if they exist
// Silently fails if files are missing or audio is blocked
export function useSound() {
  const play = useCallback((name: SoundName) => {
    const muted = localStorage.getItem('win95-sound') === 'false'
    if (muted) return

    const audio = new Audio(`/sounds/${name}.wav`)
    audio.volume = 0.4
    audio.play().catch(() => {
      // Silently ignore missing files or autoplay policy
    })
  }, [])

  return { play }
}
