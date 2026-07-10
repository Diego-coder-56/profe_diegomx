'use client'
// components/admin/TeacherManagementClient.tsx — CRUD de profesores (req. 7)
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertTeacher, setTeacherActive } from '@/lib/actions'
import { GraduationCap, Plus, Pencil, Power, X, Check } from 'lucide-react'
import type { Teacher } from '@/types'

type Draft = { id?: string; name: string; email: string; photo_url: string; bio: string }
const EMPTY: Draft = { name: '', email: '', photo_url: '', bio: '' }

export default function TeacherManagementClient({ teachers }: { teachers: Teacher[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')

  function openNew() { setError(''); setDraft({ ...EMPTY }) }
  function openEdit(t: Teacher) {
    setError('')
    setDraft({ id: t.id, name: t.name, email: t.email, photo_url: t.photo_url ?? '', bio: t.bio ?? '' })
  }

  function save() {
    if (!draft) return
    if (!draft.name.trim() || !draft.email.trim()) { setError('Nombre y correo son obligatorios.'); return }
    start(async () => {
      await upsertTeacher({
        id: draft.id,
        name: draft.name.trim(),
        email: draft.email.trim(),
        photo_url: draft.photo_url.trim() || null,
        bio: draft.bio.trim() || null,
      })
      setDraft(null)
      router.refresh()
    })
  }

  function toggle(t: Teacher) {
    start(async () => { await setTeacherActive(t.id, !t.active); router.refresh() })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[14px] shadow-sm transition-all">
          <Plus size={16} /> Nuevo profesor
        </button>
      </div>

      {teachers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center">
          <GraduationCap size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aún no hay profesores registrados.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white rounded-2xl border p-5 shadow-card ${t.active ? 'border-slate-100' : 'border-slate-200 opacity-70'}`}>
              <div className="flex items-center gap-3 mb-3">
                {t.photo_url
                  ? <img src={t.photo_url} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold">{t.name.slice(0, 2).toUpperCase()}</div>}
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{t.name}</p>
                  <p className="text-[12px] text-slate-400 truncate">{t.email}</p>
                </div>
              </div>
              {t.bio && <p className="text-[13px] text-slate-500 line-clamp-3 mb-3">{t.bio}</p>}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {t.active ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Editar"><Pencil size={15} /></button>
                  <button onClick={() => toggle(t)} disabled={pending} className={`p-2 rounded-lg transition-all ${t.active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={t.active ? 'Desactivar' : 'Activar'}><Power size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !pending && setDraft(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">{draft.id ? 'Editar profesor' : 'Nuevo profesor'}</h3>
              <button onClick={() => setDraft(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Nombre" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="Profe Diego" />
              <Field label="Correo" value={draft.email} onChange={v => setDraft({ ...draft, email: v })} placeholder="diego@profediegomx.com" />
              <Field label="Foto (URL)" value={draft.photo_url} onChange={v => setDraft({ ...draft, photo_url: v })} placeholder="https://..." />
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Biografía</label>
                <textarea value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
                  placeholder="Especialista en matemáticas para admisión..." />
              </div>
              {error && <p className="text-[13px] text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDraft(null)} disabled={pending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50 transition-all">Cancelar</button>
              <button onClick={save} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] transition-all disabled:opacity-60">
                <Check size={16} /> {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
    </div>
  )
}
