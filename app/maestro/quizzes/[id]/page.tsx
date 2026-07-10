export const dynamic = 'force-dynamic'
// app/maestro/quizzes/[id]/page.tsx — editor del profesor (solo sus quizzes)
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getQuiz } from '@/lib/quiz'
import QuizBuilder from '@/components/admin/QuizBuilder'

export default async function MaestroQuizEditor({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const quiz = await getQuiz(params.id)
  if (!quiz) notFound()
  // Un profesor solo puede abrir sus propios quizzes.
  if (session.role === 'teacher' && (quiz as any).created_by !== session.sub) redirect('/maestro/quizzes')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">{quiz.title}</h1>
        {quiz.subject && <p className="text-slate-400 text-[14px] mt-0.5">{quiz.subject}</p>}
      </div>
      <QuizBuilder quiz={quiz} backHref="/maestro/quizzes" />
    </div>
  )
}
