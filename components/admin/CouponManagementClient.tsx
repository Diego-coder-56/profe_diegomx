'use client'
// components/admin/CouponManagementClient.tsx — CRUD de cupones (req. 24)
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCoupon, deleteCoupon } from '@/lib/actions'
import { Ticket, Plus, Trash2, X, Check, Power } from 'lucide-react'
import type { Coupon } from '@/types'

type Draft = { code: string; discount_percent: number; max_uses: string; expires_at: string; active: boolean }
const EMPTY: Draft = { code: '', discount_percent: 10, max_uses: '', expires_at: '', active: true }

export default function CouponManagementClient({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')

  function save() {
    if (!draft) return
    if (!draft.code.trim()) { setError('El código es obligatorio.'); return }
    start(async () => {
      await upsertCoupon({
        code: draft.code,
        discount_percent: Number(draft.discount_percent) || 0,
        active: draft.active,
        max_uses: draft.max_uses.trim() ? Number(draft.max_uses) : null,
        expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : null,
      })
      setDraft(null); router.refresh()
    })
  }

  function toggle(c: Coupon) {
    start(async () => {
      await upsertCoupon({ code: c.code, discount_percent: c.discount_percent, active: !c.active, max_uses: c.max_uses, expires_at: c.expires_at })
      router.refresh()
    })
  }

  function remove(code: string) {
    if (!confirm(`¿Eliminar el cupón ${code}? Esta acción no se puede deshacer.`)) return
    start(async () => { await deleteCoupon(code); router.refresh() })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setError(''); setDraft({ ...EMPTY }) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[14px] shadow-sm transition-all">
          <Plus size={16} /> Nuevo cupón
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center">
          <Ticket size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aún no hay cupones. Crea uno como <b>ECOEMS50</b>.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden divide-y divide-slate-50">
          {coupons.map(c => (
            <div key={c.code} className="flex items-center gap-4 px-5 py-4">
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Ticket size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 font-mono">{c.code}</p>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">{c.discount_percent}% OFF</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.active ? 'Activo' : 'Inactivo'}</span>
                </div>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Usos: {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ' (ilimitado)'}
                  {c.expires_at ? ` · expira ${new Date(c.expires_at).toLocaleDateString('es-MX')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(c)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title={c.active ? 'Desactivar' : 'Activar'}><Power size={15} /></button>
                <button onClick={() => remove(c.code)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !pending && setDraft(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Nuevo cupón</h3>
              <button onClick={() => setDraft(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Código</label>
                <input value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="ECOEMS50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] font-mono uppercase focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Descuento (%)</label>
                  <input type="number" min={0} max={100} value={draft.discount_percent} onChange={e => setDraft({ ...draft, discount_percent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Usos máx. (opcional)</label>
                  <input type="number" min={1} value={draft.max_uses} onChange={e => setDraft({ ...draft, max_uses: e.target.value })} placeholder="∞"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Expira (opcional)</label>
                <input type="date" value={draft.expires_at} onChange={e => setDraft({ ...draft, expires_at: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </div>
              {error && <p className="text-[13px] text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDraft(null)} disabled={pending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50 transition-all">Cancelar</button>
              <button onClick={save} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] transition-all disabled:opacity-60">
                <Check size={16} /> {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
