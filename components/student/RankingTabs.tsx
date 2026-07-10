'use client'
// components/student/RankingTabs.tsx — ranking global / semanal con podio
import { useState } from 'react'
import { Trophy, Lock } from 'lucide-react'

type Entry = { user_id: string; name: string; xp: number }

export default function RankingTabs({ global, weekly, meId }: { global: Entry[]; weekly: Entry[]; meId: string }) {
  const [tab, setTab] = useState<'global' | 'semanal' | 'curso' | 'universidad'>('global')
  const tabs = [
    { key: 'global', label: 'Global' },
    { key: 'semanal', label: 'Semanal' },
    { key: 'curso', label: 'Por curso', soon: true },
    { key: 'universidad', label: 'Por universidad', soon: true },
  ] as const

  const list = tab === 'global' ? global : tab === 'semanal' ? weekly : []
  const podium = list.slice(0, 3)
  const rest = list.slice(3)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-7 justify-center">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold transition-all
              ${tab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-brand-300'}`}>
            {t.label}
            {'soon' in t && t.soon && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[8px] font-bold opacity-70"><Lock size={7} /> PRONTO</span>}
          </button>
        ))}
      </div>

      {(tab === 'curso' || tab === 'universidad') ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <Trophy size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[14px]">Este ranking llegará en una próxima fase.</p>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center text-slate-400">
          <Trophy size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[14px]">Aún no hay datos suficientes para este ranking.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Podio */}
          <div className="grid grid-cols-3 gap-3 items-end mb-5">
            {[1, 0, 2].map(slot => {
              const e = podium[slot]
              if (!e) return <div key={slot} />
              const medal = slot === 0 ? '🥇' : slot === 1 ? '🥈' : '🥉'
              const h = slot === 0 ? 'pt-7 pb-9' : 'pt-5 pb-6'
              const ring = slot === 0 ? 'from-amber-300 to-amber-500' : slot === 1 ? 'from-slate-300 to-slate-400' : 'from-orange-300 to-orange-400'
              return (
                <div key={slot} className={`rounded-2xl border shadow-card text-center px-2 ${h} ${e.user_id === meId ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100'}`}>
                  <div className="text-3xl mb-1">{medal}</div>
                  <div className={`w-11 h-11 mx-auto rounded-full bg-gradient-to-br ${ring} flex items-center justify-center text-white text-[13px] font-bold mb-2`}>
                    {e.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 truncate">{e.user_id === meId ? 'Tú' : e.name}</p>
                  <p className="text-[13px] font-black text-brand-600">{e.xp.toLocaleString('es-MX')} XP</p>
                </div>
              )
            })}
          </div>

          {/* Resto */}
          {rest.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-50">
              {rest.map((e, idx) => (
                <div key={e.user_id} className={`flex items-center gap-3 px-5 py-3 ${e.user_id === meId ? 'bg-brand-50' : ''}`}>
                  <span className="w-6 text-center font-bold text-slate-400 text-[13px]">{idx + 4}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {e.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                  </div>
                  <span className={`flex-1 truncate text-[13px] ${e.user_id === meId ? 'font-bold text-brand-700' : 'text-slate-700'}`}>{e.user_id === meId ? 'Tú' : e.name}</span>
                  <span className="text-[13px] font-bold text-brand-600 tabular-nums">{e.xp.toLocaleString('es-MX')} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
