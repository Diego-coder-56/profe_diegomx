'use client'
// components/marketing/FAQ.tsx — preguntas frecuentes (acordeón)
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  { q: '¿Cuánto dura el acceso?', a: 'El acceso a cada curso es por tiempo prolongado desde tu compra, para que estudies a tu ritmo sin presiones. Consulta los detalles de cada curso al inscribirte.' },
  { q: '¿Incluye simuladores?', a: 'Sí. Cada curso incluye simuladores con reactivos tipo examen real (IPN, UNAM y bachillerato), con explicación en cada pregunta y resultados al instante.' },
  { q: '¿Hay clases en vivo?', a: 'El contenido principal es en video para que lo veas cuando quieras. Además tienes apoyo directo por WhatsApp con el profe para resolver dudas.' },
  { q: '¿Puedo pagar en OXXO?', a: 'Escríbenos por WhatsApp y te compartimos las formas de pago disponibles, incluyendo opciones en efectivo como OXXO y transferencia.' },
  { q: '¿Funciona en celular?', a: '¡Totalmente! La plataforma está optimizada para iPhone, Android y tabletas. Puedes estudiar y hacer simuladores desde donde estés.' },
  { q: '¿Incluye WhatsApp?', a: 'Sí. El acompañamiento por WhatsApp es una de las ventajas de Profe Diego MX: dudas resueltas por una persona real, no un bot.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className={`rounded-2xl border transition-all ${isOpen ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
            <button onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-6 py-5">
              <span className="font-bold text-slate-900">{item.q}</span>
              <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {isOpen ? <Minus size={15} /> : <Plus size={15} />}
              </span>
            </button>
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[15px] text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
