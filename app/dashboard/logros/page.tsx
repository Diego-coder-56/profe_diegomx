export const dynamic = 'force-dynamic'
// app/dashboard/logros/page.tsx — Logros del alumno
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getAchievementsWithStatus } from '@/lib/gamification'
import { Medal, Lock } from 'lucide-react'

export default async function LogrosPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const items = await getAchievementsWithStatus(session.sub)
  const earned = items.filter(i => i.earned).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">🏅 Logros</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">
          {items.length ? `Has desbloqueado ${earned} de ${items.length}` : 'Tus insignias aparecerán aquí'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <Medal size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[14px]">Estudia, completa quizzes y mantén tu racha para ganar insignias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(a => (
            <div key={a.code}
              className={`rounded-2xl border p-5 text-center transition-all ${a.earned ? 'bg-white border-amber-200 shadow-card' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`text-5xl mb-2 ${a.earned ? '' : 'grayscale opacity-40'}`}>{a.emoji}</div>
              <h3 className={`font-bold text-[14px] ${a.earned ? 'text-slate-900' : 'text-slate-400'}`}>{a.name}</h3>
              {a.description && <p className={`text-[11px] mt-1 ${a.earned ? 'text-slate-500' : 'text-slate-400'}`}>{a.description}</p>}
              {a.earned
                ? <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Desbloqueado</span>
                : <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full"><Lock size={9} /> Bloqueado</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
