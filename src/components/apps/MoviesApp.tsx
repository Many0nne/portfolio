import styles from './MoviesApp.module.css'
import { movies, LETTERBOXD_URL } from '../../data/movies'

const STARS = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export function MoviesApp() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Films favoris</span>
        <span className={styles.headerCount}>{movies.length} entrées</span>
      </div>

      <div className={styles.list}>
        {movies.map((film, i) => (
          <div key={film.id} className={styles.row}>
            <span className={styles.index}>{String(i + 1).padStart(2, '0')}.</span>
            <div className={styles.info}>
              <span className={styles.title}>{film.title}</span>
              <span className={styles.meta}>
                {film.year} · {film.director}
              </span>
              {film.note && <span className={styles.note}>{film.note}</span>}
            </div>
            <span className={styles.rating}>{STARS(film.rating)}</span>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <a
          href={LETTERBOXD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.letterboxdBtn}
        >
          Voir mon Letterboxd
        </a>
      </div>
    </div>
  )
}
