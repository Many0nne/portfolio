import { skills } from '../skills'
import type { TextEditorDocument } from './types'

const CATEGORIES = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'outils', label: 'Outils' },
  { key: 'design', label: 'Design' },
] as const

const SKILL_NAME_WIDTH = 34

function levelToStars(level: number): string {
  const clamped = Math.max(0, Math.min(5, level))
  const full = Math.floor(clamped)
  const hasHalf = clamped - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return `${'★'.repeat(full)}${hasHalf ? '½' : ''}${'☆'.repeat(empty)}`
}

function buildSkillsContent() {
  return [
    'COMPÉTENCES TECHNIQUES',
    '────────────────────────────────────────────────────',
    '',
    ...CATEGORIES.flatMap((category) => {
      const categorySkills = skills.filter((skill) => skill.category === category.key)

      if (!categorySkills.length) {
        return []
      }

      return [
        category.label.toUpperCase(),
        ...categorySkills.map((skill) => {
          const levelLabel = skill.level === null ? '???' : levelToStars(skill.level)

          return `${skill.name.padEnd(SKILL_NAME_WIDTH, ' ')}: ${levelLabel}`
        }),
        '',
      ]
    }),
    '────────────────────────────────────────────────────',
  ].join('\n')
}

export const skillsDocument: TextEditorDocument = {
  content: buildSkillsContent(),
  downloadFileName: 'Competences.txt',
}