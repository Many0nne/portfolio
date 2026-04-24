import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './PaintApp.module.css'

type Tool = 'pen' | 'eraser' | 'fill' | 'rect' | 'line'

const WIN95_PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#c0c0c0', '#ffffff', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ff8040', '#804000', '#804040', '#408080', '#4040ff', '#ff40ff', '#804080', '#408040',
  '#ff8080', '#80ff80', '#8080ff', '#ffff80', '#80ffff', '#ff80ff', '#c0c080', '#80c0c0',
]

const BRUSH_SIZES = [
  { label: 'S', value: 1 },
  { label: 'M', value: 3 },
  { label: 'L', value: 8 },
]

const TOOL_ICONS: Record<Tool, { src: string; alt: string }> = {
  pen: { src: '/img/pifmgr_19.ico', alt: 'Crayon' },
  eraser: { src: '/img/Eraser.png', alt: 'Gomme' },
  fill: { src: '/img/Mspaint_32x32_4.png', alt: 'Remplir' },
  rect: { src: '/icon/indicator-rectangle-horizontal.svg', alt: 'Rectangle' },
  line: { src: '/icon/indicator-horizontal.svg', alt: 'Ligne' },
}

function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) {
  const canvas = ctx.canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const idx = (x: number, y: number) => (y * canvas.width + x) * 4

  const targetIdx = idx(startX, startY)
  const tr = data[targetIdx]
  const tg = data[targetIdx + 1]
  const tb = data[targetIdx + 2]
  const ta = data[targetIdx + 3]

  const hex = fillColor.replace('#', '')
  const fr = parseInt(hex.slice(0, 2), 16)
  const fg = parseInt(hex.slice(2, 4), 16)
  const fb = parseInt(hex.slice(4, 6), 16)

  if (tr === fr && tg === fg && tb === fb && ta === 255) return

  const match = (i: number) =>
    data[i] === tr && data[i + 1] === tg && data[i + 2] === tb && data[i + 3] === ta

  const queue: number[] = []
  queue.push(startX + startY * canvas.width)

  const visited = new Uint8Array(canvas.width * canvas.height)
  visited[startX + startY * canvas.width] = 1

  while (queue.length > 0) {
    const pos = queue.pop()!
    const x = pos % canvas.width
    const y = Math.floor(pos / canvas.width)
    const i = idx(x, y)

    data[i] = fr
    data[i + 1] = fg
    data[i + 2] = fb
    data[i + 3] = 255

    const neighbors = [
      x - 1 >= 0 ? pos - 1 : -1,
      x + 1 < canvas.width ? pos + 1 : -1,
      y - 1 >= 0 ? pos - canvas.width : -1,
      y + 1 < canvas.height ? pos + canvas.width : -1,
    ]

    for (const n of neighbors) {
      if (n < 0 || visited[n]) continue
      const ni = n * 4
      if (match(ni)) {
        visited[n] = 1
        queue.push(n)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function getPos(canvas: HTMLCanvasElement, e: React.MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.floor((e.clientX - rect.left) * (canvas.width / rect.width)),
    y: Math.floor((e.clientY - rect.top) * (canvas.height / rect.height)),
  }
}

interface PaintAppProps {
  windowId?: string
  fileId?: string
}

export function PaintApp(_props: PaintAppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [eraserCursor, setEraserCursor] = useState({ x: 0, y: 0, visible: false })
  const eraserCursorSize = brushSize * 4 + 2
  const startPos = useRef({ x: 0, y: 0 })
  const snapshot = useRef<ImageData | null>(null)

  // Initialize canvas white
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const drawDot = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const updateEraserCursor = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'eraser') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    setEraserCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    })
  }, [tool])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(canvas, e)
    const color = e.button === 2 ? bgColor : fgColor

    updateEraserCursor(e)

    if (tool === 'fill') {
      floodFill(ctx, pos.x, pos.y, color)
      return
    }

    setIsDrawing(true)
    startPos.current = pos

    if (tool === 'rect' || tool === 'line') {
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } else {
      drawDot(ctx, pos.x, pos.y, tool === 'eraser' ? bgColor : color, tool === 'eraser' ? eraserCursorSize : brushSize)
    }
  }, [tool, fgColor, bgColor, brushSize, eraserCursorSize, drawDot, updateEraserCursor])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    updateEraserCursor(e)

    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(canvas, e)
    const color = e.buttons === 2 ? bgColor : fgColor

    if (tool === 'pen' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? bgColor : color
      ctx.lineWidth = tool === 'eraser' ? eraserCursorSize : brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(startPos.current.x, startPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      startPos.current = pos
    } else if (tool === 'rect' && snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0)
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.strokeRect(
        startPos.current.x,
        startPos.current.y,
        pos.x - startPos.current.x,
        pos.y - startPos.current.y
      )
    } else if (tool === 'line' && snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0)
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(startPos.current.x, startPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }, [isDrawing, tool, fgColor, bgColor, brushSize, eraserCursorSize, updateEraserCursor])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
    snapshot.current = null
  }, [])

  const handleMouseLeave = useCallback(() => {
    handleMouseUp()
    setEraserCursor((current) => ({ ...current, visible: false }))
  }, [handleMouseUp])

  const handleColorClick = useCallback((color: string, e: React.MouseEvent) => {
    if (e.button === 2) {
      setBgColor(color)
    } else {
      setFgColor(color)
    }
  }, [])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'dessin.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [bgColor])

  const cursorMap: Record<Tool, string> = {
    pen: 'crosshair',
    eraser: 'none',
    fill: 'cell',
    rect: 'crosshair',
    line: 'crosshair',
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleClear}>Effacer tout</button>
        <div className={styles.separator} />
        <button className={styles.toolBtn} onClick={handleSave}>Enregistrer</button>
      </div>

      <div className={styles.body}>
        <div className={styles.toolbox}>
          {(Object.keys(TOOL_ICONS) as Tool[]).map((t) => (
            <button
              key={t}
              className={`${styles.toolButton} ${tool === t ? styles.toolActive : ''}`}
              onClick={() => setTool(t)}
              title={TOOL_ICONS[t].alt}
              aria-label={TOOL_ICONS[t].alt}
            >
              <img
                src={TOOL_ICONS[t].src}
                alt={TOOL_ICONS[t].alt}
                className={styles.toolIcon}
                draggable={false}
              />
            </button>
          ))}
          <div className={styles.sizeSeparator} />
          {BRUSH_SIZES.map((s) => (
            <button
              key={s.value}
              className={`${styles.sizeButton} ${brushSize === s.value ? styles.toolActive : ''}`}
              onClick={() => setBrushSize(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={600}
            height={440}
            style={{ cursor: cursorMap[tool] }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
          />
          {tool === 'eraser' && eraserCursor.visible && (
            <div
              className={styles.eraserCursor}
              style={{
                left: eraserCursor.x,
                top: eraserCursor.y,
                width: eraserCursorSize,
                height: eraserCursorSize,
              }}
            />
          )}
        </div>
      </div>

      <div className={styles.palette}>
        <div className={styles.activeColors}>
          <div className={styles.bgSwatch} style={{ background: bgColor }} title="Arrière-plan (clic droit)" />
          <div className={styles.fgSwatch} style={{ background: fgColor }} title="Avant-plan (clic gauche)" />
        </div>
        <div className={styles.colorGrid}>
          {WIN95_PALETTE.map((color) => (
            <div
              key={color}
              className={styles.colorCell}
              style={{ background: color }}
              onMouseDown={(e) => { e.preventDefault(); handleColorClick(color, e) }}
              onContextMenu={(e) => { e.preventDefault(); handleColorClick(color, e) }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
