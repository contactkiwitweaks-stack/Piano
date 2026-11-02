import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import type { Piece } from '../types/music'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export type VisualTheme = 'ylia' | 'dark' | 'light'

interface FallingKeysCanvasProps {
  piece: Piece
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  activeNotes: Map<number, { velocity: number; timestamp: number }>
  damperPedal: number
  viewMode: '3d' | '2d'
  theme?: VisualTheme
  onKeyClick?: (midi: number) => void
  handMode?: 'both' | 'right' | 'left'
  expectedNotes?: number[]
  onScreenKeyPress?: (midi: number) => void
  onTogglePedal?: () => void
  showFingers?: boolean
  wallpaperUrl?: string
}

/** Safe rounded rectangle drawing that never crashes on older WebKit or negative radii */
function drawSafeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const safeW = Math.max(0.1, w)
  const safeH = Math.max(0.1, h)
  const safeR = Math.max(0, Math.min(radius, safeW / 2, safeH / 2))
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, safeW, safeH, safeR)
  } else {
    ctx.moveTo(x + safeR, y)
    ctx.arcTo(x + safeW, y, x + safeW, y + safeH, safeR)
    ctx.arcTo(x + safeW, y + safeH, x, y + safeH, safeR)
    ctx.arcTo(x, y + safeH, x, y, safeR)
    ctx.arcTo(x, y, x + safeW, y, safeR)
    ctx.closePath()
  }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  life: number
  maxLife: number
}

const IS_BLACK_KEY = [
  false, true, false, true, false, false, true, false, true, false, true, false, // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
]

function isMidiBlack(midi: number): boolean {
  return IS_BLACK_KEY[midi % 12]
}

