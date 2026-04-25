import type { FsNode } from '../types'

export const ROOT_ID = 'root'
export const WINDOWS_ID = 'windows'
export const PROGRAM_FILES_ID = 'program-files'
export const USERS_ID = 'users'
export const USERS_TERRY_ID = 'users-terry'
export const BUREAU_ID = 'bureau'
export const DOCUMENTS_ID = 'documents'
export const MES_PROJETS_ID = 'mes-projets'
export const MES_FILMS_ID = 'mes-films'
export const MUSIQUE_ID = 'musique'
export const IMAGES_ID = 'images'
export const TERRY_FILES_ID = 'terry-files'
export const RECYCLED_ID = 'recycled'

const NOW = Date.now()

const SKILLS_CONTENT = `COMPÉTENCES TECHNIQUES
────────────────────────────────────────────────────

FRONTEND
TypeScript                        : ★★★½☆
React                             : ★★★½☆
Vue.js                            : ★★★½☆
Nuxt                              : ★★★☆☆
CSS                               : ★★★½☆
Tailwind                          : ★★★★☆
Angular                           : ???

BACKEND
Node.js                           : ★★★☆☆
PostgreSQL                        : ★★★★☆
Python                            : ★★★½☆
Django                            : ★★½☆☆
PHP                               : ???
Machine Learning (IA generatives) : ★★½☆☆

OUTILS
Docker                            : ★★★★☆
Git                               : ★★★★☆
CI/CD                             : ★★★☆☆
Vite                              : ★★½☆☆
Kubernetes                        : ★½☆☆☆

DESIGN
Figma                             : ★★★½☆

────────────────────────────────────────────────────`

const RESUME_CONTENT = `Terry BARILLON
Full-Stack Developer · TypeScript · React · Vue.JS
barillon.terry.85@gmail.com
github.com/Many0nne

════════════════════════════════════════════════════

EXPÉRIENCES
────────────────────────────────────────────────────

AKAJOULE - DÉVELOPPEUR FULLSTACK
En cours
  Projet 1 - Outil web pour la réduction de
    production de gaz à effet de serre
    - Aide au développement d'un outil web assistant
      les entreprises dans leur réduction de production
      de gaz à effet de serre
    - Adaptation et correction de tests unitaires
      et end-to-end
    - Analyse approfondie de l'application pour
      identifier, expliquer et corriger les bugs
    - Développement d'une version statique
      minimaliste de l'application pour une
      présentation client optimisée
    - Correction et validation des fonctions afin de
      garantir leur exactitude mathématique
    - Technologies : Nuxt.js, Django, Tailwind,
      Django Rest Framework, Prime Vue, Auth0,
      PostgreSQL

  Projet 2 - Outil NOP pour réseaux de chaleur
    - Développement d'un outil pour faciliter la
      création de NOP (notes d'opportunités) pour la
      création de réseaux de chaleur
    - Création d'une maquette et d'une charte
      graphique pour l'outil sur Figma en se basant
      sur les wireframes
    - Développement d'un plan d'architecture
      applicative côté frontend (choix de librairies,
      nomenclature, décomposition modulaire, etc.)

════════════════════════════════════════════════════

PROJETS NOTABLES
────────────────────────────────────────────────────

TS-Mock-API (2026)
  Génère des APIs REST fonctionnelles à partir
  d'interfaces TypeScript. CRUD complet, Swagger
  auto-généré, pagination, persistance JSON.
  github.com/Many0nne/TS-Mock-API

GracefulErrors (2026)
  Bibliothèque TypeScript de gestion d'erreurs
  uniforme. Intégrations React/Vue, Axios,
  Sentry, Datadog, SSR, i18n.
  github.com/Many0nne/GracefulErrors

════════════════════════════════════════════════════

COMPÉTENCES TECHNIQUES
────────────────────────────────────────────────────

TypeScript  : ★★★½☆
React       : ★★★½☆
Vue.js      : ★★★½☆
Nuxt        : ★★★☆☆
CSS         : ★★★½☆
Node.js     : ★★★☆☆
PostgreSQL  : ★★★★☆
Docker      : ★★★★☆
Git         : ★★★★☆
CI/CD       : ★★★☆☆
Tailwind    : ★★★★☆
Vite        : ★★½☆☆
Figma       : ★★★½☆
Kubernetes  : ★½☆☆☆
Python      : ★★★½☆
Django      : ★★½☆☆
Machine Learning (IA generatives) : ★★½☆☆
Angular     : ???
PHP         : ???

════════════════════════════════════════════════════

SOFT SKILLS
────────────────────────────────────────────────────

Apprentissage continu
  J'aime apprendre vite, progresser en continu et
  approfondir les sujets jusqu'à en comprendre les
  fondations.

Force de proposition
  Je n'hésite pas à proposer des idées, améliorer
  l'existant et challenger les approches quand cela
  peut apporter de la valeur.

Communication et curiosité
  Je pose des questions quand c'est nécessaire, même
  si elles semblent basiques, pour sécuriser les
  décisions et éviter les malentendus.

════════════════════════════════════════════════════

FORMATION
────────────────────────────────────────────────────

Sept 2025
  MASTER EXPERT INFORMATIQUE ET
  SYSTÈME D'INFORMATION

2024 - 2025
  DEV - FULLSTACK : DÉVELOPPEUR
  EN INTELLIGENCE ARTIFICIELLE ET
  DATA SCIENCE

2022 - 2024
  PARCOURS SOCLE NUMÉRIQUE -
  BAC+1 / BAC+2

EPSI - Nantes

════════════════════════════════════════════════════`

