import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { Piece, PracticeVariant, MidiInputState, NoteEvent } from './types/music'
import type { MasterEditionId, LibraryPieceSummary } from './types/edition'
import { LibraryRepository } from './library/LibraryRepository'
import { PracticeVariantEngine } from './engine/PracticeVariantEngine'
import { PianoAudioEngine } from './audio/PianoAudioEngine'
import { MidiManager } from './midi/MidiManager'
import { FlowkeyPlayerView } from './components/FlowkeyPlayerView'
import { FlowkeyHomeView } from './components/FlowkeyHomeView'
import { FlowkeyTabBar, type TabId } from './components/FlowkeyTabBar'
import { CoursesView } from './components/CoursesView'
import { NoteReadingTrainer } from './components/NoteReadingTrainer'
import { RolandLX9Modal } from './components/RolandLX9Modal'
import { ImportModal } from './components/ImportModal'
import { LibraryModal } from './components/LibraryModal'
import { WarmupsModal } from './components/WarmupsModal'
import { AudioSettingsModal } from './components/AudioSettingsModal'
import { TutorialsView } from './components/TutorialsView'
import { CompetitionReportModal, type CompetitionResults, type CompetitionMistake } from './components/CompetitionReportModal'
import { ConcertLoadingScreen } from './components/ConcertLoadingScreen'
import { SongStorageManager } from './library/SongStorageManager'
import { ScoreEngine } from './engine/ScoreEngine'
import { AcousticNoteRecognizer } from './engine/AcousticNoteRecognizer'
import { translations, type LanguageCode } from './i18n/translations'
import {
  Volume2,
  VolumeX,
  Bluetooth,
  Music2,
  BookOpen,
  X,
  Sliders,
  Flame,
  GraduationCap,
} from 'lucide-react'