export const FallingKeysCanvas = React.memo<FallingKeysCanvasProps>(({
  piece,
  currentTime,
  playbackRate,
  activeNotes,
  damperPedal,
  viewMode,
  theme = 'ylia',
  onKeyClick,
  handMode = 'both',
  expectedNotes = [],
  onScreenKeyPress,
  onTogglePedal,
  showFingers = true,
  wallpaperUrl = '/images/ylia_bg.png',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const yliaImageRef = useRef<HTMLImageElement | null>(null)

  // Load Your Lie in April authentic artwork with automatic fallback and caching
  useEffect(() => {
    const img = new Image()
    img.src = wallpaperUrl || '/images/ylia_bg.png'
    img.onload = () => {
      yliaImageRef.current = img
    }
  }, [wallpaperUrl])

  // Touch tracking for polyphonic keyboard input
  const activeTouchMapRef = useRef<Map<number, number>>(new Map())
  const pressedKeysRef = useRef<Set<number>>(new Set())

  // Precompute maximum note duration in the current piece to ensure binary search culling window never cuts off sustained notes
  const maxNoteDuration = useMemo(() => {
    if (!piece || !piece.notes || piece.notes.length === 0) return 4.0
    let maxD = 1.0
    for (let i = 0; i < piece.notes.length; i++) {
      if (piece.notes[i].duration > maxD) maxD = piece.notes[i].duration
    }
    return Math.min(15.0, maxD)
  }, [piece.notes])

  const maxNoteDurationRef = useRef<number>(maxNoteDuration)
  maxNoteDurationRef.current = maxNoteDuration

  // Dynamic visible register calculation (Focuses on the piece's range)
  const { startMidi, endMidi } = useMemo(() => {
    let minMidi = 108
    let maxMidi = 21
    piece.notes.forEach((n) => {
      if (n.midi < minMidi) minMidi = n.midi
      if (n.midi > maxMidi) maxMidi = n.midi
    })
    const padLow = 4
    const padHigh = 4
    const s = Math.max(21, Math.min(minMidi - padLow, 36)) // C2
    const e = Math.min(108, Math.max(maxMidi + padHigh, 88)) // E6
    return { startMidi: s, endMidi: e }
  }, [piece.notes])

  // Calculate layout of white and black keys within the focused range
  const { whiteKeys, blackKeys, midiToXPos, totalWhite } = useMemo(() => {
    const wKeys: { midi: number; index: number }[] = []
    const bKeys: { midi: number; whiteIndexBefore: number }[] = []
    const xPosMap = new Map<number, { isBlack: boolean; whiteIndex: number }>()

    let whiteCount = 0
    for (let midi = startMidi; midi <= endMidi; midi++) {
      const black = isMidiBlack(midi)
      if (!black) {
        wKeys.push({ midi, index: whiteCount })
        xPosMap.set(midi, { isBlack: false, whiteIndex: whiteCount })
        whiteCount++
      } else {
        bKeys.push({ midi, whiteIndexBefore: whiteCount - 1 })
        xPosMap.set(midi, { isBlack: true, whiteIndex: whiteCount - 1 })
      }
    }
    return { whiteKeys: wKeys, blackKeys: bKeys, totalWhite: Math.max(1, whiteCount), midiToXPos: xPosMap }
  }, [startMidi, endMidi])

  // Stable canvas dimension synchronization:
  // Never mutates canvas.width in an async ResizeObserver callback (which blanks the canvas to black)
  // Instead, tracks container size and lets the synchronous render tick resize & immediately paint
  const pendingDimRef = useRef<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const width = container.clientWidth
      const height = container.clientHeight
      if (width > 0 && height > 0) {
        pendingDimRef.current = {
          w: Math.round(width * dpr),
          h: Math.round(height * dpr),
        }
      }
    }

    handleResize()
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // Context loss & restoration protection for iOS Safari / WebKit
    const handleContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('Canvas context lost - waiting for GPU restoration...')
    }
    const handleContextRestored = () => {
      console.info('Canvas context restored successfully.')
    }

    canvas.addEventListener('contextlost', handleContextLost)
    canvas.addEventListener('contextrestored', handleContextRestored)

    return () => {
      resizeObserver.disconnect()
      canvas.removeEventListener('contextlost', handleContextLost)
      canvas.removeEventListener('contextrestored', handleContextRestored)
    }
  }, [])

  // Fast stable refs for 120 FPS render loop
  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime
  const playbackRateRef = useRef(playbackRate)
  playbackRateRef.current = playbackRate
  const activeNotesRef = useRef(activeNotes)
  activeNotesRef.current = activeNotes
  const damperPedalRef = useRef(damperPedal)
  damperPedalRef.current = damperPedal
  const expectedNotesRef = useRef(expectedNotes)
  expectedNotesRef.current = expectedNotes
  const handModeRef = useRef(handMode)
  handModeRef.current = handMode
  const themeRef = useRef(theme)
  themeRef.current = theme
  const showFingersRef = useRef(showFingers)
  showFingersRef.current = showFingers

  // Particle emission helper
  const spawnHitParticles = useCallback((x: number, y: number, color: string, count: number = 2) => {
    if (particlesRef.current.length > 50) return
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - Math.random() * 4,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -Math.random() * 2.8 - 0.8,
        color,
        radius: Math.random() * 2.2 + 1.2,
        life: 0,
        maxLife: Math.floor(Math.random() * 18 + 14),
      })
    }
  }, [])

  // Map measures to approximate start times for measure line drawing
  const measureStartTimes = useMemo(() => {
    const map = new Map<number, number>()
    piece.notes.forEach((n) => {
      const m = Math.max(1, n.measure)
      if (!map.has(m) || n.startTime < map.get(m)!) {
        map.set(m, n.startTime)
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [piece.notes])

  // 120 FPS Main Render Engine
  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const render = () => {
      try {
        const container = containerRef.current
        const dpr = Math.max(1, window.devicePixelRatio || 1)
        const pending = pendingDimRef.current
        const containerW = container ? container.clientWidth : 0
        const containerH = container ? container.clientHeight : 0

        const targetW = pending ? pending.w : Math.round(containerW * dpr)
        const targetH = pending ? pending.h : Math.round(containerH * dpr)

        // Only resize if target differs by more than 1 pixel (avoids subpixel jitter & black flash)
        if (
          targetW > 10 &&
          targetH > 10 &&
          (Math.abs(canvas.width - targetW) > 1 || Math.abs(canvas.height - targetH) > 1)
        ) {
          canvas.width = targetW
          canvas.height = targetH
          pendingDimRef.current = null
        }

        const width = canvas.width / dpr
        const height = canvas.height / dpr

        if (!width || !height || !isFinite(width) || !isFinite(height) || width < 10 || height < 10) {
          return
        }

        // Absolute matrix reset: guarantees no exponential scale accumulation or black voids
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const curTime = currentTimeRef.current
        const curRate = playbackRateRef.current
        const curActiveNotes = activeNotesRef.current
        const curPedal = damperPedalRef.current
        const curExpectedNotes = expectedNotesRef.current
        const curHandMode = handModeRef.current
        const curTheme = themeRef.current
        const curShowFingers = showFingersRef.current
        const curPressedKeys = pressedKeysRef.current

        // Sleek tactile keyboard: takes only 19% of screen, giving 81% vertical space to falling notes!
        const keyboardHeight = Math.min(108, Math.max(70, height * 0.19))
        const keyboardY = height - keyboardHeight
        const blackKeyHeight = keyboardHeight * 0.62
        const whiteKeyWidth = width / totalWhite
        const blackKeyWidth = whiteKeyWidth * 0.64

        const pixelsPerSecond = 145 * curRate
        const lookaheadSeconds = keyboardY / pixelsPerSecond

        // 3D Perspective Projection helper
        const projectPoint = (x: number, y: number) => {
          if (viewMode === '2d') return { x, y }
          const progressY = Math.max(0, Math.min(1, y / keyboardY))
          // Horizon scale at top (y=0) is 0.60, expanding to 1.0 at keyboard strike line
          const depthScale = 0.60 + progressY * 0.40
          const centerX = width / 2
          return { x: centerX + (x - centerX) * depthScale, y }
        }

        // -------------------------------------------------------------
        // 1. THEME BACKGROUND RENDERING (PREVENTS ANY BLACK VOIDS)
        // -------------------------------------------------------------
        // Solid base fill across the ENTIRE canvas first (never flashes black)
        ctx.fillStyle = curTheme === 'light' ? '#f8fafc' : '#080c1e'
        ctx.fillRect(0, 0, width, height)

        if (curTheme === 'ylia') {
          const img = yliaImageRef.current
          if (img && img.complete && img.naturalWidth > 0) {
            // Draw authentic "Your Lie in April" Kaori & Kousei artwork
            const imgAspect = img.naturalWidth / img.naturalHeight
            const canvasAspect = width / keyboardY
            let drawW = width
            let drawH = keyboardY
            let drawX = 0
            let drawY = 0

            if (canvasAspect > imgAspect) {
              drawH = width / imgAspect
              drawY = (keyboardY - drawH) / 2
            } else {
              drawW = keyboardY * imgAspect
              drawX = (width - drawW) / 2
            }

            try {
              ctx.drawImage(img, drawX, drawY, drawW, drawH)
            } catch {}

            // Soft dark starry vignette overlay so notes pop brilliantly
            const overlay = ctx.createLinearGradient(0, 0, 0, keyboardY)
            overlay.addColorStop(0, 'rgba(8, 12, 28, 0.45)')
            overlay.addColorStop(0.7, 'rgba(10, 15, 36, 0.55)')
            overlay.addColorStop(1, 'rgba(6, 9, 24, 0.75)')
            ctx.fillStyle = overlay
            ctx.fillRect(0, 0, width, keyboardY)
          } else {
            // Deep starry navy fallback
            const grad = ctx.createLinearGradient(0, 0, 0, keyboardY)
            grad.addColorStop(0, '#0a0f24')
            grad.addColorStop(0.6, '#0f1738')
            grad.addColorStop(1, '#070a1a')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, width, keyboardY)
          }
        } else if (curTheme === 'dark') {
          // Concert Dark: Deep obsidian midnight
          const grad = ctx.createLinearGradient(0, 0, 0, keyboardY)
          grad.addColorStop(0, '#06070a')
          grad.addColorStop(0.7, '#0b0d14')
          grad.addColorStop(1, '#040508')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, width, keyboardY)
        } else {
          // Ivory Studio Light
          const grad = ctx.createLinearGradient(0, 0, 0, keyboardY)
          grad.addColorStop(0, '#f8fafc')
          grad.addColorStop(1, '#e2e8f0')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, width, keyboardY)
        }

      // -------------------------------------------------------------
      // 2. HORIZONTAL MEASURE LINES & MEASURE NUMBERS (Like Screenshot)
      // -------------------------------------------------------------
      measureStartTimes.forEach(([measureNum, mTime]) => {
        if (mTime >= curTime - 0.2 && mTime <= curTime + lookaheadSeconds) {
          const timeFromCurrent = mTime - curTime
          const lineY = keyboardY - timeFromCurrent * pixelsPerSecond
          if (lineY >= 0 && lineY <= keyboardY) {
            ctx.save()
            const pL = projectPoint(0, lineY)
            const pR = projectPoint(width, lineY)
            // Subtle horizontal measure divider line with perspective projection
            ctx.strokeStyle = curTheme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)'
            ctx.lineWidth = viewMode === '3d' ? 1.4 : 1
            ctx.beginPath()
            ctx.moveTo(pL.x, pL.y)
            ctx.lineTo(pR.x, pR.y)
            ctx.stroke()

            // Measure number on the left margin
            ctx.fillStyle = curTheme === 'light' ? 'rgba(71, 85, 105, 0.7)' : 'rgba(226, 232, 240, 0.75)'
            ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`${measureNum}`, Math.max(8, pL.x + 8), pL.y - 4)
            ctx.restore()
          }
        }
      })

      // -------------------------------------------------------------
      // 3. SUBTLE VERTICAL KEY LANE GUIDES
      // -------------------------------------------------------------
      ctx.strokeStyle = curTheme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.06)'
      ctx.lineWidth = 1
      whiteKeys.forEach((wk) => {
        if (wk.midi % 12 === 0 || (viewMode === '3d' && wk.midi % 12 === 5)) {
          const x = wk.index * whiteKeyWidth
          const p1 = projectPoint(x, 0)
          const p2 = projectPoint(x, keyboardY)
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      })

      // -------------------------------------------------------------
      // 5. RENDER FALLING NOTES (SLIM, ELEGANT ROUNDED PILLS WITH NOTE LETTERS)
      // -------------------------------------------------------------
      const maxNoteDur = maxNoteDurationRef.current || 4.0
      const minStartTime = curTime - maxNoteDur - 0.5

      let low = 0
      let high = piece.notes.length - 1
      let startIdx = piece.notes.length
      while (low <= high) {
        const mid = (low + high) >> 1
        if (piece.notes[mid].startTime >= minStartTime) {
          startIdx = mid
          high = mid - 1
        } else {
          low = mid + 1
        }
      }

      const activePlayingMidis = new Map<number, { isRight: boolean }>()
      const maxStartTime = curTime + lookaheadSeconds + 0.5
      const notesToRender: typeof piece.notes = []

      for (let i = startIdx; i < piece.notes.length; i++) {
        const n = piece.notes[i]
        if (n.startTime > maxStartTime) break

        // Skip notes that have already finished playing before curTime
        if (n.startTime + n.duration < curTime) continue

        notesToRender.push(n)

        const isPlaying = curTime >= n.startTime && curTime <= n.startTime + n.duration
        if (isPlaying) {
          activePlayingMidis.set(n.midi, { isRight: n.hand === 'right' })
        }
      }

      // Draw each falling note pill
      notesToRender.forEach((note) => {
        const posInfo = midiToXPos.get(note.midi)
        if (!posInfo) return

        let keyX = 0
        let keyW = 0
        if (!posInfo.isBlack) {
          keyX = posInfo.whiteIndex * whiteKeyWidth
          keyW = whiteKeyWidth
        } else {
          keyX = (posInfo.whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2
          keyW = blackKeyWidth
        }

        // Accurate linear note height: ensures notes never jump or "extend" upon striking the keyboard!
        const start = note.startTime
        const end = note.startTime + note.duration
        const fullNoteHeight = Math.max(12, note.duration * pixelsPerSecond)

        let bottomY = 0
        let topY = 0
        let noteLengthPx = 0

        if (curTime < start) {
          // 1. Approaching: Note falls downward at constant speed
          const timeUntilHit = start - curTime
          bottomY = keyboardY - timeUntilHit * pixelsPerSecond
          topY = bottomY - fullNoteHeight
          noteLengthPx = fullNoteHeight
        } else if (curTime <= end) {
          // 2. Active Strike: Bottom rests precisely at the strike line while top smoothly descends linearly
          bottomY = keyboardY
          const duration = Math.max(0.001, end - start)
          const remainingRatio = Math.max(0, (end - curTime) / duration)
          noteLengthPx = Math.max(3, fullNoteHeight * remainingRatio)
          topY = keyboardY - noteLengthPx
        } else {
          // 3. Finished note
          return
        }

        // Skip notes completely off-screen
        if (bottomY < -20 || topY > keyboardY + 10) return

        const isRight = note.hand === 'right'

        // Check hand practice filter dimming
        const isDimmed = (curHandMode === 'right' && !isRight) || (curHandMode === 'left' && isRight)
        const alpha = isDimmed ? 0.25 : 1.0

        // Palette:
        // YLIA: Left Hand = Pastel Pink (#f472b6), Right Hand = Pastel Sky Cyan (#38bdf8)
        // Dark: Left Hand = Pastel Rose (#e879f9), Right Hand = Pastel Cyan (#38bdf8)
        // Light: Left Hand = Pastel Coral (#fb7185), Right Hand = Pastel Teal (#2dd4bf)
        let baseColor = isRight ? '#38bdf8' : '#f472b6'
        let gradTop = isRight ? '#bae6fd' : '#fbcfe8'
        let borderColor = isRight ? 'rgba(186, 230, 253, 0.95)' : 'rgba(251, 207, 232, 0.95)'
        let glowColor = isRight ? 'rgba(56, 189, 248, 0.75)' : 'rgba(244, 114, 182, 0.75)'

        if (curTheme === 'dark') {
          baseColor = isRight ? '#38bdf8' : '#e879f9'
          gradTop = isRight ? '#7dd3fc' : '#f0abfc'
          borderColor = isRight ? 'rgba(125, 211, 252, 0.9)' : 'rgba(240, 171, 252, 0.9)'
          glowColor = isRight ? 'rgba(56, 189, 248, 0.7)' : 'rgba(232, 121, 249, 0.7)'
        } else if (curTheme === 'light') {
          baseColor = isRight ? '#0d9488' : '#e11d48'
          gradTop = isRight ? '#5eead4' : '#fda4af'
          borderColor = isRight ? 'rgba(45, 212, 191, 0.9)' : 'rgba(251, 113, 133, 0.9)'
          glowColor = isRight ? 'rgba(45, 212, 191, 0.6)' : 'rgba(251, 113, 133, 0.6)'
        }

        const isCurrentlyPlaying = curTime >= note.startTime && curTime <= note.startTime + note.duration
        if (isCurrentlyPlaying && !isDimmed) {
          spawnHitParticles(keyX + keyW / 2, keyboardY, baseColor, 1)
        }

        // Pill margins: proportional padding so notes fit cleanly and never crowd
        const notePad = Math.max(1, Math.min(2, keyW * 0.1))
        const noteX = keyX + notePad
        const noteW = Math.max(4, keyW - notePad * 2)
        const cornerR = Math.min(5, noteW / 2)

        ctx.save()
        ctx.globalAlpha = alpha

        if (isCurrentlyPlaying && !isDimmed) {
          ctx.shadowColor = glowColor
          ctx.shadowBlur = 6
        }

        if (viewMode === '3d') {
          // 3D Perspective Highway: Notes expand realistically towards the keyboard strike line
          const pTL = projectPoint(noteX, topY)
          const pTR = projectPoint(noteX + noteW, topY)
          const pBR = projectPoint(noteX + noteW, bottomY)
          const pBL = projectPoint(noteX, bottomY)

          ctx.beginPath()
          ctx.moveTo(pTL.x, pTL.y)
          ctx.lineTo(pTR.x, pTR.y)
          ctx.lineTo(pBR.x, pBR.y)
          ctx.lineTo(pBL.x, pBL.y)
          ctx.closePath()

          const noteGrad = ctx.createLinearGradient((pTL.x + pTR.x) / 2, topY, (pBL.x + pBR.x) / 2, bottomY)
          noteGrad.addColorStop(0, gradTop)
          noteGrad.addColorStop(1, baseColor)
          ctx.fillStyle = noteGrad
          ctx.fill()

          ctx.strokeStyle = borderColor
          ctx.lineWidth = 1.3
          ctx.stroke()

          // 3D Specular depth bevel: subtle bright inner edge on left, subtle dark edge on right
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pTL.x + 1, pTL.y)
          ctx.lineTo(pBL.x + 1, pBL.y)
          ctx.stroke()
        } else {
          // 2D Overhead View: Precise flat rounded pills
          drawSafeRoundRect(ctx, noteX, topY, noteW, noteLengthPx, cornerR)

          const noteGrad = ctx.createLinearGradient(noteX, topY, noteX, bottomY)
          noteGrad.addColorStop(0, gradTop)
          noteGrad.addColorStop(1, baseColor)
          ctx.fillStyle = noteGrad
          ctx.fill()

          ctx.strokeStyle = borderColor
          ctx.lineWidth = 1.2
          ctx.stroke()
        }

        // -------------------------------------------------------------
        // NOTE LETTER RENDERING (LOCKED STATIC AT TOP-CENTER OF PILL)
        // Positioned cleanly at the top of the note with fixed margins.
        // Never dynamically slides or moves during playback!
        // -------------------------------------------------------------
        if (noteW >= 3.0 && noteLengthPx >= 8 && bottomY > 0 && topY < keyboardY) {
          const noteLetter = note.noteName.replace(/[0-9]/g, '')
          const rawFinger = note.finger ? Number(note.finger) : (note.hand === 'left' ? 5 : 1)
          const fingerDigit = Math.max(1, Math.min(5, Math.round(rawFinger) || 1))
          const isNarrow = noteW < 14

          // Fixed vertical anchor at top of note with 10px breathing room
          const fixedTopOffset = Math.min(10, Math.max(6, noteLengthPx * 0.35))
          const pTopAnchor = projectPoint(noteX + noteW / 2, topY + fixedTopOffset)

          ctx.save()
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
          ctx.shadowBlur = 4

          if (curShowFingers) {
            // If fingers option is toggled ON: note letter at top, finger digit below
            ctx.font = isNarrow ? 'bold 7.5px sans-serif' : 'bold 9px sans-serif'
            ctx.fillText(noteLetter, pTopAnchor.x, pTopAnchor.y)

            if (noteLengthPx >= 26) {
              const pBottomAnchor = projectPoint(noteX + noteW / 2, bottomY - 9)
              ctx.font = isNarrow ? 'bold 8px sans-serif' : 'bold 9.5px sans-serif'
              ctx.fillText(`${fingerDigit}`, pBottomAnchor.x, pBottomAnchor.y)
            }
          } else {
            // Clean by default: Note letter locked at top-center, completely stable
            ctx.font = isNarrow ? 'bold 8px sans-serif' : 'bold 9.5px sans-serif'
            ctx.fillText(noteLetter, pTopAnchor.x, pTopAnchor.y)
          }

          ctx.restore()
        }

        ctx.restore()
      })

      // -------------------------------------------------------------
      // 6. STRIKE LINE & UPWARD RADIANT LIGHT BLOOM
      // -------------------------------------------------------------
      // Horizontal laser strike line
      ctx.save()
      ctx.strokeStyle = curTheme === 'ylia' ? '#38bdf8' : curTheme === 'light' ? '#cbd5e1' : '#f59e0b'
      ctx.lineWidth = 1.8
      ctx.shadowColor = curTheme === 'ylia' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(245, 158, 11, 0.8)'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(0, keyboardY)
      ctx.lineTo(width, keyboardY)
      ctx.stroke()
      ctx.restore()

      // Delicate strike contact glow (subtle key surface reflection without masking falling notes)
      activePlayingMidis.forEach((info, midi) => {
        const posInfo = midiToXPos.get(midi)
        if (!posInfo) return
        const kX = !posInfo.isBlack
          ? posInfo.whiteIndex * whiteKeyWidth
          : (posInfo.whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2
        const kW = !posInfo.isBlack ? whiteKeyWidth : blackKeyWidth

        ctx.save()
        if (viewMode === '3d') {
          const p1 = projectPoint(kX, keyboardY - 38)
          const p2 = projectPoint(kX + kW, keyboardY - 38)
          ctx.beginPath()
          ctx.moveTo(kX, keyboardY)
          ctx.lineTo(kX + kW, keyboardY)
          ctx.lineTo(p2.x, p2.y)
          ctx.lineTo(p1.x, p1.y)
          ctx.closePath()
          const bloomGrad = ctx.createLinearGradient(kX + kW / 2, keyboardY, (p1.x + p2.x) / 2, p1.y)
          const bloomColor = info.isRight ? 'rgba(56, 189, 248, 0.45)' : 'rgba(244, 114, 182, 0.45)'
          bloomGrad.addColorStop(0, bloomColor)
          bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = bloomGrad
          ctx.fill()
        } else {
          const bloomH = 8
          const bloomGrad = ctx.createLinearGradient(kX + kW / 2, keyboardY, kX + kW / 2, keyboardY - bloomH)
          const bloomColor = info.isRight ? 'rgba(56, 189, 248, 0.28)' : 'rgba(244, 114, 182, 0.28)'
          bloomGrad.addColorStop(0, bloomColor)
          bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = bloomGrad
          ctx.fillRect(kX, keyboardY - bloomH, kW, bloomH)
        }
        ctx.restore()
      })

      // -------------------------------------------------------------
      // 7. PARTICLES
      // -------------------------------------------------------------
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.x += p.vx
        p.y += p.vy
        p.life++

        const progress = p.life / p.maxLife
        const alpha = Math.max(0, 1 - progress)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * (1 - progress * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = alpha
        ctx.fill()
        ctx.globalAlpha = 1.0

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1)
        }
      }

      // Expected notes set for Wait-for-Note highlight
      const expectedSet = new Set(curExpectedNotes)

      // -------------------------------------------------------------
      // 8. RENDER WHITE KEYS (IVORY WITH PHYSICAL KEY-DIP & PASTEL COLOR GLOW)
      // -------------------------------------------------------------
      whiteKeys.forEach((wk) => {
        const x = wk.index * whiteKeyWidth
        const activeInfo = activePlayingMidis.get(wk.midi) || (curActiveNotes.has(wk.midi) ? { isRight: true } : undefined)
        const isPressed = activeInfo !== undefined || curPressedKeys.has(wk.midi)
        const isExpected = expectedSet.has(wk.midi)
        const yOffset = isPressed ? 2.5 : 0

        ctx.save()
        if (isPressed) {
          // Pastel glow: Pink for Left Hand, Cyan for Right Hand
          const isRightHand = activeInfo?.isRight ?? true
          const hitGrad = ctx.createLinearGradient(x, keyboardY + yOffset, x, height)
          if (curTheme === 'ylia' || curTheme === 'dark') {
            if (isRightHand) {
              hitGrad.addColorStop(0, '#e0f2fe')
              hitGrad.addColorStop(0.5, '#38bdf8')
              hitGrad.addColorStop(1, '#0284c7')
            } else {
              hitGrad.addColorStop(0, '#fce7f3')
              hitGrad.addColorStop(0.5, '#f472b6')
              hitGrad.addColorStop(1, '#db2777')
            }
          } else {
            if (isRightHand) {
              hitGrad.addColorStop(0, '#ccfbf1')
              hitGrad.addColorStop(0.5, '#2dd4bf')
              hitGrad.addColorStop(1, '#0f766e')
            } else {
              hitGrad.addColorStop(0, '#ffe4e6')
              hitGrad.addColorStop(0.5, '#fb7185')
              hitGrad.addColorStop(1, '#be123c')
            }
          }
          ctx.fillStyle = hitGrad
          ctx.shadowColor = isRightHand ? 'rgba(56, 189, 248, 0.9)' : 'rgba(244, 114, 182, 0.9)'
          ctx.shadowBlur = 18
        } else if (isExpected) {
          const pulse = Math.sin(Date.now() / 150) * 0.15 + 0.85
          ctx.fillStyle = `rgba(245, 158, 11, ${pulse * 0.4})`
        } else {
          // Realistic Ivory Key
          const wGrad = ctx.createLinearGradient(x, keyboardY, x, height)
          wGrad.addColorStop(0, '#ffffff')
          wGrad.addColorStop(0.85, '#f4f4f0')
          wGrad.addColorStop(1, '#d8d8d0')
          ctx.fillStyle = wGrad
        }

        ctx.fillRect(x + 0.5, keyboardY + yOffset, whiteKeyWidth - 1, keyboardHeight - yOffset)

        ctx.strokeStyle = isPressed ? (activeInfo?.isRight ? '#0284c7' : '#db2777') : '#b0b0a8'
        ctx.lineWidth = 0.8
        ctx.strokeRect(x + 0.5, keyboardY + yOffset, whiteKeyWidth - 1, keyboardHeight - yOffset)

        // Rounded lip at the bottom of the white key
        ctx.fillStyle = isPressed ? '#0284c7' : '#b8b8b0'
        ctx.fillRect(x + 1, height - 3, whiteKeyWidth - 2, 2.5)

        // Middle C and Octave label
        if (wk.midi % 12 === 0 && whiteKeyWidth > 13) {
          ctx.fillStyle = isPressed ? '#ffffff' : '#888880'
          ctx.font = 'bold 9px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`C${Math.floor(wk.midi / 12) - 1}`, x + whiteKeyWidth / 2, height - 6)
        }
        ctx.restore()
      })

      // -------------------------------------------------------------
      // 9. RENDER BLACK KEYS (EBONY BEVELS & PASTEL KEY-DIP GLOW)
      // -------------------------------------------------------------
      blackKeys.forEach((bk) => {
        const x = (bk.whiteIndexBefore + 1) * whiteKeyWidth - blackKeyWidth / 2
        const activeInfo = activePlayingMidis.get(bk.midi) || (curActiveNotes.has(bk.midi) ? { isRight: true } : undefined)
        const isPressed = activeInfo !== undefined || curPressedKeys.has(bk.midi)
        const isExpected = expectedSet.has(bk.midi)
        const yOffset = isPressed ? 2 : 0

        ctx.save()
        if (isPressed) {
          const isRightHand = activeInfo?.isRight ?? true
          const hitGrad = ctx.createLinearGradient(x, keyboardY + yOffset, x, keyboardY + blackKeyHeight)
          if (curTheme === 'ylia' || curTheme === 'dark') {
            if (isRightHand) {
              hitGrad.addColorStop(0, '#bae6fd')
              hitGrad.addColorStop(0.65, '#38bdf8')
              hitGrad.addColorStop(1, '#0369a1')
            } else {
              hitGrad.addColorStop(0, '#fbcfe8')
              hitGrad.addColorStop(0.65, '#f472b6')
              hitGrad.addColorStop(1, '#9d174d')
            }
          } else {
            if (isRightHand) {
              hitGrad.addColorStop(0, '#99f6e4')
              hitGrad.addColorStop(0.65, '#2dd4bf')
              hitGrad.addColorStop(1, '#0f766e')
            } else {
              hitGrad.addColorStop(0, '#fecdd3')
              hitGrad.addColorStop(0.65, '#fb7185')
              hitGrad.addColorStop(1, '#be123c')
            }
          }
          ctx.fillStyle = hitGrad
          ctx.shadowColor = isRightHand ? 'rgba(56, 189, 248, 0.9)' : 'rgba(244, 114, 182, 0.9)'
          ctx.shadowBlur = 18
        } else if (isExpected) {
          ctx.fillStyle = '#b45309'
        } else {
          // Ebony Gloss Key
          const bGrad = ctx.createLinearGradient(x, keyboardY, x, keyboardY + blackKeyHeight)
          bGrad.addColorStop(0, '#262626')
          bGrad.addColorStop(0.7, '#141414')
          bGrad.addColorStop(1, '#050505')
          ctx.fillStyle = bGrad
        }

        ctx.fillRect(x, keyboardY + yOffset, blackKeyWidth, blackKeyHeight - yOffset)

        ctx.strokeStyle = isPressed ? (activeInfo?.isRight ? '#38bdf8' : '#f472b6') : '#333333'
        ctx.lineWidth = 1
        ctx.strokeRect(x, keyboardY + yOffset, blackKeyWidth, blackKeyHeight - yOffset)

        // Bottom glossy bevel of black key
        if (!isPressed) {
          ctx.fillStyle = '#444444'
          ctx.fillRect(x + 1, keyboardY + blackKeyHeight - 3, blackKeyWidth - 2, 2.5)
        }
        ctx.restore()
      })

      // -------------------------------------------------------------
      // 10. ULTRA-SLEEK MINIMALIST DAMPER PEDAL PILL (Anime / Modern Glass Aesthetic)
      // -------------------------------------------------------------
      const isPedalDown = curPedal > 30
      const pedalPillW = 82
      const pedalPillH = 24
      const pedalPillX = width - pedalPillW - 14
      const pedalPillY = keyboardY - pedalPillH - 10

      if (width > 280) {
        ctx.save()
        // Translucent frosted glass pill
        ctx.fillStyle = isPedalDown
          ? 'rgba(245, 158, 11, 0.22)'
          : curTheme === 'light'
          ? 'rgba(255, 255, 255, 0.75)'
          : 'rgba(15, 23, 42, 0.65)'
        ctx.strokeStyle = isPedalDown
          ? '#f59e0b'
          : curTheme === 'light'
          ? 'rgba(0, 0, 0, 0.12)'
          : 'rgba(255, 255, 255, 0.12)'
        ctx.lineWidth = 1

        if (isPedalDown) {
          ctx.shadowColor = 'rgba(245, 158, 11, 0.75)'
          ctx.shadowBlur = 10
        }

        drawSafeRoundRect(ctx, pedalPillX, pedalPillY, pedalPillW, pedalPillH, 12)
        ctx.fill()
        ctx.stroke()
        ctx.shadowBlur = 0

        // Status indicator dot
        ctx.beginPath()
        ctx.arc(pedalPillX + 13, pedalPillY + pedalPillH / 2, isPedalDown ? 3.5 : 2.8, 0, Math.PI * 2)
        ctx.fillStyle = isPedalDown ? '#fbbf24' : curTheme === 'light' ? '#94a3b8' : '#71717a'
        ctx.fill()

        // Clean typography
        ctx.fillStyle = isPedalDown
          ? '#ffffff'
          : curTheme === 'light'
          ? '#475569'
          : '#94a3b8'
        ctx.font = 'bold 9.5px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          isPedalDown ? 'DAMPER' : 'PEDAL',
          pedalPillX + 22,
          pedalPillY + pedalPillH / 2
        )
        ctx.restore()
      }
      } catch (err) {
        console.warn('Canvas render tick glitch caught:', err)
      } finally {
        animId = requestAnimationFrame(render)
      }
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [
    piece,
    viewMode,
    whiteKeys,
    blackKeys,
    midiToXPos,
    totalWhite,
    measureStartTimes,
    spawnHitParticles,
  ])

  // Mouse & Touch Polyphonic Keyboard Input
  const getInteractionTarget = (clientX: number, clientY: number): { type: 'key'; midi: number } | { type: 'pedal' } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    // Exact normalized coordinates within canvas logical dimensions
    const x = ((clientX - rect.left) / rect.width) * width
    const y = ((clientY - rect.top) / rect.height) * height

    const whiteKeyWidth = width / totalWhite
    const blackKeyWidth = whiteKeyWidth * 0.64
    const keyboardHeight = Math.min(108, Math.max(70, height * 0.19))
    const keyboardY = height - keyboardHeight
    const blackKeyHeight = keyboardHeight * 0.62

    // Clicked on pedal widget?
    const pedalPillW = 82
    const pedalPillH = 24
    const pedalPillX = width - pedalPillW - 14
    const pedalPillY = keyboardY - pedalPillH - 10
    if (x >= pedalPillX && x <= pedalPillX + pedalPillW && y >= pedalPillY && y <= pedalPillY + pedalPillH) {
      return { type: 'pedal' }
    }

    // Only allow strikes on keyboard or immediate strike zone (within 24px above keyboardY)
    if (y < keyboardY - 24) {
      return null
    }

    // Check black keys first (only in the upper portion where black keys exist)
    if (y <= keyboardY + blackKeyHeight) {
      for (const bk of blackKeys) {
        const bx = (bk.whiteIndexBefore + 1) * whiteKeyWidth - blackKeyWidth / 2
        if (x >= bx && x <= bx + blackKeyWidth) {
          return { type: 'key', midi: bk.midi }
        }
      }
    }

    // Check white keys (span full width of their index)
    for (const wk of whiteKeys) {
      const wx = wk.index * whiteKeyWidth
      if (x >= wx && x <= wx + whiteKeyWidth) {
        return { type: 'key', midi: wk.midi }
      }
    }

    return null
  }

  const onKeyStart = (pointerId: number, midi: number) => {
    activeTouchMapRef.current.set(pointerId, midi)
    pressedKeysRef.current.add(midi)

    PianoAudioEngine.getInstance().unlockAudio().catch(() => {})
    PianoAudioEngine.getInstance().noteOn(midi, 95)
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})

    if (onKeyClick) onKeyClick(midi)
    if (onScreenKeyPress) onScreenKeyPress(midi)
  }

  const onKeyEnd = (pointerId: number) => {
    const midi = activeTouchMapRef.current.get(pointerId)
    if (midi !== undefined) {
      activeTouchMapRef.current.delete(pointerId)

      let stillHeld = false
      for (const m of activeTouchMapRef.current.values()) {
        if (m === midi) {
          stillHeld = true
          break
        }
      }

      if (!stillHeld) {
        pressedKeysRef.current.delete(midi)
        PianoAudioEngine.getInstance().noteOff(midi)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none touch-none"
      onPointerDown={(e) => {
        const target = getInteractionTarget(e.clientX, e.clientY)
        if (!target) return
        if (target.type === 'pedal') {
          if (onTogglePedal) onTogglePedal()
        } else {
          onKeyStart(e.pointerId, target.midi)
        }
      }}
      onPointerMove={(e) => {
        if (!activeTouchMapRef.current.has(e.pointerId)) return
        const target = getInteractionTarget(e.clientX, e.clientY)
        const currentMidi = activeTouchMapRef.current.get(e.pointerId)
        if (target && target.type === 'key') {
          if (target.midi !== currentMidi) {
            onKeyEnd(e.pointerId)
            onKeyStart(e.pointerId, target.midi)
          }
        } else {
          onKeyEnd(e.pointerId)
        }
      }}
      onPointerUp={(e) => onKeyEnd(e.pointerId)}
      onPointerCancel={(e) => onKeyEnd(e.pointerId)}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
})
