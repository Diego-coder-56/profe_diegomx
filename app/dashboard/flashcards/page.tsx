export const dynamic = 'force-dynamic'
// app/dashboard/flashcards/page.tsx — mazos de flashcards por materia
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { listDecks } from '@/lib/flashcards'
import { Layers, ArrowRight, Plus, Sparkles } from 'lucide-react'

export default async function FlashcardsDecksPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const decks = await listDecks(session.sub)
  const totalDue = decks.reduce((s, d) => s + d.due, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Flashcards</h1>
          <p className="text-slate-400 text-[14px]">Elige una materia o repasa todo lo pendiente</p>
        </div>
        <Link href="/dashboard/flashcards/mis" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-[14px] text-slate-700 hover:border-brand-300">
          <Plus size={16} /> Mis flashcards
        </Link>
      </div>

      {/* Estudiar todas */}
      <Link href="/dashboard/flashcards/estudiar"
        className="group flex items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl shadow-lg shadow-brand-600/20 p-5 text-white hover:shadow-xl transition-all mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center"><Sparkles size={22} /></div>
          <div>
            <p className="font-extrabold text-[17px]">Repasar todo</p>
            <p className="text-[13px] text-blue-100">{totalDue} tarjeta{totalDue !== 1 ? 's' : ''} pendiente{totalDue !== 1 ? 's' : ''} hoy</p>
          </div>
        </div>
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Mazos por materia */}
      {decks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <Layers size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[14px]">Aún no hay flashcards. Configura Supabase y ejecuta las migraciones.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(d => (
            <Link key={d.subject} href={`/dashboard/flashcards/estudiar?subject=${encodeURIComponent(d.subject)}`}
              className="group bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                  <Layers size={20} className="text-brand-600 group-hover:text-white transition-colors" />
                </div>
                {d.due > 0 && <span className="text-[11px] font-bold text-white bg-orange-500 rounded-full px-2 py-0.5">{d.due} pendiente{d.due !== 1 ? 's' : ''}</span>}
              </div>
              <h3 className="font-bold text-slate-900">{d.subject}</h3>
              <p className="text-[12px] text-slate-400">{d.total} tarjeta{d.total !== 1 ? 's' : ''}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
