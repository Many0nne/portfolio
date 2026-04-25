export interface AudioStore {
  soundEnabled: boolean
  volume: number
  setSoundEnabled: (v: boolean) => void
  setVolume: (v: number) => void
}