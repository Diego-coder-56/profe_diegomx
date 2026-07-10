export const dynamic = 'force-dynamic'
// app/maestro/quizzes/page.tsx — quizzes del profesor
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { listQuizzes } from '@/lib/quiz'
import { isSupabaseConfigured } from '@/lib/supabase'
import QuizListClient from '@/components/admin/QuizListClient'

export default async function MaestroQuizzesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  // El profesor ve solo los suyos; el admin (si entra aquí) también ve solo los suyos.
  const quizzes = await listQuizzes(false, session.sub)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Mis quizzes</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Crea quizzes con 8 tipos de pregunta, temporizador e imágenes</p>
      </div>
      {!isSupabaseConfigured() && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-700">
          Configura Supabase y ejecuta las migraciones de quizzes para empezar a crear.
        </div>
      )}
      <QuizListClient quizzes={quizzes} basePath="/maestro/quizzes" />
    </div>
  )
}
