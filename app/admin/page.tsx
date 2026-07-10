export const dynamic = 'force-dynamic'
// app/admin/page.tsx — Dashboard admin ampliado (req. 5)
import { listUsers, countAllAccess, seedIfNeeded, getAdminStats, listAuditLogs } from '@/lib/db'
import { Users, BookOpen, TrendingUp, UserCheck, ArrowRight, FileText, HelpCircle, Ticket, Trash2, FileEdit, GraduationCap, Activity } from 'lucide-react'
import Link from 'next/link'

const ACTION_LABEL: Record<string, string> = {
  'course.created': 'Curso creado', 'course.updated': 'Curso editado', 'course.deleted': 'Curso eliminado', 'course.restored': 'Curso restaurado',
  'lesson.created': 'Clase creada', 'lesson.updated': 'Clase editada', 'lesson.deleted': 'Clase eliminada', 'lesson.restored': 'Clase restaurada', 'lesson.reordered': 'Clase reordenada',
  'coupon.upserted': 'Cupón guardado', 'coupon.deleted': 'Cupón eliminado',
  'teacher.created': 'Profesor creado', 'teacher.updated': 'Profesor editado', 'teacher.activated': 'Profesor activado', 'teacher.deactivated': 'Profesor desactivado',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'hace un momento'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default async function AdminDashboardPage() {
  await seedIfNeeded()
  const [users, totalAccess, stats, logs] = await Promise.all([
    listUsers(),
    countAllAccess(),
    getAdminStats(),
    listAuditLogs(8),
  ])

  const recentUsers = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)

  const kpis = [
    { label: 'Total usuarios',    value: stats.users.total,   icon: Users,      color: 'bg-blue-50 text-blue-600',       border: 'border-blue-100' },
    { label: 'Usuarios activos',  value: stats.users.active,  icon: UserCheck,  color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: 'Cursos publicados', value: stats.courses.published, icon: BookOpen, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { label: 'Accesos otorgados', value: totalAccess,         icon: TrendingUp, color: 'bg-amber-50 text-amber-600',     border: 'border-amber-100' },
  ]

  const courseBreakdown = [
    { label: 'Publicados', value: stats.courses.published, color: 'text-emerald-600' },
    { label: 'Borradores', value: stats.courses.drafts, color: 'text-amber-600' },
    { label: 'Eliminados', value: stats.courses.deleted, color: 'text-red-500' },
  ]

  const platform = [
    { label: 'Clases', value: stats.platform.lessons, icon: FileText },
    { label: 'Exámenes', value: stats.platform.exams, icon: HelpCircle },
    { label: 'Preguntas', value: stats.platform.questions, icon: HelpCircle },
    { label: 'Cupones', value: stats.platform.coupons, icon: Ticket },
  ]

  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Resumen general de la plataforma</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-2xl border ${kpi.border} p-5 shadow-card`}>
            <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{kpi.value}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Desglose cursos + plataforma */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
          <h2 className="font-bold text-slate-900 text-[15px] mb-4">Cursos</h2>
          <div className="grid grid-cols-3 gap-3">
            {courseBreakdown.map(c => (
              <div key={c.label} className="text-center rounded-xl bg-slate-50 py-4">
                <p className={`text-2xl font-extrabold ${c.color}`}>{c.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
          <h2 className="font-bold text-slate-900 text-[15px] mb-4">Plataforma</h2>
          <div className="grid grid-cols-4 gap-3">
            {platform.map(p => (
              <div key={p.label} className="text-center rounded-xl bg-slate-50 py-4">
                <p className="text-2xl font-extrabold text-slate-800">{p.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <Link href="/admin/usuarios" className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Users size={20} className="text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-[15px]">Usuarios</p>
            <p className="text-slate-400 text-[13px]">Roles, accesos y estado</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
        </Link>
        <Link href="/admin/cursos" className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <BookOpen size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-[15px]">Cursos</p>
            <p className="text-slate-400 text-[13px]">Publicar, editar y organizar</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
        </Link>
        <Link href="/admin/profesores" className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <GraduationCap size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-[15px]">Profesores</p>
            <p className="text-slate-400 text-[13px]">Altas, edición y estado</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Últimos registros */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-[15px]">Últimos registros</h2>
            <Link href="/admin/usuarios" className="text-[12px] text-brand-600 hover:text-brand-700 font-medium">Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers.map(u => (
              <div key={u.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-[11px] font-bold shrink-0">
                    {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">{u.full_name ?? '—'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-brand-100 text-brand-700' : u.role === 'teacher' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Profesor' : 'Alumno'}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                </div>
              </div>
            ))}
            {!recentUsers.length && <div className="py-8 text-center text-slate-400 text-[14px]">Aún no hay registros.</div>}
          </div>
        </div>

        {/* Actividad reciente (auditoría) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <Activity size={16} className="text-brand-600" />
            <h2 className="font-bold text-slate-900 text-[15px]">Actividad reciente</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {logs.map(log => {
              const isDelete = log.action.includes('deleted')
              const Icon = isDelete ? Trash2 : FileEdit
              return (
                <div key={log.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDelete ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-slate-800 truncate">
                      {ACTION_LABEL[log.action] ?? log.action}{log.detail ? `: ${log.detail}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{log.user_email ?? 'sistema'} · {timeAgo(log.created_at)}</p>
                  </div>
                </div>
              )
            })}
            {!logs.length && <div className="py-8 text-center text-slate-400 text-[14px]">Sin actividad registrada todavía.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
