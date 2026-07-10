export const dynamic = 'force-dynamic'
// app/admin/profesores/page.tsx — administración de profesores (req. 7)
import { listTeachers } from '@/lib/db'
import TeacherManagementClient from '@/components/admin/TeacherManagementClient'

export default async function TeachersPage() {
  const teachers = await listTeachers(true)
  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Profesores</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">
          {teachers.length} profesor{teachers.length !== 1 ? 'es' : ''} · {teachers.filter(t => t.active).length} activo{teachers.filter(t => t.active).length !== 1 ? 's' : ''}
        </p>
      </div>
      <TeacherManagementClient teachers={teachers} />
    </div>
  )
}
