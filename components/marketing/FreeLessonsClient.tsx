'use client'
// components/marketing/FreeLessonsClient.tsx — vitrina pública de clases gratis
import { useState } from 'react'
import Link from 'next/link'
import { PlayCircle, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
// Tipo local: el componente NO importa nada de lib/db (que usa código de servidor).
export interface FreeLesson {
  id: string; title: string; description: string | null; video_url: string | null
  duration_sec: number; course_title: string; course_slug: string; course_color?: string | null
}

/** Convierte un link de YouTube a formato embed. Si no es YouTube, devuelve null. */
function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null
}
function mmss(sec: number): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  return `${m} min`
}

export default function FreeLessonsClient({ lessons }: { lessons: FreeLesson[] }) {
  const [active, setActive] = useState<FreeLesson | null>(lessons[0] ?? null)

  if (lessons.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
        <PlayCircle size={36} className="mx-auto mb-3 text-slate-300" />
        <p className="text-[14px]">Pronto habrá clases de muestra disponibles.</p>
        <Link href="/login" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-[14px]">
          Iniciar sesión <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  const embed = active?.video_url ? youtubeEmbed(active.video_url) : null

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Reproductor */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video shadow-lg">
          {embed ? (
            <iframe src={embed} title={active?.title ?? 'Clase'} allowFullScreen
              className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : active?.video_url ? (
            <video src={active.video_url} controls className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-[14px]">
              Esta clase aún no tiene video.
            </div>
          )}
        </div>
        {active && (
          <div className="mt-4">
            <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wide">{active.course_title}</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{active.title}</h2>
            {active.description && <p className="text-slate-500 text-[14px] mt-1.5">{active.description}</p>}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-lg">
          <h3 className="font-extrabold text-[18px]">¿Te gustó? Esto es solo una probadita 🎁</h3>
          <ul className="mt-3 space-y-1.5 text-[14px] text-blue-50">
            <li className="flex items-center gap-2"><CheckCircle2 size={15} /> Todas las clases de todos los cursos</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={15} /> Simuladores, quizzes y flashcards</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={15} /> Tutor con inteligencia artificial 24/7</li>
          </ul>
          <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-[15px] px-6 py-3 rounded-xl hover:gap-3 transition-all">
            Quiero inscribirme <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* Lista de clases */}
      <div>
        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Clases de muestra ({lessons.length})
        </p>
        <div className="space-y-2">
          {lessons.map(l => (
            <button key={l.id} onClick={() => setActive(l)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all
                ${active?.id === l.id ? 'bg-brand-50 border-brand-300' : 'bg-white border-slate-100 hover:border-brand-200'}`}>
              <PlayCircle size={18} className={active?.id === l.id ? 'text-brand-600 shrink-0' : 'text-slate-300 shrink-0'} />
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-semibold truncate ${active?.id === l.id ? 'text-brand-700' : 'text-slate-700'}`}>{l.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{l.course_title}{l.duration_sec ? ` · ${mmss(l.duration_sec)}` : ''}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Bloqueado */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <Lock size={18} className="mx-auto text-slate-300 mb-1.5" />
          <p className="text-[12px] text-slate-400">El resto de las clases están disponibles para alumnos inscritos.</p>
          <Link href="/login" className="mt-2 inline-block text-[13px] font-bold text-brand-600 hover:text-brand-700">
            Ya tengo cuenta → Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
