export const dynamic = 'force-dynamic'
// app/dashboard/tutor/page.tsx — IA Tutor
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { isTutorConfigured } from '@/lib/tutor'
import TutorChat from '@/components/student/TutorChat'

export default async function TutorPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">🧠 Tutor IA</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Resuelve, explica y practica con inteligencia artificial</p>
      </div>
      {!isTutorConfigured() && (
        <div className="max-w-2xl mx-auto mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-700">
          El Tutor IA necesita una <b>ANTHROPIC_API_KEY</b> en las variables de entorno para funcionar.
        </div>
      )}
      <TutorChat />
    </div>
  )
}
