export const dynamic = 'force-dynamic'
// app/dashboard/retos/page.tsx — Retos diarios y semanales
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { computeChallenges } from '@/lib/challenges'
import ChallengesClient from '@/components/student/ChallengesClient'

export default async function RetosPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const challenges = await computeChallenges(session.sub)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">🎯 Retos</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Completa retos y gana XP extra</p>
      </div>
      <ChallengesClient challenges={challenges} />
    </div>
  )
}
