'use client'
// components/admin/PaymentsAdminClient.tsx — gestión de pagos y membresías
import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordPaymentAction, toggleUserActive } from '@/lib/actions'
// Tipos locales (el componente NO importa nada de lib/payments, que usa código de servidor con 'fs').
type MembershipStatus = 'sin_membresia' | 'active' | 'expiring' | 'expired'
interface StudentRow {
  id: string; name: string; email: string; role: string; is_active: boolean
  due_date: string | null; status: MembershipStatus; daysLeft: number | null; lastPayment: string | null
}
interface PaymentStats {
  totalStudents: number; activeStudents: number; blockedStudents: number
  pending: number; expiring: number; incomeMonth: number; incomeYear: number
  upcoming: { name: string; due_date: string; daysLeft: number }[]
  byMonth: { month: string; total: number }[]
}

const STATUS_LABEL: Record<MembershipStatus, string> = {
  sin_membresia: 'Sin membresía', active: 'Al corriente', expiring: 'Próximo a vencer', expired: 'Vencido',
}
import {
  Users, UserCheck, Ban, Clock, DollarSign, CalendarClock, Search, Plus, X, Check, ShieldOff, ShieldCheck,
} from 'lucide-react'

const STATUS_STYLE: Record<MembershipStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  expiring: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  sin_membresia: 'bg-slate-100 text-slate-500',
}

export default function PaymentsAdminClient({ stats, students }: { stats: PaymentStats; students: StudentRow[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | MembershipStatus>('all')
  const [payFor, setPayFor] = useState<StudentRow | null>(null)
  const [form, setForm] = useState({ amount: '', method: 'efectivo', concept: 'Mensualidad', months: '1', notes: '' })

  const filtered = useMemo(() => students.filter(s => {
    const okQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase())
    const okF = filter === 'all' || s.status === filter
    return okQ && okF
  }), [students, q, filter])

  const maxMonth = Math.max(1, ...stats.byMonth.map(m => m.total))

  function openPay(s: StudentRow) {
    setForm({ amount: '', method: 'efectivo', concept: 'Mensualidad', months: '1', notes: '' })
    setPayFor(s)
  }
  function savePay() {
    if (!payFor || !Number(form.amount)) return
    start(async () => {
      await recordPaymentAction(payFor.id, {
        amount: Number(form.amount), method: form.method, concept: form.concept,
        months: Number(form.months) || 1, notes: form.notes || undefined,
      })
      setPayFor(null); router.refresh()
    })
  }
  function toggleBlock(s: StudentRow) {
    const action = s.is_active ? 'bloquear' : 'desbloquear'
    if (!confirm(`¿Seguro que deseas ${action} a ${s.name}?`)) return
    start(async () => { await toggleUserActive(s.id, !s.is_active); router.refresh() })
  }

  const cards = [
    { icon: Users, label: 'Alumnos', value: stats.totalStudents, tint: 'text-blue-600 bg-blue-50' },
    { icon: UserCheck, label: 'Al corriente', value: stats.activeStudents, tint: 'text-emerald-600 bg-emerald-50' },
    { icon: Ban, label: 'Vencidos', value: stats.blockedStudents, tint: 'text-red-600 bg-red-50' },
    { icon: Clock, label: 'Por vencer', value: stats.expiring, tint: 'text-amber-600 bg-amber-50' },
    { icon: DollarSign, label: 'Ingresos del mes', value: `$${stats.incomeMonth.toLocaleString('es-MX')}`, tint: 'text-violet-600 bg-violet-50' },
    { icon: DollarSign, label: 'Ingresos del año', value: `$${stats.incomeYear.toLocaleString('es-MX')}`, tint: 'text-brand-600 bg-brand-50' },
  ]

  return (
    <div>
      {/* Tarjetas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.tint}`}><c.icon size={17} /></div>
            <p className="text-xl font-black text-slate-900 leading-none">{c.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Ingresos por mes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="font-bold text-slate-900 text-[14px] mb-4">Ingresos por mes</p>
          {stats.byMonth.length === 0 ? <p className="text-slate-400 text-[13px]">Aún no hay pagos registrados.</p> : (
            <div className="flex items-end gap-2 h-32">
              {stats.byMonth.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-brand-500 rounded-t-md" style={{ height: `${Math.max(4, (m.total / maxMonth) * 100)}%` }} title={`$${m.total}`} />
                  <span className="text-[9px] text-slate-400">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Próximos vencimientos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <div className="flex items-center gap-2 mb-3"><CalendarClock size={16} className="text-amber-500" /><p className="font-bold text-slate-900 text-[14px]">Próximos vencimientos</p></div>
          {stats.upcoming.length === 0 ? <p className="text-slate-400 text-[13px]">Nadie por vencer en los próximos 7 días.</p> : (
            <div className="divide-y divide-slate-50">
              {stats.upcoming.map(u => (
                <div key={u.name + u.due_date} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-slate-700 font-medium">{u.name}</span>
                  <span className="text-amber-600 font-semibold">en {u.daysLeft} día{u.daysLeft !== 1 ? 's' : ''} · {u.due_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar alumno…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
        </div>
        {(['all', 'active', 'expiring', 'expired', 'sin_membresia'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-300'}`}>
            {f === 'all' ? 'Todos' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Tabla de alumnos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden divide-y divide-slate-50">
        {filtered.length === 0 ? <div className="py-12 text-center text-slate-400 text-[14px]">Sin resultados.</div> : filtered.map(s => (
          <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-[11px] font-bold shrink-0">
              {(s.name || s.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-slate-800 truncate">{s.name}{!s.is_active && <span className="ml-2 text-[10px] text-red-500 font-bold">BLOQUEADO</span>}</p>
              <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
              {s.due_date && <p className="text-[10px] text-slate-400 mt-0.5">vence {s.due_date}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openPay(s)} disabled={pending} className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-[12px] font-semibold hover:bg-brand-600 hover:text-white transition-all"><Plus size={13} /> Pago</button>
              <button onClick={() => toggleBlock(s)} disabled={pending} className={`p-2 rounded-lg transition-all ${s.is_active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={s.is_active ? 'Bloquear' : 'Desbloquear'}>
                {s.is_active ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal registrar pago */}
      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !pending && setPayFor(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-extrabold text-slate-900">Registrar pago</h3>
              <button onClick={() => setPayFor(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <p className="text-[13px] text-slate-400 mb-4">{payFor.name} · {payFor.email}</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Monto (MXN)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="2599"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Meses</label>
                  <input type="number" min={1} value={form.months} onChange={e => setForm({ ...form, months: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Método</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] bg-white focus:outline-none focus:border-brand-400">
                  {['efectivo', 'transferencia', 'tarjeta', 'oxxo', 'otro'].map(m => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Concepto</label>
                <input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Observaciones (opcional)</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPayFor(null)} disabled={pending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50">Cancelar</button>
              <button onClick={savePay} disabled={pending || !Number(form.amount)} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] disabled:opacity-60">
                <Check size={16} /> {pending ? 'Guardando…' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
