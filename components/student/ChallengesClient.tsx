'use client'
// components/student/ChallengesClient.tsx — retos con barra de progreso y reclamo
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimChallengeAction } from '@/lib/actions'
import type { ChallengeState } from '@/lib/challenges'
import { Check, Gift } from 'lucide-react'

export default function ChallengesClient({ challenges }: { challenges: ChallengeState[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const daily = challenges.filter(c => c.scope === 'daily')
  const weekly = challenges.filter(c => c.scope === 'weekly')

  function claim(key: string) {
    start(async () => { await claimChallengeAction(key); router.refresh() })
  }

  const Card = (c: ChallengeState) => {
    const pct = Math.min(100, Math.round((c.current / c.goal) * 100))
    return (
      <div key={c.key} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{c.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-[14px]">{c.title}</p>
            <p className="text-[12px] text-amber-500 font-semibold">+{c.xp} XP</p>
          </div>
          {c.claimed && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1"><Check size={11} /> Reclamado</span>}
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Progreso</span><span>{Math.min(c.current, c.goal)}/{c.goal}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${c.complete ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {!c.claimed && (
          <button onClick={() => claim(c.key)} disabled={!c.complete || pending}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] transition-all ${c.complete ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            <Gift size={15} /> {c.complete ? (pending ? 'Reclamando…' : 'Reclamar recompensa') : 'En progreso'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Retos diarios</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{daily.map(Card)}</div>
      </section>
      <section>
        <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Retos semanales</h2>
        <div className="grid sm:grid-cols-2 gap-4">{weekly.map(Card)}</div>
      </section>
    </div>
  )
}
