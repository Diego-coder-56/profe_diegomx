export const dynamic = 'force-dynamic'
// app/admin/pagos/page.tsx — Pagos y membresías
import { listStudentsWithMembership, getPaymentStats } from '@/lib/payments'
import { isSupabaseConfigured } from '@/lib/supabase'
import PaymentsAdminClient from '@/components/admin/PaymentsAdminClient'

export default async function PagosPage() {
  const [students, stats] = await Promise.all([listStudentsWithMembership(), getPaymentStats()])
  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Pagos y membresías</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Control de mensualidades, vencimientos e ingresos</p>
      </div>
      {!isSupabaseConfigured() && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-700">
          Configura Supabase y ejecuta la migración <b>0006_payments.sql</b> para registrar pagos y membresías.
        </div>
      )}
      <PaymentsAdminClient stats={stats} students={students} />
    </div>
  )
}
