'use client'
// components/admin/QuizBuilder.tsx — editor de preguntas (8 tipos)
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addQuestionAction, updateQuestionAction, deleteQuestionAction, updateQuizAction } from '@/lib/actions'
import { TYPE_LABELS, type QuestionType, type QuizWithQuestions, type QuizQuestion } from '@/lib/quiz'
import Latex from '@/components/ui/Latex'
import { Plus, X, Check, Trash2, Pencil, ArrowLeft, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

const TYPES = Object.keys(TYPE_LABELS) as QuestionType[]

type Draft = {
  id?: string
  type: QuestionType
  prompt: string
  image_url: string
  options: string[]
  optionImages: string[]
  correct: number
  tfAnswer: boolean
  openAnswer: string
  openAccept: string
  blanks: string[]
  pairs: { left: string; right: string }[]
  items: string[]
}
const EMPTY: Draft = {
  type: 'multiple_choice', prompt: '', image_url: '',
  options: ['', '', '', ''], optionImages: ['', '', '', ''], correct: 0, tfAnswer: true,
  openAnswer: '', openAccept: '', blanks: [''],
  pairs: [{ left: '', right: '' }, { left: '', right: '' }], items: ['', ''],
}

export default function QuizBuilder({ quiz, backHref = '/admin/quizzes' }: { quiz: QuizWithQuestions; backHref?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [err, setErr] = useState('')
  const [timeMin, setTimeMin] = useState(quiz.time_limit_sec ? Math.round(quiz.time_limit_sec / 60) : 0)

  function saveTime(min: number) {
    setTimeMin(min)
    start(async () => { await updateQuizAction(quiz.id, { time_limit_sec: min > 0 ? min * 60 : null }) })
  }

  function openNew() { setErr(''); setDraft({ ...EMPTY, options: ['', '', '', ''] }) }

  function openEdit(q: QuizQuestion) {
    setErr('')
    const p = q.payload ?? {}
    setDraft({
      id: q.id, type: q.type, prompt: q.prompt, image_url: q.image_url ?? '',
      options: p.options ?? ['', '', '', ''], optionImages: p.optionImages ?? [], correct: p.correct ?? 0,
      tfAnswer: p.answer ?? true,
      openAnswer: p.answer ?? '', openAccept: (p.accept ?? []).join(', '),
      blanks: p.blanks ?? [''],
      pairs: p.pairs ?? [{ left: '', right: '' }, { left: '', right: '' }],
      items: p.items ?? ['', ''],
    })
  }

  function buildPayload(d: Draft): any {
    switch (d.type) {
      case 'multiple_choice': case 'image': case 'math_latex':
        return { options: d.options.map(o => o.trim()).filter(Boolean), optionImages: d.optionImages.slice(0, d.options.length).map(s => s.trim()), correct: d.correct }
      case 'true_false': return { answer: d.tfAnswer }
      case 'open': return { answer: d.openAnswer.trim(), accept: d.openAccept.split(',').map(s => s.trim()).filter(Boolean) }
      case 'fill_blank': return { blanks: d.blanks.map(b => b.trim()).filter(Boolean) }
      case 'match': return { pairs: d.pairs.filter(p => p.left.trim() && p.right.trim()) }
      case 'order': return { items: d.items.map(i => i.trim()).filter(Boolean) }
    }
  }

  function validate(d: Draft): string | null {
    if (!d.prompt.trim()) return 'El enunciado es obligatorio.'
    if (d.type === 'image' && !d.image_url.trim()) return 'Este tipo requiere una imagen.'
    const p = buildPayload(d)
    if (['multiple_choice', 'image', 'math_latex'].includes(d.type)) {
      if (p.options.length < 2) return 'Agrega al menos 2 opciones.'
      if (d.correct >= p.options.length) return 'Marca cuál opción es la correcta.'
    }
    if (d.type === 'open' && !p.answer) return 'Escribe la respuesta correcta.'
    if (d.type === 'fill_blank' && p.blanks.length === 0) return 'Agrega al menos una respuesta para los espacios.'
    if (d.type === 'match' && p.pairs.length < 2) return 'Agrega al menos 2 pares.'
    if (d.type === 'order' && p.items.length < 2) return 'Agrega al menos 2 elementos.'
    return null
  }

  function save() {
    if (!draft) return
    const v = validate(draft)
    if (v) { setErr(v); return }
    const q = { type: draft.type, prompt: draft.prompt.trim(), image_url: draft.image_url.trim() || null, payload: buildPayload(draft) }
    start(async () => {
      if (draft.id) await updateQuestionAction(quiz.id, draft.id, q)
      else await addQuestionAction(quiz.id, q)
      setDraft(null); router.refresh()
    })
  }

  function removeQ(id: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    start(async () => { await deleteQuestionAction(quiz.id, id); router.refresh() })
  }

  function togglePublish() {
    start(async () => { await updateQuizAction(quiz.id, { is_published: !quiz.is_published }); router.refresh() })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-[13px] font-medium"><ArrowLeft size={14} /> Volver a quizzes</Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[13px]">
            <span className="text-slate-400">⏱</span>
            <input type="number" min={0} value={timeMin} onChange={e => saveTime(Number(e.target.value) || 0)}
              className="w-12 text-center focus:outline-none" title="Minutos (0 = sin límite)" />
            <span className="text-slate-400">min</span>
          </div>
          <button onClick={togglePublish} disabled={pending}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all ${quiz.is_published ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {quiz.is_published ? <><Eye size={14} /> Publicado</> : <><EyeOff size={14} /> Borrador</>}
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[13px] shadow-sm">
            <Plus size={15} /> Agregar pregunta
          </button>
        </div>
      </div>

      {quiz.questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <p className="text-[14px]">Este quiz aún no tiene preguntas. Agrega la primera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 font-bold text-[13px] flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{TYPE_LABELS[q.type]}</span>
                <p className="text-[14px] text-slate-800 font-medium mt-0.5">
                  {q.type === 'math_latex' ? <Latex tex={q.prompt} /> : q.prompt}
                </p>
                {q.image_url && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1"><ImageIcon size={11} /> con imagen</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(q)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={14} /></button>
                <button onClick={() => removeQ(q.id)} disabled={pending} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={() => !pending && setDraft(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">{draft.id ? 'Editar pregunta' : 'Nueva pregunta'}</h3>
              <button onClick={() => setDraft(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Tipo de pregunta</label>
                <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as QuestionType })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 bg-white">
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  Enunciado {draft.type === 'math_latex' && <span className="text-slate-400 font-normal">(LaTeX, ej. x^2 + 1)</span>}
                  {draft.type === 'fill_blank' && <span className="text-slate-400 font-normal">(usa ___ para cada espacio)</span>}
                </label>
                <textarea value={draft.prompt} onChange={e => setDraft({ ...draft, prompt: e.target.value })} rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none" />
                {draft.type === 'math_latex' && draft.prompt && (
                  <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg text-[15px]"><span className="text-[11px] text-slate-400 mr-2">Vista previa:</span><Latex tex={draft.prompt} /></div>
                )}
              </div>

              {(draft.type === 'image') && (
                <Field label="URL de la imagen" value={draft.image_url} onChange={v => setDraft({ ...draft, image_url: v })} placeholder="https://..." />
              )}

              {/* Campos por tipo */}
              {['multiple_choice', 'image', 'math_latex'].includes(draft.type) && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Opciones (marca la correcta)</label>
                  <div className="space-y-2">
                    {draft.options.map((opt, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={draft.correct === idx} onChange={() => setDraft({ ...draft, correct: idx })} className="accent-brand-600 w-4 h-4" />
                          <input value={opt} onChange={e => { const o = [...draft.options]; o[idx] = e.target.value; setDraft({ ...draft, options: o }) }}
                            placeholder={`Opción ${idx + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-brand-400" />
                          {draft.options.length > 2 && <button onClick={() => setDraft({ ...draft, options: draft.options.filter((_, k) => k !== idx), correct: 0 })} className="p-1 text-slate-300 hover:text-red-400"><X size={14} /></button>}
                        </div>
                        <input value={draft.optionImages[idx] ?? ''} onChange={e => { const im = [...draft.optionImages]; im[idx] = e.target.value; setDraft({ ...draft, optionImages: im }) }}
                          placeholder="URL de imagen para esta opción (opcional)" className="w-full ml-6 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-[12px] focus:outline-none focus:border-brand-300" style={{ width: 'calc(100% - 1.5rem)' }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })} className="mt-2 text-[12px] text-brand-600 font-semibold">+ Agregar opción</button>
                </div>
              )}

              {draft.type === 'true_false' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">Respuesta correcta</label>
                  <div className="flex gap-2">
                    <button onClick={() => setDraft({ ...draft, tfAnswer: true })} className={`flex-1 py-2.5 rounded-xl border font-semibold text-[14px] ${draft.tfAnswer ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>Verdadero</button>
                    <button onClick={() => setDraft({ ...draft, tfAnswer: false })} className={`flex-1 py-2.5 rounded-xl border font-semibold text-[14px] ${!draft.tfAnswer ? 'bg-red-50 border-red-300 text-red-600' : 'border-slate-200 text-slate-500'}`}>Falso</button>
                  </div>
                </div>
              )}

              {draft.type === 'open' && (
                <>
                  <Field label="Respuesta correcta" value={draft.openAnswer} onChange={v => setDraft({ ...draft, openAnswer: v })} />
                  <Field label="Otras respuestas aceptadas (separadas por coma)" value={draft.openAccept} onChange={v => setDraft({ ...draft, openAccept: v })} placeholder="sinónimo1, sinónimo2" />
                </>
              )}

              {draft.type === 'fill_blank' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Respuestas de los espacios (en orden)</label>
                  <div className="space-y-2">
                    {draft.blanks.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-400 w-5">{idx + 1}.</span>
                        <input value={b} onChange={e => { const a = [...draft.blanks]; a[idx] = e.target.value; setDraft({ ...draft, blanks: a }) }}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-brand-400" />
                        {draft.blanks.length > 1 && <button onClick={() => setDraft({ ...draft, blanks: draft.blanks.filter((_, k) => k !== idx) })} className="p-1 text-slate-300 hover:text-red-400"><X size={14} /></button>}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDraft({ ...draft, blanks: [...draft.blanks, ''] })} className="mt-2 text-[12px] text-brand-600 font-semibold">+ Agregar espacio</button>
                </div>
              )}

              {draft.type === 'match' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Pares a relacionar</label>
                  <div className="space-y-2">
                    {draft.pairs.map((pr, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input value={pr.left} onChange={e => { const a = [...draft.pairs]; a[idx] = { ...a[idx], left: e.target.value }; setDraft({ ...draft, pairs: a }) }} placeholder="Columna A" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
                        <span className="text-slate-300">↔</span>
                        <input value={pr.right} onChange={e => { const a = [...draft.pairs]; a[idx] = { ...a[idx], right: e.target.value }; setDraft({ ...draft, pairs: a }) }} placeholder="Columna B" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
                        {draft.pairs.length > 2 && <button onClick={() => setDraft({ ...draft, pairs: draft.pairs.filter((_, k) => k !== idx) })} className="p-1 text-slate-300 hover:text-red-400"><X size={14} /></button>}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDraft({ ...draft, pairs: [...draft.pairs, { left: '', right: '' }] })} className="mt-2 text-[12px] text-brand-600 font-semibold">+ Agregar par</button>
                </div>
              )}

              {draft.type === 'order' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Elementos en el orden correcto</label>
                  <div className="space-y-2">
                    {draft.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-400 w-5">{idx + 1}.</span>
                        <input value={it} onChange={e => { const a = [...draft.items]; a[idx] = e.target.value; setDraft({ ...draft, items: a }) }}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
                        {draft.items.length > 2 && <button onClick={() => setDraft({ ...draft, items: draft.items.filter((_, k) => k !== idx) })} className="p-1 text-slate-300 hover:text-red-400"><X size={14} /></button>}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDraft({ ...draft, items: [...draft.items, ''] })} className="mt-2 text-[12px] text-brand-600 font-semibold">+ Agregar elemento</button>
                </div>
              )}

              {err && <p className="text-[13px] text-red-500">{err}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setDraft(null)} disabled={pending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50">Cancelar</button>
              <button onClick={save} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] disabled:opacity-60">
                <Check size={16} /> {pending ? 'Guardando…' : draft.id ? 'Guardar' : 'Agregar'}
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
