export const dynamic = 'force-dynamic'
// app/dashboard/membresia/page.tsx — membresía y pagos del alumno
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMembership, listPayments, statusOf, STATUS_LABEL, type MembershipStatus } from '@/lib/payments'
import { CreditCard, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'

const STATUS_STYLE: Record<MembershipStatus, { box: string; text: string; icon: any }> = {
  active: { box: 'from-emerald-500 to-emerald-600', text: 'text-emerald-50', icon: CheckCircle2 },
  expiring: { box: 'from-amber-500 to-orange-500', text: 'text-amber-50', icon: AlertTriangle },
  expired: { box: 'from-red-500 to-red-600', text: 'text-red-50', icon: AlertTriangle },
  sin_membresia: { box: 'from-slate-400 to-slate-500', text: 'text-slate-50', icon: CreditCard },
}

export default async function MembresiaPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [m, payments] = await Promise.all([getMembership(session.sub), listPayments(session.sub)])
  const { status, daysLeft } = statusOf(m?.due_date ?? null)
  const st = STATUS_STYLE[status]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">💳 Mi membresía</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Estado de tu cuenta e historial de pagos</p>
      </div>

      {/* Estado */}
      <div className={`rounded-3xl bg-gradient-to-br ${st.box} p-6 text-white shadow-lg mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[13px] ${st.text}`}>Estado de membresía</p>
            <p className="text-2xl font-extrabold mt-0.5">{STATUS_LABEL[status]}</p>
          </div>
          <st.icon size={36} className="opacity-80" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/15 rounded-xl p-3">
            <p className={`text-[11px] ${st.text}`}>Vence</p>
            <p className="font-bold">{m?.due_date ?? '—'}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className={`text-[11px] ${st.text}`}>Días restantes</p>
            <p className="font-bold">{daysLeft !== null ? (daysLeft < 0 ? 'Vencida' : `${daysLeft} días`) : '—'}</p>
          </div>
        </div>
        {(status === 'expired' || status === 'expiring') && (
          <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-[14px]">
            Renovar por WhatsApp
          </a>
        )}
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <Calendar size={16} className="text-brand-600" /><p className="font-bold text-slate-900 text-[15px]">Historial de pagos</p>
        </div>
        {payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[14px]">Aún no hay pagos registrados.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800">{p.concept ?? 'Pago'}</p>
                  <p className="text-[11px] text-slate-400">{p.paid_at}{p.method ? ` · ${p.method}` : ''}{p.due_date ? ` · vigencia ${p.due_date}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-slate-900">${p.amount.toLocaleString('es-MX')}</p>
                  {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand-600 font-semibold">Comprobante</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
