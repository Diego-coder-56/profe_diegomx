export const dynamic = 'force-dynamic'
// app/admin/usuarios/page.tsx (sin Supabase)
import { listUsers, listCourses, getUserCourseIds } from '@/lib/db'
import UserManagementClient from '@/components/admin/UserManagementClient'

export default async function UsersPage() {
  const [users, courses] = await Promise.all([
    listUsers(),
    listCourses(true),
  ])

  // Para cada usuario, obtener sus accesos
  const allAccessArr = await Promise.all(
    users.map(async u => {
      const ids = await getUserCourseIds(u.id)
      return ids.map(courseId => ({ user_id: u.id, course_id: courseId }))
    })
  )
  const allAccess = allAccessArr.flat()

  const profiles = users.map(({ password_hash: _, ...p }) => p)

  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Gestión de usuarios</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">{profiles.length} usuario{profiles.length !== 1 ? 's' : ''} registrado{profiles.length !== 1 ? 's' : ''}</p>
      </div>
      <UserManagementClient
        profiles={profiles}
        courses={courses.map(c => ({ id: c.id, title: c.title, category: c.category }))}
        allAccess={allAccess}
      />
    </div>
  )
}
