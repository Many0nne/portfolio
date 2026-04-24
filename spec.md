# Spec — Refonte « vrai OS » du portfolio Windows 95

> Document destiné à une nouvelle session Claude Code. Tout ce dont elle a besoin pour implémenter sans fouiller le repo doit se trouver ici.
> Stack : React 19 + TS, Vite, Zustand 5, 98.css, Howler. Aucun test configuré. Pas de CSS-in-JS — uniquement CSS Modules co-localisés + variables 98.css globales.

---

## 1. Objectif

Aujourd'hui le projet est une mosaïque d'apps autonomes qui chacune ré-implémente sa propre vue d'un « contenu » statique (Notepad x3, Films, Mail, Contact qui clone le Terminal, etc.). Beaucoup de comportements OS sont triches : pas de vraie filesystem, pas de file association, pas de shell unifié, content figé en variantes, etc.

**Cible :** un OS cohérent où :
1. Une **seule source de vérité** décrit l'arborescence de fichiers (`C:\` racine).
2. Chaque fichier a une **extension** ; l'extension détermine **quelle app** l'ouvre (file association).
3. Les apps sont **génériques** : Notepad lit *n'importe quel* `.txt`, Media Player lit *n'importe quel* `.mp3`, MS Paint ouvre/enregistre des `.bmp`, etc. Plus de variantes hardcodées.
4. Le **shell (Terminal)** opère sur la même filesystem (lit ET écrit). Les apps qui touchent au FS passent par le même module.
5. Le **Casino** est une app comme une autre : cohabite mais ne pollue plus le store global, ne wipe plus tout le localStorage en cas de banqueroute, et ne « gage » plus des AppType (mécanique anti-OS — voir §6).
6. Les comportements **standard Win95 manquants** sont ajoutés : right-click contextuel sur fichiers/icônes, redimensionnement de fenêtre, multi-instances, dialogues vraiment modaux, Corbeille fonctionnelle, "Poste de travail".

---

## 2. État actuel — incohérences à corriger

Numérotées ; chaque numéro est référencé dans le plan d'action §7.

