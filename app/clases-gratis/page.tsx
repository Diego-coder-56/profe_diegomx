export const dynamic = 'force-dynamic'
// app/clases-gratis/page.tsx — PÚBLICA (sin cuenta): solo clases marcadas como gratis.
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { listFreeLessons } from '@/lib/db'
import FreeLessonsClient from '@/components/marketing/FreeLessonsClient'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clases gratis | Profe Diego MX',
  description: 'Prueba gratis algunas clases de Profe Diego MX. Sin registro, sin tarjeta. Prepárate para el examen de admisión (COMIPEMS, IPN, UNAM, UAM).',
  alternates: { canonical: '/clases-gratis' },
}

export default async function ClasesGratisPage() {
  const lessons = await listFreeLessons(12)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Encabezado público */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Profe Diego MX" width={32} height={32} className="rounded-lg" />
            <span className="font-extrabold text-slate-900">Profe Diego <span className="text-brand-600">MX</span></span>
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[14px] transition-colors">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-[13px] font-medium mb-5">
          <ArrowLeft size={14} /> Volver al inicio
        </Link>

        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-3">
            🎁 PRUEBA GRATIS · SIN REGISTRO
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Clases de muestra</h1>
          <p className="text-slate-500 text-[15px] mt-2 max-w-xl mx-auto">
            Mira algunas clases completas antes de inscribirte. Sin cuenta y sin tarjeta.
          </p>
        </div>

        <FreeLessonsClient lessons={lessons} />
      </main>
    </div>
  )
}