const FILMS_CONTENT = `FILMS FAVORIS
────────────────────────────────────────────────────

Alien, le 8eme Passager (1979) - Ridley Scott
★★★★★
Huis clos spatial, tension parfaite.

Amadeus (1984) - Milos Forman
★★★★★
Virtuosite, jalousie et grace absolue.

Central Station (Central do Brasil) (1998) - Walter Salles
★★★★★
Road movie sensible et bouleversant.

Come and See (1985) - Elem Klimov
★★★★★
Une experience de guerre radicale.

────────────────────────────────────────────────────
Retrouver plus sur letterboxd.com/Manyonne/`

const PLAYLIST_CONTENT = `#EXTM3U
#EXTINF:231,I Digress - 666 Rehab, Skyte, heygwuapo
/audio/Skyte, heygwuapo - I DIGRESS (OFFICIAL MUSIC VIDEO).mp3
#EXTINF:200,Lacrimosa - Wolfgang Amadeus Mozart
/audio/Mozart - Lacrimosa.mp3
#EXTINF:226,Paint It Black - The Rolling Stones
/audio/The Rolling Stones - Paint It, Black (Official Lyric Video).mp3`

const WIN_INI_CONTENT = `[Windows]
CursorBlinkRate=530
SnapToDefaultButton=0
SwapMouseButtons=0

[Desktop]
Wallpaper=(None)
TileWallpaper=0
WallpaperStyle=0

[Fonts]
`

function file(
  id: string,
  parentId: string,
  name: string,
  content: string,
  mimeType: string,
  extra?: Partial<FsNode>
): FsNode {
  return {
    id,
    name,
    kind: 'file',
    parentId,
    content,
    mimeType,
    createdAt: NOW,
    modifiedAt: NOW,
    sizeBytes: new TextEncoder().encode(content).length,
    ...extra,
  }
}

function folder(
  id: string,
  parentId: string | null,
  name: string,
  extra?: Partial<FsNode>
): FsNode {
  return {
    id,
    name,
    kind: 'folder',
    parentId,
    createdAt: NOW,
    modifiedAt: NOW,
    sizeBytes: 0,
    ...extra,
  }
}

function lnk(
  id: string,
  parentId: string,
  name: string,
  app: FsNode['shortcut'] extends undefined ? never : NonNullable<FsNode['shortcut']>['app'],
  props?: Record<string, unknown>,
  extra?: Partial<FsNode>
): FsNode {
  return {
    id,
    name,
    kind: 'file',
    parentId,
    mimeType: 'application/x-shortcut',
    shortcut: { app, props },
    createdAt: NOW,
    modifiedAt: NOW,
    sizeBytes: 0,
    ...extra,
  }
}

