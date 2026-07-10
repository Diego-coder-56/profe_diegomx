export const dynamic = 'force-dynamic'
// app/admin/quizzes/page.tsx — listado de quizzes (admin ve todos; profesor solo los suyos)
import { listQuizzes } from '@/lib/quiz'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import QuizListClient from '@/components/admin/QuizListClient'

export default async function QuizzesAdminPage() {
  const session = await getSession()
  const onlyMine = session?.role === 'teacher'
  const quizzes = await listQuizzes(false, onlyMine ? session!.sub : undefined)
  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Quizzes</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">
          {onlyMine ? 'Tus quizzes · 8 tipos de pregunta, temporizador e imágenes' : 'Constructor de quizzes con 8 tipos de pregunta'}
        </p>
      </div>
      {!isSupabaseConfigured() && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-700">
          Supabase aún no está configurado: configura las variables y ejecuta la migración <b>0004_quizzes.sql</b> para usar los quizzes.
        </div>
      )}
      <QuizListClient quizzes={quizzes} />
    </div>
  )
}
