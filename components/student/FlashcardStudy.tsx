'use client'
// components/student/FlashcardStudy.tsx — estudio de flashcards (SM-2)
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { reviewFlashcard } from '@/lib/actions'
import type { DueCard, Grade } from '@/lib/flashcards'
import { RotateCw, Check, ArrowLeft, Sparkles, Layers } from 'lucide-react'

const BUTTONS: { grade: Grade; label: string; cls: string }[] = [
  { grade: 'again', label: 'Muy difícil', cls: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' },
  { grade: 'hard',  label: 'Difícil',     cls: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200' },
  { grade: 'good',  label: 'Fácil',       cls: 'bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-200' },
  { grade: 'easy',  label: 'Muy fácil',   cls: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' },
]

export default function FlashcardStudy({ cards }: { cards: DueCard[] }) {
  const [pending, start] = useTransition()
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [done, setDone] = useState(cards.length === 0)

  const card = cards[i]

  function grade(g: Grade) {
    if (!card) return
    start(async () => {
      await reviewFlashcard(card.id, g)
      setReviewed(r => r + 1)
      setFlipped(false)
      if (i + 1 >= cards.length) setDone(true)
      else setI(i + 1)
    })
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-10 text-center">
        {cards.length === 0 ? (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-extrabold text-slate-900">¡Todo al día!</h2>
            <p className="text-slate-500 mt-2">No tienes tarjetas pendientes por ahora. Vuelve mañana para mantener tu racha. 🔥</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-extrabold text-slate-900">¡Sesión completa!</h2>
            <p className="text-slate-500 mt-2">Repasaste <b>{reviewed}</b> tarjeta{reviewed !== 1 ? 's' : ''} y ganaste <b className="text-amber-500">+{reviewed * 15} XP</b>.</p>
          </>
        )}
        <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progreso */}
      <div className="flex items-center justify-between mb-4 text-[13px]">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 font-medium"><ArrowLeft size={14} /> Salir</Link>
        <span className="font-semibold text-slate-400">{i + 1} / {cards.length}</span>
        <span className="font-bold text-brand-600">{card.subject}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${(i / cards.length) * 100}%` }} />
      </div>

      {/* Tarjeta */}
      <div className="relative" style={{ perspective: 1200 }}>
        <motion.div
          className="relative w-full min-h-[260px]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Frente */}
          <div className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-card p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}>
            {card.isNew && <span className="absolute top-4 right-4 text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">NUEVA</span>}
            <p className="text-[11px] uppercase tracking-widest text-slate-300 font-bold mb-3">Pregunta</p>
            <p className="text-xl font-bold text-slate-900">{card.front}</p>
            {card.hint && <p className="text-[13px] text-slate-400 mt-4">💡 {card.hint}</p>}
          </div>
          {/* Reverso */}
          <div className="absolute inset-0 bg-brand-600 rounded-3xl shadow-card p-8 flex flex-col items-center justify-center text-center text-white"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-[11px] uppercase tracking-widest text-blue-200 font-bold mb-3">Respuesta</p>
            <p className="text-xl font-bold">{card.back}</p>
          </div>
        </motion.div>
      </div>

      {/* Controles */}
      {!flipped ? (
        <button onClick={() => setFlipped(true)}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95">
          <RotateCw size={16} /> Mostrar respuesta
        </button>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BUTTONS.map(b => (
            <button key={b.grade} onClick={() => grade(b.grade)} disabled={pending}
              className={`px-3 py-3.5 rounded-2xl border font-bold text-[13px] transition-all active:scale-95 disabled:opacity-50 ${b.cls}`}>
              {b.label}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-[12px] text-slate-400 mt-4 flex items-center justify-center gap-1">
        <Sparkles size={12} /> Cada repaso suma +15 XP
      </p>
    </div>
  )
}
