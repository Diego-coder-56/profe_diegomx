'use client'
// Botón + modal para crear un curso nuevo desde el admin
import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { upsertCourse } from '@/lib/actions'
import { useRouter } from 'next/navigation'

export default function CourseAdminClient() {
  const [open, setOpen]         = useState(false)
  const [isPending, start]      = useTransition()
  const [error, setError]       = useState('')
  const router                  = useRouter()

  const [form, setForm] = useState({
    title: '', slug: '', description: '', category: '', price: '0', is_published: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.slug) { setError('Título y slug son requeridos'); return }
    start(async () => {
      try {
        await upsertCourse({ ...form, price: parseFloat(form.price) || 0 })
        setOpen(false)
        setForm({ title: '', slug: '', description: '', category: '', price: '0', is_published: false })
        router.refresh()
      } catch (e) { setError('Error al guardar') }
    })
  }

  const inputCls = "w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all bg-slate-50"

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[13px] font-semibold transition-colors shadow-sm">
        <Plus size={15} /> Nuevo curso
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Nuevo curso</h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Admisión IPN" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Slug * (sin espacios)</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="admision-ipn" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Categoría</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="IPN, UNAM, Cálculo..." className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Precio (MXN)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand-600" />
                <span className="text-[13px] text-slate-700 font-medium">Publicar inmediatamente</span>
              </label>
              {error && <p className="text-red-600 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[13px] font-bold disabled:opacity-60 transition-colors">
                  {isPending ? 'Guardando...' : 'Crear curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
