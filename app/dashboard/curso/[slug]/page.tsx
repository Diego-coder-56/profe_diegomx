export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import {
  getCourseBySlug, hasAccess as checkAccess,
  getLessonsByCourse, getLessonsProgress,
  getSubjectsByCourse, getMaterialsByLesson,
  getExamsByCourse, getQuestionsByExam, getAttemptsByUserExam,
} from '@/lib/db'
import CourseViewer from '@/components/student/CourseViewer'
import { isBlocked } from '@/lib/payments'
import Link from 'next/link'
import type { Lesson, LessonProgress, LessonMaterial, ExamQuestion, ExamAttempt } from '@/types'

interface Props { params: { slug: string } }

export default async function CourseViewerPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const course = await getCourseBySlug(params.slug)
  if (!course) notFound()

  const access = await checkAccess(session.sub, course.id)
  if (!access) redirect('/dashboard')

  // Bloqueo automático por membresía vencida (solo si el alumno tiene membresía).
  if (await isBlocked(session.sub)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">Tu membresía venció</h1>
        <p className="text-slate-500 text-[14px] mb-6">Para seguir accediendo a tus cursos, ponte al corriente con tu pago.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/membresia" className="inline-flex items-center justify-center px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-[14px]">Ver mi membresía</Link>
          <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-5 py-3 bg-[#25D366] text-white rounded-xl font-bold text-[14px]">Renovar por WhatsApp</a>
        </div>
      </div>
    )
  }

  const [lessons, subjects, exams] = await Promise.all([
    getLessonsByCourse(course.id),
    getSubjectsByCourse(course.id),
    getExamsByCourse(course.id),
  ])

  const lessonIds = lessons.map((l: Lesson) => l.id)
  const progress: LessonProgress[] = lessonIds.length > 0
    ? await getLessonsProgress(session.sub, lessonIds)
    : []

  // Materials per lesson
  const materialsArr = await Promise.all(lessonIds.map((id: string) => getMaterialsByLesson(id)))
  const materials: Record<string, LessonMaterial[]> = {}
  lessonIds.forEach((id: string, i: number) => { materials[id] = materialsArr[i] })

  // Exam questions & attempts
  const examQuestions: Record<string, ExamQuestion[]> = {}
  const examAttempts: Record<string, ExamAttempt[]>   = {}
  await Promise.all(exams.map(async (exam: { id: string }) => {
    examQuestions[exam.id] = await getQuestionsByExam(exam.id)
    examAttempts[exam.id]  = await getAttemptsByUserExam(session.sub, exam.id)
  }))

  return (
    <CourseViewer
      course={course}
      subjects={subjects}
      lessons={lessons}
      progress={progress}
      materials={materials}
      exams={exams}
      examQuestions={examQuestions}
      examAttempts={examAttempts}
    />
  )
}