### 2.1 Filesystem & sources dupliquées
- **I-1** Trois sources distinctes décrivent le contenu : `desktopShortcuts` (raccourcis bureau) **ET** `filesystem` (arbre Explorer/Terminal) **ET** `DRIVE_ROOT_CHILDREN` (racine `C:\` synthétique inlinée dans `TerminalApp.tsx:110-118`). Elles divergent : ex. Mail, Paint, MediaPlayer, Casino, Bank, Démineur sont sur le bureau mais **absents du `filesystem`** → inaccessibles via Explorer ou Terminal.
- **I-2** Le « disque » est faux : `DRIVE_ROOT_CHILDREN` ne contient qu'une entrée `portfolio`, et `getPathString` (`src/utils/fsUtils.ts:3-6`) renvoie toujours `C:\PORTFOLIO\…`, alors que la racine `C:\` est vide à part « portfolio ». Aucun `Windows`, `Program Files`, `Users`, `Recycled`.
- **I-3** Les fichiers ont des **noms d'extension décoratifs** (`Compétences.txt`, `films-favoris.lst`, `Terminal.exe`) mais l'ouverture ne dépend pas de l'extension : `appType` est codé en dur sur le node (`filesystem.ts:84,97,108,116,124,132,148`). Un `.txt` ouvre une app *différente* selon le node.

### 2.2 Apps qui dupliquent un même comportement
- **I-4** `TextEditorApp` (`src/components/apps/TextEditorApp.tsx`) prend une prop `variant` ∈ `'skills'|'resume'|'notes'` et lit dans `TEXT_EDITOR_DOCUMENTS`. C'est **3 apps déguisées**. Cela force `AppType` à contenir `skills`, `resume`, `notes` (`filesystem.ts:5-7`) + 3 entrées dans `DEFAULT_SIZES`/`APP_TITLES`/`APP_ICONS` (`windowStore.ts:23-25, 41-43, 59-61`) + 3 cases dans `App.tsx:53-58`.
- **I-5** `MoviesApp` (`src/components/apps/MoviesApp.tsx`) est juste un Notepad spécialisé qui rend `data/movies.ts` en HTML. Le fichier `films-favoris.lst` doit s'ouvrir dans Notepad comme un autre document texte (avec, si besoin, une présentation tableau quand l'app détecte du contenu structuré — sinon plain text).
- **I-6** `ContactApp` (`src/components/apps/ContactApp.tsx`) est un **clone du Terminal** (mêmes types `Line`, mêmes commandes `help/clear`, plus `whoami/email/github/linkedin/777`). Il n'est référencé nulle part (`Grep ContactApp` → seul son propre fichier). C'est du code mort qui contenait la mécanique d'unlock Casino (commande `777`). **Conséquence cachée** : le déverrouillage Casino n'a actuellement **aucun chemin utilisateur**. À supprimer ; la commande `777` (ou autre easter-egg) doit être migrée dans le vrai `TerminalApp`.

### 2.3 Window manager
- **I-7** Une seule instance par `AppType` (sauf `project-viewer`) — `windowStore.ts:96-112`. Un vrai OS permet plusieurs Notepad ouverts sur des fichiers différents. À assouplir (multi-instance pour Notepad, Paint, Media Player, Explorer ; mono-instance reste légitime pour Bank, Casino, Démineur).
- **I-8** Pas de redimensionnement : `Window.module.css:97-110` définit 8 handles (`n,s,e,w,ne,nw,se,sw`) mais `Window.tsx` ne les rend jamais. `updateSize` (`windowStore.ts:196-200`) existe mais n'est jamais appelé.
- **I-9** `zCounter` est une variable module (`windowStore.ts:72`) hors du store. Pas un bug, mais incohérent avec le reste — si la racine se ré-instancie (HMR…) elle se réinitialise et casse les ordres.
- **I-10** Le compteur max 8 fenêtres (`windowStore.ts:115`) est arbitraire et silencieux (rien ne s'affiche quand on dépasse). Soit le supprimer, soit afficher une dialog modale "Mémoire insuffisante" Win95-style.

### 2.4 Shell (Terminal)
- **I-11** Lecture seule : pas de `mkdir`, `del`, `copy`, `move`, `ren`, `type`, `echo >`, `attrib`. Sans ces commandes le shell n'est qu'un viewer. Au minimum implémenter : `type <file>`, `echo <txt> > <file>`, `mkdir <dir>`, `del <file>`, `ren <a> <b>`, `copy <src> <dst>`, `cls`, `exit`.
- **I-12** Le terminal n'invoque **pas** les file associations : `start` ouvre via `entry.appType` (`TerminalApp.tsx:375-384`). Doit utiliser le module `fileAssociations` introduit en §3.3.
- **I-13** L'autocomplétion (`TerminalApp.tsx:51-76, 472-496`) n'est pas étendue à `type`, `del`, etc. — toute commande prenant un path doit en bénéficier.
- **I-14** Pas d'`exit` (ferme la fenêtre), pas de `tree` (utile si vraie hiérarchie), pas de `where` / `which`, pas de support des variables d'environnement (`%PATH%`, `%USERPROFILE%`).
- **I-15** Le prompt affiche `C:\PORTFOLIO\...` partout (majuscules) ; cohérent MS-DOS, mais incohérent avec le label affiché dans Explorer (`Portfolio`, casse mixte). Définir une règle unique (cf. §4.1).

### 2.5 Explorer
- **I-16** Address bar `readOnly` (`FileExplorer.tsx:158`). Doit accepter un path tapé (`C:\Projets\TS-Mock-API`) et naviguer.
- **I-17** Pas de menu contextuel sur fichier/dossier (Open, Open with…, Cut, Copy, Paste, Rename, Delete, Properties).
- **I-18** Pas de menu Fichier/Edition/Affichage (ils existent visuellement dans Notepad mais pas Explorer ; à standardiser).
- **I-19** Le tree (panneau gauche) ne montre que les dossiers de premier niveau du root virtuel ; il devrait montrer **récursivement** les dossiers et un nœud « Poste de travail / C:\ ».
- **I-20** Aucune création (Nouveau dossier / Nouveau fichier).
- **I-21** Aucune sélection multi (Ctrl/Shift+clic).

### 2.6 Apps statiques
- **I-22** `MailApp` toolbar boutons décoratifs (`MailApp.tsx:34-38`) : `Nouveau`, `Répondre`, `Supprimer` ne font rien. Soit les retirer, soit les implémenter (au minimum « Supprimer » → déplace dans dossier `deleted`).
- **I-23** `PaintApp` ne sait ni ouvrir ni enregistrer de fichier. Doit pouvoir : ouvrir un `.bmp` du FS, enregistrer (Fichier > Enregistrer sous → écrit dans le FS).
- **I-24** `MediaPlayer` lit la playlist hardcodée `data/playlist.ts`. Doit pouvoir lire un `.mp3` ouvert via le FS (double-clic dans Explorer → media player).
- **I-25** `AboutDialog` est rendu comme une fenêtre normale, mais l'About Win95 est une **dialog modale** (sans Reduce/Maximize, OK seul, bloque l'arrière-plan). À convertir en `<DialogBox>` (`src/components/shared/DialogBox.tsx`).

### 2.7 Casino / Banque (mécanique « gage d'apps »)
- **I-26** `pledgeApps` permet de mettre en gage des `AppType` ; tant qu'une app est gagée, `openWindow` la refuse (`windowStore.ts:91`). C'est **anti-OS** : un OS ne refuse pas de lancer une app parce qu'elle a été « hypothéquée » dans un mini-jeu. Reformuler : la « banque » prête de l'argent contre des **fichiers** (verrouille un fichier — l'icône reste mais double-clic affiche « Fichier saisi par la banque ») plutôt que des AppType. **Ou** isoler la mécanique entièrement dans le casino (crédits gagnés/perdus, pas d'effet OS).
- **I-27** `declareBankruptcy` (`casinoStore.ts:65-68`) appelle `localStorage.clear()` → wipe **toutes** les clés (positions d'icônes `win95-icon-positions-v2`, thème `win95-desktop-theme-v1`, mute `win95-sound`, et toute future clé). Doit ne supprimer que `win95-casino-v1`.
- **I-28** Le store window dépend du store casino (`windowStore.ts:3, 91`) — couplage qu'on veut casser.
- **I-29** Le déverrouillage du Casino n'a plus de chemin utilisateur depuis que `ContactApp` est mort. Une fois `ContactApp` supprimé, il faut soit câbler `777` dans `TerminalApp`, soit retirer le verrou.

### 2.8 Bureau / Taskbar / Boot
- **I-30** `BootScreen` est un seul bouton « Boot ». À enrichir : POST → BIOS → écran de chargement Win95 (logo + barre) → desktop. Bonus : durée minimale 1.5 s.
- **I-31** Shutdown (`App.tsx:94-97`) vide les windows et revient au boot. Doit afficher la séquence Win95 « Vous pouvez maintenant éteindre votre ordinateur en toute sécurité » (écran orange/noir) avant de retourner au boot.
- **I-32** Right-click bureau (`Desktop.tsx:343-346`) : pas de « Nouveau > Dossier / Document texte ». À ajouter pour cohérence avec Explorer (qui doit aussi le supporter).
- **I-33** Aucun `Win + R` (Exécuter…). Implémenter une dialog "Exécuter" qui prend une commande (lance une app par nom : `notepad`, `mspaint`, `cmd`, etc.).
- **I-34** Taskbar : pas de zone "system tray" séparée propre — l'horloge + son + crédits sont collés (`Taskbar.tsx:90-95`). Visuellement OK mais conceptuellement les crédits ne devraient pas y vivre (cf. I-26).
- **I-35** `useKeyboardShortcuts` (`hooks/useKeyboardShortcuts.ts`) utilise `e.metaKey` pour `Win+E` / `Win+D`. Sur Windows, la touche Windows = `e.metaKey` côté Chromium **n'est pas livrée** au navigateur (le système l'intercepte). Choisir une combinaison fonctionnelle : `Ctrl+Alt+E`, `Ctrl+Alt+D`.

### 2.9 Petits divers
- **I-36** `ICON_MAP.mail` pointe sur `FileText_32x32_4.png` (`src/data/icons.ts:12`) au lieu d'une icône mail. `APP_ICONS.movies = 'notepad'` (`windowStore.ts:64`) — quand on supprimera l'app movies (cf. I-5) ce mapping disparaîtra.
- **I-37** `desktopShortcuts` : `notes` et `casino` ont la **même `defaultPos` `{col:2, row:2}`** (`filesystem.ts:54, 62`). Fonctionne grâce à `resolveCollisions` mais l'intention est claire : à corriger.
- **I-38** Comparaisons d'app pledged faites avec `includes` sur des string littéraux qui disparaitront avec la refonte des AppType (suppression de `skills/resume/notes/movies`).
- **I-39** README mentionne « React 18 / Tailwind / 98.css » dans `AboutDialog.tsx:21` alors que c'est React 19 (`package.json:17`). README mentionne aussi « contact » dans la liste d'apps (`README.md:15`) — qui n'existe plus.
- **I-40** TypeScript `^6.0.2` dans `package.json:31` — cette version n'existe pas (TS est en 5.x). À aligner sur `~5.6.0` (ou à laisser tel quel si la build passe — vérifier `npm run build`).

---

## 3. Architecture cible

### 3.1 Module `filesystem` — source unique de vérité

**Nouveau fichier : `src/fs/types.ts`**
```ts
export type FsNodeKind = 'folder' | 'file'

export interface FsNode {
  id: string                         // uuid stable, sert de clé React et de référence
  name: string                       // ex. "Compétences.txt"
  kind: FsNodeKind
  parentId: string | null            // null ⇔ racine
  // contenu : présent uniquement sur les fichiers
  content?: string                   // texte UTF-8 OU dataURL pour bmp/mp3
  mimeType?: string                  // 'text/plain', 'image/bmp', 'audio/mpeg', 'application/x-shortcut'
  // métadonnées affichées
  createdAt: number                  // ms epoch
  modifiedAt: number
  sizeBytes: number                  // calculé pour file ; somme récursive pour folder
  // protection
  locked?: { pin: string }           // pin demandé pour ouvrir/lister (ex: dossier Terry Files)
  // raccourci .lnk : pointe vers une app interne plutôt qu'un fichier
  shortcut?: { app: AppId; props?: Record<string, unknown> }
  // attributs Win95
  attrs?: { hidden?: boolean; readOnly?: boolean; system?: boolean }
}
```

**Nouveau fichier : `src/fs/fsStore.ts`** — Zustand persist, clé `win95-fs-v1`.
```ts
interface FsStore {
  nodes: Record<string, FsNode>      // indexé par id
  rootId: string                     // id du nœud "C:\"
  // requêtes
  getChildren: (id: string) => FsNode[]
  getByPath: (path: string) => FsNode | null   // accepte 'C:\Projets\foo.txt' OU 'foo.txt' relatif
  getPath: (id: string) => string              // 'C:\Projets\foo.txt'
  // mutations (toutes mettent à jour modifiedAt + sizeBytes ascendants)
  create: (parentId: string, partial: Omit<FsNode,'id'|'parentId'|'createdAt'|'modifiedAt'>) => string
  rename: (id: string, newName: string) => void
  move:   (id: string, newParentId: string) => void
  remove: (id: string) => void                // déplace vers Recycle Bin sauf si déjà dedans
  writeContent: (id: string, content: string) => void
  // utilitaires
  resolvePath: (path: string, cwdId: string) => { ok: true; node: FsNode } | { ok: false; reason: 'not-found'|'not-dir'|'locked' }
}
```

**Filesystem initial seedé (lors du premier boot, si store vide)** :
```
C:\
├── Windows\                       (folder, system, hidden)
│   └── win.ini                    (fichier texte décoratif)
├── Program Files\
│   ├── Notepad\notepad.exe        (.lnk → app 'notepad', readOnly)
│   ├── Paint\mspaint.exe          (.lnk → app 'paint')
│   ├── Media Player\mplayer.exe   (.lnk → app 'media-player')
│   ├── Minesweeper\winmine.exe    (.lnk → app 'minesweeper')
│   ├── Mail\mail.exe              (.lnk → app 'mail')
│   ├── Casino\casino.exe          (.lnk → app 'casino')
│   └── Bank\bank.exe              (.lnk → app 'bank')
├── Users\Terry\
│   ├── Bureau\                    (folder spécial — voir §3.5)
│   ├── Documents\
│   │   ├── CV.txt
│   │   ├── Compétences.txt
│   │   └── Notes.txt
│   ├── Mes Projets\
│   │   ├── TS-Mock-API.proj       (mimeType 'application/x-project', ouvre ProjectViewer)
│   │   └── GracefulErrors.proj
│   ├── Mes Films\
│   │   └── films-favoris.lst      (texte structuré, lu par Notepad)
│   ├── Musique\
│   │   ├── (3-4 .mp3 décoratifs si possible — sinon les .lnk pointent vers /audio/*.mp3 livré dans /public)
│   │   └── playlist.m3u
│   └── Images\
│       └── (placeholder bmp)
├── Terry Files\                   (locked: pin '95')
│   └── films-favoris.lst          (déplacé ici, contenu plus personnel)
└── Recycled\                      (system)
```

> **Implémentation** : un seul fichier `src/fs/seed.ts` exporte une fonction `buildSeedTree(): { rootId, nodes }`. Le store charge le seed si `localStorage['win95-fs-v1']` est absent.

### 3.2 `AppId` & registre d'apps

Remplacer `AppType` (`src/data/filesystem.ts:1-16`) par un registre unifié dans `src/apps/registry.ts` :

```ts
export type AppId =
  | 'notepad'        // remplace skills, resume, notes, movies (TextEditorApp)
  | 'explorer'       // remplace file-explorer, projects
  | 'terminal'
  | 'paint'
  | 'media-player'
  | 'mail'
  | 'minesweeper'
  | 'project-viewer'
  | 'casino'
  | 'bank'
  | 'about'          // dialog modale, pas une fenêtre normale
  | 'run'            // dialog Win+R

export interface AppDescriptor {
  id: AppId
  title: string                          // titre par défaut, surchargé si on ouvre un fichier
  iconKey: string                        // clé dans ICON_MAP
  defaultSize: { width: number; height: number }
  multiInstance: boolean                 // true pour notepad/explorer/paint/media-player/project-viewer
  isDialog?: boolean                     // true pour about, run → rendu via DialogBox
  // signature d'ouverture
  // tous les apps reçoivent { windowId, openedFile?: FsNode } via React props
}

export const APPS: Record<AppId, AppDescriptor>
```

`windowStore.ts` supprime `DEFAULT_SIZES`, `APP_TITLES`, `APP_ICONS` et lit dans `APPS`.

### 3.3 File associations

**Nouveau fichier : `src/fs/associations.ts`**
```ts
export interface AssociationContext { node: FsNode }
export interface Association {
  app: AppId
  // si l'app accepte un fichier, retourne les props à passer
  toProps: (ctx: AssociationContext) => Record<string, unknown>
}

// résolution par mimeType d'abord, puis par extension
export function resolveAssociation(node: FsNode): Association | null
```

**Table d'association :**
| Extension / mimeType         | App ouverte       |
| ---------------------------- | ----------------- |
| `.txt`, `.lst`, `.ini`, `.m3u`, `text/*` | `notepad`         |
| `.bmp`, `image/bmp`          | `paint`           |
| `.mp3`, `.wav`, `audio/*`    | `media-player`    |
| `.proj`, `application/x-project` | `project-viewer` |
| `.lnk`, `application/x-shortcut` | `node.shortcut.app` (avec `node.shortcut.props`) |
| `.exe` (sans shortcut)       | refus + dialog "Programme inconnu" |
| Aucun                        | dialog "Ouvrir avec…" listant les apps `multiInstance` capables d'ouvrir un fichier |

L'Explorer, le Terminal (`start`) et le Bureau (double-clic) **doivent tous** passer par cette fonction. Plus de `appType` codé sur le node.

### 3.4 Notepad générique

`TextEditorApp` devient `NotepadApp` (`src/components/apps/NotepadApp.tsx`) :
- Props `{ windowId: string; fileId?: string }`. Si `fileId` absent → buffer "Sans titre".
- Lit le contenu via `fsStore.getByPath` ou `fsStore.nodes[fileId]`.
- Édite localement (`useState`), bouton **Fichier > Enregistrer** appelle `fsStore.writeContent(fileId, value)`. **Fichier > Enregistrer sous…** ouvre un dialog "Enregistrer sous" (input nom + tree de dossiers).
- **Fichier > Ouvrir…** : dialog équivalent.
- Le titre de la fenêtre devient `${node.name} — Notepad` (mettre à jour via `useWindowStore.getState().setTitle(windowId, …)` — nouvelle action à ajouter au store).

À supprimer : `src/components/apps/TextEditorApp.tsx`, `src/components/apps/MoviesApp.tsx`, `src/data/text-editor/*`, `src/data/movies.ts` (le contenu de ces fichiers va dans le seed du FS — voir §3.1). Conserver `src/data/text-editor/types.ts` uniquement si une autre partie l'importe (vérifier `Grep TextEditorVariant`).

### 3.5 Bureau = miroir d'un dossier `C:\Users\Terry\Bureau`

Les "raccourcis bureau" ne sont plus une liste hardcodée (`desktopShortcuts`) mais le **contenu réel** du dossier `C:\Users\Terry\Bureau`. Le seed y place :
- Un `.lnk` "Mes Projets" → app `explorer` avec props `{ folderId: '<id de Mes Projets>' }`
- Un `.lnk` pour CV.txt, Compétences.txt, Notes.txt
- Un `.lnk` Démineur → app `minesweeper`
- Un `.lnk` Terry Files (locked) → app `explorer` sur ce dossier
- Un `.lnk` Messagerie, Paint, Lecteur Multimédia, Terminal, À propos
- Un `.lnk` Casino, Banque (créés mais avec `attrs.hidden = true` jusqu'au déverrouillage)

`Desktop.tsx` lit `fsStore.getChildren(bureauId)` et applique sa logique de grille existante (à conserver — `computeMetrics`, `gridToPixel`, `findFreeCell`). Les positions persistées (`win95-icon-positions-v2`) sont indexées par `node.id`.

Avantage : le user peut créer/supprimer/renommer un raccourci sur le bureau via Explorer, et ça se reflète immédiatement.

### 3.6 Window store — refactor

```ts
interface WindowState {
  id: string
  app: AppId
  title: string
  iconKey: string
  fileId?: string                  // fichier ouvert (si associé)
  props: Record<string, unknown>
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  prevBounds?: { position; size }  // pour restore depuis maximize
}

interface WindowStore {
  windows: WindowState[]
  activeWindowId: string | null
  zCounter: number                                // déplacé dans le store
  openApp: (app: AppId, opts?: { fileId?: string; props?: Record<string, unknown> }) => string
  openFile: (fileId: string) => string             // résout l'association
  setTitle: (id: string, title: string) => void
  closeWindow / focusWindow / minimize / maximize / updatePosition / updateSize
}
```

Règles :
- `multiInstance` (depuis `APPS`) gouverne le comportement : si `false` et fenêtre existante → focus + un-minimize ; si `true` → ouvre une nouvelle fenêtre.
- Suppression du couplage casino (plus de `pledgedApps.includes(app)` en garde).
- Suppression du cap arbitraire de 8 fenêtres (ou afficher dialog `<DialogBox>` "Mémoire insuffisante" Win95 si dépassé).

### 3.7 Resize de fenêtre

Implémenter dans `Window.tsx` les 8 handles déjà stylés (`Window.module.css:97-110`). Pattern : `pointerdown` sur handle → `pointermove` global → `updateSize`/`updatePosition`. Min `defaultSize / 2`. Désactivé si `isMaximized`.

### 3.8 Terminal — vraie shell

Refactor `TerminalApp.tsx` :
- Plus de `DRIVE_ROOT_CHILDREN` synthétique. Le cwd est un `nodeId` (init = root `C:\`).
- Toute commande passe par `fsStore`.
- Commandes minimum :
  ```
  cd <path>          chdir       — alias
  dir [path]         ls          — alias
  pwd
  type <file>        cat         — alias  (affiche le contenu texte)
  echo <txt>                       (affiche)
  echo <txt> > file                (écrit ; remplace)
  echo <txt> >> file               (append)
  mkdir <name>       md          — alias
  rmdir <name>       rd          — alias  (refuse si non vide sans /S)
  del <name>         erase       — alias  (déplace vers Recycled)
  ren <a> <b>        rename      — alias
  copy <src> <dst>
  move <src> <dst>
  start <name>       open        — alias  (passe par resolveAssociation)
  cls                clear       — alias
  ver
  help
  exit                              (ferme la fenêtre via closeWindow)
  tree                              (arbre ASCII du cwd)
  whoami                            (renvoie 'TERRY\\terry')
  date / time                       (lecture seule)
  ```
- Easter egg : taper `777` (sans rien d'autre) → `useCasinoStore.getState().unlockCasino()` + bannière de confirmation. Migration depuis `ContactApp` mort.
- Autocomplete `Tab` étendu à toutes les commandes prenant un path.
- Historique persistant en mémoire (déjà OK).
- Path résolu côté `fsStore.resolvePath` (gère `..`, `.`, `\`, `C:\` absolu, relatif).

### 3.9 Explorer — vraie navigation

- Address bar éditable : `onSubmit` → `fsStore.resolvePath(input, cwd)`.
- Tree gauche : récursif, expand/collapse, racine "Poste de travail" → `C:\` → sous-dossiers.
- Menu File / Edit / View / Help (cf. §4.4).
- Context menu sur fichier : Ouvrir / Ouvrir avec… / Couper / Copier / Coller / Renommer / Supprimer / Propriétés.
- Context menu sur fond : Affichage > (Grandes/Petites icônes/Liste/Détails) / Trier par > … / Nouveau > (Dossier/Document texte/Image bitmap).
- Sélection multi (Ctrl+clic, Shift+clic, sélection rectangle).
- Drag & drop fichier → autre dossier (move).
- Bouton Précédent / Suivant / Dossier parent (la barre d'historique).

### 3.10 Casino / Bank découplés

- `casinoStore` ne référence plus `AppType` ni `windowStore`.
- `pledgeApps`/`redeemApps` deviennent `pledgeFiles(fileIds)`/`redeemFiles(fileIds)`. Le « gage » verrouille le **fichier** dans le FS (`node.locked = { pin: 'BANK' }` ou attribut spécial `attrs.bankSeized = true`). L'Explorer affiche une icône cadenas dorée et l'ouverture renvoie une dialog "Fichier saisi par la banque — remboursez le prêt".
- `declareBankruptcy` : `localStorage.removeItem('win95-casino-v1')` uniquement, puis reset du store via `useCasinoStore.setState(initialState)`. Pas de reload, pas de `clear()`.
- L'unlock initial du Casino se fait via la commande Terminal `777` (cf. §3.8). Tant que `unlocked === false`, les `.lnk` casino/bank du Bureau sont marqués `attrs.hidden = true` → non rendus.

### 3.11 About en dialog modale

`AboutDialog.tsx` utilise actuellement la même chrome de fenêtre. Le rendre modal via `<DialogBox>` (`src/components/shared/DialogBox.tsx`) :
- Bloque les interactions arrière via overlay semi-transparent.
- Une seule action OK → ferme la dialog (n'ouvre pas une fenêtre du windowStore).
- App `'about'` flaggée `isDialog: true` dans le registre → `App.tsx` rend les dialogs séparément des fenêtres.

Faire la même chose pour la nouvelle app `'run'` (Win+R).

### 3.12 Boot / Shutdown réalistes

- `BootScreen` : afficher (séquence ~2 s) :
  1. Écran noir + texte "Award Modular BIOS v4.51PG" (1 s)
  2. Logo Windows 95 + barre de progression (1 s)
  3. Desktop apparaît + son `startup`.
- `ShutdownScreen` (nouveau composant) : écran orange Win95 « Vous pouvez maintenant éteindre votre ordinateur en toute sécurité. » avec bouton "Redémarrer" qui repasse en boot.
- Avant shutdown : if windows non sauvegardés (Notepad/Paint avec buffer modifié), afficher dialog "Souhaitez-vous enregistrer les modifications ?".

### 3.13 Raccourcis clavier

`useKeyboardShortcuts` :
- Remplacer `metaKey` par `ctrlKey + altKey` (cf. I-35).
- `Ctrl+Esc` → Start menu (déjà OK).
- `Ctrl+Alt+E` → Explorer.
- `Ctrl+Alt+D` → Show desktop.
- `Alt+F4` → close (OK).
- `Alt+Tab` → cycle (OK).
- `Ctrl+Alt+R` → ouvre dialog Run.

---

## 4. Référentiel — style et conventions

### 4.1 Convention de path
- Affichage : `C:\Users\Terry\Documents\CV.txt` (casse mixte, `\`, conserve les accents).
- Comparaison interne : insensible à la casse (`name.toLowerCase()` à la résolution).
- Le nom **stocké** dans `node.name` garde la casse originale.
- Le seed n'utilise PAS `MAJUSCULES` (rupture avec l'actuel `getPathString` qui upper-case tout).

### 4.2 Fichiers / dossiers
- **CSS Modules** co-localisés : `Foo.tsx` + `Foo.module.css`. Pas d'inline styles sauf valeur dynamique calculée.
- Variables couleur / espacement uniquement via les tokens 98.css (`var(--surface)`, `var(--button-shadow)`, `var(--dialog-blue)`, `var(--element-spacing)`, etc.) — voir `src/styles/main.css:7-80` pour la liste complète.
- Police : `Pixelated MS Sans Serif` (déjà chargée) pour la chrome ; `Courier New` pour Notepad/Terminal/Paint texte (variable `--text-app-font-family`).
- Aucun emoji dans les nouveaux composants (les actuels `🔴 🔒 💰 📝 ↩ 🗑` doivent être remplacés à terme par les icônes `/img/*.png` ou `/icon/*.svg` — voir §4.3).
- Composants exportés en **named export** (cohérent avec l'existant : `export function Foo()`).
- Tests : aucun (pas de Vitest/Jest configuré, ne pas en ajouter sauf demande).

### 4.3 Icônes
Toutes dans `src/data/icons.ts` (`ICON_MAP`). Sources dans `public/img/*.png|ico` et `public/icon/*.svg`. Lors de l'ajout d'une nouvelle icône, l'ajouter à `ICON_MAP` puis utiliser `<AppIcon name="…" />` (`src/components/shared/AppIcon.tsx`).
À corriger maintenant :
- `mail` → utiliser `/img/Mailnews12_32x32_4.png` (déjà présent ailleurs).
- Ajouter clés : `notepad-app`, `paint-app`, `cmd-app`, `dialog-info`, `dialog-warning`, `dialog-error`, `recycle-empty`, `recycle-full`, `mycomputer`, `shortcut-overlay` (petit overlay flèche pour les `.lnk`).

### 4.4 Menus d'applications
Toutes les apps "documentaires" (Notepad, Paint, Explorer, Mail) ont une menu bar **Fichier / Édition / Affichage / Aide** au minimum. Markup uniforme :
```tsx
<div className={styles.menuBar}>
  <button className={styles.menu} aria-haspopup="menu">Fichier</button>
  …
</div>
```
Composant partagé à créer : `src/components/shared/MenuBar.tsx` qui prend une prop `menus: Array<{ label: string; items: Array<{ label: string; onClick?: () => void; separator?: boolean; disabled?: boolean }> }>`.

### 4.5 Dialogs
Composant existant `DialogBox` (`src/components/shared/DialogBox.tsx`) à étendre :
- Variante `'info' | 'warning' | 'error' | 'question'` (icône à gauche).
- Boutons configurables `[{ label, onClick, primary? }]`.
- Overlay modal (`position: fixed; inset: 0; background: transparent; pointerEvents: auto`).
- Z-index = `99999`, au-dessus de toute fenêtre.
- Premier bouton primary focusé au mount.

### 4.6 Sons
`src/hooks/useSound.ts` (hook existant) — sons `open`, `close`, `startup`, `error`, `chimes`. Conserver.
- À ajouter : son de `shutdown` (déjà dans `/public/audio` ? sinon mock).
- À ajouter : son `ding` pour les dialogs `error`/`warning`.

### 4.7 LocalStorage — clés
Inventaire (ne pas réutiliser, ne pas wipe en bloc) :
| Clé                          | Owner              | Type         |
| ---------------------------- | ------------------ | ------------ |
| `win95-fs-v1`                | fsStore (nouveau)  | persist Z    |
| `win95-casino-v1`            | casinoStore        | persist Z    |
| `win95-icon-positions-v2`    | Desktop            | manual       |
| `win95-desktop-theme-v1`     | Desktop            | manual       |
| `win95-sound`                | Taskbar            | manual       |
| `win95-windows-v1` *(opt.)*  | windowStore        | persist Z    |

`declareBankruptcy` ne touche que `win95-casino-v1`.

---

## 5. Cartographie des fichiers (post-refonte)

```
src/
├── App.tsx                                 [MAJ §6.10]
├── main.tsx                                [inchangé]
├── App.css / index.css / styles/main.css   [inchangés]
├── apps/
│   └── registry.ts                         [NEW §3.2]
├── fs/
│   ├── types.ts                            [NEW §3.1]
│   ├── fsStore.ts                          [NEW §3.1]
│   ├── associations.ts                     [NEW §3.3]
│   └── seed.ts                             [NEW §3.1 — contient l'ancien text-editor/movies content]
├── store/
│   ├── windowStore.ts                      [REFACTOR §3.6]
│   └── casinoStore.ts                      [REFACTOR §3.10]
├── components/
│   ├── BootScreen/
│   │   ├── BootScreen.tsx                  [MAJ §3.12]
│   │   └── ShutdownScreen.tsx              [NEW §3.12]
│   ├── Desktop/Desktop.tsx                 [MAJ §3.5 §6.5]
│   ├── Taskbar/
│   │   ├── Taskbar.tsx                     [MAJ §6.6]
│   │   ├── StartMenu.tsx                   [MAJ §6.6]
│   │   ├── TaskbarClock.tsx                [inchangé]
│   │   └── CreditsDisplay.*                [SUPPRIMER si on bouge les crédits hors taskbar]
│   ├── Window/Window.tsx                   [MAJ §3.7 + multi-instance]
│   ├── FileExplorer/FileExplorer.tsx       [REFACTOR §3.9]
│   ├── apps/
│   │   ├── NotepadApp.tsx                  [NEW §3.4 — remplace TextEditorApp/MoviesApp]
│   │   ├── PaintApp.tsx                    [MAJ §3.* — open/save FS, max-instance]
│   │   ├── MediaPlayer.tsx                 [MAJ — accept fileId prop]
│   │   ├── TerminalApp.tsx                 [REFACTOR §3.8]
│   │   ├── MailApp.tsx                     [MAJ I-22]
│   │   ├── Minesweeper.tsx                 [inchangé sauf signature openWindow]
│   │   ├── ProjectViewer.tsx               [MAJ — lit projectId via FsNode props]
│   │   ├── CasinoApp.tsx                   [MAJ §3.10 — découplage]
│   │   ├── BankApp.tsx                     [REFACTOR §3.10 — pledge fichiers]
│   │   ├── AboutDialog.tsx                 [MAJ §3.11 — modal]
│   │   ├── RunDialog.tsx                   [NEW §6.7]
│   │   ├── TextEditorApp.tsx               [SUPPRIMER]
│   │   ├── MoviesApp.tsx                   [SUPPRIMER]
│   │   └── ContactApp.tsx                  [SUPPRIMER — code mort, easter egg migré]
│   ├── shared/
│   │   ├── AppIcon.tsx                     [inchangé]
│   │   ├── DialogBox.tsx                   [MAJ §4.5]
│   │   ├── MenuBar.tsx                     [NEW §4.4]
│   │   └── ContextMenu.tsx                 [NEW §6.8]
│   └── GameOverDialog.tsx                  [MAJ — utilise DialogBox ; ne reload plus]
├── data/
│   ├── filesystem.ts                       [SUPPRIMER (remplacé par fs/seed.ts)]
│   ├── icons.ts                            [MAJ §4.3]
│   ├── projects.ts                         [conservé — content seedé dans FS via .proj nodes]
│   ├── mails.ts                            [conservé — MailApp continue de lire ce module]
│   ├── playlist.ts                         [conservé — fallback si FS vide]
│   ├── skills.ts                           [SUPPRIMER si plus utilisé]
│   ├── movies.ts                           [SUPPRIMER — contenu déplacé dans seed films-favoris.lst]
│   └── text-editor/                        [SUPPRIMER tout sauf si types.ts utilisé ailleurs]
├── hooks/
│   ├── useKeyboardShortcuts.ts             [MAJ I-35]
│   ├── useLocalStorage.ts                  [inchangé]
│   └── useSound.ts                         [inchangé]
└── utils/
    ├── fsUtils.ts                          [SUPPRIMER — remplacé par fs/fsStore.ts]
    └── path.ts                             [NEW — split/join/normalize de path Win]
```

---

## 6. Plan d'implémentation séquencé

> Ordre conseillé pour minimiser les périodes où l'app ne build pas. Chaque étape peut faire l'objet d'un commit.

### Étape 1 — Socle FS (bloquant tout le reste)
Fichiers : `src/fs/types.ts`, `src/fs/fsStore.ts`, `src/fs/seed.ts`, `src/utils/path.ts`.
- Définir `FsNode`, `FsStore`, `path.ts` (`splitPath`, `joinPath`, `normalize`, `isAbsolute`, `dirname`, `basename`, `extname`).
- Implémenter store Zustand `persist`.
- Seeder : porter le contenu existant
  - `Compétences.txt` ← `src/data/text-editor/skills.ts`
  - `CV.txt` ← `src/data/text-editor/resume.ts`
  - `Notes.txt` ← `src/data/text-editor/notes.ts`
  - `films-favoris.lst` ← formattage texte de `src/data/movies.ts`
  - `*.proj` ← entrées de `src/data/projects.ts`
  - `playlist.m3u` ← `src/data/playlist.ts`

### Étape 2 — Registre apps + associations
Fichiers : `src/apps/registry.ts`, `src/fs/associations.ts`.
- Définir `AppId`, `APPS`, table d'association.

### Étape 3 — Window store refactor
Fichier : `src/store/windowStore.ts`.
- Nouvelle signature `openApp` / `openFile`.
- Supprimer dépendance casino.
- Ajouter `setTitle`, `multiInstance`, `prevBounds`.

### Étape 4 — Notepad générique + suppressions
- Créer `NotepadApp.tsx`.
- Supprimer `TextEditorApp.tsx`, `MoviesApp.tsx`, `ContactApp.tsx`, `data/text-editor/*`, `data/movies.ts`.
- Mettre à jour `App.tsx` (case unique `'notepad'`).

### Étape 5 — Explorer refactor
Fichier : `src/components/FileExplorer/FileExplorer.tsx`.
- Lit `fsStore`. Address bar éditable. Tree récursif. Multi-sélection. Context menu (utilise `ContextMenu.tsx` créé en §6.8).
- Boutons New Folder / New File (menu Fichier > Nouveau).

### Étape 6 — Bureau = Bureau folder
Fichier : `src/components/Desktop/Desktop.tsx`.
- Lit `fsStore.getChildren(bureauId)` au lieu de `desktopShortcuts`.
- Garde sa logique de grille.
- Right-click Nouveau > Dossier / Document texte → crée dans `Bureau`.

### Étape 7 — Terminal refactor
Fichier : `src/components/apps/TerminalApp.tsx`.
- cwd = nodeId. Suppression `DRIVE_ROOT_CHILDREN`.
- Implémente toutes les commandes §3.8.
- Easter egg `777` → unlock casino + crée les `.lnk` Casino/Bank dans Bureau (en levant `attrs.hidden`).

### Étape 8 — Shared MenuBar + ContextMenu + DialogBox v2
Fichiers : `src/components/shared/MenuBar.tsx`, `ContextMenu.tsx`, `DialogBox.tsx`.

### Étape 9 — Window resize
Fichier : `src/components/Window/Window.tsx`.
- Rendre les 8 handles ; pointer events → `updateSize`/`updatePosition`.

### Étape 10 — Casino/Bank découplés + bankruptcy fix
Fichiers : `src/store/casinoStore.ts`, `src/components/apps/CasinoApp.tsx`, `BankApp.tsx`, `GameOverDialog.tsx`.

### Étape 11 — Boot / Shutdown réalistes
Fichiers : `BootScreen.tsx`, `ShutdownScreen.tsx`, `App.tsx`.

### Étape 12 — Mail / Paint / MediaPlayer enrichis
- Mail : implémenter Supprimer (déplace mail dans `deleted`). Retirer "Nouveau" / "Répondre" si pas implémentés.
- Paint : Fichier > Ouvrir / Enregistrer / Enregistrer sous, lit/écrit `.bmp` dans FS via dataURL.
- MediaPlayer : accept `fileId` prop ; si présent, lit ce fichier ; sinon ouvre la playlist seedée.

### Étape 13 — About modal + Run dialog + raccourcis
- `AboutDialog.tsx` : isDialog.
- `RunDialog.tsx` : nouveau.
- `useKeyboardShortcuts.ts` : `metaKey` → `ctrlKey + altKey`. Ajouter `Ctrl+Alt+R`.

### Étape 14 — Nettoyage
- Supprimer `src/data/filesystem.ts`, `src/utils/fsUtils.ts`, `data/skills.ts` si plus importés.
- Mettre à jour `README.md` (React 19, suppression mention "contact", liste apps à jour).
- Mettre à jour `CLAUDE.md` (sections Architecture / Window system / Casino).
- Vérifier `package.json` TypeScript version (cf. I-40).

---

## 7. Récapitulatif des fichiers concernés (index rapide pour la nouvelle session)

Pour chaque incohérence § 2, voici **où il faut intervenir** :

| Inc. | Fichier(s) | Lignes-clé |
| ---- | --- | --- |
| I-1, I-2, I-3 | `src/data/filesystem.ts` (à SUPPRIMER), `src/components/apps/TerminalApp.tsx:110-118`, `src/utils/fsUtils.ts:3-6` | toute la déclaration |
| I-4 | `src/components/apps/TextEditorApp.tsx`, `src/data/text-editor/*`, `src/App.tsx:53-58`, `src/store/windowStore.ts:23-25,41-43,59-61` | toute la déclaration |
| I-5 | `src/components/apps/MoviesApp.tsx`, `src/data/movies.ts` | suppression |
| I-6 | `src/components/apps/ContactApp.tsx` | suppression complète, easter-egg 777 à migrer vers Terminal |
| I-7 | `src/store/windowStore.ts:96-112` | logique multi-instance |
| I-8 | `src/components/Window/Window.tsx` (rendu manquant), `Window.module.css:97-110` (CSS prêt) | ajouter handles |
| I-9 | `src/store/windowStore.ts:72` | déplacer `zCounter` dans le state |
| I-10 | `src/store/windowStore.ts:115` | retirer ou afficher dialog |
| I-11 → I-15 | `src/components/apps/TerminalApp.tsx` (refactor entier) | tout le fichier |
| I-16 → I-21 | `src/components/FileExplorer/FileExplorer.tsx` (refactor entier) | tout le fichier |
| I-22 | `src/components/apps/MailApp.tsx:34-38` | toolbar |
| I-23 | `src/components/apps/PaintApp.tsx` | ajouter menu Fichier + I/O FS |
| I-24 | `src/components/apps/MediaPlayer.tsx` | accepter `fileId` |
| I-25 | `src/components/apps/AboutDialog.tsx`, `src/App.tsx:61-62` | passage en dialog |
| I-26, I-28 | `src/store/casinoStore.ts`, `src/store/windowStore.ts:3,91`, `src/components/apps/BankApp.tsx`, `src/components/Desktop/Desktop.tsx:327` | découpler |
| I-27 | `src/store/casinoStore.ts:65-68` | `removeItem` + `setState(initial)` |
| I-29 | `src/components/apps/TerminalApp.tsx` (nouvelle commande `777`) | dans `STATIC_COMMANDS` ou handler dédié |
| I-30, I-31 | `src/components/BootScreen/BootScreen.tsx`, `ShutdownScreen.tsx` (NEW), `src/App.tsx:85-126` | revue séquence |
| I-32 | `src/components/Desktop/Desktop.tsx:343-346,428-463` | enrichir context menu |
| I-33 | `src/components/apps/RunDialog.tsx` (NEW), `useKeyboardShortcuts.ts` | binding `Ctrl+Alt+R` |
| I-34 | `src/components/Taskbar/Taskbar.tsx:90-95`, `CreditsDisplay.tsx` | retirer crédits du tray (optionnel) |
| I-35 | `src/hooks/useKeyboardShortcuts.ts:17,24` | `metaKey` → `ctrlKey && altKey` |
| I-36 | `src/data/icons.ts:12`, `src/store/windowStore.ts:64` | corriger mappings |
| I-37 | `src/data/filesystem.ts:54,62` | (devient caduc avec §3.5) |
| I-38 | partout où on lit un AppType retiré | grep après refonte |
| I-39 | `README.md`, `src/components/apps/AboutDialog.tsx:21` | "React 19", retirer "contact" |
| I-40 | `package.json:31` | TS `~5.6.0` (vérifier) |

---

## 8. Critères de validation

À la fin de l'implémentation :

- [ ] Une seule définition de filesystem (`src/fs/seed.ts` + `fsStore`). Aucun import de `src/data/filesystem.ts` (fichier supprimé).
- [ ] Ouvrir `Notes.txt` depuis le Bureau, depuis l'Explorer, et via `start notes.txt` dans le Terminal donne **la même fenêtre Notepad** (le titre = nom du fichier).
- [ ] Modifier `Notes.txt` dans Notepad puis fermer puis rouvrir → contenu persisté.
- [ ] `mkdir test` puis `cd test` puis `echo hello > a.txt` puis `type a.txt` fonctionne dans le Terminal.
- [ ] Le contenu créé en Terminal apparaît immédiatement dans l'Explorer ouvert sur le même dossier.
- [ ] Plusieurs Notepad ouverts simultanément sur des fichiers différents.
- [ ] Redimensionner une fenêtre depuis chaque coin/bord.
- [ ] Right-clic sur un fichier → Renommer → la modification se reflète partout.
- [ ] `Ctrl+Alt+E` ouvre l'Explorer ; `Ctrl+Alt+D` minimise tout ; `Alt+F4` ferme la fenêtre active.
- [ ] Bankruptcy reset uniquement le store casino — positions d'icônes et thème survivent.
- [ ] Aucune référence à `AppType`, `desktopShortcuts`, `TextEditorApp`, `MoviesApp`, `ContactApp` dans le code.
- [ ] `npm run build` passe sans warning TS.
- [ ] `npm run lint` passe.

---

## 9. Hors-scope (à NE PAS implémenter sauf demande)

- Système de permissions multi-utilisateurs.
- Vrai système de processus (l'app actuelle confond app et fenêtre — c'est OK).
- Réseau virtuel (Internet Explorer simulé).
- Drag & drop entre Explorer et Bureau (souhaitable mais peut être différé).
- Sauvegarde des fenêtres ouvertes au shutdown (optionnel — clé `win95-windows-v1` réservée).
- Support tactile / mobile (le projet est desktop-only).
