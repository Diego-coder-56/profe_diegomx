'use client'
// components/marketing/Testimonials.tsx — carrusel premium de testimonios
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react'

type T = { name: string; school: string; text: string; initials: string }

const TESTIMONIALS: T[] = [
  { name: 'Carlos M.', school: 'Aceptado en IPN — ESIME', initials: 'CM',
    text: 'Reprobé el examen una vez por mi cuenta. Con los simuladores del Profe Diego entendí en qué fallaba y a la segunda quedé en mi primera opción.' },
  { name: 'Ana V.', school: 'Aceptada en UNAM — CCH', initials: 'AV',
    text: 'Las explicaciones de cada reactivo son oro. Estudiaba desde el celular en el camión y aun así subí muchísimo mi puntaje.' },
  { name: 'Luis R.', school: 'Aceptado en IPN — CECyT', initials: 'LR',
    text: 'El radar de desempeño me mostró que iba mal en química. Me enfoqué ahí las últimas semanas y fue justo lo que necesitaba.' },
  { name: 'Jimena P.', school: 'Aceptada en UAM', initials: 'JP',
    text: 'El apoyo por WhatsApp marca la diferencia. Preguntaba mis dudas y me respondían rápido. Se siente acompañamiento real.' },
]

export default function Testimonials() {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)

  const go = (d: number) => { setDir(d); setI((prev) => (prev + d + TESTIMONIALS.length) % TESTIMONIALS.length) }

  useEffect(() => {
    const t = setInterval(() => { setDir(1); setI((p) => (p + 1) % TESTIMONIALS.length) }, 6000)
    return () => clearInterval(t)
  }, [])

  const t = TESTIMONIALS[i]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-card p-8 sm:p-12 overflow-hidden min-h-[280px]">
        <Quote className="absolute top-6 right-8 text-brand-100" size={64} />
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={i}
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}>
            <div className="flex gap-1 mb-5">
              {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={18} className="fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-medium relative z-10">“{t.text}”</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold">{t.initials}</div>
              <div>
                <p className="font-bold text-slate-900">{t.name}</p>
                <p className="text-[13px] text-brand-600 font-semibold">{t.school}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={() => go(-1)} aria-label="Anterior" className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, idx) => (
            <button key={idx} onClick={() => { setDir(idx > i ? 1 : -1); setI(idx) }} aria-label={`Testimonio ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} />
          ))}
        </div>
        <button onClick={() => go(1)} aria-label="Siguiente" className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-all">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
