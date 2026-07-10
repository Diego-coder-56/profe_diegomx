export const dynamic = 'force-dynamic'
// app/admin/cupones/page.tsx — administración de cupones (req. 24)
import { listCoupons } from '@/lib/db'
import CouponManagementClient from '@/components/admin/CouponManagementClient'

export default async function CouponsPage() {
  const coupons = (await listCoupons()).sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Cupones</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">{coupons.length} cupón{coupons.length !== 1 ? 'es' : ''} · {coupons.filter(c => c.active).length} activo{coupons.filter(c => c.active).length !== 1 ? 's' : ''}</p>
      </div>
      <CouponManagementClient coupons={coupons} />
    </div>
  )
}
