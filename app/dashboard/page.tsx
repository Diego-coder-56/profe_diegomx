export const dynamic = 'force-dynamic'
// app/dashboard/page.tsx — Dashboard del alumno (gamificado) + Mis cursos
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { listCourses, getUserCourseIds, getUserById } from '@/lib/db'
import { getUserGameState } from '@/lib/gamification'
import { hasDoneToday, getDailyTopic } from '@/lib/daily'
import StudentGamePanel from '@/components/student/dashboard/StudentGamePanel'
import Link from 'next/link'
import { BookOpen, Lock, ArrowRight, GraduationCap } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [allCourses, accessIds, profile] = await Promise.all([
    listCourses(true),
    getUserCourseIds(session.sub),
    getUserById(session.sub),
  ])

  const fullName = profile?.full_name ?? null
  const firstName = (fullName?.split(' ')[0]) || session.email.split('@')[0]

  const courses = allCourses.map(c => ({ ...c, hasAccess: accessIds.includes(c.id) }))
  const myCourses = courses.filter(c => c.hasAccess)
  const continueCourse = myCourses[0] ? { slug: myCourses[0].slug, title: myCourses[0].title } : null

  // Gamificación (degrada a ceros si Supabase aún no está configurado)
  const gameState = await getUserGameState(session.sub, session.email, fullName ?? undefined)
  const dailyDone = await hasDoneToday(session.sub)
  const dailyTopic = getDailyTopic()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Reto diario / racha */}
      {!dailyDone && (
        <Link href="/dashboard/reto-diario"
          className="group flex items-center justify-between gap-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/20 p-4 sm:p-5 text-white mb-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-3xl shrink-0">🔥</div>
            <div className="min-w-0">
              <p className="font-extrabold text-[15px] sm:text-[16px]">
                {gameState.currentStreak > 0 ? `¡No pierdas tu racha de ${gameState.currentStreak} día${gameState.currentStreak !== 1 ? 's' : ''}!` : 'Comienza tu racha hoy'}
              </p>
              <p className="text-[12px] text-orange-50 truncate">Reto de hoy: {dailyTopic.emoji} {dailyTopic.topic}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-white text-orange-600 font-bold text-[13px] px-4 py-2 rounded-xl shrink-0 group-hover:gap-2.5 transition-all">
            Hacer reto <ArrowRight size={15} />
          </span>
        </Link>
      )}

      <StudentGamePanel
        name={firstName}
        state={gameState}
        continueCourse={continueCourse}
      />

      <div className="mb-3 scroll-mt-20" id="mis-cursos">
        <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Mis cursos</h2>
      </div>

      {myCourses.length > 0 ? (
        <div className="mb-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myCourses.map(course => (
              <Link key={course.id} href={`/dashboard/curso/${course.slug}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-brand-500 to-brand-700 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 bg-hero-grid" />
                  <BookOpen size={32} className="text-white/80" />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500 rounded-full text-[10px] font-bold text-white">Acceso activo</div>
                </div>
                <div className="p-4">
                  {course.category && <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">{course.category}</span>}
                  <h3 className="font-bold text-slate-900 text-[15px] mt-1 mb-2 group-hover:text-brand-600 transition-colors">{course.title}</h3>
                  <div className="flex items-center gap-1.5 text-brand-600 text-[13px] font-semibold">Continuar <ArrowRight size={13} /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-12 bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-card">
          <GraduationCap size={40} className="text-slate-200 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-[16px] mb-1">Aún no tienes cursos</h3>
          <p className="text-slate-400 text-[14px] mb-5">Contacta al Profe Diego para obtener acceso a los cursos.</p>
          <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-xl font-semibold text-[14px] hover:bg-[#20bd5b] transition-colors">
            Contactar por WhatsApp
          </a>
        </div>
      )}

      {courses.filter(c => !c.hasAccess).length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4">Más cursos disponibles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.filter(c => !c.hasAccess).map(course => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden opacity-75">
                <div className="h-28 bg-gradient-to-br from-slate-300 to-slate-400 relative overflow-hidden flex items-center justify-center">
                  <Lock size={28} className="text-white/60" />
                </div>
                <div className="p-4">
                  {course.category && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{course.category}</span>}
                  <h3 className="font-bold text-slate-600 text-[15px] mt-1 mb-2">{course.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-extrabold text-slate-700">{formatPrice(course.price)}</span>
                    <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-[12px] font-semibold hover:bg-brand-600 hover:text-white transition-all">
                      Solicitar acceso
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
