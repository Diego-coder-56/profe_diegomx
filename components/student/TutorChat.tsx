'use client'
// components/student/TutorChat.tsx — IA Tutor
import { useState, useTransition } from 'react'
import { tutorAskAction } from '@/lib/actions'
import type { TutorMode } from '@/lib/tutor'
import Latex from '@/components/ui/Latex'
import { Sparkles, Send, Lightbulb, ListOrdered, RefreshCw, CheckCircle2 } from 'lucide-react'

const MODES: { key: TutorMode; label: string; icon: any }[] = [
  { key: 'resolver', label: 'Resolver', icon: CheckCircle2 },
  { key: 'explicar', label: 'Explicar', icon: Lightbulb },
  { key: 'pasos',    label: 'Paso a paso', icon: ListOrdered },
  { key: 'otro',     label: 'Otro ejercicio', icon: RefreshCw },
]

// Renderiza texto con fragmentos $...$ como LaTeX en línea.
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-[14px] text-slate-700">
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$')
          ? <Latex key={i} tex={p.slice(1, -1)} />
          : <span key={i}>{p}</span>)}
    </div>
  )
}

export default function TutorChat() {
  const [pending, start] = useTransition()
  const [question, setQuestion] = useState('')
  const [mode, setMode] = useState<TutorMode>('pasos')
  const [answer, setAnswer] = useState<string | null>(null)

  function ask(m: TutorMode) {
    if (!question.trim()) return
    setMode(m)
    start(async () => {
      const r = await tutorAskAction(question, m)
      setAnswer(r.text)
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center"><Sparkles size={18} className="text-white" /></div>
          <div>
            <p className="font-bold text-slate-900">Tutor IA</p>
            <p className="text-[12px] text-slate-400">Pega un problema y elige qué hacer</p>
          </div>
        </div>

        <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3}
          placeholder="Ej. Resuelve la ecuación 2x + 5 = 13"
          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 resize-none" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {MODES.map(m => (
            <button key={m.key} onClick={() => ask(m.key)} disabled={pending || !question.trim()}
              className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold border transition-all disabled:opacity-50
                ${mode === m.key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
              <m.icon size={14} /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-card p-6 text-center text-slate-400 text-[14px]">
          <Sparkles size={20} className="mx-auto mb-2 animate-pulse text-brand-400" /> El tutor está pensando…
        </div>
      )}

      {answer && !pending && (
        <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-3 text-[12px] font-bold text-brand-600 uppercase tracking-wide">
            <Send size={13} /> Respuesta del tutor
          </div>
          <Rich text={answer} />
        </div>
      )}

      <p className="text-center text-[11px] text-slate-400 mt-4">El tutor puede equivocarse. Verifica los resultados importantes.</p>
    </div>
  )
}
