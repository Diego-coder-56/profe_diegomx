export const dynamic = 'force-dynamic'
// app/dashboard/ranking/page.tsx — Ranking global y semanal
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getGlobalRanking, getWeeklyRanking } from '@/lib/gamification'
import RankingTabs from '@/components/student/RankingTabs'

export default async function RankingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [global, weekly] = await Promise.all([
    getGlobalRanking(20),
    getWeeklyRanking(20),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">🏆 Ranking</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Compite con otros aspirantes y sube de posición</p>
      </div>
      <RankingTabs
        global={global}
        weekly={weekly.map(w => ({ user_id: w.user_id, name: w.name, xp: w.weeklyXp }))}
        meId={session.sub}
      />
    </div>
  )
}
