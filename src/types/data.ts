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

export interface Mail {
  id: string
  from: string
  subject: string
  date: string
  read: boolean
  folder: 'inbox' | 'sent' | 'deleted'
  body: string
  to?: string
  previewImage?: string
  previewImageAlt?: string
}

export interface Track {
  id: string
  title: string
  artist: string
  src: string
  duration: number
}
