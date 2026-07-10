export const dynamic = 'force-dynamic'
// app/dashboard/flashcards/estudiar/page.tsx — estudio (por materia o todo)
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getDueCards } from '@/lib/flashcards'
import FlashcardStudy from '@/components/student/FlashcardStudy'

export default async function StudyPage({ searchParams }: { searchParams: { subject?: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const subject = searchParams.subject
  const cards = await getDueCards(session.sub, 20, subject)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">{subject ?? 'Repaso general'}</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Repetición espaciada · +15 XP por tarjeta</p>
      </div>
      <FlashcardStudy cards={cards} />
    </div>
  )
}
