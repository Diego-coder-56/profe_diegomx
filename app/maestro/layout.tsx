export const dynamic = 'force-dynamic'
// app/maestro/layout.tsx — zona del profesor
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/session'
import { signOut } from '@/lib/actions'
import { ListChecks, LogOut, GraduationCap } from 'lucide-react'

export default async function MaestroLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'teacher' && session.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/maestro/quizzes" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Profe Diego" width={32} height={32} className="rounded-lg" />
              <span className="font-extrabold text-slate-900">Profe Diego <span className="text-brand-600">· Maestro</span></span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/maestro/quizzes" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-semibold text-slate-600 hover:bg-slate-100">
                <ListChecks size={16} /> Mis quizzes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[13px] text-slate-400"><GraduationCap size={15} /> {session.email}</span>
            <form action={signOut}>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LogOut size={15} /> Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
