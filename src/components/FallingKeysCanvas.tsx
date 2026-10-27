import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
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

export const FallingKeysCanvas: React.FC<FallingKeysCanvasProps> = ({
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const yliaImageRef = useRef<HTMLImageElement | null>(null)

  // Load Your Lie in April authentic artwork
  useEffect(() => {
    const img = new Image()
    img.src = '/images/ylia_bg.png'
    img.onload = () => {
      yliaImageRef.current = img
    }
  }, [])

  // Touch tracking for polyphonic keyboard input
  const activeTouchMapRef = useRef<Map<number, number>>(new Map())
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set())

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

  // ResizeObserver for canvas sync
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
    }

    updateCanvasDimensions()
    const resizeObserver = new ResizeObserver(updateCanvasDimensions)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
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
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render)
        return
      }

      ctx.save()
      ctx.scale(dpr, dpr)

      const curTime = currentTimeRef.current
      const curRate = playbackRateRef.current
      const curActiveNotes = activeNotesRef.current
      const curPedal = damperPedalRef.current
      const curExpectedNotes = expectedNotesRef.current
      const curHandMode = handModeRef.current
      const curTheme = themeRef.current

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
        const depthScale = 0.82 + progressY * 0.18
        const centerX = width / 2
        return { x: centerX + (x - centerX) * depthScale, y }
      }

      // -------------------------------------------------------------
      // 1. THEME BACKGROUND RENDERING
      // -------------------------------------------------------------
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

          ctx.drawImage(img, drawX, drawY, drawW, drawH)

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
            // Subtle horizontal measure divider line
            ctx.strokeStyle = curTheme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, lineY)
            ctx.lineTo(width, lineY)
            ctx.stroke()

            // Measure number on the left margin
            ctx.fillStyle = curTheme === 'light' ? 'rgba(71, 85, 105, 0.7)' : 'rgba(226, 232, 240, 0.65)'
            ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`${measureNum}`, 8, lineY - 4)
            ctx.restore()
          }
        }
      })

      // -------------------------------------------------------------
      // 3. CENTER PIECE TITLE & ANIME SUBTITLE OVERLAY (Matching Screenshot)
      // -------------------------------------------------------------
      ctx.save()
      const titleCenterY = keyboardY - 70
      if (titleCenterY > 60) {
        ctx.textAlign = 'center'
        // Main Title (e.g. "Ballade No.1, Op.23 (Chopin)")
        ctx.font = 'bold 13px sans-serif'
        ctx.fillStyle = curTheme === 'light' ? 'rgba(30, 41, 59, 0.85)' : '#ffffff'
        ctx.shadowColor = curTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.9)'
        ctx.shadowBlur = 8
        ctx.fillText(
          `${piece.title}${piece.opus ? ` (${piece.opus})` : ''}`,
          width / 2,
          titleCenterY
        )

        // Subtitle (e.g. "Your Lie in April" or Composer)
        ctx.font = '600 11px sans-serif'
        ctx.fillStyle = curTheme === 'ylia' ? '#7dd3fc' : curTheme === 'light' ? '#64748b' : '#fbbf24'
        ctx.fillText(
          curTheme === 'ylia' ? 'Your Lie in April' : piece.composer,
          width / 2,
          titleCenterY + 16
        )
      }
      ctx.restore()

      // -------------------------------------------------------------
      // 4. SUBTLE VERTICAL KEY LANE GUIDES
      // -------------------------------------------------------------
      ctx.strokeStyle = curTheme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      whiteKeys.forEach((wk) => {
        if (wk.midi % 12 === 0) {
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
      let low = 0
      let high = piece.notes.length - 1
      let startIdx = 0
      const minStartTime = curTime - 0.4
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
      const maxStartTime = curTime + lookaheadSeconds
      const notesToRender: typeof piece.notes = []

      for (let i = startIdx; i < piece.notes.length; i++) {
        const n = piece.notes[i]
        if (n.startTime > maxStartTime) break
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

        const timeFromCurrent = note.startTime - curTime
        const bottomY = keyboardY - timeFromCurrent * pixelsPerSecond
        // Note length scaled to duration, with clean minimum height
        const noteLengthPx = Math.max(14, note.duration * pixelsPerSecond)
        const topY = bottomY - noteLengthPx

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

        // Pill margins: leaving 1.5px padding on each side so notes fit cleanly and never crowd
        const notePad = 1.5
        const noteX = keyX + notePad
        const noteW = Math.max(4, keyW - notePad * 2)
        const cornerR = Math.min(5, noteW / 2)

        ctx.save()
        ctx.globalAlpha = alpha

        if (isCurrentlyPlaying && !isDimmed) {
          ctx.shadowColor = glowColor
          ctx.shadowBlur = 18
        }

        // Draw smooth rounded pill rectangle
        ctx.beginPath()
        ctx.roundRect(noteX, topY, noteW, noteLengthPx, cornerR)

        const noteGrad = ctx.createLinearGradient(noteX, topY, noteX, bottomY)
        noteGrad.addColorStop(0, gradTop)
        noteGrad.addColorStop(1, baseColor)
        ctx.fillStyle = noteGrad
        ctx.fill()

        ctx.strokeStyle = borderColor
        ctx.lineWidth = 1.2
        ctx.stroke()

        // STAMPED NOTE LETTER (e.g. "E", "B", "A", "C", "D") INSIDE PILL (MATCHING SCREENSHOT)
        // No fingering numbers! Just note letters!
        if (noteW >= 10 && bottomY > 0 && bottomY < keyboardY + 16) {
          const noteLetter = note.noteName.replace(/[0-9]/g, '')
          const textY = Math.min(bottomY - 4, topY + noteLengthPx / 2 + 3)
          ctx.save()
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
          ctx.shadowBlur = 3
          ctx.font = 'bold 9px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(noteLetter, noteX + noteW / 2, textY)
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

      // Upward blooming radiant light cones for all struck keys
      activePlayingMidis.forEach((info, midi) => {
        const posInfo = midiToXPos.get(midi)
        if (!posInfo) return
        const kX = !posInfo.isBlack
          ? posInfo.whiteIndex * whiteKeyWidth
          : (posInfo.whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2
        const kW = !posInfo.isBlack ? whiteKeyWidth : blackKeyWidth

        ctx.save()
        const bloomH = Math.min(65, keyboardY * 0.4)
        const bloomGrad = ctx.createLinearGradient(kX + kW / 2, keyboardY, kX + kW / 2, keyboardY - bloomH)
        const bloomColor = info.isRight ? 'rgba(56, 189, 248, 0.65)' : 'rgba(244, 114, 182, 0.65)'
        bloomGrad.addColorStop(0, bloomColor)
        bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = bloomGrad
        ctx.fillRect(kX, keyboardY - bloomH, kW, bloomH)
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
        const isPressed = activeInfo !== undefined || pressedKeys.has(wk.midi)
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
        const isPressed = activeInfo !== undefined || pressedKeys.has(bk.midi)
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
      // 10. 3-PEDAL SHOWCASE WIDGET
      // -------------------------------------------------------------
      const pedalBoxW = 110
      const pedalBoxH = 46
      const pedalBoxX = width - pedalBoxW - 12
      const pedalBoxY = keyboardY - pedalBoxH - 8

      if (width > 340) {
        ctx.save()
        ctx.fillStyle = curTheme === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(12, 16, 28, 0.92)'
        ctx.strokeStyle = curPedal > 30 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.roundRect(pedalBoxX, pedalBoxY, pedalBoxW, pedalBoxH, 10)
        ctx.fill()
        ctx.stroke()

        const damperDip = curPedal > 30 ? 5 : 0
        const pedalDefs = [
          { name: 'Soft', dip: 0, xOffset: 20 },
          { name: 'Sost', dip: 0, xOffset: 55 },
          { name: 'Damper', dip: damperDip, xOffset: 90, active: curPedal > 30 },
        ]

        pedalDefs.forEach((p) => {
          const px = pedalBoxX + p.xOffset
          const py = pedalBoxY + 8 + p.dip
          ctx.save()
          if (p.active) {
            const brassGrad = ctx.createLinearGradient(px - 7, py, px + 7, py + 24)
            brassGrad.addColorStop(0, '#fef08a')
            brassGrad.addColorStop(0.4, '#f59e0b')
            brassGrad.addColorStop(1, '#b45309')
            ctx.fillStyle = brassGrad
            ctx.shadowColor = 'rgba(245, 158, 11, 0.9)'
            ctx.shadowBlur = 12
          } else {
            const chromeGrad = ctx.createLinearGradient(px - 7, py, px + 7, py + 24)
            chromeGrad.addColorStop(0, '#a1a1aa')
            chromeGrad.addColorStop(0.6, '#52525b')
            chromeGrad.addColorStop(1, '#27272a')
            ctx.fillStyle = chromeGrad
          }

          ctx.beginPath()
          ctx.roundRect(px - 7, py, 14, 22, 3)
          ctx.fill()
          ctx.restore()
        })

        ctx.fillStyle = curPedal > 30 ? '#f59e0b' : '#71717a'
        ctx.font = 'bold 8.5px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          curPedal > 30 ? 'DAMPER: HOLD' : 'PEDAL: RELEASE',
          pedalBoxX + pedalBoxW / 2,
          pedalBoxY + pedalBoxH - 4
        )
        ctx.restore()
      }

      ctx.restore()
      animId = requestAnimationFrame(render)
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
    const x = clientX - rect.left
    const y = clientY - rect.top

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    const whiteKeyWidth = width / totalWhite
    const blackKeyWidth = whiteKeyWidth * 0.64
    const keyboardHeight = Math.min(108, Math.max(70, height * 0.19))
    const keyboardY = height - keyboardHeight
    const blackKeyHeight = keyboardHeight * 0.62

    // Clicked on pedal widget?
    const pedalBoxW = 110
    const pedalBoxH = 46
    const pedalBoxX = width - pedalBoxW - 12
    const pedalBoxY = keyboardY - pedalBoxH - 8
    if (x >= pedalBoxX && x <= pedalBoxX + pedalBoxW && y >= pedalBoxY && y <= pedalBoxY + pedalBoxH) {
      return { type: 'pedal' }
    }

    if (y < keyboardY) return null

    // Check black keys first
    for (const bk of blackKeys) {
      const bx = (bk.whiteIndexBefore + 1) * whiteKeyWidth - blackKeyWidth / 2
      if (x >= bx && x <= bx + blackKeyWidth && y >= keyboardY && y <= keyboardY + blackKeyHeight) {
        return { type: 'key', midi: bk.midi }
      }
    }

    // Check white keys
    for (const wk of whiteKeys) {
      const wx = wk.index * whiteKeyWidth
      if (x >= wx && x <= wx + whiteKeyWidth && y >= keyboardY && y <= height) {
        return { type: 'key', midi: wk.midi }
      }
    }

    return null
  }

  const onKeyStart = (pointerId: number, midi: number) => {
    activeTouchMapRef.current.set(pointerId, midi)
    PianoAudioEngine.getInstance().noteOn(midi, 95)
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})

    setPressedKeys((prev) => new Set(prev).add(midi))
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
        PianoAudioEngine.getInstance().noteOff(midi)
        setPressedKeys((prev) => {
          const next = new Set(prev)
          next.delete(midi)
          return next
        })
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
}
