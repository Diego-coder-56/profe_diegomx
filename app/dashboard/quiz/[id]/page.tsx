export const dynamic = 'force-dynamic'
// app/dashboard/quiz/[id]/page.tsx — jugar un quiz
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getQuiz, toPlayerQuestions } from '@/lib/quiz'
import QuizPlayer from '@/components/student/QuizPlayer'

export default async function PlayQuizPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const quiz = await getQuiz(params.id)
  if (!quiz || !quiz.is_published) notFound()
  const questions = toPlayerQuestions(quiz)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">{quiz.title}</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">
          {questions.length} pregunta{questions.length !== 1 ? 's' : ''} · +50 XP al terminar
          {quiz.time_limit_sec ? ` · ⏱ ${Math.round(quiz.time_limit_sec / 60)} min` : ''}
        </p>
      </div>
      {questions.length === 0
        ? <p className="text-center text-slate-400">Este quiz aún no tiene preguntas.</p>
        : <QuizPlayer quizId={quiz.id} title={quiz.title} questions={questions} timeLimitSec={quiz.time_limit_sec ?? 0} />}
    </div>
  )
}
