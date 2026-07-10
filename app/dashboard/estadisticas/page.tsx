export const dynamic = 'force-dynamic'
// app/dashboard/estadisticas/page.tsx — Estadísticas del alumno
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getUserStats } from '@/lib/gamification'
import { Star, Award, ListChecks, Layers, PlayCircle, CalendarCheck, BarChart3 } from 'lucide-react'

const ACTION_LABEL: Record<string, string> = {
  video: 'Videos', quiz: 'Quizzes', flashcards: 'Flashcards', daily_login: 'Ingresos', forum: 'Foro', challenge: 'Retos',
}

function heatColor(xp: number): string {
  if (xp <= 0) return '#f1f5f9'
  if (xp < 20) return '#bfdbfe'
  if (xp < 50) return '#60a5fa'
  if (xp < 100) return '#2563eb'
  return '#1e3a8a'
}

export default async function EstadisticasPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const s = await getUserStats(session.sub)

  const tiles = [
    { icon: Star, label: 'XP total', value: s.totalXp.toLocaleString('es-MX'), tint: 'text-amber-500 bg-amber-50' },
    { icon: Award, label: 'Nivel', value: s.level, tint: 'text-brand-600 bg-brand-50' },
    { icon: ListChecks, label: 'Quizzes', value: s.quizzes, tint: 'text-violet-600 bg-violet-50' },
    { icon: Layers, label: 'Flashcards', value: s.flashcards, tint: 'text-sky-600 bg-sky-50' },
    { icon: PlayCircle, label: 'Lecciones', value: s.lessonsDone, tint: 'text-emerald-600 bg-emerald-50' },
    { icon: CalendarCheck, label: 'Días activos', value: s.activeDays, tint: 'text-orange-500 bg-orange-50' },
  ]
  const maxAction = Math.max(1, ...s.byAction.map(a => a.xp))
  // 84 días → 12 columnas (semanas) × 7 filas (días)
  const weeks: { date: string; xp: number }[][] = []
  for (let w = 0; w < 12; w++) weeks.push(s.daily.slice(w * 7, w * 7 + 7))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">📈 Estadísticas</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Tu progreso de los últimos 3 meses</p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {tiles.map(t => (
          <div key={t.label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${t.tint}`}><t.icon size={17} /></div>
            <p className="text-2xl font-black text-slate-900 leading-none">{t.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Mapa de actividad */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-brand-600" /><p className="font-bold text-slate-900 text-[14px]">Mapa de actividad</p></div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(day => (
                <div key={day.date} title={`${day.date}: ${day.xp} XP`}
                  className="w-3.5 h-3.5 rounded-[3px]" style={{ backgroundColor: heatColor(day.xp) }} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
          Menos
          {['#f1f5f9', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'].map(c => <span key={c} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: c }} />)}
          Más
        </div>
      </div>

      {/* XP por tipo de actividad */}
      {s.byAction.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="font-bold text-slate-900 text-[14px] mb-4">XP por actividad</p>
          <div className="space-y-3">
            {s.byAction.map(a => (
              <div key={a.action}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-slate-600 font-medium">{ACTION_LABEL[a.action] ?? a.action}</span>
                  <span className="text-slate-400">{a.xp} XP · {a.count}×</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full" style={{ width: `${(a.xp / maxAction) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
