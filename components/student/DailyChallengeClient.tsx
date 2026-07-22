'use client'
// components/student/DailyChallengeClient.tsx — reto diario tipo Duolingo
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getDailyQuestionsAction, completeDailyAction } from '@/lib/actions'
import type { DailyTopic, DailyQuestion } from '@/lib/daily'
import { Flame, Sparkles, ArrowRight, CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft } from 'lucide-react'

type Phase = 'intro' | 'loading' | 'playing' | 'done'

export default function DailyChallengeClient({
  topic, alreadyDone, streak,
}: { topic: DailyTopic; alreadyDone: boolean; streak: number }) {
  const [pending, start] = useTransition()
  const [phase, setPhase] = useState<Phase>(alreadyDone ? 'done' : 'intro')
  const [questions, setQuestions] = useState<DailyQuestion[]>([])
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [failedGen, setFailedGen] = useState(false)

  function begin() {
    setPhase('loading')
    start(async () => {
      const r = await getDailyQuestionsAction()
      if (!r.questions || r.questions.length === 0) { setFailedGen(true); setPhase('intro'); return }
      setQuestions(r.questions); setI(0); setAnswers([]); setScore(0); setPicked(null); setPhase('playing')
    })
  }

  function choose(idx: number) {
    if (picked !== null) return
    setPicked(idx)
    const correct = idx === questions[i].correct
    if (correct) setScore(s => s + 1)
    setAnswers(a => [...a, idx])
  }

  function next() {
    if (i + 1 >= questions.length) {
      const finalScore = score
      start(async () => {
        const r = await completeDailyAction(finalScore, questions.length)
        setXp(r.xp ?? 0)
        setPhase('done')
      })
    } else {
      setI(i + 1); setPicked(null)
    }
  }

  // ── Ya completado hoy ──
  if (phase === 'done') {
    const perfect = questions.length > 0 && score === questions.length
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-8 text-center">
        <div className="text-5xl mb-3">{alreadyDone && questions.length === 0 ? '✅' : perfect ? '🏆' : '🎉'}</div>
        <h2 className="text-xl font-extrabold text-slate-900">
          {alreadyDone && questions.length === 0 ? '¡Ya hiciste el reto de hoy!' : '¡Reto completado!'}
        </h2>
        {questions.length > 0 && (
          <p className="text-slate-500 mt-2">Acertaste <b>{score}</b> de <b>{questions.length}</b>{xp ? <> · <span className="text-amber-500 font-bold">+{xp} XP</span></> : null}</p>
        )}
        <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-600 font-bold px-4 py-2 rounded-xl">
          <Flame size={18} /> Racha: {streak} día{streak !== 1 ? 's' : ''}
        </div>
        <p className="text-[13px] text-slate-400 mt-4">Vuelve mañana por un nuevo tema del temario IPN. 🔥</p>
        <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </div>
    )
  }

  // ── Jugando ──
  if (phase === 'playing' && questions[i]) {
    const q = questions[i]
    return (
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4 text-[13px]">
          <span className="font-bold text-brand-600">{topic.emoji} {topic.subjectLabel}</span>
          <span className="font-semibold text-slate-400">{i + 1} / {questions.length}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <p className="text-[16px] font-bold text-slate-900 mb-4">{q.prompt}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              const isCorrect = idx === q.correct
              const isPicked = picked === idx
              let cls = 'border-slate-200 text-slate-700 hover:border-brand-300'
              if (picked !== null) {
                if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
                else if (isPicked) cls = 'border-red-300 bg-red-50 text-red-600'
                else cls = 'border-slate-200 text-slate-400'
              }
              return (
                <button key={idx} onClick={() => choose(idx)} disabled={picked !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-[14px] transition-all flex items-center justify-between ${cls}`}>
                  <span>{opt}</span>
                  {picked !== null && isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {picked !== null && isPicked && !isCorrect && <XCircle size={18} className="text-red-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {picked !== null && (
          <button onClick={next} disabled={pending}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-60">
            {i + 1 >= questions.length ? (pending ? 'Guardando…' : 'Terminar reto') : 'Siguiente'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    )
  }

  // ── Cargando ──
  if (phase === 'loading') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-10 text-center">
        <Sparkles size={28} className="mx-auto mb-3 text-brand-400 animate-pulse" />
        <p className="font-bold text-slate-900">Preparando tu reto de hoy…</p>
        <p className="text-[13px] text-slate-400 mt-1">Generando preguntas de {topic.subjectLabel}</p>
      </div>
    )
  }

  // ── Intro ──
  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-8 text-center">
      <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 font-bold px-4 py-1.5 rounded-full text-[13px] mb-4">
        <Flame size={16} /> Racha de {streak} día{streak !== 1 ? 's' : ''}
      </div>
      <div className="text-5xl mb-3">{topic.emoji}</div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Tema de hoy</p>
      <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{topic.topic}</h2>
      <p className="text-slate-500 text-[14px] mt-1">{topic.subjectLabel} · Temario IPN</p>
      <p className="text-slate-500 text-[14px] mt-4">4 preguntas rápidas para mantener tu racha y ganar XP. 🔥</p>
      {failedGen && <p className="text-[13px] text-amber-600 mt-3">No se pudieron generar las preguntas. Intenta de nuevo en un momento.</p>}
      <button onClick={begin} disabled={pending}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-orange-500/20">
        <Flame size={18} /> Comenzar reto del día
      </button>
    </div>
  )
}
