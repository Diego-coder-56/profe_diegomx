export const dynamic = 'force-dynamic'
import {
  listCourses, getSubjectsByCourse, getLessonsByCourse,
  getMaterialsByLesson, getExamsByCourse, getQuestionsByExam,
} from '@/lib/db'
import CourseAdminClient from '@/components/admin/CourseAdminClient'
import CourseContentAdmin from '@/components/admin/CourseContentAdmin'
import CourseRowActions from '@/components/admin/CourseRowActions'
import { BookOpen, CheckCircle, Clock, DollarSign, ChevronDown, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Course, Lesson, LessonMaterial, ExamQuestion } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  'IPN':         'bg-red-50 text-red-600',
  'UNAM':        'bg-yellow-50 text-yellow-700',
  'Cálculo':     'bg-purple-50 text-purple-600',
  'Matemáticas': 'bg-indigo-50 text-indigo-600',
  'Física':      'bg-emerald-50 text-emerald-600',
  'Química':     'bg-orange-50 text-orange-600',
}

export default async function CoursesPage() {
  const all = await listCourses()
  const deleted = (await listCourses(false, true)).filter((c: Course) => c.deleted)
  const published = all.filter((c: Course) => c.is_published)
  const drafts    = all.filter((c: Course) => !c.is_published)

  // Fetch content for all courses
  const courseData = await Promise.all(all.map(async (course: Course) => {
    const [subjects, lessons, exams] = await Promise.all([
      getSubjectsByCourse(course.id),
      getLessonsByCourse(course.id),
      getExamsByCourse(course.id),
    ])
    const mats: Record<string, LessonMaterial[]> = {}
    await Promise.all(lessons.map(async (l: Lesson) => { mats[l.id] = await getMaterialsByLesson(l.id) }))
    const examQs: Record<string, ExamQuestion[]> = {}
    await Promise.all(exams.map(async (e: { id: string }) => { examQs[e.id] = await getQuestionsByExam(e.id) }))
    return { course, subjects, lessons, materials: mats, exams, examQuestions: examQs }
  }))

  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gestión de cursos</h1>
          <p className="text-slate-400 text-[14px] mt-0.5">
            {published.length} publicado{published.length !== 1 ? 's' : ''} · {drafts.length} borrador{drafts.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <CourseAdminClient />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Publicados', value: published.length, color: 'bg-emerald-50', iconColor: 'text-emerald-600', Icon: CheckCircle },
          { label: 'Borradores', value: drafts.length,    color: 'bg-amber-50',   iconColor: 'text-amber-600',   Icon: Clock },
          { label: 'Total',      value: all.length,       color: 'bg-brand-50',   iconColor: 'text-brand-600',   Icon: DollarSign },
        ].map(({ label, value, color, iconColor, Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
              <Icon size={17} className={iconColor} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-[11px] text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Course cards with content admin */}
      {all.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center">
          <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay cursos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courseData.map(({ course, subjects, lessons, materials, exams, examQuestions }) => (
            <details key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-card group overflow-hidden">
              <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-bold text-slate-900">{course.title}</p>
                    {course.category && (
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${CATEGORY_COLORS[course.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {course.category}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${course.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {course.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                    <span>{lessons.length} clases</span>
                    <span>{subjects.length} asignaturas</span>
                    <span>{exams.length} exámenes</span>
                    <span className="font-bold text-slate-600">{formatPrice(course.price)}</span>
                  </div>
                </div>
                <CourseRowActions courseId={course.id} slug={course.slug} mode="active" />
                <ChevronDown size={16} className="text-slate-400 shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-6 border-t border-slate-50">
                <CourseContentAdmin
                  course={course}
                  subjects={subjects}
                  lessons={lessons}
                  materials={materials}
                  exams={exams}
                  examQuestions={examQuestions}
                />
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Cursos eliminados (soft-delete) */}
      {deleted.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 size={16} className="text-red-400" />
            <h2 className="font-bold text-slate-700 text-[15px]">Cursos eliminados ({deleted.length})</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-50">
            {deleted.map((course: Course) => (
              <div key={course.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-600 line-through truncate">{course.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {course.deleted_at ? `Eliminado el ${new Date(course.deleted_at).toLocaleDateString('es-MX')}` : 'Eliminado'}
                  </p>
                </div>
                <CourseRowActions courseId={course.id} slug={course.slug} mode="deleted" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
