import React, { useState } from 'react'
import { coursesData, type Course } from '../data/courses'
import type { LanguageCode } from '../i18n/translations'
import type { PracticeVariant } from '../types/music'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  Sparkles,
  GraduationCap,
  RotateCcw,
  Eye,
} from 'lucide-react'

interface CoursesViewProps {
  language: LanguageCode
  onSelectCourseLesson: (pieceId: string, variant?: PracticeVariant) => void
  onOpenSightReading: () => void
  onOpenWarmups?: () => void
  onOpenTutorials?: () => void
}

const STORAGE_KEY = 'virtuoso_course_progress_v1'

export const CoursesView: React.FC<CoursesViewProps> = ({
  language,
  onSelectCourseLesson,
  onOpenSightReading,
  onOpenWarmups: _onOpenWarmups,
  onOpenTutorials: _onOpenTutorials,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)

  // Real Persistent Progress Map: { [lessonId: string]: boolean }
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const toggleLessonComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = { ...prev, [lessonId]: !prev[lessonId] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const markAllLessonsComplete = (course: Course) => {
    setCompletedLessons((prev) => {
      const next = { ...prev }
      course.lessons.forEach((l) => (next[l.id] = true))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetCourseProgress = (course: Course) => {
    setCompletedLessons((prev) => {
      const next = { ...prev }
      course.lessons.forEach((l) => delete next[l.id])
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  // Calculate real accurate progress percent for a course
  const getCourseProgress = (course: Course) => {
    if (!course.lessons || course.lessons.length === 0) return 0
    const done = course.lessons.filter((l) => !!completedLessons[l.id]).length
    return Math.round((done / course.lessons.length) * 100)
  }

  // Total stats across all courses
  const totalLessons = coursesData.reduce((acc, c) => acc + c.lessons.length, 0)
  const completedTotal = Object.values(completedLessons).filter(Boolean).length
  const overallPercent = Math.min(100, Math.round((completedTotal / (totalLessons || 1)) * 100))

  // Circular progress ring SVG helper
  const renderProgressRing = (percent: number, size = 48, strokeWidth = 4) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percent / 100) * circumference

    return (
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={percent === 100 ? '#10b981' : '#ff7a00'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute font-mono text-[11px] font-bold text-zinc-100">
          {percent === 100 ? <Check className="w-4 h-4 text-emerald-400" /> : `${percent}%`}
        </span>
      </div>
    )
  }

  // Detail View for a selected Course
  if (selectedCourse) {
    const title = selectedCourse.title[language] || selectedCourse.title.en
    const subtitle = selectedCourse.subtitle[language] || selectedCourse.subtitle.en
    const progress = getCourseProgress(selectedCourse)
    const nextLesson = selectedCourse.lessons.find((l) => !completedLessons[l.id]) || selectedCourse.lessons[0]

    return (
      <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 flex flex-col overflow-y-auto select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pr-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-6 max-w-5xl mx-auto pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))] animate-in fade-in duration-200">
        {/* Back Button & Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{language === 'de' ? 'Zurück zu allen Kursen' : 'All Courses'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllLessonsComplete(selectedCourse)}
              className="text-[11px] font-semibold text-zinc-400 hover:text-emerald-400 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 transition-colors"
            >
              {language === 'de' ? 'Alle abschließen' : 'Mark all done'}
            </button>
            <button
              onClick={() => resetCourseProgress(selectedCourse)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-red-400 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 transition-colors"
              title="Reset progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden mb-8">
          <div className="space-y-2.5 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {selectedCourse.lessons.length} {language === 'de' ? 'Lektionen' : 'Lessons'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{subtitle}</p>
          </div>

          <div className="flex items-center gap-5 z-10 w-full sm:w-auto justify-between sm:justify-start">
            {renderProgressRing(progress, 64, 5)}
            <button
              onClick={() => {
                if (nextLesson) {
                  onSelectCourseLesson(nextLesson.targetPieceId, nextLesson.practiceVariant)
                }
              }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-[0_0_24px_rgba(249,115,22,0.4)] active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{progress > 0 ? (language === 'de' ? 'Weiterlernen' : 'Continue') : (language === 'de' ? 'Kurs starten' : 'Start Course')}</span>
            </button>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 px-1 mb-2">
            {language === 'de' ? 'Lektionen-Übersicht & Aufgaben' : 'Curriculum & Interactive Practice'}
          </h2>

          {selectedCourse.lessons.map((lesson) => {
            const lTitle = lesson.title[language] || lesson.title.en
            const isDone = !!completedLessons[lesson.id]
            const lDesc = lesson.description ? (lesson.description[language] || lesson.description.en) : null
            const isExpanded = expandedLessonId === lesson.id

            return (
              <div
                key={lesson.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col gap-3 ${
                  isDone
                    ? 'bg-zinc-950/70 border-emerald-500/30'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-white/5 hover:border-amber-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <button
                      onClick={() => toggleLessonComplete(lesson.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 border transition-all active:scale-95 ${
                        isDone
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-zinc-800 border-white/10 text-zinc-400 hover:border-amber-400'
                      }`}
                      title="Click to toggle lesson completion"
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : lesson.number}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <h3 className={`text-sm sm:text-base font-bold transition-colors truncate ${isDone ? 'text-zinc-300 line-through' : 'text-white'}`}>
                        {lTitle}
                      </h3>
                      {lDesc && <p className="text-xs text-zinc-400 leading-snug">{lDesc}</p>}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>{lesson.durationMin} Min.</span>
                        <span>•</span>
                        <span className="capitalize">{lesson.practiceVariant || 'Original'}</span>
                        {isDone && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">Abgeschlossen</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isExpanded
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Show detailed theory guide & memory aids"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isExpanded ? (language === 'de' ? 'Schließen' : 'Close') : (language === 'de' ? 'Theorie & Hilfe' : 'Theory & Help')}</span>
                    </button>

                    <button
                      onClick={() => toggleLessonComplete(lesson.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 border-white/10 text-zinc-400'
                      }`}
                    >
                      {isDone ? 'Erledigt' : 'Als erledigt markieren'}
                    </button>

                    <button
                      onClick={() => {
                        onSelectCourseLesson(lesson.targetPieceId, lesson.practiceVariant)
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Üben</span>
                    </button>
                  </div>
                </div>

                {/* Expanded In-Depth Theory & Visual Memory Aid */}
                {isExpanded && (
                  <div className="mt-2 p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between text-amber-400 font-bold uppercase tracking-wider text-[11px] border-b border-white/10 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {language === 'de' ? 'Visueller Spickzettel & Noten-Kompass' : 'Visual Cheat-Sheet & Sight-Reading Compass'}
                      </span>
                      <span className="text-zinc-500 font-mono">Lektion {lesson.number}</span>
                    </div>

                    {/* Lesson 1: Keyboard Geography & Finding Middle C */}
                    {lesson.number === 1 && (
                      <div className="space-y-2.5 text-zinc-300">
                        <p className="leading-relaxed">
                          <strong className="text-white">Das Geheimnis der Klaviatur:</strong> Schau auf die schwarzen Tasten deines Klaviers. Du siehst immer abwechselnd Gruppen aus <strong>2 schwarzen Tasten</strong> und <strong>3 schwarzen Tasten</strong>.
                        </p>
                        <div className="p-3 bg-zinc-900/90 rounded-xl font-mono text-[11px] border border-white/10 flex flex-col gap-1 text-center">
                          <div className="text-amber-400 font-bold">2er Gruppe: [ C# | D# ] &nbsp;&nbsp;&nbsp;&nbsp; 3er Gruppe: [ F# | G# | A# ]</div>
                          <div className="text-zinc-400">| C | D | E | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | F | G | A | B |</div>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-300">
                          <li><strong>C finden:</strong> Die weiße Taste direkt links neben den 2 schwarzen Tasten ist IMMER das C!</li>
                          <li><strong>Schloss-C (Middle C / C4):</strong> Das C genau in der Mitte deines Klaviers (meist direkt unter dem Markenlogo des Herstellers).</li>
                          <li><strong>D („Doghouse“):</strong> Wohnt in der Hundehütte zwischen den 2 schwarzen Tasten.</li>
                          <li><strong>E:</strong> Liegt rechts an der Außenseite der 2 schwarzen Tasten.</li>
                        </ul>
                      </div>
                    )}

                    {/* Lesson 2: Treble Clef */}
                    {lesson.number === 2 && (
                      <div className="space-y-2.5 text-zinc-300">
                        <p className="leading-relaxed">
                          <strong className="text-white">Violinschlüssel (G-Schlüssel):</strong> Gilt für die rechte Hand (höhere Töne). Sein innerer Kringel kreist genau um die 2. Linie von unten (die Note G4)!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 space-y-1">
                            <span className="font-bold text-amber-400">Die 5 Linien (von unten nach oben):</span>
                            <div className="font-mono text-white">E - G - B - D - F</div>
                            <div className="text-zinc-400 italic">„Eine Gans Brät Der Fuchs“ / „Every Good Boy Does Fine“</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 space-y-1">
                            <span className="font-bold text-emerald-400">Die 4 Zwischenräume:</span>
                            <div className="font-mono text-white">F - A - C - E</div>
                            <div className="text-zinc-400 italic">Ergibt das englische Wort „FACE“ (Gesicht)!</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lesson 3: Bass Clef */}
                    {lesson.number === 3 && (
                      <div className="space-y-2.5 text-zinc-300">
                        <p className="leading-relaxed">
                          <strong className="text-white">Bassschlüssel (F-Schlüssel):</strong> Gilt für die linke Hand (tiefe Begleitungen und Bassfundamente). Die beiden Punkte umrahmen die 4. Linie von unten (die Note F3)!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 space-y-1">
                            <span className="font-bold text-amber-400">Die 5 Linien (von unten nach oben):</span>
                            <div className="font-mono text-white">G - B - D - F - A</div>
                            <div className="text-zinc-400 italic">„Guten Tag Des Abends“ / „Good Boys Do Fine Always“</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 space-y-1">
                            <span className="font-bold text-emerald-400">Die 4 Zwischenräume:</span>
                            <div className="font-mono text-white">A - C - E - G</div>
                            <div className="text-zinc-400 italic">„Alle Clowns Essen Gern“ / „All Cows Eat Grass“</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lesson 4: Middle C Bridge */}
                    {lesson.number === 4 && (
                      <div className="space-y-2 text-zinc-300">
                        <p className="leading-relaxed">
                          <strong className="text-white">Das Schloss-C verbindet beide Welten:</strong> Das Notensystem hat 10 Linien (5 oben im Violinschlüssel, 5 unten im Bassschlüssel). Dazwischen liegt eine unsichtbare 11. Linie: Das Schloss-C!
                        </p>
                        <p className="leading-relaxed text-zinc-400">
                          Wenn Schloss-C für die rechte Hand notiert ist, schwebt es auf einer kleinen Hilfslinie <em>unter</em> dem oberen System. Wenn es für die linke Hand notiert ist, schwebt es auf einer Hilfslinie <em>über</em> dem Basssystem. Es ist dieselbe Taste!
                        </p>
                      </div>
                    )}

                    {/* Lesson 5+: Rhythms, Accidentals, Intervals */}
                    {lesson.number >= 5 && (
                      <div className="space-y-2 text-zinc-300">
                        <p className="leading-relaxed">
                          <strong className="text-white">Profi-Regel:</strong> Lies Musik niemals als einzelne Buchstaben, sondern erfasse <strong>Abstände (Intervalle)</strong> und Formen! Linie zu Zwischenraum = Schritt (2te). Linie zu Linie = Sprung (3te).
                        </p>
                        <p className="text-zinc-400">
                          Schau niemals auf deine Hände herunter. Lass deine Finger die Kanten der schwarzen Tasten ertasten und halte deine Augen immer einen Takt voraus auf den Noten!
                        </p>
                      </div>
                    )}

                    {/* Quick interactive trainer launch shortcut */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={onOpenSightReading}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 transition-all text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Im Notenlese-Trainer üben</span>
                      </button>

                      <button
                        onClick={() => onSelectCourseLesson(lesson.targetPieceId, lesson.practiceVariant)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black flex items-center gap-1.5 transition-all text-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Lektion am Klavier starten</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Filter courses by category
  const filteredCourses = coursesData.filter((c) => {
    if (selectedCategory === 'all') return true
    return c.category === selectedCategory
  })

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 overflow-y-auto select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pr-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-6 space-y-8 max-w-6xl mx-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))]">
      {/* Flagship Banner: Interactive Sight-Reading & Note Reading Masterclass */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-zinc-950 border border-emerald-500/30 p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'Vom-Blatt-Lese Trainer' : 'Sight-Reading Trainer'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {language === 'de' ? 'Interaktiver Notenlese-Trainer' : 'Interactive Note Reading Trainer'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300">
            {language === 'de'
              ? 'Lerne Notenlesen von Grund auf mit Sofort-Feedback über dein Mikrofon oder MIDI-Keyboard!'
              : 'Master treble & bass clefs with instant real-time microphone or MIDI keyboard evaluation!'}
          </p>
        </div>

        <button
          onClick={onOpenSightReading}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex-shrink-0"
        >
          <Eye className="w-4 h-4" />
          <span>{language === 'de' ? 'Trainer starten' : 'Launch Trainer'}</span>
        </button>
      </div>

      {/* Header & Global Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-amber-500" />
            <span>{language === 'de' ? 'Klavier-Akademie & Kurse' : 'Piano Academy & Courses'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {language === 'de'
              ? 'Didaktisch strukturierte Kurse: Von der ersten Note bis zur Konzertreife.'
              : 'Structured masterclasses: From your first note to concert mastery.'}
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-4 shadow-sm self-start sm:self-center">
          {renderProgressRing(overallPercent, 44, 4)}
          <div>
            <div className="text-xs font-bold text-white">Gesamtfortschritt</div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {completedTotal} / {totalLessons} Lektionen
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: language === 'de' ? 'Alle Kurse' : 'All Courses' },
          { id: 'beginner', label: language === 'de' ? 'Anfänger & Notenlesen' : 'Beginner & Notes' },
          { id: 'technique', label: language === 'de' ? 'Fingersatz & Hanon' : 'Technique & Hanon' },
          { id: 'scales', label: language === 'de' ? 'Tonleitern' : 'Scales' },
          { id: 'chords', label: language === 'de' ? 'Akkorde' : 'Chords' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === tab.id
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-extrabold'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const title = course.title[language] || course.title.en
          const subtitle = course.subtitle[language] || course.subtitle.en
          const progress = getCourseProgress(course)
          const isNoteCourse = course.id === 'course-complete-note-reading-from-zero'

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className={`p-6 rounded-3xl bg-zinc-900/70 hover:bg-zinc-900 border transition-all cursor-pointer flex flex-col justify-between group shadow-lg active:scale-[0.99] relative overflow-hidden ${
                isNoteCourse ? 'border-emerald-500/50 shadow-[0_4px_24px_rgba(16,185,129,0.15)]' : 'border-white/10 hover:border-amber-500/40'
              }`}
            >
              {isNoteCourse && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] font-black uppercase">
                  Flaggschiff
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${course.coverGradient} flex items-center justify-center text-white shadow-md`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {renderProgressRing(progress, 44, 3.5)}
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors leading-tight">
                    {title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-medium">
                <span>{course.lessons.length} {language === 'de' ? 'Lektionen' : 'Lessons'}</span>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                  <span>{progress === 100 ? 'Wiederholen' : progress > 0 ? 'Fortsetzen' : 'Starten'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
