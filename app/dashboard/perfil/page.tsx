export const dynamic = 'force-dynamic'
// app/dashboard/perfil/page.tsx — perfil personalizable del alumno
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getUserById } from '@/lib/db'
import ProfileClient from '@/components/student/ProfileClient'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const u: any = await getUserById(session.sub)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Mi perfil</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Personaliza tu cuenta y cuéntanos de ti</p>
      </div>
      <ProfileClient initial={{
        full_name: u?.full_name ?? '',
        email: u?.email ?? session.email ?? '',
        avatar_url: u?.avatar_url ?? '',
        phone: u?.phone ?? '', city: u?.city ?? '', bio: u?.bio ?? '',
        school: u?.school ?? '', target_exam: u?.target_exam ?? '',
        instagram: u?.instagram ?? '', tiktok: u?.tiktok ?? '', facebook: u?.facebook ?? '',
      }} />
    </div>
  )
}
