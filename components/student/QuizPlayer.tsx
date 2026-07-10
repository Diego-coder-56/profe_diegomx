'use client'
// components/student/QuizPlayer.tsx — reproductor de quiz (8 tipos)
import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { submitQuizAction } from '@/lib/actions'
import type { PlayerQuestion } from '@/lib/quiz'
import Latex from '@/components/ui/Latex'
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle2, XCircle, Send, RotateCcw, Trophy, Clock } from 'lucide-react'

export default function QuizPlayer({ quizId, title, questions, timeLimitSec = 0 }: { quizId: string; title: string; questions: PlayerQuestion[]; timeLimitSec?: number }) {
  const [pending, start] = useTransition()
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [result, setResult] = useState<{ score: number; total: number; results: Record<string, boolean> } | null>(null)
  const [remaining, setRemaining] = useState(timeLimitSec)
  const answersRef = useRef(answers)
  answersRef.current = answers
  const submittedRef = useRef(false)

  const doSubmit = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    start(async () => {
      const r = await submitQuizAction(quizId, answersRef.current)
      setResult({ score: r.score, total: r.total, results: r.results })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  useEffect(() => {
    if (!timeLimitSec || result) return
    const t = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(t); doSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimitSec, result])

  const setA = (id: string, v: any) => setAnswers(a => ({ ...a, [id]: v }))
  function submit() { doSubmit() }

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  if (result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-8 text-center mb-6">
          <Trophy size={40} className={`mx-auto mb-3 ${pct >= 70 ? 'text-amber-400' : 'text-slate-300'}`} />
          <p className="text-5xl font-black text-brand-600">{result.score}<span className="text-2xl text-slate-300">/{result.total}</span></p>
          <p className="text-slate-500 mt-1">{pct}% de aciertos · +50 XP</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/dashboard/quiz" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl font-semibold text-[14px] text-slate-600 hover:bg-slate-50"><ArrowLeft size={15} /> Otros quizzes</Link>
            <button onClick={() => { setResult(null); setAnswers({}) }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-[14px] hover:bg-brand-700"><RotateCcw size={15} /> Reintentar</button>
          </div>
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${result.results[q.id] ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {result.results[q.id] ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-red-400 shrink-0" />}
              <span className="text-[13px] text-slate-700">Pregunta {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5 gap-3">
        <Link href="/dashboard/quiz" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-[13px] font-medium"><ArrowLeft size={14} /> Salir</Link>
        {timeLimitSec > 0 && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold tabular-nums ${remaining <= 30 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
            <Clock size={14} /> {mmss}
          </span>
        )}
        <span className="text-[13px] text-slate-400 font-semibold">{answeredCount}/{questions.length} respondidas</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <p className="text-[15px] font-bold text-slate-900 mb-3">
              <span className="text-brand-500 mr-1.5">{i + 1}.</span>
              {q.type === 'math_latex' ? <Latex tex={q.prompt} /> : q.prompt}
            </p>
            {q.image_url && <img src={q.image_url} alt="" className="rounded-xl mb-3 max-h-56 object-contain" />}
            <QuestionInput q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} />
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={pending || answeredCount === 0}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50">
        <Send size={16} /> {pending ? 'Calificando…' : 'Enviar respuestas'}
      </button>
    </div>
  )
}

function QuestionInput({ q, value, onChange }: { q: PlayerQuestion; value: any; onChange: (v: any) => void }) {
  const v = q.view ?? {}

  if (q.type === 'multiple_choice' || q.type === 'image' || q.type === 'math_latex') {
    return (
      <div className="space-y-2">
        {(v.options ?? []).map((opt: string, idx: number) => (
          <button key={idx} onClick={() => onChange(idx)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-[14px] transition-all ${value === idx ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700' : 'border-slate-200 text-slate-700 hover:border-brand-300'}`}>
            {v.optionImages?.[idx] && <img src={v.optionImages[idx]} alt="" className="rounded-lg mb-2 max-h-32 object-contain" />}
            {q.type === 'math_latex' ? <Latex tex={opt} /> : opt}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'true_false') {
    return (
      <div className="flex gap-2">
        <button onClick={() => onChange(true)} className={`flex-1 py-3 rounded-xl border-2 font-semibold text-[14px] ${value === true ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>Verdadero</button>
        <button onClick={() => onChange(false)} className={`flex-1 py-3 rounded-xl border-2 font-semibold text-[14px] ${value === false ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600'}`}>Falso</button>
      </div>
    )
  }

  if (q.type === 'open') {
    return <input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="Tu respuesta…"
      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
  }

  if (q.type === 'fill_blank') {
    const n = v.count ?? 1
    const arr: string[] = Array.isArray(value) ? value : Array(n).fill('')
    return (
      <div className="space-y-2">
        {Array.from({ length: n }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[12px] text-slate-400 w-6">{idx + 1}.</span>
            <input value={arr[idx] ?? ''} onChange={e => { const a = [...arr]; a[idx] = e.target.value; onChange(a) }} placeholder={`Espacio ${idx + 1}`}
              className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
          </div>
        ))}
      </div>
    )
  }

  if (q.type === 'match') {
    const lefts: string[] = v.lefts ?? []
    const rights: { text: string; orig: number }[] = v.rights ?? []
    const arr: number[] = Array.isArray(value) ? value : Array(lefts.length).fill(-1)
    return (
      <div className="space-y-2">
        {lefts.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-[14px] text-slate-700 font-medium px-3 py-2 bg-slate-50 rounded-lg">{l}</span>
            <span className="text-slate-300">↔</span>
            <select value={arr[i] ?? -1} onChange={e => { const a = [...arr]; a[i] = Number(e.target.value); onChange(a) }}
              className="flex-1 px-3 py-2.5 rounded-lg border-2 border-slate-200 text-[14px] bg-white focus:outline-none focus:border-brand-400">
              <option value={-1}>Elegir…</option>
              {rights.map(r => <option key={r.orig} value={r.orig}>{r.text}</option>)}
            </select>
          </div>
        ))}
      </div>
    )
  }

  if (q.type === 'order') {
    const items: { text: string; orig: number }[] = v.items ?? []
    const arr: number[] = Array.isArray(value) ? value : items.map(it => it.orig)
    const ordered = arr.map(o => items.find(it => it.orig === o)!).filter(Boolean)
    const move = (idx: number, dir: -1 | 1) => {
      const j = idx + dir
      if (j < 0 || j >= arr.length) return
      const a = [...arr];[a[idx], a[j]] = [a[j], a[idx]]; onChange(a)
    }
    return (
      <div className="space-y-2">
        {ordered.map((it, idx) => (
          <div key={it.orig} className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl">
            <span className="text-[12px] font-bold text-slate-400 w-5">{idx + 1}</span>
            <span className="flex-1 text-[14px] text-slate-700">{it.text}</span>
            <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white disabled:opacity-30"><ArrowUp size={14} /></button>
            <button onClick={() => move(idx, 1)} disabled={idx === ordered.length - 1} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white disabled:opacity-30"><ArrowDown size={14} /></button>
          </div>
        ))}
        <p className="text-[11px] text-slate-400 mt-1">Ordena con las flechas (de primero a último).</p>
      </div>
    )
  }

  return null
}
