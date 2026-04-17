import styles from './SkillsApp.module.css'
import { skills } from '../../data/skills'
import { ProgressBar } from '../shared/ProgressBar'

const CATEGORIES = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'outils', label: 'Outils' },
  { key: 'design', label: 'Design' },
] as const

function levelToStars(level: number): string {
  const clamped = Math.max(0, Math.min(5, level))
  const full = Math.floor(clamped)
  const hasHalf = clamped - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return `${'★'.repeat(full)}${hasHalf ? '½' : ''}${'☆'.repeat(empty)}`
}

export function SkillsApp() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img className={styles.headerIcon} src="/img/Settings_32x32_4.png" alt="" />
        <span>Panneau de configuration — Compétences</span>
      </div>
      <div className={styles.body}>
        {CATEGORIES.map((cat) => {
          const catSkills = skills.filter((s) => s.category === cat.key)
          if (!catSkills.length) return null
          return (
            <section key={cat.key} className={styles.section}>
              <div className={styles.sectionTitle}>{cat.label}</div>
              <div className={styles.skillList}>
                {catSkills.map((skill) => (
                  <div key={skill.name} className={styles.skillRow}>
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className={styles.skillIcon}
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                    <span className={styles.skillName}>{skill.name}</span>
                    {skill.level === null ? (
                      <ProgressBar value={0} label="???" />
                    ) : (
                      <ProgressBar value={skill.level * 20} label={levelToStars(skill.level)} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
