'use client'
// components/marketing/LiveActivity.tsx — actividad "en tiempo real"
import { useEffect, useState } from 'react'
import { Flame, BookOpen, Target } from 'lucide-react'

// Base estable por día + pequeña variación viva. Cuando existan datos reales,
// reemplazar estos valores por conteos de la base de datos.
function seedToday(base: number, spread: number) {
  const d = new Date()
  const seed = d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate()
  return base + (seed % spread)
}

export default function LiveActivity() {
  const [studying, setStudying] = useState(0)
  const [sims, setSims] = useState(0)
  const [answered, setAnswered] = useState(0)

  useEffect(() => {
    setStudying(seedToday(38, 25))
    setSims(seedToday(210, 80))
    setAnswered(seedToday(4800, 1500))
    const t = setInterval(() => {
      setStudying((v) => Math.max(20, v + (Math.random() > 0.5 ? 1 : -1)))
      setAnswered((v) => v + Math.floor(Math.random() * 4))
    }, 3500)
    return () => clearInterval(t)
  }, [])

  const items = [
    { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', label: 'alumnos estudiando ahora', value: studying },
    { icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50', label: 'simuladores realizados hoy', value: sims },
    { icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'preguntas respondidas hoy', value: answered },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {items.map(({ icon: Icon, color, bg, label, value }) => (
        <div key={label} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-card">
          <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon size={20} className={color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{value.toLocaleString('es-MX')}</p>
            </div>
            <p className="text-[12px] text-slate-400 leading-tight">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
