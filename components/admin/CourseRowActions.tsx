'use client'
// components/admin/CourseRowActions.tsx — eliminar (soft) / restaurar curso (req. 1)
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { softDeleteCourse, restoreCourse } from '@/lib/actions'
import { Trash2, RotateCcw, Eye } from 'lucide-react'

export default function CourseRowActions({ courseId, slug, mode }: { courseId: string; slug: string; mode: 'active' | 'deleted' }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function stop(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation() }

  function del(e: React.MouseEvent) {
    stop(e)
    if (!confirm('¿Estás seguro de eliminar este curso?\n\nSe ocultará de la plataforma pero podrás restaurarlo después.')) return
    start(async () => { await softDeleteCourse(courseId); router.refresh() })
  }
  function restore(e: React.MouseEvent) {
    stop(e)
    start(async () => { await restoreCourse(courseId); router.refresh() })
  }

  if (mode === 'deleted') {
    return (
      <button onClick={restore} disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all disabled:opacity-60">
        <RotateCcw size={13} /> {pending ? '...' : 'Restaurar'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 shrink-0" onClick={stop}>
      <a href={`/dashboard/curso/${slug}`} target="_blank" rel="noopener noreferrer" onClick={stop}
        className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Vista previa">
        <Eye size={15} />
      </a>
      <button onClick={del} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar curso">
        <Trash2 size={15} />
      </button>
    </div>
  )
}
