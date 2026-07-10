'use client'
// components/student/CourseViewer.tsx — Estilo Platzi
import { useState, useTransition, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronLeft, Menu, X,
  Clock, BookOpen, PlayCircle, Award, Lock,
  FileText, Download, Link2, FileArchive, File,
  ChevronDown, ChevronRight, GraduationCap,
  ClipboardList, Timer, Trophy, RotateCcw, AlertCircle,
  Folder, FolderOpen
} from 'lucide-react'
import { markLessonComplete, submitExamAttempt } from '@/lib/actions'
import { formatDuration } from '@/lib/utils'
import type { Course, Lesson, LessonProgress, Subject, LessonMaterial, Exam, ExamQuestion, ExamAttempt } from '@/types'

interface Props {
  course: Course
  subjects: Subject[]
  lessons: Lesson[]
  progress: LessonProgress[]
  materials: Record<string, LessonMaterial[]>
  exams: Exam[]
  examQuestions: Record<string, ExamQuestion[]>
  examAttempts: Record<string, ExamAttempt[]>
}

type ActiveView = 'lesson' | 'exam'

export default function CourseViewer({
  course, subjects, lessons, progress, materials, exams, examQuestions, examAttempts
}: Props) {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(lessons[0] ?? null)
  const [activeView, setActiveView]         = useState<ActiveView>('lesson')
  const [activeExam, setActiveExam]         = useState<Exam | null>(null)
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [activeTab, setActiveTab]           = useState<'video' | 'material'>('video')
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set())
  const [isPending, startTransition]        = useTransition()
  const [localProgress, setLocalProgress]  = useState<Set<string>>(
    new Set(progress.filter(p => p.completed).map(p => p.lesson_id))
  )

  // Exam state
  const [examStarted, setExamStarted]     = useState(false)
  const [examAnswers, setExamAnswers]     = useState<Record<number, number>>({})
  const [examSubmitted, setExamSubmitted] = useState(false)
  const [examScore, setExamScore]         = useState(0)
  const [timeLeft, setTimeLeft]           = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const completedCount = localProgress.size
  const totalCount     = lessons.length
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Group lessons by subject
  const unassigned = lessons.filter(l => !l.subject_id)
  const bySubject  = subjects.map(s => ({
    subject: s,
    lessons: lessons.filter(l => l.subject_id === s.id),
  }))

  const toggleSubject = (id: string) => {
    setCollapsedSubjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleComplete = () => {
    if (!currentLesson || localProgress.has(currentLesson.id)) return
    const newSet = new Set(localProgress)
    newSet.add(currentLesson.id)
    setLocalProgress(newSet)
    startTransition(async () => { await markLessonComplete(currentLesson.id) })
  }

  const goNext = () => {
    if (!currentLesson) return
    const idx = lessons.findIndex(l => l.id === currentLesson.id)
    if (idx < lessons.length - 1) { setCurrentLesson(lessons[idx + 1]); setActiveTab('video') }
  }

  const isCompleted = (id: string) => localProgress.has(id)

  const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&autoplay=0`
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
    if (url.includes('/embed/')) return url
    return null
  }

  const materialIcon = (type: string) => {
    if (type === 'pdf')  return <FileText size={14} className="text-red-500" />
    if (type === 'doc')  return <FileText size={14} className="text-blue-500" />
    if (type === 'zip')  return <FileArchive size={14} className="text-yellow-500" />
    if (type === 'link') return <Link2 size={14} className="text-brand-500" />
    return <File size={14} className="text-slate-400" />
  }

  // ── Exam logic ─────────────────────────────────────────────────
  const startExam = (exam: Exam) => {
    setActiveExam(exam)
    setExamStarted(true)
    setExamAnswers({})
    setExamSubmitted(false)
    setExamScore(0)
    setTimeLeft(exam.duration_min * 60)
    setActiveView('exam')
    setSidebarOpen(false)
  }

  useEffect(() => {
    if (!examStarted || examSubmitted || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmitExam(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examStarted, examSubmitted])

  const handleSubmitExam = () => {
    if (!activeExam) return
    if (timerRef.current) clearInterval(timerRef.current)
    const questions = examQuestions[activeExam.id] ?? []
    let correct = 0
    questions.forEach((q, i) => { if (examAnswers[i] === q.correct_index) correct++ })
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    setExamScore(score)
    setExamSubmitted(true)
    startTransition(async () => {
      await submitExamAttempt({
        exam_id: activeExam.id,
        answers: questions.map((_, i) => examAnswers[i] ?? -1),
        score,
      })
    })
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const embedUrl    = getEmbedUrl(currentLesson?.video_url ?? null)
  const currentIdx  = lessons.findIndex(l => l.id === currentLesson?.id)
  const curMaterials = currentLesson ? (materials[currentLesson.id] ?? []) : []

  // ── Lesson Row ─────────────────────────────────────────────────
  const LessonRow = ({ lesson, i }: { lesson: Lesson; i: number }) => {
    const done   = isCompleted(lesson.id)
    const active = currentLesson?.id === lesson.id && activeView === 'lesson'
    return (
      <button
        onClick={() => { setCurrentLesson(lesson); setActiveView('lesson'); setActiveTab('video'); setSidebarOpen(false) }}
        className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-all ${
          active
            ? 'bg-brand-50 border-r-2 border-brand-600'
            : 'hover:bg-slate-50 border-r-2 border-transparent'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {done
            ? <CheckCircle2 size={15} className="text-emerald-500" />
            : active
              ? <PlayCircle size={15} className="text-brand-600" />
              : <Circle size={15} className="text-slate-300" />
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[12.5px] font-medium leading-snug ${
            active ? 'text-brand-700' : done ? 'text-slate-400 line-through' : 'text-slate-700'
          }`}>
            <span className="text-[10px] text-slate-300 mr-1">{String(i + 1).padStart(2, '0')}.</span>
            {lesson.title}
          </p>
          {lesson.duration_sec > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock size={9} /> {formatDuration(lesson.duration_sec)}
            </p>
          )}
        </div>
        {materials[lesson.id]?.length > 0 && (
          <span title="Tiene material" className="shrink-0 mt-1">
            <FileText size={10} className="text-slate-300" />
          </span>
        )}
      </button>
    )
  }

  // ── Sidebar ────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-brand-600 text-[12px] font-medium mb-3 hover:text-brand-700">
          <ChevronLeft size={13} /> Mis cursos
        </Link>
        <h2 className="font-bold text-slate-900 text-[13px] leading-snug mb-2">{course.title}</h2>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>{completedCount}/{totalCount} clases</span>
          <span className="font-bold text-brand-600">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-brand-600 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }} />
        </div>
        {progressPct === 100 && (
          <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold bg-emerald-50 px-2 py-1.5 rounded-lg">
            <Award size={12} /> ¡Curso completado! 🎉
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {/* Clases por asignatura */}
        {bySubject.map(({ subject, lessons: sLessons }) => (
          <div key={subject.id}>
            <button
              onClick={() => toggleSubject(subject.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors border-y border-slate-100"
            >
              {collapsedSubjects.has(subject.id)
                ? <FolderOpen size={13} className="text-brand-500 shrink-0" />
                : <Folder size={13} className="text-brand-500 shrink-0" />
              }
              <span className="flex-1 text-left text-[11.5px] font-bold text-slate-700 uppercase tracking-wide truncate">{subject.title}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{sLessons.length} clases</span>
              {collapsedSubjects.has(subject.id)
                ? <ChevronDown size={12} className="text-slate-400 shrink-0" />
                : <ChevronRight size={12} className="text-slate-400 shrink-0" />
              }
            </button>
            <AnimatePresence>
              {!collapsedSubjects.has(subject.id) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  {sLessons.map((lesson, i) => (
                    <LessonRow key={lesson.id} lesson={lesson} i={lessons.indexOf(lesson)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Sin asignatura */}
        {unassigned.length > 0 && (
          <div>
            {subjects.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-y border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">General</span>
              </div>
            )}
            {unassigned.map(l => <LessonRow key={l.id} lesson={l} i={lessons.indexOf(l)} />)}
          </div>
        )}

        {lessons.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-[13px]">
            <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
            Aún no hay clases en este curso.
          </div>
        )}

        {/* Exámenes simulacro */}
        {exams.filter(e => e.is_published).length > 0 && (
          <div className="border-t border-slate-100">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardList size={11} /> Exámenes simulacro
              </span>
            </div>
            {exams.filter(e => e.is_published).map(exam => {
              const attempts = examAttempts[exam.id] ?? []
              const best = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null
              const isActive = activeExam?.id === exam.id && activeView === 'exam'
              return (
                <button key={exam.id}
                  onClick={() => startExam(exam)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all border-r-2 ${
                    isActive ? 'bg-violet-50 border-violet-600' : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <GraduationCap size={15} className={`mt-0.5 shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12.5px] font-semibold ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>{exam.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Timer size={9} /> {exam.duration_min} min
                      </span>
                      {best !== null && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${best >= exam.pass_score ? 'text-emerald-600' : 'text-red-500'}`}>
                          <Trophy size={9} /> Mejor: {best}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // ── Exam View ──────────────────────────────────────────────────
  const ExamView = () => {
    if (!activeExam) return null
    const questions = examQuestions[activeExam.id] ?? []

    if (!examStarted) return null

    if (examSubmitted) {
      const passed = examScore >= activeExam.pass_score
      const correct = questions.filter((q, i) => examAnswers[i] === q.correct_index).length
      return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className={`rounded-2xl border p-8 text-center mb-6 ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {passed ? <Trophy size={36} className="text-emerald-600" /> : <AlertCircle size={36} className="text-red-500" />}
            </div>
            <h2 className={`text-3xl font-extrabold mb-1 ${passed ? 'text-emerald-700' : 'text-red-600'}`}>{examScore}%</h2>
            <p className={`text-[15px] font-semibold mb-1 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {passed ? '¡Aprobado! 🎉' : 'No aprobado'}
            </p>
            <p className="text-[13px] text-slate-500">
              {correct} de {questions.length} correctas · Mínimo requerido: {activeExam.pass_score}%
            </p>
          </div>

          {/* Revisión de respuestas */}
          <div className="space-y-4 mb-6">
            {questions.map((q, i) => {
              const answered = examAnswers[i]
              const isRight  = answered === q.correct_index
              return (
                <div key={q.id} className={`bg-white rounded-xl border p-4 ${isRight ? 'border-emerald-200' : 'border-red-200'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    {isRight
                      ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      : <X size={16} className="text-red-500 mt-0.5 shrink-0" />
                    }
                    <p className="text-[13px] font-semibold text-slate-800">{q.question}</p>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`text-[12px] px-3 py-1.5 rounded-lg ${
                        oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-semibold' :
                        oi === answered && !isRight ? 'bg-red-50 text-red-600' :
                        'text-slate-500'
                      }`}>
                        {oi === q.correct_index && '✓ '}{opt}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 mt-2.5 pl-6 italic">{q.explanation}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => startExam(activeExam)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-[13px] transition-all">
              <RotateCcw size={14} /> Reintentar
            </button>
            <button onClick={() => { setActiveView('lesson'); setExamStarted(false) }}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-[13px] hover:bg-slate-50 transition-all">
              Volver a clases
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header examen */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl border border-slate-100 shadow-card px-5 py-4">
          <div>
            <h1 className="text-[17px] font-extrabold text-slate-900">{activeExam.title}</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{questions.length} preguntas · Aprueba con {activeExam.pass_score}%</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-[15px] ${
            timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-700'
          }`}>
            <Timer size={15} /> {formatTime(timeLeft)}
          </div>
        </div>

        {/* Preguntas */}
        <div className="space-y-5 mb-6">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-[14px] font-semibold text-slate-800 mb-4">
                <span className="text-[11px] text-slate-300 font-normal mr-2">{i + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2.5">
                {q.options.map((opt, oi) => (
                  <label key={oi}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-all ${
                      examAnswers[i] === oi
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input type="radio" name={`q${i}`} value={oi} checked={examAnswers[i] === oi}
                      onChange={() => setExamAnswers(prev => ({ ...prev, [i]: oi }))}
                      className="accent-brand-600 w-4 h-4" />
                    <span className="text-[13px] text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[12px] text-slate-400">
            {Object.keys(examAnswers).length}/{questions.length} respondidas
          </p>
          <button onClick={handleSubmitExam}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-[14px] transition-all shadow-sm">
            <ClipboardList size={15} />
            Enviar examen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#f0f2f5] overflow-hidden">
      {/* ── Sidebar Desktop ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[280px] shrink-0 bg-white border-r border-slate-100 shadow-sm overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── Sidebar Mobile Overlay ───────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                <span className="font-bold text-slate-900 text-[13px]">Contenido del curso</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X size={17} className="text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <Menu size={17} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-slate-800 truncate">
              {activeView === 'exam' ? activeExam?.title : currentLesson?.title ?? 'Sin clase'}
            </p>
            <p className="text-[10px] text-slate-400">{course.title}</p>
          </div>
          <span className="text-[11px] font-bold text-brand-600 shrink-0">{progressPct}%</span>
        </div>

        {/* Vista: lección o examen */}
        <div className="flex-1 overflow-y-auto">
          {activeView === 'exam' ? (
            <ExamView />
          ) : (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
              {currentLesson ? (
                <>
                  {/* Video player */}
                  <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl mb-4">
                    {embedUrl ? (
                      <div className="aspect-video">
                        <iframe src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen title={currentLesson.title}
                          referrerPolicy="strict-origin-when-cross-origin"
                          sandbox="allow-scripts allow-same-origin allow-presentation" />
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                          <Lock size={28} className="text-white/50" />
                        </div>
                        <p className="text-white/50 text-[14px]">Video no disponible</p>
                      </div>
                    )}
                  </div>

                  {/* Tabs: Video info / Material */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden mb-4">
                    {/* Tab bar */}
                    <div className="flex border-b border-slate-100">
                      {[
                        { key: 'video', label: 'Clase', icon: <PlayCircle size={13} /> },
                        { key: 'material', label: `Material${curMaterials.length > 0 ? ` (${curMaterials.length})` : ''}`, icon: <Download size={13} /> },
                      ].map(tab => (
                        <button key={tab.key}
                          onClick={() => setActiveTab(tab.key as 'video' | 'material')}
                          className={`flex items-center gap-1.5 px-5 py-3.5 text-[12.5px] font-semibold border-b-2 transition-all ${
                            activeTab === tab.key
                              ? 'border-brand-600 text-brand-700'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}>
                          {tab.icon}{tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    {activeTab === 'video' ? (
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold text-slate-300">Clase {currentIdx + 1} de {totalCount}</span>
                              {isCompleted(currentLesson.id) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">
                                  <CheckCircle2 size={9} /> Completada
                                </span>
                              )}
                            </div>
                            <h1 className="text-[18px] font-extrabold text-slate-900 mb-1">{currentLesson.title}</h1>
                            {currentLesson.description && (
                              <p className="text-[13px] text-slate-500 leading-relaxed">{currentLesson.description}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            {!isCompleted(currentLesson.id) && (
                              <button onClick={handleComplete} disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl font-semibold text-[13px] transition-all active:scale-95">
                                <CheckCircle2 size={14} /> Marcar completada
                              </button>
                            )}
                            {currentIdx < lessons.length - 1 && (
                              <button onClick={goNext}
                                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[13px] transition-all active:scale-95">
                                Siguiente →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5">
                        {curMaterials.length === 0 ? (
                          <div className="py-8 text-center">
                            <Download size={28} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-[13px] text-slate-400">No hay material adjunto a esta clase.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {curMaterials.map(mat => (
                              <a key={mat.id} href={mat.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all group">
                                <div className="w-8 h-8 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                                  {materialIcon(mat.type)}
                                </div>
                                <span className="flex-1 text-[13px] font-medium text-slate-700 group-hover:text-brand-700 truncate">{mat.title}</span>
                                <Download size={13} className="text-slate-300 group-hover:text-brand-500 shrink-0 transition-colors" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-white rounded-2xl border border-slate-100 shadow-card flex flex-col items-center justify-center gap-4">
                  <BookOpen size={48} className="text-slate-200" />
                  <div className="text-center">
                    <p className="font-bold text-slate-700 text-[16px]">Próximamente</p>
                    <p className="text-slate-400 text-[14px] mt-1">Las clases de este curso se agregarán pronto.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
