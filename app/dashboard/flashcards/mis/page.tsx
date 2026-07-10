export const dynamic = 'force-dynamic'
// app/dashboard/flashcards/mis/page.tsx — flashcards creadas por el alumno
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { listMyFlashcards } from '@/lib/flashcards'
import MyFlashcardsClient from '@/components/student/MyFlashcardsClient'
import { ArrowLeft } from 'lucide-react'

export default async function MyFlashcardsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const cards = await listMyFlashcards(session.sub)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard/flashcards" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-[13px] font-medium mb-4"><ArrowLeft size={14} /> Volver a flashcards</Link>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Mis flashcards</h1>
        <p className="text-slate-400 text-[14px]">Crea tus propias tarjetas y compártelas con toda la plataforma</p>
      </div>
      <MyFlashcardsClient cards={cards} />
    </div>
  )
}
