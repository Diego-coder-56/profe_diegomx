export const dynamic = 'force-dynamic'
// app/admin/quizzes/[id]/page.tsx — editor de un quiz
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getQuiz } from '@/lib/quiz'
import QuizBuilder from '@/components/admin/QuizBuilder'

export default async function QuizEditorPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const quiz = await getQuiz(params.id)
  if (!quiz) notFound()
  // Un profesor solo puede abrir sus propios quizzes.
  if (session?.role === 'teacher' && (quiz as any).created_by !== session.sub) redirect('/admin/quizzes')
  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">{quiz.title}</h1>
        {quiz.subject && <p className="text-slate-400 text-[14px] mt-0.5">{quiz.subject}</p>}
      </div>
      <QuizBuilder quiz={quiz} />
    </div>
  )
}
