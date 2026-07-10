'use client'
// components/admin/QuizListClient.tsx — lista y alta de quizzes
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createQuizAction, deleteQuizAction, updateQuizAction } from '@/lib/actions'
import { ListChecks, Plus, X, Check, Trash2, Pencil, Eye, EyeOff } from 'lucide-react'
import type { Quiz } from '@/lib/quiz'

export default function QuizListClient({ quizzes, basePath = '/admin/quizzes' }: { quizzes: Quiz[]; basePath?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')

  function create() {
    if (!title.trim()) return
    start(async () => {
      const r = await createQuizAction({ title: title.trim(), subject: subject.trim() || undefined })
      setModal(false); setTitle(''); setSubject('')
      if (r.id) router.push(`${basePath}/${r.id}`)
      else router.refresh()
    })
  }
  function togglePublish(q: Quiz) {
    start(async () => { await updateQuizAction(q.id, { is_published: !q.is_published }); router.refresh() })
  }
  function remove(q: Quiz) {
    if (!confirm(`¿Eliminar el quiz "${q.title}"? Esta acción no se puede deshacer.`)) return
    start(async () => { await deleteQuizAction(q.id); router.refresh() })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[14px] shadow-sm">
          <Plus size={16} /> Nuevo quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center">
          <ListChecks size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aún no hay quizzes. Crea el primero.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-50">
          {quizzes.map(q => (
            <div key={q.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><ListChecks size={18} className="text-brand-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 truncate">{q.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{q.is_published ? 'Publicado' : 'Borrador'}</span>
                </div>
                {q.subject && <p className="text-[12px] text-slate-400">{q.subject}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`${basePath}/${q.id}`} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Editar preguntas"><Pencil size={15} /></Link>
                <button onClick={() => togglePublish(q)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title={q.is_published ? 'Despublicar' : 'Publicar'}>
                  {q.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => remove(q)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !pending && setModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Nuevo quiz</h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del quiz"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Materia (opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} disabled={pending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50">Cancelar</button>
              <button onClick={create} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] disabled:opacity-60">
                <Check size={16} /> {pending ? 'Creando…' : 'Crear y editar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
