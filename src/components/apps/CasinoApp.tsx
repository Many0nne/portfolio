import { useState, useCallback, useRef, useEffect } from 'react'
import styles from './CasinoApp.module.css'
import { useCasinoStore } from '../../store/casinoStore'

const SYMBOLS = [
  { label: '7',        multiplier: 50, weight: 1,  icon: '/img/7.png' },
  { label: 'Bell',     multiplier: 20, weight: 2,  icon: '/img/cloche.jpg' },
  { label: 'Cherries', multiplier: 10, weight: 4,  icon: '/img/cerise.jpg' },
  { label: 'Lemon',    multiplier: 8,  weight: 6,  icon: '/img/citron.jpg' },
  { label: 'Peach',    multiplier: 5,  weight: 10, icon: '/img/orange.jpg' },
  { label: 'Grapes',   multiplier: 3,  weight: 15, icon: '/img/raisin.jpg' },
]

const POOL: number[] = []
for (let i = 0; i < SYMBOLS.length; i++) {
  for (let j = 0; j < SYMBOLS[i].weight; j++) POOL.push(i)
}

function pickSymbolIndex() {
  return POOL[Math.floor(Math.random() * POOL.length)]
}

function SymbolIcon({ src, label, className }: { src: string; label: string; className?: string }) {
  return <img src={src} alt={label} className={className} draggable={false} />
}

let _audioCtx: AudioContext | null = null
function getAudioContext(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new AudioContext()
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume()
  }
  return _audioCtx
}

function playSound(type: 'win' | 'loss') {
  try {
    const ctx = getAudioContext()
    if (type === 'win') {
      const notes = [261.6, 329.6, 392, 523.3]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.value = 0.15
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.1)
      })
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    }
  } catch {
    // Audio not available
  }
}

function playTickSound() {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = 800 + Math.random() * 400
    gain.gain.value = 0.04
    osc.start()
    osc.stop(ctx.currentTime + 0.03)
  } catch {
    // Audio not available
  }
}

export function CasinoApp() {
  const { credits, deductCredits, addCredits } = useCasinoStore()
  const [bet, setBet] = useState(10)
  const [reels, setReels] = useState([5, 5, 5])
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState('')
  const [isWin, setIsWin] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleSpin = useCallback(() => {
    if (spinning || credits < bet) return
    deductCredits(bet)
    setSpinning(true)
    setMessage('')
    setIsWin(false)

    const finalIndices = [pickSymbolIndex(), pickSymbolIndex(), pickSymbolIndex()]
    let tick = 0

    intervalRef.current = setInterval(() => {
      setReels([pickSymbolIndex(), pickSymbolIndex(), pickSymbolIndex()])
      playTickSound()
      tick++
      if (tick >= 22) {
        clearInterval(intervalRef.current!)
        setReels(finalIndices)
        setSpinning(false)

        const won = finalIndices[0] === finalIndices[1] && finalIndices[1] === finalIndices[2]
        if (won) {
          const payout = bet * SYMBOLS[finalIndices[0]].multiplier
          addCredits(payout)
          playSound('win')
          setIsWin(true)
          setMessage(`Gagné ! +${payout} crédits`)
        } else {
          playSound('loss')
          setMessage('Perdu !')
        }
      }
    }, 80)
  }, [spinning, credits, bet, deductCredits, addCredits])

  const canBetMore = bet < 50 && bet < credits
  const canBetLess = bet > 5

  return (
    <div className={styles.casino}>
      <div className={styles.header}>
        <span className={styles.balance}>💰 {credits} crédits</span>
      </div>

      <div className={styles.machine}>
        <div className={styles.machineTop}>
          <span className={styles.machineTitle}>★ CASINO WIN95 ★</span>
        </div>
        <div className={styles.reelWindow}>
          <div className={styles.reels}>
            {reels.map((symIdx, i) => (
              <div key={i} className={`${styles.reel} ${spinning ? styles.spinning : ''}`}>
                <SymbolIcon
                  src={SYMBOLS[symIdx].icon}
                  label={SYMBOLS[symIdx].label}
                  className={styles.symbol}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={`${styles.message} ${isWin ? styles.win : ''}`}>
          {message || ' '}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.betRow}>
          <span className={styles.betLabel}>Mise :</span>
          <button
            className={styles.betBtn}
            onClick={() => setBet((b) => Math.max(5, b - 5))}
            disabled={spinning || !canBetLess}
          >
            −
          </button>
          <span className={styles.betAmount}>{bet}</span>
          <button
            className={styles.betBtn}
            onClick={() => setBet((b) => Math.min(50, Math.min(credits, b + 5)))}
            disabled={spinning || !canBetMore}
          >
            +
          </button>
          <span className={styles.betLabel}>crédits</span>
        </div>

        <button
          className={styles.spinBtn}
          onClick={handleSpin}
          disabled={spinning || credits < bet}
        >
          {spinning ? '⏳ En cours...' : '🎰 LANCER'}
        </button>
      </div>

      <div className={styles.payoutTable}>
        <div className={styles.payoutTitle}>— Tableau des gains —</div>
        <div className={styles.payoutGrid}>
          {SYMBOLS.map((s) => (
            <div key={s.label} className={styles.payoutRow}>
              <div className={styles.payoutSymbols}>
                {[0, 1, 2].map((k) => (
                  <SymbolIcon key={k} src={s.icon} label={s.label} className={styles.payoutSymbol} />
                ))}
              </div>
              <span className={styles.payoutMult}>× {s.multiplier}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
