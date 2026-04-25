import { useCallback } from 'react'
import { useAudioStore } from '../store/audioStore'

type SoundName = 'open' | 'close' | 'error' | 'notify' | 'startup' | 'click'

export function useSound() {
  const play = useCallback((name: SoundName) => {
    if (!useAudioStore.getState().soundEnabled) return

    const audio = new Audio(`/sounds/${name}.wav`)
    audio.volume = 0.4
    audio.play().catch(() => {
      // Silently ignore missing files or autoplay policy
    })
  }, [])

  return { play }
}
