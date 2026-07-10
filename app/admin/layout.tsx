export const dynamic = 'force-dynamic'
// app/admin/layout.tsx (sin Supabase)
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getUserById } from '@/lib/db'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'teacher') redirect('/dashboard')

  const user = await getUserById(session.sub)
  const userName = user?.full_name ?? user?.email ?? (session.role === 'teacher' ? 'Profesor' : 'Admin')

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <AdminSidebar userName={userName} role={session.role} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
