Plan : App Paint (Windows 95)
                                                                                                                                                                
     Context
                                                                                                                                                                
     Ajouter une app Paint style Windows 95 au portfolio, avec canvas HTML5, palette de couleurs, outils (crayon, gomme, remplissage, formes), et sauvegarde de
     l'image. Aucun backend requis — tout en localStorage/canvas.                                                                                             

     ---
     Fichiers à créer

     - src/components/apps/PaintApp.tsx — composant principal
     - src/components/apps/PaintApp.module.css — styles

     Fichiers à modifier

     1. src/data/filesystem.ts — Ajouter 'paint' au type AppType
     2. src/store/windowStore.ts — Ajouter entrées dans DEFAULT_SIZES, APP_TITLES, APP_ICONS
     3. src/data/icons.ts — Ajouter paint dans ICON_MAP
     4. src/App.tsx — Lazy import + case dans le switch AppContent
     5. src/components/Desktop/Desktop.tsx — Ajouter icône dans DESKTOP_ICONS
     6. src/components/Taskbar/StartMenu.tsx — Ajouter entrée dans le menu Programmes

     Icône

     Utiliser une icône Windows 95 existante comme FileText_32x32_4.png ou créer /public/img/paint_icon.png inspiré de la palette Windows 95 (palette +
     pinceau).

     ---
     PaintApp — Fonctionnalités

     Outils

     - Crayon (défaut) — dessin libre
     - Gomme — efface en blanc
     - Remplissage (pot) — flood fill algorithme BFS sur le canvas
     - Rectangle — tracé avec preview pendant le drag
     - Ligne — tracé droit avec preview

     Palette

     - 28 couleurs fixes style Windows 95 (grille 2 lignes × 14)
     - Couleur avant-plan + arrière-plan (clic gauche / clic droit)
     - Carré "couleur active" visible

     Taille de pinceau

     - 3 tailles : S (1px), M (3px), L (8px)

     Barre d'outils

     - Style Windows 95 (boutons 3D en relief, 98.css)
     - Toolbar verticale gauche pour outils
     - Palette en bas

     Canvas

     - Blanc par défaut, 100% de la zone disponible
     - Curseur adapté au tool actif
     - Sauvegarde PNG via canvas.toDataURL() + <a download>

     ---
     Structure du composant

     // État
     const canvasRef = useRef<HTMLCanvasElement>(null)
     const [tool, setTool] = useState<Tool>('pen')
     const [fgColor, setFgColor] = useState('#000000')
     const [bgColor, setBgColor] = useState('#ffffff')
     const [brushSize, setBrushSize] = useState(3)
     const [isDrawing, setIsDrawing] = useState(false)
     const startPos = useRef({ x: 0, y: 0 })
     const snapshot = useRef<ImageData | null>(null) // pour preview rect/ligne

     // Handlers
     onMouseDown → start drawing, save snapshot pour formes
     onMouseMove → draw (pen/eraser) ou preview (rect/ligne)
     onMouseUp   → commit shape, stop drawing

     // Flood fill (remplissage) : BFS sur ImageData

     ---
     Intégration

     Même pattern que MailApp :
     - Lazy import dans App.tsx
     - Case 'paint' dans le switch
     - Taille par défaut : 800 × 580
     - Position desktop : col 2, row 1 (ou colonne libre)

     ---
     Vérification

     1. Lancer pnpm dev
     2. Double-cliquer l'icône Paint sur le bureau → fenêtre s'ouvre
     3. Dessiner avec le crayon → trait visible
     4. Changer couleur → couleur appliquée
     5. Gomme → efface
     6. Remplissage → flood fill fonctionne
     7. Rectangle → tracé avec preview
     8. Bouton "Enregistrer" → télécharge un fichier PNG
     9. App dans Start Menu → Programmes → Paint