export function App() {
  // Navigation Tabs: 'songs' | 'search' | 'mySongs' | 'courses' | 'player'
  const [activeTab, setActiveTab] = useState<TabId>('songs')

  // Localization & Piece State (Default to Beethoven: Für Elise matching Screenshot 1)
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [currentPieceId, setCurrentPieceId] = useState<string>('beethoven-fur-elise')
  const [edition, setEdition] = useState<MasterEditionId>('urtext')

  // Dynamic piece data loaded from LibraryRepository / ScoreEngine
  const [piece, setPiece] = useState<Piece | null>(null)
  const [loadingPieceSummary, setLoadingPieceSummary] = useState<LibraryPieceSummary | null>(null)

  // Practice, Competition & Playback states
  const [practiceVariant, setPracticeVariant] = useState<PracticeVariant>('original')
  const [handMode, setHandMode] = useState<'both' | 'right' | 'left'>('both')
  const [playMode, setPlayMode] = useState<'flow' | 'practice' | 'competition'>('practice')
  const [showHands, setShowHands] = useState<boolean>(true)
  const [currentTime, setCurrentTime] = useState<number>(0.0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Competition Exam Evaluation state
  const [competitionScore, setCompetitionScore] = useState<number>(0)
  const [competitionCombo, setCompetitionCombo] = useState<number>(0)
  const [competitionLastJudgment, setCompetitionLastJudgment] = useState<{ text: string; color: string; offsetMs?: number } | null>(null)
  const [isCompetitionReportOpen, setIsCompetitionReportOpen] = useState<boolean>(false)
  const [competitionResults, setCompetitionResults] = useState<CompetitionResults | null>(null)

  const competitionScoreRef = useRef<number>(0)
  const competitionComboRef = useRef<number>(0)
  const competitionMaxComboRef = useRef<number>(0)
  const competitionMistakesRef = useRef<CompetitionMistake[]>([])
  const competitionHitsCountRef = useRef<number>(0)
  const competitionMissesCountRef = useRef<number>(0)
  const competitionExtraNotesCountRef = useRef<number>(0)
  const competitionTimingErrorsRef = useRef<number[]>([])
  const processedNoteIdsRef = useRef<Set<string>>(new Set())

  // Adaptive Performance Buffer (empowers playing faster than tempo without getting stuck)
  const performanceBufferRef = useRef<{ midi: number; timestampMs: number; velocity: number; matched: boolean }[]>([])

  // Looping controls
  const [isLooping, setIsLooping] = useState<boolean>(false)
  const [loopRange, setLoopRange] = useState<[number, number]>([1, 4])

  // Hardware MIDI State
  const [midiState, setMidiState] = useState<MidiInputState>(MidiManager.getInstance().getState())
  const [wrongNoteMidi, setWrongNoteMidi] = useState<number | null>(null)

  // Metronome & Speed Ramp state
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false)
  const [isSpeedRamp, setIsSpeedRamp] = useState<boolean>(false)
  const [accuracyPercent, setAccuracyPercent] = useState<number>(100)
  const lastMetronomeBeatRef = useRef<number>(-1)
  const notesHitCountRef = useRef<number>(0)
  const notesWrongCountRef = useRef<number>(0)

  // Real-time input tracking for Wait Mode from all input sources (on-screen keyboard, MIDI)
  const screenActiveNotesRef = useRef<Set<number>>(new Set())
  const expectedWaitMidisRef = useRef<number[]>([])

  // Modals
  const [isRolandModalOpen, setIsRolandModalOpen] = useState<boolean>(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState<boolean>(false)
  const [isWarmupsModalOpen, setIsWarmupsModalOpen] = useState<boolean>(false)
  const [isSightReadingOpen, setIsSightReadingOpen] = useState<boolean>(false)
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState<boolean>(false)
  const [isTutorialsOpen, setIsTutorialsOpen] = useState<boolean>(false)

  const t = translations[language]

  // Load piece dynamically based on pieceId and edition
  useEffect(() => {
    LibraryRepository.loadPiece(currentPieceId, edition).then((loadedPiece) => {
      setPiece(loadedPiece)
      setCurrentTime(0)
      setIsPlaying(false)
    })
  }, [currentPieceId, edition])

  // Transformed notes based on practice variant (e.g. right hand only, left hand only)
  const activePiece = useMemo<Piece | null>(() => {
    if (!piece) return null
    const transformedNotes = PracticeVariantEngine.transformNotes(piece.notes, practiceVariant)
    return {
      ...piece,
      notes: transformedNotes,
    }
  }, [piece, practiceVariant])

  const currentTimeRef = useRef<number>(0)
  const nextNoteIndexRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(performance.now())

  const isWaitMode = playMode === 'practice'
  const setIsWaitMode = useCallback((val: boolean) => setPlayMode(val ? 'practice' : 'flow'), [])
  const isWaitModeRef = useRef<boolean>(isWaitMode)
  isWaitModeRef.current = isWaitMode
  const playModeRef = useRef<'flow' | 'practice' | 'competition'>(playMode)
  playModeRef.current = playMode

  // Fast stable refs to prevent listener teardown and recreation during 120 FPS playback
  const activePieceRef = useRef<Piece | null>(null)
  activePieceRef.current = activePiece
  const activeTabRef = useRef<TabId>(activeTab)
  activeTabRef.current = activeTab
  const handModeRef = useRef<'both' | 'right' | 'left'>(handMode)
  handModeRef.current = handMode
  const hitWaitNotesRef = useRef<Set<number>>(new Set())
  const manualPedalDepthRef = useRef<number>(0)

  // Stop all ringing voices and jump playback cursor to target time & index
  const resetPlaybackToIndex = useCallback((targetTime: number, notes: typeof activePiece extends null ? [] : NonNullable<typeof activePiece>['notes']) => {
    currentTimeRef.current = targetTime
    PianoAudioEngine.getInstance().stopAllVoices()
    hitWaitNotesRef.current.clear()
    expectedWaitMidisRef.current = []
    AcousticNoteRecognizer.getInstance().clearTargetNotes()
    performanceBufferRef.current = []
    lastMetronomeBeatRef.current = -1
    processedNoteIdsRef.current.clear()

    competitionScoreRef.current = 0
    competitionComboRef.current = 0
    competitionMaxComboRef.current = 0
    competitionHitsCountRef.current = 0
    competitionMissesCountRef.current = 0
    competitionExtraNotesCountRef.current = 0
    competitionTimingErrorsRef.current = []
    competitionMistakesRef.current = []
    setCompetitionScore(0)
    setCompetitionCombo(0)
    setCompetitionLastJudgment(null)

    let idx = 0
    while (idx < notes.length && notes[idx].startTime < targetTime) {
      idx++
    }
    nextNoteIndexRef.current = idx
  }, [])

  // Calculate upcoming expected notes for Wait-for-Note Mode target highlight
  const expectedNotes = useMemo<number[]>(() => {
    if (!isWaitMode || !activePiece) return []
    if (expectedWaitMidisRef.current.length > 0) {
      return [...expectedWaitMidisRef.current]
    }
    const notesAtCurrentTime = activePiece.notes.filter(
      (n) => n.startTime >= currentTime - 0.08 && n.startTime <= currentTime + 0.18
    )
    const filteredByHand = notesAtCurrentTime.filter((n) => {
      if (handMode === 'right') return n.hand === 'right'
      if (handMode === 'left') return n.hand === 'left'
      return true
    })
    return filteredByHand.map((n) => n.midi)
  }, [isWaitMode, activePiece, currentTime, handMode])

  const triggerWrongNoteAlert = useCallback((midi: number) => {
    setWrongNoteMidi(midi)
    notesWrongCountRef.current++
    const total = notesHitCountRef.current + notesWrongCountRef.current
    if (total > 0) {
      setAccuracyPercent(Math.max(0, Math.min(100, Math.round((notesHitCountRef.current / total) * 100))))
    }
    setTimeout(() => {
      setWrongNoteMidi(null)
    }, 1200)
  }, [])

  // Unified Performance Note Handler (used by Roland USB-C MIDI and on-screen keyboard)
  const handlePerformanceNoteInput = useCallback((midi: number, velocity: number = 80) => {
    PianoAudioEngine.getInstance().noteOn(midi, velocity)
    hitWaitNotesRef.current.add(midi)

    const now = performance.now()
    performanceBufferRef.current.push({
      midi,
      timestampMs: now,
      velocity,
      matched: false,
    })
    performanceBufferRef.current = performanceBufferRef.current.filter((e) => now - e.timestampMs < 3000)

    const currentPiece = activePieceRef.current
    const currentPlayMode = playModeRef.current
    const curTime = currentTimeRef.current
    const currentHand = handModeRef.current

    if (!currentPiece || activeTabRef.current !== 'player') return

    // 1. PRACTICE MODE (Adaptive Elastic Performance Follower)
    if (currentPlayMode === 'practice') {
      const currentExpected = expectedWaitMidisRef.current
      if (currentExpected.length > 0 && !currentExpected.includes(midi)) {
        // Multi-chord lookahead: check if this note is part of upcoming chords (next 20 notes)
        const lookaheadNotes = currentPiece.notes.slice(
          nextNoteIndexRef.current,
          nextNoteIndexRef.current + 20
        ).filter((n) => {
          if (currentHand === 'right') return n.hand === 'right'
          if (currentHand === 'left') return n.hand === 'left'
          return true
        })
        const isUpcomingValidNote = lookaheadNotes.some((n) => n.midi === midi)

        if (!isUpcomingValidNote) {
          triggerWrongNoteAlert(midi)
        }
      }
      return
    }

    // 2. COMPETITION MODE (Real-time Evaluated Exam)
    if (currentPlayMode === 'competition') {
      const eligibleNotes = currentPiece.notes.filter((n) => {
        if (processedNoteIdsRef.current.has(n.id)) return false
        if (currentHand === 'right' && n.hand !== 'right') return false
        if (currentHand === 'left' && n.hand !== 'left') return false
        return Math.abs(n.startTime - curTime) < 0.22
      })

      const matchedNote = eligibleNotes.find((n) => n.midi === midi)

      if (matchedNote) {
        processedNoteIdsRef.current.add(matchedNote.id)
        const offsetMs = Math.round((curTime - matchedNote.startTime) * 1000)
        competitionTimingErrorsRef.current.push(Math.abs(offsetMs))
        competitionHitsCountRef.current++

        competitionComboRef.current++
        competitionMaxComboRef.current = Math.max(
          competitionMaxComboRef.current,
          competitionComboRef.current
        )

        const mult = competitionComboRef.current >= 40 ? 4 : competitionComboRef.current >= 20 ? 3 : competitionComboRef.current >= 10 ? 2 : 1
        const basePts = Math.abs(offsetMs) <= 30 ? 1000 : Math.abs(offsetMs) <= 70 ? 750 : Math.abs(offsetMs) <= 130 ? 450 : 200
        competitionScoreRef.current += basePts * mult

        setCompetitionScore(competitionScoreRef.current)
        setCompetitionCombo(competitionComboRef.current)

        const text = Math.abs(offsetMs) <= 30 ? 'CRITICAL PERFECT!' : Math.abs(offsetMs) <= 70 ? 'PERFECT' : offsetMs < -70 ? 'EARLY' : 'LATE'
        const color = Math.abs(offsetMs) <= 30 ? 'text-amber-400' : Math.abs(offsetMs) <= 70 ? 'text-emerald-400' : 'text-sky-400'
        setCompetitionLastJudgment({ text, color, offsetMs })
      } else {
        competitionExtraNotesCountRef.current++
        competitionComboRef.current = 0
        competitionScoreRef.current = Math.max(0, competitionScoreRef.current - 150)

        const mNum = Math.max(1, Math.floor(curTime / (60 / (currentPiece.tempoBpm || 100) * 4)) + 1)
        competitionMistakesRef.current.push({
          id: `extra-${Date.now()}-${Math.random()}`,
          measure: mNum,
          beat: 1,
          timestampSec: Math.round(curTime * 10) / 10,
          type: 'wrong-key',
          playedNoteName: ScoreEngine.midiToNoteName(midi),
          description: `Extra / wrong note ${ScoreEngine.midiToNoteName(midi)} struck unexpectedly`,
        })

        setCompetitionScore(competitionScoreRef.current)
        setCompetitionCombo(0)
        setCompetitionLastJudgment({ text: 'EXTRA KEY (-150)', color: 'text-rose-400' })
      }
    }
  }, [triggerWrongNoteAlert])

  const finishCompetition = useCallback(() => {
    setIsPlaying(false)
    const currentPiece = activePieceRef.current
    const totalScoreNotes = currentPiece ? currentPiece.notes.length : 1
    const hits = competitionHitsCountRef.current
    const misses = competitionMissesCountRef.current
    const extras = competitionExtraNotesCountRef.current
    const totalAttempts = hits + misses + extras
    const acc = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0

    const avgTiming = competitionTimingErrorsRef.current.length > 0
      ? Math.round(competitionTimingErrorsRef.current.reduce((a, b) => a + b, 0) / competitionTimingErrorsRef.current.length)
      : 24

    const grade: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' =
      acc >= 98 && avgTiming <= 30 && extras === 0 ? 'S+' :
      acc >= 93 && avgTiming <= 45 ? 'S' :
      acc >= 85 ? 'A' :
      acc >= 75 ? 'B' :
      acc >= 60 ? 'C' : 'D'

    const measureMistakeCounts: Record<number, number> = {}
    competitionMistakesRef.current.forEach((m) => {
      measureMistakeCounts[m.measure] = (measureMistakeCounts[m.measure] || 0) + 1
    })
    let worstMeasure = 1
    let maxErrors = 0
    Object.entries(measureMistakeCounts).forEach(([mStr, count]) => {
      if (count > maxErrors) {
        maxErrors = count
        worstMeasure = parseInt(mStr, 10)
      }
    })
    const maxMeasure = currentPiece?.sections?.[0]?.endMeasure || 16
    const problemRange: [number, number] = [
      Math.max(1, worstMeasure - 1),
      Math.min(maxMeasure, worstMeasure + 2)
    ]

    const res: CompetitionResults = {
      score: competitionScoreRef.current,
      maxPossibleScore: 100000,
      maxCombo: competitionMaxComboRef.current,
      totalNotes: totalScoreNotes,
      notesHit: hits,
      notesMissed: misses,
      extraNotesCount: extras,
      accuracyPercent: acc,
      averageTimingErrorMs: avgTiming,
      dynamicRatingPercent: Math.min(100, Math.round(acc * 0.95)),
      pedalRatingPercent: 94,
      grade,
      mistakes: [...competitionMistakesRef.current],
      problemMeasures: problemRange,
    }

    setCompetitionResults(res)
    if (currentPiece) {
      SongStorageManager.saveCompetitionScore({
        pieceId: currentPiece.id,
        score: res.score,
        accuracyPercent: acc,
        grade,
        date: new Date().toLocaleDateString(),
        timingErrorMs: avgTiming,
        extraNotesCount: extras,
        missedNotesCount: misses,
      })
    }
    setIsCompetitionReportOpen(true)
  }, [])

  // Global iOS Safari Web Audio unlocker (resumes suspended AudioContext on first touch/click)
  useEffect(() => {
    const unlockAudio = () => {
      PianoAudioEngine.getInstance().unlockAudio().catch(() => {})
    }
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true })
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true })
    window.addEventListener('click', unlockAudio, { once: true, passive: true })
    return () => {
      window.removeEventListener('touchstart', unlockAudio)
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('click', unlockAudio)
    }
  }, [])

  // Subscribe to Roland LX-9 Bluetooth & Web MIDI events
  useEffect(() => {
    const unsubscribe = MidiManager.getInstance().subscribe(
      (midi, velocity) => {
        handlePerformanceNoteInput(midi, velocity)
      },
      (midi) => {
        PianoAudioEngine.getInstance().noteOff(midi)
      },
      (pedalVal) => {
        manualPedalDepthRef.current = pedalVal
        PianoAudioEngine.getInstance().setDamperPedal(pedalVal)
      },
      (updatedState) => {
        setMidiState(updatedState)
      }
    )

    MidiManager.getInstance().connectWebMidi().catch(() => {})

    return () => {
      unsubscribe()
    }
  }, [handlePerformanceNoteInput])

  const handleScreenKeyPress = useCallback((midi: number) => {
    screenActiveNotesRef.current.add(midi)
    handlePerformanceNoteInput(midi, 80)

    setTimeout(() => {
      screenActiveNotesRef.current.delete(midi)
    }, 280)
  }, [handlePerformanceNoteInput])

  const handleTogglePedal = useCallback(() => {
    const curDepth = manualPedalDepthRef.current
    const newDepth = curDepth > 30 ? 0 : 127
    manualPedalDepthRef.current = newDepth
    PianoAudioEngine.getInstance().setDamperPedal(newDepth)
  }, [])

  // Calculate loop time bounds in seconds
  const loopTimeBounds = useMemo<[number, number]>(() => {
    if (!isLooping || !activePiece) return [0, activePiece?.duration || 12]
    const notesInStart = activePiece.notes.filter((n) => n.measure >= loopRange[0])
    const notesInEnd = activePiece.notes.filter((n) => n.measure <= loopRange[1])
    const startSec = notesInStart[0]?.startTime || 0
    const endSec = notesInEnd.length > 0 ? notesInEnd[notesInEnd.length - 1].startTime + 1.8 : activePiece.duration
    return [startSec, endSec]
  }, [isLooping, loopRange, activePiece])

  // Main playback tick loop with hardware-accurate audio timeline scheduling & Wait-for-Note Mode
  useEffect(() => {
    let animId: number

    const tick = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      if (isPlaying && activePiece && activeTab === 'player') {
        const prevTime = currentTimeRef.current
        let nextTime = prevTime + deltaSec * playbackRate

        // 1. PRACTICE MODE (Adaptive Elastic Performance Follower - leaps forward when playing faster!)
        if (playMode === 'practice') {
          let keepCheckingChords = true
          while (keepCheckingChords && nextNoteIndexRef.current < activePiece.notes.length) {
            const upcomingLeader = activePiece.notes[nextNoteIndexRef.current]
            if (upcomingLeader && upcomingLeader.startTime > nextTime + 0.05 && nextNoteIndexRef.current !== 0) {
              break
            }

            // Collect all simultaneous notes in this chord cluster (within 0.05s)
            const chordNotes: NoteEvent[] = []
            let cIdx = nextNoteIndexRef.current
            while (
              cIdx < activePiece.notes.length &&
              Math.abs(activePiece.notes[cIdx].startTime - upcomingLeader.startTime) < 0.05
            ) {
              chordNotes.push(activePiece.notes[cIdx])
              cIdx++
            }

            const targetChordNotes = chordNotes.filter((n) => {
              if (handMode === 'both') return true
              if (handMode === 'right') return n.hand === 'right'
              if (handMode === 'left') return n.hand === 'left'
              return true
            })

            if (targetChordNotes.length > 0) {
              const expectedMidis = targetChordNotes.map((n) => n.midi)
              expectedWaitMidisRef.current = expectedMidis
              AcousticNoteRecognizer.getInstance().setTargetNotes(expectedMidis)

              // Check if all expected midis in this chord have been hit
              const allHit = expectedMidis.every(
                (m) =>
                  midiState.activeNotes.has(m) ||
                  screenActiveNotesRef.current.has(m) ||
                  hitWaitNotesRef.current.has(m) ||
                  performanceBufferRef.current.some((b) => !b.matched && b.midi === m)
              )

              if (!allHit) {
                // Hold and wait for player's fingers!
                keepCheckingChords = false
                animId = requestAnimationFrame(tick)
                return
              }

              // Chord satisfied! Consume matching buffer notes
              expectedMidis.forEach((m) => {
                const bufMatch = performanceBufferRef.current.find((b) => !b.matched && b.midi === m)
                if (bufMatch) bufMatch.matched = true
              })

              notesHitCountRef.current += targetChordNotes.length
              const total = notesHitCountRef.current + notesWrongCountRef.current
              if (total > 0) {
                setAccuracyPercent(Math.max(0, Math.min(100, Math.round((notesHitCountRef.current / total) * 100))))
              }
              hitWaitNotesRef.current.clear()
              expectedWaitMidisRef.current = []
              AcousticNoteRecognizer.getInstance().clearTargetNotes()

              // Elastic forward leap: sync cursor with player's performance
              nextTime = Math.max(nextTime, upcomingLeader.startTime + 0.005)
              nextNoteIndexRef.current = cIdx

              // Schedule accompaniment audio if practicing single hands
              chordNotes.forEach((note) => {
                const isAccompaniment =
                  (handMode === 'right' && note.hand === 'left') ||
                  (handMode === 'left' && note.hand === 'right')
                if (isAccompaniment) {
                  PianoAudioEngine.getInstance().scheduleNote(
                    note.midi,
                    note.velocity || 80,
                    note.duration / playbackRate,
                    0
                  )
                }
              })
              // The while-loop automatically checks the next chord! If the player already played ahead, it leaps again!
            } else {
              nextNoteIndexRef.current = cIdx
            }
          }
        }

        // 2. COMPETITION MODE (Real-time Examination: checks missed notes)
        if (playMode === 'competition') {
          for (let i = 0; i < activePiece.notes.length; i++) {
            const note = activePiece.notes[i]
            if (note.startTime < nextTime - 0.22 && !processedNoteIdsRef.current.has(note.id)) {
              const matchesHand =
                handMode === 'both' ||
                (handMode === 'right' && note.hand === 'right') ||
                (handMode === 'left' && note.hand === 'left')
              if (matchesHand) {
                processedNoteIdsRef.current.add(note.id)
                competitionMissesCountRef.current++
                competitionComboRef.current = 0
                setCompetitionCombo(0)
                competitionMistakesRef.current.push({
                  id: `miss-${note.id}`,
                  measure: note.measure,
                  beat: note.beat || 1,
                  timestampSec: note.startTime,
                  type: 'missed-note',
                  expectedNoteName: note.noteName,
                  description: `Missed note ${note.noteName} (${note.hand} hand)`,
                })
                setCompetitionLastJudgment({ text: 'MISSED', color: 'text-rose-500' })
              }
            }
            if (note.startTime > nextTime) break
          }
        }

        // Metronome Click Timing
        if (isMetronomeOn && activePiece) {
          const beatsPerSec = (activePiece.tempoBpm * playbackRate) / 60
          const currentBeatExact = nextTime * beatsPerSec
          const currentBeatIndex = Math.floor(currentBeatExact)

          if (currentBeatIndex > lastMetronomeBeatRef.current) {
            lastMetronomeBeatRef.current = currentBeatIndex
            const beatsInMeasure = activePiece.timeSignature ? activePiece.timeSignature[0] : 4
            const isDownbeat = currentBeatIndex % beatsInMeasure === 0
            PianoAudioEngine.getInstance().playMetronomeClick(isDownbeat)
          }
        }

        // Loop handling with optional Speed Ramp (+5% on successful loop completion)
        if (isLooping && nextTime >= loopTimeBounds[1]) {
          const loopStart = loopTimeBounds[0]
          resetPlaybackToIndex(loopStart, activePiece.notes)
          setCurrentTime(loopStart)

          if (isSpeedRamp) {
            setPlaybackRate((prevRate) => Math.min(1.25, Math.round((prevRate + 0.05) * 100) / 100))
          }

          animId = requestAnimationFrame(tick)
          return
        }

        // End of piece handling
        if (nextTime >= activePiece.duration) {
          if (playMode === 'competition') {
            finishCompetition()
          } else {
            setIsPlaying(false)
            resetPlaybackToIndex(0, activePiece.notes)
            setCurrentTime(0)
          }
          animId = requestAnimationFrame(tick)
          return
        }

        // Schedule all notes occurring between prevTime and nextTime
        while (
          nextNoteIndexRef.current < activePiece.notes.length &&
          activePiece.notes[nextNoteIndexRef.current].startTime <= nextTime
        ) {
          const note = activePiece.notes[nextNoteIndexRef.current]
          const isAccompaniment =
            (handMode === 'right' && note.hand === 'left') ||
            (handMode === 'left' && note.hand === 'right')
          const shouldPlayAudio = !isWaitMode || isAccompaniment

          if (shouldPlayAudio) {
            const leadTimeSec = Math.max(0, note.startTime - prevTime)
            PianoAudioEngine.getInstance().scheduleNote(
              note.midi,
              note.velocity || 80,
              note.duration / playbackRate,
              leadTimeSec / playbackRate
            )
          }
          nextNoteIndexRef.current++
        }

        // Continuous Damper Pedal Handling: blends recorded Urtext score pedals with live user pedal
        const activePedal = activePiece.pedalEvents.find(
          (pedal) => nextTime >= pedal.startTime && nextTime <= pedal.startTime + pedal.duration
        )
        const scorePedalDepth = activePedal ? activePedal.depth : 0
        const effectivePedal = Math.max(manualPedalDepthRef.current, scorePedalDepth)
        PianoAudioEngine.getInstance().setDamperPedal(effectivePedal)

        currentTimeRef.current = nextTime
        setCurrentTime(nextTime)
      }

      animId = requestAnimationFrame(tick)
    }

    lastTimeRef.current = performance.now()
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [
    isPlaying,
    playbackRate,
    isLooping,
    loopTimeBounds,
    isWaitMode,
    handMode,
    activePiece,
    midiState.activeNotes,
    activeTab,
    resetPlaybackToIndex,
  ])

  const handleTogglePlay = async () => {
    await PianoAudioEngine.getInstance().unlockAudio()
    if (!activePiece) return
    if (!isPlaying && currentTimeRef.current >= activePiece.duration - 0.5) {
      const startTime = isLooping ? loopTimeBounds[0] : 0
      resetPlaybackToIndex(startTime, activePiece.notes)
      setCurrentTime(startTime)
    }
    if (isPlaying) {
      PianoAudioEngine.getInstance().stopAllVoices()
    }
    setIsPlaying(!isPlaying)
  }

  const handleRewind = () => {
    if (!activePiece) return
    const target = isLooping ? loopTimeBounds[0] : 0
    resetPlaybackToIndex(target, activePiece.notes)
    setCurrentTime(target)
  }

  const handleSeek = (time: number) => {
    if (!activePiece) return
    resetPlaybackToIndex(time, activePiece.notes)
    setCurrentTime(time)
  }

  const handleToggleMute = () => {
    PianoAudioEngine.getInstance().toggleMute()
    setIsMuted(!isMuted)
  }

  const handleHandModeChange = useCallback((mode: 'both' | 'right' | 'left') => {
    setHandMode(mode)
    if (mode === 'right') {
      setPracticeVariant('hands-separate-right')
    } else if (mode === 'left') {
      setPracticeVariant('hands-separate-left')
    } else {
      setPracticeVariant('original')
    }
  }, [])

  const handleSelectPieceAndEdition = (
    pieceId: string,
    editionId: MasterEditionId,
    variant?: PracticeVariant,
    loopRangeCustom?: [number, number]
  ) => {
    const summary = LibraryRepository.getCatalog().find((p) => p.id === pieceId)
    if (summary) {
      setLoadingPieceSummary(summary)
    }

    LibraryRepository.loadPiece(pieceId, editionId).then((loadedPiece) => {
      setPiece(loadedPiece)
      setCurrentPieceId(pieceId)
      setEdition(editionId)
      if (variant) {
        setPracticeVariant(variant)
        if (variant === 'hands-separate-right') setHandMode('right')
        else if (variant === 'hands-separate-left') setHandMode('left')
        else setHandMode('both')

        if (variant === 'wait-for-note') setIsWaitMode(true)
        if (variant === 'slow-practice') setPlaybackRate(0.75)
      } else {
        setPracticeVariant('original')
        setHandMode('both')
      }
      if (loopRangeCustom) {
        setLoopRange(loopRangeCustom)
        setIsLooping(true)
      } else {
        setIsLooping(false)
      }
      setCurrentTime(0)
      setIsPlaying(false)
      resetPlaybackToIndex(0, loadedPiece.notes)
      setActiveTab('player')
    })
  }

  const handleSelectCustomPiece = (customPiece: Piece) => {
    SongStorageManager.savePiece(customPiece)
    setPiece(customPiece)
    setCurrentPieceId(customPiece.id)
    setEdition('urtext')
    setCurrentTime(0)
    setIsPlaying(false)
    resetPlaybackToIndex(0, customPiece.notes)
    setActiveTab('player')
  }

  if (!activePiece) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#09090d] text-orange-400 font-mono text-sm">
        Loading Flowkey & Virtuoso Engine...
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#09090d] text-zinc-100 overflow-hidden font-sans select-none relative">
      {/* Top Header Bar (Only visible outside the Player view) */}
      {activeTab !== 'player' && (
        <header className="min-h-14 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pr-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] flex items-center justify-between z-30 select-none pt-[var(--sat)] shadow-md">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('songs')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 via-orange-400 to-amber-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform">
              <Music2 className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
              VIRTUOSO
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-0.5 text-[10px] font-bold">
              {(['en', 'de', 'fr', 'ja', 'zh'] as LanguageCode[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded-lg transition-colors uppercase font-mono ${
                    language === lang
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Library / Catalog */}
            <button
              onClick={() => setIsLibraryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 hover:text-orange-400 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">{t.ui.library}</span>
            </button>

            {/* Warm-Ups */}
            <button
              onClick={() => setIsWarmupsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 hover:text-orange-400 text-xs font-semibold transition-colors"
              title="Pianist Warm-Ups & Finger Drills"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Warm-Ups</span>
            </button>

            {/* Audio Acoustics */}
            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 hover:text-orange-400 text-xs font-semibold transition-colors"
              title="Concert Hall Reverb & Touch Settings"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Acoustics</span>
            </button>

            {/* Roland LX-9 Bluetooth Status */}
            <button
              onClick={() => setIsRolandModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                midiState.isConnected
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bluetooth className={`w-3.5 h-3.5 ${midiState.isConnected ? 'text-blue-400 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {midiState.isConnected ? `Roland (${midiState.damperPedal})` : t.pairPiano}
              </span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'player' ? (
          /* FLOWKEY PLAYER VIEW (Screenshot 1: Overhead 2D Keys, Middle Controls, Engraved Parchment Sheet) */
          <FlowkeyPlayerView
            piece={activePiece}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            handMode={handMode}
            isWaitMode={isWaitMode}
            playMode={playMode}
            onChangePlayMode={setPlayMode}
            competitionScore={competitionScore}
            competitionCombo={competitionCombo}
            competitionLastJudgment={competitionLastJudgment}
            onOpenCompetitionReport={finishCompetition}
            showHands={showHands}
            isLooping={isLooping}
            loopRange={loopRange}
            activeNotes={midiState.activeNotes}
            damperPedal={PianoAudioEngine.getInstance().getPedalDepth() || midiState.damperPedal}
            edition={edition}
            language={language}
            isConnectedLX9={midiState.isConnected}
            wrongNoteMidi={wrongNoteMidi}
            expectedNotes={expectedNotes}
            isMetronomeOn={isMetronomeOn}
            isSpeedRamp={isSpeedRamp}
            accuracyPercent={accuracyPercent}
            onToggleMetronome={() => setIsMetronomeOn((prev) => !prev)}
            onToggleSpeedRamp={() => setIsSpeedRamp((prev) => !prev)}
            onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
            onEditionChange={(newEd) => handleSelectPieceAndEdition(currentPieceId, newEd, practiceVariant, isLooping ? loopRange : undefined)}
            onTogglePlay={handleTogglePlay}
            onRewind={handleRewind}
            onSeek={handleSeek}
            onRateChange={setPlaybackRate}
            onHandModeChange={handleHandModeChange}
            onToggleWaitMode={() => setIsWaitMode(!isWaitMode)}
            onToggleHands={() => setShowHands(!showHands)}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onLoopRangeChange={setLoopRange}
            onOpenBluetoothModal={() => setIsRolandModalOpen(true)}
            onBackToDiscovery={() => setActiveTab('songs')}
            onScreenKeyPress={handleScreenKeyPress}
            onTogglePedal={handleTogglePedal}
          />
        ) : activeTab === 'courses' ? (
          /* FLOWKEY COURSES VIEW (Screenshot 5: Beginner Courses, Scales & Exercises, Chords) */
          <CoursesView
            language={language}
            onSelectCourseLesson={(targetPieceId, variant) => {
              handleSelectPieceAndEdition(targetPieceId, 'urtext', variant)
            }}
            onOpenSightReading={() => setIsSightReadingOpen(true)}
            onOpenWarmups={() => setIsWarmupsModalOpen(true)}
            onOpenTutorials={() => setIsTutorialsOpen(true)}
          />
        ) : (
          /* FLOWKEY DISCOVERY / SONGS VIEW (Screenshot 2: "Für dich empfohlen", "Februar Favoriten", Search) */
          <FlowkeyHomeView
            language={language}
            viewTab={activeTab}
            onSelectPieceAndEdition={handleSelectPieceAndEdition}
            onOpenPlayer={() => setActiveTab('player')}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}
      </main>

      {/* Flowkey Bottom Navigation Bar & Persistent Mini-Player (Hidden when playing full piano) */}
      <FlowkeyTabBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
        }}
        currentPiece={activePiece}
        currentEdition={edition}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        damperPedal={midiState.damperPedal}
        language={language}
      />

      {/* Interactive Sight Reading Note Trainer Modal */}
      {isSightReadingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto w-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-orange-400" />
              <span>{t.sightReading.title}</span>
            </h2>
            <button
              onClick={() => setIsSightReadingOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.ui.close}</span>
            </button>
          </div>
          <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
            <NoteReadingTrainer
              language={language}
            />
          </div>
        </div>
      )}

      {/* Roland LX-9 Bluetooth & Simulator Modal */}
      <RolandLX9Modal
        isOpen={isRolandModalOpen}
        onClose={() => setIsRolandModalOpen(false)}
        isConnected={midiState.isConnected}
        deviceName={midiState.deviceName}
        connectionType={midiState.connectionType}
        damperPedal={midiState.damperPedal}
        latencyMs={midiState.latencyMs}
        language={language}
      />

      {/* Score & MIDI Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSelectPiece={handleSelectCustomPiece}
        language={language}
      />

      {/* Repertoire Library & Master Edition Chooser Modal */}
      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        currentPieceId={currentPieceId}
        currentEdition={edition}
        language={language}
        onSelectPieceAndEdition={(p, ed) => {
          handleSelectPieceAndEdition(p.id, ed)
          setIsLibraryModalOpen(false)
        }}
      />

      {/* Warm-Ups Modal */}
      <WarmupsModal
        isOpen={isWarmupsModalOpen}
        onClose={() => setIsWarmupsModalOpen(false)}
        language={language}
        onSelectWarmupPiece={(warmupPiece) => {
          handleSelectCustomPiece(warmupPiece)
          setIsWarmupsModalOpen(false)
        }}
      />

      {/* Acoustics & Reverb Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        language={language}
      />

      {/* Video Masterclasses / Tutorials Modal */}
      {isTutorialsOpen && activePiece && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-3 max-w-5xl mx-auto w-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-400" />
              <span>Masterclasses & Pedagogy</span>
            </h2>
            <button
              onClick={() => setIsTutorialsOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.ui.close}</span>
            </button>
          </div>
          <div className="flex-1 max-w-5xl mx-auto w-full overflow-hidden">
            <TutorialsView
              piece={activePiece}
              language={language}
              onClose={() => setIsTutorialsOpen(false)}
              onLaunchPracticePassage={(startMeasure, endMeasure, tempoRate) => {
                setIsTutorialsOpen(false)
                setActiveTab('player')
                setIsLooping(true)
                setLoopRange([startMeasure, endMeasure])
                setPlaybackRate(tempoRate)
                setCurrentTime(0)
              }}
              onSwitchToSightReading={() => {
                setIsTutorialsOpen(false)
                setIsSightReadingOpen(true)
              }}
              onSwitchToWarmups={() => {
                setIsTutorialsOpen(false)
                setIsWarmupsModalOpen(true)
              }}
            />
          </div>
        </div>
      )}

      {/* Grand Competition Jury & Mistake Auditor Modal */}
      {activePiece && (
        <CompetitionReportModal
          isOpen={isCompetitionReportOpen}
          onClose={() => setIsCompetitionReportOpen(false)}
          onRetry={() => {
            setIsCompetitionReportOpen(false)
            resetPlaybackToIndex(0, activePiece.notes)
            setCurrentTime(0)
            setIsPlaying(true)
          }}
          onPracticeProblemMeasures={(range) => {
            setIsCompetitionReportOpen(false)
            setLoopRange(range)
            setIsLooping(true)
            setPlayMode('practice')
            const startNote = activePiece.notes.find((n) => n.measure >= range[0])
            const startTime = startNote ? startNote.startTime : 0
            resetPlaybackToIndex(startTime, activePiece.notes)
            setCurrentTime(startTime)
            setIsPlaying(true)
          }}
          results={competitionResults}
          activePiece={activePiece}
          language={language}
        />
      )}
      {/* Concert Masterclass Preloading & Stage Preparation Screen */}
      {loadingPieceSummary && (
        <ConcertLoadingScreen
          pieceSummary={loadingPieceSummary}
          onReady={() => setLoadingPieceSummary(null)}
        />
      )}
    </div>
  )
}

export default App
