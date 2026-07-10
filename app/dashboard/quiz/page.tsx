export const dynamic = 'force-dynamic'
// app/dashboard/quiz/page.tsx — lista de quizzes para el alumno
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { listQuizzes } from '@/lib/quiz'
import { ListChecks, ArrowRight } from 'lucide-react'

export default async function QuizListPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const quizzes = await listQuizzes(true)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Quizzes</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Pon a prueba lo que sabes y gana XP</p>
      </div>
      {quizzes.length === 0 ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <ListChecks size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[14px]">Aún no hay quizzes publicados. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {quizzes.map(q => (
            <Link key={q.id} href={`/dashboard/quiz/${q.id}`}
              className="group bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all p-5">
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-3 group-hover:bg-brand-600 transition-colors">
                <ListChecks size={20} className="text-brand-600 group-hover:text-white transition-colors" />
              </div>
              {q.subject && <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">{q.subject}</span>}
              <h3 className="font-bold text-slate-900 mt-0.5">{q.title}</h3>
              {q.description && <p className="text-[13px] text-slate-400 mt-1 line-clamp-2">{q.description}</p>}
              <span className="inline-flex items-center gap-1.5 text-brand-600 text-[13px] font-semibold mt-3">Comenzar <ArrowRight size={13} /></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
