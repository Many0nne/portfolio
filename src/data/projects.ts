export interface Project {
  id: string
  title: string
  shortDesc: string
  description: string
  screenshot: string
  techStack: string[]
  date: string
  role: string
  links: {
    label: 'GitHub' | 'Demo' | 'Article'
    url: string
  }[]
  category: 'web' | 'mobile' | 'autre'
  featured: boolean
}

export const projects: Project[] = [
  {
    id: 'ts-mock-api',
    title: 'TS-Mock-API',
    shortDesc: "Génère une API REST complète à partir d'interfaces TypeScript.",
    description:
      'Outil qui génère des APIs REST fonctionnelles avec données réalistes ' +
      'directement depuis des interfaces TypeScript annotées. Aucun backend requis. ' +
      'Supporte CRUD complet, pagination, filtrage, tri, contraintes JSDoc, ' +
      'documentation Swagger auto-générée et persistance JSON optionnelle.',
    screenshot: '/img/TS-Mock-API.png',
    techStack: ['TypeScript', 'Node.js', 'Express', 'Faker.js', 'Swagger/OpenAPI'],
    date: '2064',
    role: 'Auteur · Conception & développement complet',
    links: [
      { label: 'GitHub', url: 'https://github.com/Many0nne/TS-Mock-API' },
    ],
    category: 'autre',
    featured: true,
  },
  {
    id: 'graceful-errors',
    title: 'GracefulErrors',
    shortDesc: "Moteur d'erreurs TypeScript pour des expériences utilisateur cohérentes.",
    description:
      'Bibliothèque TypeScript qui transforme les erreurs techniques en expériences ' +
      'utilisateur uniformes. Registre centralisé des codes d\'erreur, intégrations ' +
      'React & Vue (hooks/composables, error boundaries), support Axios, ' +
      'Sentry/Datadog, SSR (Next.js, Nuxt, Remix), i18n et zero-dependency core.',
    screenshot: '/img/gracefulerrors.png',
    techStack: ['TypeScript', 'React', 'Vue', 'Axios', 'Sentry', 'Datadog'],
    date: '2026',
    role: 'Auteur · Conception & développement complet',
    links: [
      { label: 'GitHub', url: 'https://github.com/Many0nne/GracefulErrors' },
    ],
    category: 'autre',
    featured: true,
  },
]
