'use client'
// Gestión completa de contenido de un curso: asignaturas, clases, material, exámenes
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, ChevronDown, ChevronRight, Trash2, Edit3,
  PlayCircle, FileText, Link2, FileArchive, File, Save,
  GraduationCap, ClipboardList, Timer, Trophy, BookOpen,
  Folder, Video, Upload, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  upsertSubject, upsertLesson, upsertMaterial, deleteMaterial,
  upsertExam, upsertQuestion, deleteQuestion,
  softDeleteLesson, reorderLesson
} from '@/lib/actions'
import type { Course, Subject, Lesson, LessonMaterial, Exam, ExamQuestion } from '@/types'

interface Props {
  course: Course
  subjects: Subject[]
  lessons: Lesson[]
  materials: Record<string, LessonMaterial[]>
  exams: Exam[]
  examQuestions: Record<string, ExamQuestion[]>
}

const inputCls = "w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all bg-slate-50"
const labelCls = "text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block"

export default function CourseContentAdmin({ course, subjects: initSubjects, lessons: initLessons, materials: initMaterials, exams: initExams, examQuestions: initQuestions }: Props) {
  const router    = useRouter()
  const [isPending, start] = useTransition()

  // ── Tabs ───────────────────────────────────────────────────────
  const [tab, setTab] = useState<'clases' | 'examenes'>('clases')

  // ── Subject modal ──────────────────────────────────────────────
  const [subjectModal, setSubjectModal] = useState(false)
  const [subjectForm, setSubjectForm]   = useState({ title: '', description: '' })
  const [subjectError, setSubjectError] = useState('')

  const saveSubject = () => {
    if (!subjectForm.title) { setSubjectError('El título es requerido'); return }
    setSubjectError('')
    start(async () => {
      await upsertSubject({ course_id: course.id, title: subjectForm.title, description: subjectForm.description, position: initSubjects.length })
      setSubjectModal(false)
      setSubjectForm({ title: '', description: '' })
      router.refresh()
    })
  }

  // ── Lesson modal ───────────────────────────────────────────────
  const [lessonModal, setLessonModal]     = useState(false)
  const [lessonSubject, setLessonSubject] = useState<string | null>(null)
  const [lessonForm, setLessonForm]       = useState({
    title: '', description: '', video_url: '', duration_sec: '', is_free: false
  })
  const [lessonError, setLessonError]     = useState('')
  const [lessonEditId, setLessonEditId]   = useState<string | null>(null)

  const openLessonModal = (subjectId: string | null) => {
    setLessonEditId(null)
    setLessonSubject(subjectId)
    setLessonForm({ title: '', description: '', video_url: '', duration_sec: '', is_free: false })
    setLessonError('')
    setLessonModal(true)
  }

  const openLessonEdit = (lesson: Lesson) => {
    setLessonEditId(lesson.id)
    setLessonSubject(lesson.subject_id ?? null)
    setLessonForm({
      title: lesson.title ?? '',
      description: lesson.description ?? '',
      video_url: lesson.video_url ?? '',
      duration_sec: lesson.duration_sec ? String(lesson.duration_sec) : '',
      is_free: lesson.is_free ?? false,
    })
    setLessonError('')
    setLessonModal(true)
  }

  const saveLesson = () => {
    if (!lessonForm.title) { setLessonError('El título es requerido'); return }
    setLessonError('')
    const existing = lessonEditId ? initLessons.find(l => l.id === lessonEditId) : null
    const bySubject = initLessons.filter(l => l.subject_id === lessonSubject)
    start(async () => {
      await upsertLesson({
        ...(lessonEditId ? { id: lessonEditId } : {}),
        course_id: course.id,
        subject_id: lessonSubject,
        title: lessonForm.title,
        description: lessonForm.description,
        video_url: lessonForm.video_url,
        duration_sec: parseInt(lessonForm.duration_sec) || 0,
        position: existing ? existing.position : bySubject.length,
        is_free: lessonForm.is_free,
      })
      setLessonModal(false)
      setLessonEditId(null)
      router.refresh()
    })
  }

  const removeLesson = (id: string) => {
    if (!confirm('¿Eliminar esta clase?\n\nSe ocultará del curso (los alumnos dejarán de verla). Es reversible desde la base de datos.')) return
    start(async () => { await softDeleteLesson(id); router.refresh() })
  }

  const moveLesson = (id: string, dir: -1 | 1) => {
    start(async () => { await reorderLesson(course.id, id, dir); router.refresh() })
  }

  // ── Material modal ─────────────────────────────────────────────
  const [materialModal, setMaterialModal] = useState(false)
  const [materialLesson, setMaterialLesson] = useState<string | null>(null)
  const [matForm, setMatForm] = useState({ title: '', url: '', type: 'pdf' as LessonMaterial['type'] })
  const [matError, setMatError] = useState('')

  const openMaterialModal = (lessonId: string) => {
    setMaterialLesson(lessonId)
    setMatForm({ title: '', url: '', type: 'pdf' })
    setMatError('')
    setMaterialModal(true)
  }

  const saveMaterial = () => {
    if (!matForm.title || !matForm.url) { setMatError('Título y URL son requeridos'); return }
    setMatError('')
    start(async () => {
      await upsertMaterial({ lesson_id: materialLesson!, ...matForm })
      setMaterialModal(false)
      router.refresh()
    })
  }

  const removeMaterial = (id: string, lessonId: string) => {
    start(async () => { await deleteMaterial(id, lessonId); router.refresh() })
  }

  // ── Exam modal ─────────────────────────────────────────────────
  const [examModal, setExamModal]   = useState(false)
  const [examForm, setExamForm]     = useState({ title: '', description: '', duration_min: '60', pass_score: '70', is_published: false })
  const [examError, setExamError]   = useState('')

  const saveExam = () => {
    if (!examForm.title) { setExamError('El título es requerido'); return }
    setExamError('')
    start(async () => {
      await upsertExam({ course_id: course.id, title: examForm.title, description: examForm.description,
        duration_min: parseInt(examForm.duration_min) || 60,
        pass_score: parseInt(examForm.pass_score) || 70,
        is_published: examForm.is_published })
      setExamModal(false)
      setExamForm({ title: '', description: '', duration_min: '60', pass_score: '70', is_published: false })
      router.refresh()
    })
  }

  // ── Question modal ─────────────────────────────────────────────
  const [questionModal, setQuestionModal] = useState(false)
  const [questionExam, setQuestionExam]   = useState<string | null>(null)
  const [qForm, setQForm] = useState({
    question: '', options: ['', '', '', ''], correct_index: 0, explanation: ''
  })
  const [qError, setQError] = useState('')

  const openQuestionModal = (examId: string) => {
    setQuestionExam(examId)
    setQForm({ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' })
    setQError('')
    setQuestionModal(true)
  }

  const saveQuestion = () => {
    if (!qForm.question || qForm.options.some(o => !o)) { setQError('Completa la pregunta y todas las opciones'); return }
    setQError('')
    const qs = initQuestions[questionExam!] ?? []
    start(async () => {
      await upsertQuestion({ exam_id: questionExam!, question: qForm.question,
        options: qForm.options, correct_index: qForm.correct_index,
        explanation: qForm.explanation, position: qs.length })
      setQuestionModal(false)
      router.refresh()
    })
  }

  const removeQuestion = (id: string, examId: string) => {
    start(async () => { await deleteQuestion(id, examId); router.refresh() })
  }

  // ── Collapsibles ───────────────────────────────────────────────
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const matIcon = (type: string) => {
    if (type === 'pdf') return <FileText size={12} className="text-red-500" />
    if (type === 'doc') return <FileText size={12} className="text-blue-500" />
    if (type === 'zip') return <FileArchive size={12} className="text-yellow-500" />
    if (type === 'link') return <Link2 size={12} className="text-brand-500" />
    return <File size={12} className="text-slate-400" />
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="mt-5">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'clases',   label: 'Clases', icon: <BookOpen size={13} /> },
          { key: 'examenes', label: 'Exámenes simulacro', icon: <ClipboardList size={13} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'clases' && (
        <div>
          {/* Asignaturas */}
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
              <Folder size={14} className="text-brand-500" /> Asignaturas
            </h3>
            <button onClick={() => setSubjectModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11.5px] font-semibold transition-colors">
              <Plus size={12} /> Nueva asignatura
            </button>
          </div>

          <div className="space-y-3">
            {/* Asignaturas con sus lecciones */}
            {initSubjects.map(subject => {
              const sLessons = initLessons.filter(l => l.subject_id === subject.id).sort((a, b) => a.position - b.position)
              const isOpen   = expanded.has(subject.id)
              return (
                <div key={subject.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-card">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => toggle(subject.id)}>
                    <Folder size={14} className="text-brand-500 shrink-0" />
                    <span className="flex-1 text-[13px] font-bold text-slate-800">{subject.title}</span>
                    <span className="text-[11px] text-slate-400">{sLessons.length} clases</span>
                    {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </div>
                  {isOpen && (
                    <div className="border-t border-slate-50">
                      {sLessons.map((lesson, i) => (
                        <LessonItem key={lesson.id} lesson={lesson}
                          mats={initMaterials[lesson.id] ?? []}
                          onAddMaterial={() => openMaterialModal(lesson.id)}
                          onRemoveMaterial={removeMaterial}
                          onEdit={() => openLessonEdit(lesson)}
                          onDelete={() => removeLesson(lesson.id)}
                          onMoveUp={() => moveLesson(lesson.id, -1)}
                          onMoveDown={() => moveLesson(lesson.id, 1)}
                          isFirst={i === 0} isLast={i === sLessons.length - 1}
                          pending={isPending}
                          matIcon={matIcon} />
                      ))}
                      <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50">
                        <button onClick={() => openLessonModal(subject.id)}
                          className="flex items-center gap-1.5 text-[12px] text-brand-600 hover:text-brand-700 font-semibold">
                          <Plus size={12} /> Agregar clase
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Sin asignatura */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-card">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => toggle('__general__')}>
                <BookOpen size={14} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-[13px] font-bold text-slate-600">Sin asignatura (General)</span>
                <span className="text-[11px] text-slate-400">{initLessons.filter(l => !l.subject_id).length} clases</span>
                {expanded.has('__general__') ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </div>
              {expanded.has('__general__') && (
                <div className="border-t border-slate-50">
                  {initLessons.filter(l => !l.subject_id).sort((a, b) => a.position - b.position).map((lesson, i, arr) => (
                    <LessonItem key={lesson.id} lesson={lesson}
                      mats={initMaterials[lesson.id] ?? []}
                      onAddMaterial={() => openMaterialModal(lesson.id)}
                      onRemoveMaterial={removeMaterial}
                      onEdit={() => openLessonEdit(lesson)}
                      onDelete={() => removeLesson(lesson.id)}
                      onMoveUp={() => moveLesson(lesson.id, -1)}
                      onMoveDown={() => moveLesson(lesson.id, 1)}
                      isFirst={i === 0} isLast={i === arr.length - 1}
                      pending={isPending}
                      matIcon={matIcon} />
                  ))}
                  <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50">
                    <button onClick={() => openLessonModal(null)}
                      className="flex items-center gap-1.5 text-[12px] text-brand-600 hover:text-brand-700 font-semibold">
                      <Plus size={12} /> Agregar clase
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'examenes' && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-violet-500" /> Exámenes simulacro
            </h3>
            <button onClick={() => setExamModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11.5px] font-semibold transition-colors">
              <Plus size={12} /> Nuevo examen
            </button>
          </div>

          <div className="space-y-3">
            {initExams.map(exam => {
              const qs    = initQuestions[exam.id] ?? []
              const isOpen = expanded.has(`exam-${exam.id}`)
              return (
                <div key={exam.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-card">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => toggle(`exam-${exam.id}`)}>
                    <GraduationCap size={14} className="text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-slate-800">{exam.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400"><Timer size={9} className="inline" /> {exam.duration_min} min</span>
                        <span className="text-[10px] text-slate-400"><Trophy size={9} className="inline" /> Aprueba con {exam.pass_score}%</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${exam.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {exam.is_published ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{qs.length} preguntas</span>
                    {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </div>
                  {isOpen && (
                    <div className="border-t border-slate-50">
                      {qs.map((q, i) => (
                        <div key={q.id} className="px-4 py-3 border-b border-slate-50 flex gap-3">
                          <span className="text-[10px] text-slate-300 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-medium text-slate-700 mb-1">{q.question}</p>
                            <div className="grid grid-cols-2 gap-1">
                              {q.options.map((opt, oi) => (
                                <span key={oi} className={`text-[11px] px-2 py-1 rounded-lg ${oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-slate-50 text-slate-500'}`}>
                                  {oi === q.correct_index ? '✓ ' : ''}{opt}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => removeQuestion(q.id, exam.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <div className="px-4 py-2.5 bg-slate-50/50">
                        <button onClick={() => openQuestionModal(exam.id)}
                          className="flex items-center gap-1.5 text-[12px] text-violet-600 hover:text-violet-700 font-semibold">
                          <Plus size={12} /> Agregar pregunta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {initExams.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-100 py-10 text-center">
                <GraduationCap size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[13px] text-slate-400">No hay exámenes. Crea el primero.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Nueva asignatura ─────────────────────────────── */}
      <Modal open={subjectModal} onClose={() => setSubjectModal(false)} title="Nueva asignatura">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input value={subjectForm.title} onChange={e => setSubjectForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Álgebra Básica" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea value={subjectForm.description} onChange={e => setSubjectForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className={inputCls + ' resize-none'} placeholder="Descripción opcional..." />
          </div>
          {subjectError && <p className="text-red-600 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{subjectError}</p>}
          <ModalButtons onCancel={() => setSubjectModal(false)} onSave={saveSubject} pending={isPending} />
        </div>
      </Modal>

      {/* ── Modal: Nueva / Editar clase ─────────────────────────── */}
      <Modal open={lessonModal} onClose={() => { setLessonModal(false); setLessonEditId(null) }} title={lessonEditId ? 'Editar clase' : 'Nueva clase'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Título *</label>
            <input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Introducción al cálculo" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className={labelCls}>URL del video</label>
            <input value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=... o Vimeo" className={inputCls} />
            <p className="text-[10px] text-slate-400 mt-1">Acepta YouTube y Vimeo</p>
          </div>
          <div>
            <label className={labelCls}>Duración (segundos)</label>
            <input type="number" min="0" value={lessonForm.duration_sec}
              onChange={e => setLessonForm(f => ({ ...f, duration_sec: e.target.value }))} className={inputCls} placeholder="300" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={lessonForm.is_free} onChange={e => setLessonForm(f => ({ ...f, is_free: e.target.checked }))}
              className="w-4 h-4 rounded accent-brand-600" />
            <span className="text-[13px] text-slate-700 font-medium">Clase gratuita (preview)</span>
          </label>
          {lessonError && <p className="text-red-600 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{lessonError}</p>}
          <ModalButtons onCancel={() => { setLessonModal(false); setLessonEditId(null) }} onSave={saveLesson} pending={isPending} saveLabel={lessonEditId ? 'Guardar cambios' : 'Crear clase'} />
        </div>
      </Modal>

      {/* ── Modal: Agregar material ─────────────────────────────── */}
      <Modal open={materialModal} onClose={() => setMaterialModal(false)} title="Agregar material">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nombre del recurso *</label>
            <input value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Guía de estudio PDF" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>URL del recurso *</label>
            <input value={matForm.url} onChange={e => setMatForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://drive.google.com/..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select value={matForm.type} onChange={e => setMatForm(f => ({ ...f, type: e.target.value as LessonMaterial['type'] }))} className={inputCls}>
              <option value="pdf">PDF</option>
              <option value="doc">Documento Word</option>
              <option value="zip">ZIP / Comprimido</option>
              <option value="link">Enlace web</option>
              <option value="other">Otro</option>
            </select>
          </div>
          {matError && <p className="text-red-600 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{matError}</p>}
          <ModalButtons onCancel={() => setMaterialModal(false)} onSave={saveMaterial} pending={isPending} />
        </div>
      </Modal>

      {/* ── Modal: Nuevo examen ─────────────────────────────────── */}
      <Modal open={examModal} onClose={() => setExamModal(false)} title="Nuevo examen simulacro">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Título *</label>
            <input value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Examen de admisión UNAM" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Duración (minutos)</label>
              <input type="number" min="1" value={examForm.duration_min}
                onChange={e => setExamForm(f => ({ ...f, duration_min: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Puntaje mínimo (%)</label>
              <input type="number" min="1" max="100" value={examForm.pass_score}
                onChange={e => setExamForm(f => ({ ...f, pass_score: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={examForm.is_published} onChange={e => setExamForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded accent-violet-600" />
            <span className="text-[13px] text-slate-700 font-medium">Publicar examen (visible para alumnos)</span>
          </label>
          {examError && <p className="text-red-600 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{examError}</p>}
          <ModalButtons onCancel={() => setExamModal(false)} onSave={saveExam} pending={isPending} saveLabel="Crear examen" />
        </div>
      </Modal>

      {/* ── Modal: Nueva pregunta ───────────────────────────────── */}
      <Modal open={questionModal} onClose={() => setQuestionModal(false)} title="Nueva pregunta">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Pregunta *</label>
            <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))}
              rows={2} className={inputCls + ' resize-none'} placeholder="¿Cuál es la derivada de x²?" />
          </div>
          <div>
            <label className={labelCls}>Opciones (marca la correcta)</label>
            <div className="space-y-2">
              {qForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={qForm.correct_index === i}
                    onChange={() => setQForm(f => ({ ...f, correct_index: i }))}
                    className="w-4 h-4 accent-emerald-600 shrink-0" />
                  <input value={opt} onChange={e => setQForm(f => { const o = [...f.options]; o[i] = e.target.value; return { ...f, options: o } })}
                    placeholder={`Opción ${i + 1}`} className={inputCls + ' flex-1'} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Selecciona el radio de la respuesta correcta</p>
          </div>
          <div>
            <label className={labelCls}>Explicación (opcional)</label>
            <textarea value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))}
              rows={2} className={inputCls + ' resize-none'} placeholder="Explicación de la respuesta correcta..." />
          </div>
          {qError && <p className="text-red-600 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{qError}</p>}
          <ModalButtons onCancel={() => setQuestionModal(false)} onSave={saveQuestion} pending={isPending} saveLabel="Agregar pregunta" />
        </div>
      </Modal>
    </div>
  )
}

// ── Lesson Item ──────────────────────────────────────────────────
function LessonItem({ lesson, mats, onAddMaterial, onRemoveMaterial, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast, pending, matIcon }: {
  lesson: Lesson; mats: LessonMaterial[]
  onAddMaterial: () => void; onRemoveMaterial: (id: string, lessonId: string) => void
  onEdit: () => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void
  isFirst: boolean; isLast: boolean; pending: boolean
  matIcon: (type: string) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const hasVideo = Boolean(lesson.video_url)
  return (
    <div className="border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors">
        <PlayCircle size={13} className={hasVideo ? 'text-brand-500 shrink-0' : 'text-slate-300 shrink-0'} />
        <div className="flex-1 min-w-0">
          <span className="text-[12.5px] text-slate-700 font-medium block truncate">{lesson.title}</span>
          {hasVideo
            ? <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate"><Video size={9} /> {lesson.video_url}</span>
            : <span className="text-[10px] text-amber-500">Sin video</span>}
        </div>
        {mats.length > 0 && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
            <FileText size={9} /> {mats.length}
          </span>
        )}
        {/* Reordenar */}
        <button onClick={onMoveUp} disabled={isFirst || pending} title="Subir"
          className="p-1.5 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
          <ArrowUp size={13} />
        </button>
        <button onClick={onMoveDown} disabled={isLast || pending} title="Bajar"
          className="p-1.5 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
          <ArrowDown size={13} />
        </button>
        {/* Editar (cambiar link, título, etc.) */}
        <button onClick={onEdit} disabled={pending} title="Editar clase / cambiar video"
          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
          <Edit3 size={13} />
        </button>
        {/* Eliminar */}
        <button onClick={onDelete} disabled={pending} title="Eliminar clase"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={13} />
        </button>
        <button onClick={() => setOpen(v => !v)}
          className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 shrink-0">
          Material {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <button onClick={onAddMaterial}
          className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
          <Plus size={12} />
        </button>
      </div>
      {open && mats.length > 0 && (
        <div className="px-10 pb-2.5 space-y-1.5">
          {mats.map(mat => (
            <div key={mat.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
              {matIcon(mat.type)}
              <span className="flex-1 text-[11.5px] text-slate-600 truncate">{mat.title}</span>
              <button onClick={() => onRemoveMaterial(mat.id, lesson.id)}
                className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal wrapper ────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function ModalButtons({ onCancel, onSave, pending, saveLabel = 'Guardar' }: {
  onCancel: () => void; onSave: () => void; pending?: boolean; saveLabel?: string
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-colors">
        Cancelar
      </button>
      <button type="button" onClick={onSave} disabled={pending}
        className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[13px] font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {pending ? 'Guardando...' : <><Save size={13} /> {saveLabel}</>}
      </button>
    </div>
  )
}
