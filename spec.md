# Specs Portfolio Win95

## 3. Calculatrice

**Concept** : `calc.exe` classique — affichage 7 segments, opérations de base.

**UX** : Boutons numériques, opérateurs, display rétro. Tout en état local React.

### Fichiers à créer

- `src/components/apps/Calculator.tsx`
- `src/components/apps/Calculator.module.css`

### Fichiers à modifier

1. `src/data/filesystem.ts` — ajouter `'calculator'` à `AppType`
2. `src/store/windowStore.ts` — `DEFAULT_SIZES` (280×380), `APP_TITLES`, `APP_ICONS`
3. `src/data/icons.ts` — icône 🧮
4. `src/App.tsx` — lazy import + case
5. `src/components/Desktop/Desktop.tsx` — `DESKTOP_ICONS`
6. `src/components/Taskbar/StartMenu.tsx` — item Start Menu


## 5. Internet Explorer (liens / bookmarks)

**Concept** : Fausse barre d'adresse IE5 — liste de liens externes (projets, réseaux, ressources) rendue comme une page HTML statique "retro".

**UX** : Barre d'adresse, boutons Précédent/Suivant, barre de favoris prédéfinis. Contenu affiché dans une zone scrollable stylée.

> Note : Les iframes peuvent bloquer des sites tiers (CSP). Alternative recommandée : rendu d'une "page" statique interne simulée.

### Données

`src/data/bookmarks.ts`

```ts
interface Bookmark {
  id: string
  label: string
  url: string
  icon: string
  category: 'favoris' | 'projets' | 'réseaux'
}
```

### Fichiers à créer

- `src/components/apps/IEApp.tsx`
- `src/components/apps/IEApp.module.css`
- `src/data/bookmarks.ts`

### Fichiers à modifier

1. `src/data/filesystem.ts` — ajouter `'ie'` à `AppType`
2. `src/store/windowStore.ts` — `DEFAULT_SIZES` (700×500), `APP_TITLES`, `APP_ICONS`
3. `src/data/icons.ts` — icône IE (image Win95 ou 🌐)
4. `src/App.tsx` — lazy import + case
5. `src/components/Desktop/Desktop.tsx` — `DESKTOP_ICONS`
6. `src/components/Taskbar/StartMenu.tsx` — item Start Menu

---

## 6. Solitaire

**Concept** : `sol.exe` — version jouable du Klondike Solitaire.

**Complexité** : Moyenne-haute (logique de jeu, drag & drop des cartes).

**UX** : 7 colonnes tableau, 4 fondations, talon, retournement de cartes. Drag & drop natif HTML5 ou via pointeur events.

### Fichiers à créer

- `src/components/apps/Solitaire.tsx`
- `src/components/apps/Solitaire.module.css`

### Fichiers à modifier

1. `src/data/filesystem.ts` — ajouter `'solitaire'` à `AppType`
2. `src/store/windowStore.ts` — `DEFAULT_SIZES` (640×480), `APP_TITLES`, `APP_ICONS`
3. `src/data/icons.ts` — icône 🃏
4. `src/App.tsx` — lazy import + case
5. `src/components/Desktop/Desktop.tsx` — `DESKTOP_ICONS`
6. `src/components/Taskbar/StartMenu.tsx` — item `Jeux`

---

## Checklist commune (tous modules)

Pour chaque module, les **8 étapes** sont identiques :

1. `src/components/apps/NomApp.tsx` + `NomApp.module.css`
2. `src/data/filesystem.ts` → union `AppType`
3. `src/store/windowStore.ts` → `DEFAULT_SIZES` + `APP_TITLES` + `APP_ICONS`
4. `src/data/icons.ts` → `ICON_MAP`
5. `src/App.tsx` → lazy import + case dans `AppContent`
6. `src/components/Desktop/Desktop.tsx` → `DESKTOP_ICONS`
7. `src/components/Taskbar/StartMenu.tsx` → item Start Menu
8. `src/data/filesystem.ts` → `VirtualFile` *(optionnel, pour File Explorer)*

---

## Priorité suggérée

| # | Module | Effort | Impact |
|---|--------|--------|--------|
| 1 | Calculatrice | Très faible | Moyen |
| 2 | Lecteur multimédia | Moyen | Élevé |
| 3 | Internet Explorer | Moyen | Moyen |
| 4 | Solitaire | Élevé | Moyen |

---

## Vérification (par module)

1. `pnpm dev` → icône visible sur le bureau
2. Double-clic → fenêtre s'ouvre avec titre et icône corrects
3. Start Menu → item présent dans le bon sous-menu
4. File Explorer → visible si `VirtualFile` ajouté
5. `pnpm tsc --noEmit` → aucune erreur TypeScript
