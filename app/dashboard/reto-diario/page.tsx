export const dynamic = 'force-dynamic'
// app/dashboard/reto-diario/page.tsx — reto diario tipo Duolingo
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getDailyTopic, hasDoneToday } from '@/lib/daily'
import { getUserGameState } from '@/lib/gamification'
import DailyChallengeClient from '@/components/student/DailyChallengeClient'

export default async function RetoDiarioPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const topic = getDailyTopic()
  const [done, state] = await Promise.all([
    hasDoneToday(session.sub),
    getUserGameState(session.sub, session.email),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">🔥 Reto diario</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Un tema del temario IPN cada día. No pierdas tu racha.</p>
      </div>
      <DailyChallengeClient topic={topic} alreadyDone={done} streak={state.currentStreak} />
    </div>
  )
}
