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
  Flame,
} from 'lucide-react'

interface CoursesViewProps {
  language: LanguageCode
  onSelectCourseLesson: (pieceId: string, variant?: PracticeVariant) => void
  onOpenSightReading: () => void
  onOpenWarmups?: () => void
  onOpenTutorials?: () => void
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  language,
  onSelectCourseLesson,
  onOpenSightReading,
  onOpenWarmups,
  onOpenTutorials,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

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
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute font-mono text-[11px] font-bold text-zinc-100">
          {percent === 100 ? <Check className="w-4 h-4 text-emerald-400" /> : `${percent}%`}
        </span>
      </div>
    )
  }

  // Localized category titles
  const categoryHeaders = {
    beginner: {
      en: 'Beginner Courses',
      de: 'Anfängerkurse',
      fr: 'Cours pour débutants',
      ja: '初心者向けコース',
      zh: '初级入门课程',
    },
    technique: {
      en: 'Fingering & Hanon Drills',
      de: 'Fingersatz & Hanon-Etüden',
      fr: 'Doigtés et exercices Hanon',
      ja: '運指とハノン練習曲',
      zh: '指法训练与哈农练习',
    },
    scales: {
      en: 'Exercises & Scales',
      de: 'Übungen & Tonleitern',
      fr: 'Exercices et gammes',
      ja: '練習曲と音階',
      zh: '基础练习与音阶专练',
    },
    chords: {
      en: 'Chords & Improvisation',
      de: 'Akkorde & Improvisation',
      fr: 'Accords et improvisation',
      ja: 'コードと即興演奏',
      zh: '和弦伴奏与即兴演奏',
    },
  }

  // If a specific course is selected: Render the Course Detail Screen (Flowkey Screenshots 3 & 4)
  if (selectedCourse) {
    const title = selectedCourse.title[language] || selectedCourse.title.en
    const subtitle = selectedCourse.subtitle[language] || selectedCourse.subtitle.en

    // Next uncompleted lesson or first lesson
    const nextLesson =
      selectedCourse.lessons.find((l) => l.progressPercent < 100) || selectedCourse.lessons[0]

    return (
      <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 flex flex-col overflow-y-auto select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-6 max-w-5xl mx-auto pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))]">
        {/* Back to Courses Button */}
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold mb-6 transition-colors self-start bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>
            {language === 'de'
              ? 'Alle Kurse'
              : language === 'fr'
              ? 'Tous les cours'
              : language === 'ja'
              ? 'すべてのコース'
              : language === 'zh'
              ? '返回所有课程'
              : 'All Courses'}
          </span>
        </button>

        {/* Course Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden mb-8">
          <div className="space-y-2.5 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {selectedCourse.lessons.length}{' '}
                {language === 'de'
                  ? 'Lektionen'
                  : language === 'fr'
                  ? 'Leçons'
                  : language === 'ja'
                  ? 'レッスン'
                  : language === 'zh'
                  ? '课时'
                  : 'Lessons'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{subtitle}</p>
          </div>

          {/* Right Action & Progress Ring */}
          <div className="flex items-center gap-5 z-10 w-full sm:w-auto justify-between sm:justify-start">
            {renderProgressRing(selectedCourse.overallProgress, 64, 5)}
            <button
              onClick={() => {
                if (nextLesson) {
                  onSelectCourseLesson(nextLesson.targetPieceId, nextLesson.practiceVariant)
                }
              }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-[0_0_24px_rgba(249,115,22,0.4)] active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {selectedCourse.overallProgress > 0
                  ? language === 'de'
                    ? 'Weiterlernen'
                    : language === 'fr'
                    ? 'Continuer'
                    : language === 'ja'
                    ? '続ける'
                    : language === 'zh'
                    ? '继续学习'
                    : 'Continue Learning'
                  : language === 'de'
                  ? 'Kurs starten'
                  : language === 'fr'
                  ? 'Démarrer le cours'
                  : language === 'ja'
                  ? 'コースを開始'
                  : language === 'zh'
                  ? '开始课程'
                  : 'Start Course'}
              </span>
            </button>
          </div>
        </div>

        {/* Lessons List (Matching Screenshot 4) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 px-1 mb-2">
            {language === 'de'
              ? 'Lektionen-Übersicht'
              : language === 'fr'
              ? 'Programme du cours'
              : language === 'ja'
              ? 'レッスン一覧'
              : language === 'zh'
              ? '课时列表'
              : 'Course Curriculum'}
          </h2>

          {selectedCourse.lessons.map((lesson) => {
            const lTitle = lesson.title[language] || lesson.title.en
            const isCompleted = lesson.progressPercent === 100

            return (
              <div
                key={lesson.id}
                onClick={() => onSelectCourseLesson(lesson.targetPieceId, lesson.practiceVariant)}
                className="group p-4 sm:p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-orange-500/40 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Lesson Number Circle */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 border ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-800 border-white/10 text-zinc-300'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : lesson.number}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                      {lTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      <span>{lesson.durationMin} Min.</span>
                      <span>•</span>
                      <span className="capitalize">{lesson.practiceVariant || 'Original'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {renderProgressRing(lesson.progressPercent, 40, 3)}
                  <div className="w-8 h-8 rounded-xl bg-zinc-800/80 group-hover:bg-orange-500 text-zinc-400 group-hover:text-white flex items-center justify-center transition-all">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // All Courses Overview (Flowkey Screenshot 5)
  return (
    <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 overflow-y-auto select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-6 space-y-10 max-w-6xl mx-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))]">
      {/* Header Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {language === 'de'
            ? 'Kurse & Tonleitern'
            : language === 'fr'
            ? 'Cours et Gammes'
            : language === 'ja'
            ? 'コースと音階'
            : language === 'zh'
            ? '钢琴课程与音阶体系'
            : 'Courses & Scales'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {language === 'de'
            ? 'Vom ersten Ton bis zu virtuosen Chopin-Balladen und Tonleitern.'
            : language === 'fr'
            ? 'Des premières notes aux ballades de Chopin et aux gammes complètes.'
            : language === 'ja'
            ? '最初の1音からショパンのバラード、音階練習まで網羅。'
            : language === 'zh'
            ? '从单音基础到肖邦叙事曲与全套大小调音阶体系。'
            : 'From your first notes to full scales and Chopin masterpieces.'}
        </p>
      </div>

      {/* 3 Quick-Action Labs & Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Note Reading Trainer */}
        <div
          onClick={onOpenSightReading}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-950/40 via-zinc-900 to-indigo-950/30 border border-blue-500/30 hover:border-blue-500/60 flex items-center justify-between gap-3 cursor-pointer shadow-lg group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-blue-300 transition-colors">
                {language === 'de' ? 'Noten lesen lernen' : 'Sight-Reading Trainer'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {language === 'de' ? 'Violin- & Bass-Schlüssel' : 'Clef & interval reflex trainer'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </div>

        {/* 2. Pianist Warm-Ups */}
        <div
          onClick={onOpenWarmups}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-orange-950/40 via-zinc-900 to-amber-950/30 border border-orange-500/30 hover:border-orange-500/60 flex items-center justify-between gap-3 cursor-pointer shadow-lg group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-orange-300 transition-colors">
                {language === 'de' ? 'Klavier-Einspielen' : 'Pianist Warm-Ups'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {language === 'de' ? '5-Minuten Fingeraktivierung' : '5-min finger activation & stretch'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </div>

        {/* 3. Video Masterclasses */}
        <div
          onClick={onOpenTutorials}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-yellow-950/30 border border-amber-500/30 hover:border-amber-500/60 flex items-center justify-between gap-3 cursor-pointer shadow-lg group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-amber-300 transition-colors">
                {language === 'de' ? 'Meisterkurs-Videos' : 'Video Masterclasses'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {language === 'de' ? 'Igor Levit & Konzert-Tipps' : 'Concert pianist pedagogy & tips'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </div>
      </div>

      {/* 4 Curriculum Categories */}
      {(['beginner', 'technique', 'scales', 'chords'] as const).map((cat) => {
        const catCourses = coursesData.filter((c) => c.category === cat)
        const catTitle = categoryHeaders[cat][language] || categoryHeaders[cat].en

        return (
          <section key={cat} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <h2 className="text-lg font-bold text-white tracking-wide">{catTitle}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catCourses.map((course) => {
                const title = course.title[language] || course.title.en
                const subtitle = course.subtitle[language] || course.subtitle.en

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="p-5 sm:p-6 rounded-3xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-orange-500/40 cursor-pointer flex flex-col justify-between gap-4 transition-all shadow-md group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                          {course.lessonCount}{' '}
                          {language === 'de'
                            ? 'Lektionen'
                            : language === 'fr'
                            ? 'Leçons'
                            : language === 'ja'
                            ? 'レッスン'
                            : language === 'zh'
                            ? '课时'
                            : 'Lessons'}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                          {title}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{subtitle}</p>
                      </div>

                      {/* Progress Ring */}
                      {renderProgressRing(course.overallProgress, 50, 4)}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Flowkey Master Curriculum</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-orange-400 group-hover:translate-x-1 transition-transform">
                        <span>{language === 'de' ? 'Öffnen' : 'Open'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
