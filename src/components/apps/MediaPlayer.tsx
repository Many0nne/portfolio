import { useState, useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { playlist } from '../../data/playlist'
import styles from './MediaPlayer.module.css'

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function MediaPlayer({ fileId: _fileId }: { fileId?: string } = {}) {
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadError, setLoadError] = useState(false)

  const howlRef = useRef<Howl | null>(null)
  const rafRef = useRef<number>(0)
  const autoPlayRef = useRef(false)

  const track = playlist[trackIndex]

  useEffect(() => {
    const shouldAutoPlay = autoPlayRef.current

    howlRef.current?.stop()
    howlRef.current?.unload()
    howlRef.current = null
    cancelAnimationFrame(rafRef.current)
    setCurrentTime(0)
    setDuration(0)
    setLoadError(false)

    const howl = new Howl({
      src: [track.src],
      html5: true,
      onload: () => setDuration(howl.duration()),
      onloaderror: () => {
        setLoadError(true)
        setIsPlaying(false)
      },
      onend: () => {
        autoPlayRef.current = true
        setTrackIndex((i) => (i + 1) % playlist.length)
      },
    })

    howlRef.current = howl

    if (shouldAutoPlay) {
      howl.play()
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      howl.stop()
      howl.unload()
    }
  }, [trackIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = () => {
      const h = howlRef.current
      if (h) setCurrentTime(h.seek() as number)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  const handlePlayPause = useCallback(() => {
    const h = howlRef.current
    if (!h || loadError) return
    if (isPlaying) {
      h.pause()
      setIsPlaying(false)
      autoPlayRef.current = false
    } else {
      h.play()
      setIsPlaying(true)
      autoPlayRef.current = true
    }
  }, [isPlaying, loadError])

  const handlePrev = useCallback(() => {
    autoPlayRef.current = isPlaying
    setTrackIndex((i) => (i - 1 + playlist.length) % playlist.length)
  }, [isPlaying])

  const handleNext = useCallback(() => {
    autoPlayRef.current = isPlaying
    setTrackIndex((i) => (i + 1) % playlist.length)
  }, [isPlaying])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    howlRef.current?.seek(t)
    setCurrentTime(t)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={styles.player}>
      {/* LCD Display */}
      <div className={styles.display}>
        <div className={styles.trackLine}>
          <span className={styles.trackTitle} title={`${track.title} — ${track.artist}`}>
            {track.title}
          </span>
          <span className={styles.timeDisplay}>
            {formatTime(currentTime)}
          </span>
        </div>
        <div className={styles.artistLine}>
          {loadError ? (
            <span className={styles.errorText}>Fichier introuvable</span>
          ) : (
            <span className={styles.artistName}>{track.artist}</span>
          )}
          <span className={styles.totalTime}>/{formatTime(duration || track.duration)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressRow}>
        <input
          type="range"
          min={0}
          max={duration || track.duration}
          step={0.5}
          value={currentTime}
          onChange={handleSeek}
          className={styles.progressBar}
          aria-label="Position"
        />
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Visualizer */}
      <div className={styles.visualizer} aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className={`${styles.bar} ${isPlaying ? styles.barActive : ''}`}
            style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.transportButtons}>
          <button className={styles.btn} onClick={handlePrev} title="Précédent" aria-label="Précédent">
            ⏮
          </button>
          <button
            className={`${styles.btn} ${styles.btnPlay}`}
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause' : 'Lecture'}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className={styles.btn} onClick={handleNext} title="Suivant" aria-label="Suivant">
            ⏭
          </button>
        </div>
      </div>

      {/* Playlist indicator */}
      <div className={styles.playlist}>
        {playlist.map((t, i) => (
          <button
            key={t.id}
            className={`${styles.plItem} ${i === trackIndex ? styles.plItemActive : ''}`}
            onClick={() => {
              autoPlayRef.current = isPlaying
              setTrackIndex(i)
            }}
            title={`${t.title} — ${t.artist}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
