'use client'
// components/student/MyFlashcardsClient.tsx — crear y compartir flashcards propias
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMyFlashcardAction, deleteMyFlashcardAction, shareMyFlashcardAction } from '@/lib/actions'
import type { MyCard } from '@/lib/flashcards'
import { Plus, Trash2, Globe, Lock, X, Check } from 'lucide-react'

export default function MyFlashcardsClient({ cards }: { cards: MyCard[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ subject: '', front: '', back: '', hint: '', shared: true })
  const [err, setErr] = useState('')

  function save() {
    if (!f.subject.trim() || !f.front.trim() || !f.back.trim()) { setErr('Materia, frente y reverso son obligatorios.'); return }
    setErr('')
    start(async () => {
      await createMyFlashcardAction({ subject: f.subject, front: f.front, back: f.back, hint: f.hint || undefined, shared: f.shared })
      setModal(false); setF({ subject: '', front: '', back: '', hint: '', shared: true }); router.refresh()
    })
  }
  function remove(id: string) {
    if (!confirm('¿Eliminar esta flashcard?')) return
    start(async () => { await deleteMyFlashcardAction(id); router.refresh() })
  }
  function toggleShare(c: MyCard) {
    start(async () => { await shareMyFlashcardAction(c.id, !c.shared); router.refresh() })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setErr(''); setModal(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[14px] shadow-sm">
          <Plus size={16} /> Crear flashcard
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <p className="text-[14px]">Aún no has creado flashcards. ¡Crea la primera y compártela con la comunidad!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{c.subject}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleShare(c)} disabled={pending} title={c.shared ? 'Compartida (clic para hacer privada)' : 'Privada (clic para compartir)'}
                    className={`p-1.5 rounded-lg transition-all ${c.shared ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                    {c.shared ? <Globe size={14} /> : <Lock size={14} />}
                  </button>
                  <button onClick={() => remove(c.id)} disabled={pending} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="font-bold text-slate-900 text-[14px]">{c.front}</p>
              <p className="text-[13px] text-slate-500 mt-1 border-t border-slate-50 pt-2">{c.back}</p>
              {c.shared && <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600">Compartida con todos</span>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !pending && setModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Nueva flashcard</h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} placeholder="Materia (ej. Física)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
              <textarea value={f.front} onChange={e => setF({ ...f, front: e.target.value })} rows={2} placeholder="Frente (pregunta)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 resize-none" />
              <textarea value={f.back} onChange={e => setF({ ...f, back: e.target.value })} rows={2} placeholder="Reverso (respuesta)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 resize-none" />
              <input value={f.hint} onChange={e => setF({ ...f, hint: e.target.value })} placeholder="Pista (opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                <input type="checkbox" checked={f.shared} onChange={e => setF({ ...f, shared: e.target.checked })} className="accent-brand-600 w-4 h-4" />
                Compartir con toda la plataforma
              </label>
              {err && <p className="text-[13px] text-red-500">{err}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} disabled={pending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50">Cancelar</button>
              <button onClick={save} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] disabled:opacity-60">
                <Check size={16} /> {pending ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