export function buildSeedTree(): { rootId: string; nodes: Record<string, FsNode> } {
  const nodes: FsNode[] = [
    // Root C:\
    folder(ROOT_ID, null, 'C:'),

    // Windows\ (system, hidden)
    folder(WINDOWS_ID, ROOT_ID, 'Windows', { attrs: { system: true, hidden: true } }),
    file('win-ini', WINDOWS_ID, 'win.ini', WIN_INI_CONTENT, 'text/plain', { attrs: { readOnly: true } }),

    // Program Files\
    folder(PROGRAM_FILES_ID, ROOT_ID, 'Program Files'),
    folder('pf-notepad', PROGRAM_FILES_ID, 'Notepad'),
    lnk('pf-notepad-exe', 'pf-notepad', 'notepad.exe', 'notepad', undefined, { attrs: { readOnly: true } }),
    folder('pf-paint', PROGRAM_FILES_ID, 'Paint'),
    lnk('pf-paint-exe', 'pf-paint', 'mspaint.exe', 'paint', undefined, { attrs: { readOnly: true } }),
    folder('pf-mediaplayer', PROGRAM_FILES_ID, 'Media Player'),
    lnk('pf-mplayer-exe', 'pf-mediaplayer', 'mplayer.exe', 'media-player', undefined, { attrs: { readOnly: true } }),
    folder('pf-minesweeper', PROGRAM_FILES_ID, 'Minesweeper'),
    lnk('pf-winmine-exe', 'pf-minesweeper', 'winmine.exe', 'minesweeper', undefined, { attrs: { readOnly: true } }),
    folder('pf-mail', PROGRAM_FILES_ID, 'Mail'),
    lnk('pf-mail-exe', 'pf-mail', 'mail.exe', 'mail', undefined, { attrs: { readOnly: true } }),

    // Users\
    folder(USERS_ID, ROOT_ID, 'Users'),

    // Users\Terry\
    folder(USERS_TERRY_ID, USERS_ID, 'Terry'),

    // Users\Terry\Bureau\ (desktop folder)
    folder(BUREAU_ID, USERS_TERRY_ID, 'Bureau'),
    lnk('lnk-mes-projets', BUREAU_ID, 'Mes Projets', 'explorer', { folderId: MES_PROJETS_ID }),
    lnk('lnk-cv', BUREAU_ID, 'CV.txt', 'notepad', { fileId: 'cv-txt' }),
    lnk('lnk-competences', BUREAU_ID, 'Compétences.txt', 'notepad', { fileId: 'competences-txt' }),
    lnk('lnk-about', BUREAU_ID, 'À propos', 'about'),
    lnk('lnk-minesweeper', BUREAU_ID, 'Démineur', 'minesweeper'),
    lnk('lnk-terry-files', BUREAU_ID, 'Terry Files', 'explorer', { folderId: TERRY_FILES_ID }),
    lnk('lnk-mail', BUREAU_ID, 'Messagerie', 'mail'),
    lnk('lnk-paint', BUREAU_ID, 'Paint', 'paint'),
    lnk('lnk-media-player', BUREAU_ID, 'Lecteur Multimédia', 'media-player'),
    lnk('lnk-terminal', BUREAU_ID, 'Terminal', 'terminal'),

    // Users\Terry\Documents\
    folder(DOCUMENTS_ID, USERS_TERRY_ID, 'Documents'),
    file('cv-txt', DOCUMENTS_ID, 'CV.txt', RESUME_CONTENT, 'text/plain'),
    file('competences-txt', DOCUMENTS_ID, 'Compétences.txt', SKILLS_CONTENT, 'text/plain'),

    // Users\Terry\Mes Projets\
    folder(MES_PROJETS_ID, USERS_TERRY_ID, 'Mes Projets'),
    file('ts-mock-api-proj', MES_PROJETS_ID, 'TS-Mock-API.proj', 'ts-mock-api', 'application/x-project'),
    file('graceful-errors-proj', MES_PROJETS_ID, 'GracefulErrors.proj', 'graceful-errors', 'application/x-project'),

    // Users\Terry\Mes Films\
    folder(MES_FILMS_ID, USERS_TERRY_ID, 'Mes Films'),
    file('films-favoris-lst', MES_FILMS_ID, 'films-favoris.lst', FILMS_CONTENT, 'text/plain'),

    // Users\Terry\Musique\
    folder(MUSIQUE_ID, USERS_TERRY_ID, 'Musique'),
    file('playlist-m3u', MUSIQUE_ID, 'playlist.m3u', PLAYLIST_CONTENT, 'audio/x-mpegurl'),

    // Users\Terry\Images\
    folder(IMAGES_ID, USERS_TERRY_ID, 'Images'),

    // Terry Files\
    folder(TERRY_FILES_ID, ROOT_ID, 'Terry Files'),
    file('terry-films', TERRY_FILES_ID, 'films-favoris.lst', FILMS_CONTENT, 'text/plain'),

    // Recycled\
    folder(RECYCLED_ID, ROOT_ID, 'Recycled', { attrs: { system: true } }),
  ]

  const nodesRecord: Record<string, FsNode> = {}
  for (const node of nodes) {
    nodesRecord[node.id] = node
  }

  return { rootId: ROOT_ID, nodes: nodesRecord }
}
