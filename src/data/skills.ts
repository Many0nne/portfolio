export interface Skill {
  name: string
  icon: string
  level: number | null
  category: 'frontend' | 'backend' | 'outils' | 'design'
}

export const skills: Skill[] = [
  { name: 'TypeScript', icon: 'https://cdn.simpleicons.org/typescript', level: 3.5, category: 'frontend' },
  { name: 'React', icon: 'https://cdn.simpleicons.org/react', level: 3.5, category: 'frontend' },
  { name: 'Vue.js', icon: 'https://cdn.simpleicons.org/vuedotjs', level: 3.5, category: 'frontend' },
  { name: 'Nuxt', icon: 'https://cdn.simpleicons.org/nuxt', level: 3, category: 'frontend' },
  { name: 'CSS', icon: 'https://cdn.simpleicons.org/css', level: 3.5, category: 'frontend' },
  { name: 'Tailwind', icon: 'https://cdn.simpleicons.org/tailwindcss', level: 4, category: 'frontend' },
  { name: 'Angular', icon: 'https://cdn.simpleicons.org/angular', level: null, category: 'frontend' },
  { name: 'Node.js', icon: 'https://cdn.simpleicons.org/nodedotjs', level: 3, category: 'backend' },
  { name: 'PostgreSQL', icon: 'https://cdn.simpleicons.org/postgresql', level: 4, category: 'backend' },
  { name: 'Python', icon: 'https://cdn.simpleicons.org/python', level: 3.5, category: 'backend' },
  { name: 'Django', icon: 'https://cdn.simpleicons.org/django', level: 2.5, category: 'backend' },
  { name: 'PHP', icon: 'https://cdn.simpleicons.org/php', level: null, category: 'backend' },
  { name: 'Machine Learning (IA generatives)', icon: 'https://cdn.simpleicons.org/openai', level: 2.5, category: 'backend' },
  { name: 'Docker', icon: 'https://cdn.simpleicons.org/docker', level: 4, category: 'outils' },
  { name: 'Git', icon: 'https://cdn.simpleicons.org/git', level: 4, category: 'outils' },
  { name: 'CI/CD', icon: 'https://cdn.simpleicons.org/githubactions', level: 3, category: 'outils' },
  { name: 'Vite', icon: 'https://cdn.simpleicons.org/vite', level: 2.5, category: 'outils' },
  { name: 'Kubernetes', icon: 'https://cdn.simpleicons.org/kubernetes', level: 1.5, category: 'outils' },
  { name: 'Figma', icon: 'https://cdn.simpleicons.org/figma', level: 3.5, category: 'design' },
]
