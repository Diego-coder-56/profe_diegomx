// lib/quiz.ts — Constructor de quiz (8 tipos) + calificación + persistencia
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

export type QuestionType =
  | 'multiple_choice' | 'true_false' | 'open' | 'fill_blank'
  | 'match' | 'order' | 'image' | 'math_latex'

export const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Opción múltiple',
  true_false: 'Verdadero / Falso',
  open: 'Respuesta abierta',
  fill_blank: 'Completar espacios',
  match: 'Relacionar columnas',
  order: 'Ordenar (arrastrar)',
  image: 'Pregunta con imagen',
  math_latex: 'Matemáticas (LaTeX)',
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  type: QuestionType
  prompt: string
  image_url: string | null
  payload: any
  position: number
}
export interface Quiz {
  id: string; title: string; description: string | null; subject: string | null
  is_published: boolean; time_limit_sec: number | null; created_at: string; updated_at: string
}
export interface QuizWithQuestions extends Quiz { questions: QuizQuestion[] }

// ── Normalización de texto para respuestas abiertas / espacios ─────
export function norm(s: string): string {
  return (s ?? '')
    .toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // quita acentos
    .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')         // quita puntuación, colapsa espacios
}

/** Calificación pura por tipo. answer viene del alumno; devuelve true/false. */
export function gradeQuestion(type: QuestionType, payload: any, answer: any): boolean {
  switch (type) {
    case 'multiple_choice':
    case 'image':
    case 'math_latex':
      return Number(answer) === Number(payload?.correct)
    case 'true_false':
      return Boolean(answer) === Boolean(payload?.answer)
    case 'open': {
      const accepted = [payload?.answer, ...(payload?.accept ?? [])].filter(Boolean).map(norm)
      return accepted.includes(norm(answer))
    }
    case 'fill_blank': {
      const blanks: string[] = payload?.blanks ?? []
      const ans: string[] = Array.isArray(answer) ? answer : []
      if (ans.length !== blanks.length || blanks.length === 0) return false
      return blanks.every((b, i) => norm(b) === norm(ans[i] ?? ''))
    }
    case 'match': {
      // answer[i] = índice de la columna derecha elegido para el izquierdo i.
      const pairs = payload?.pairs ?? []
      const ans: number[] = Array.isArray(answer) ? answer : []
      if (ans.length !== pairs.length || pairs.length === 0) return false
      return ans.every((v, i) => Number(v) === i)
    }
    case 'order': {
      // answer = índices originales en el orden propuesto por el alumno.
      const items = payload?.items ?? []
      const ans: number[] = Array.isArray(answer) ? answer : []
      if (ans.length !== items.length || items.length === 0) return false
      return ans.every((v, i) => Number(v) === i)
    }
    default:
      return false
  }
}

// ═══════════════════ Servicios (Supabase) ═══════════════════════════
export async function listQuizzes(publishedOnly = false, ownerId?: string): Promise<Quiz[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb = getSupabase()!
    let q = sb.from('quizzes').select('*').order('created_at', { ascending: false })
    if (publishedOnly) q = q.eq('is_published', true)
    if (ownerId) q = q.eq('created_by', ownerId)
    const { data } = await q
    return (data ?? []) as Quiz[]
  } catch { return [] }
}

/** Dueño de un quiz (para validar permisos del profesor). */
export async function getQuizOwner(id: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data } = await getSupabase()!.from('quizzes').select('created_by').eq('id', id).maybeSingle()
    return (data?.created_by as string) ?? null
  } catch { return null }
}

export async function getQuiz(id: string): Promise<QuizWithQuestions | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const sb = getSupabase()!
    const { data: quiz } = await sb.from('quizzes').select('*').eq('id', id).maybeSingle()
    if (!quiz) return null
    const { data: questions } = await sb.from('quiz_questions').select('*').eq('quiz_id', id).order('position')
    return { ...(quiz as Quiz), questions: (questions ?? []) as QuizQuestion[] }
  } catch { return null }
}

export async function createQuiz(data: { title: string; description?: string; subject?: string; createdBy?: string }): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const sb = getSupabase()!
  const { data: row } = await sb.from('quizzes').insert({ title: data.title, description: data.description ?? null, subject: data.subject ?? null, created_by: data.createdBy ?? null }).select('id').single()
  return row?.id ?? null
}
export async function updateQuiz(id: string, data: { title?: string; description?: string; subject?: string; is_published?: boolean; time_limit_sec?: number | null }): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase()!.from('quizzes').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
}
export async function deleteQuiz(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase()!.from('quizzes').delete().eq('id', id)
}

export async function addQuestion(quizId: string, q: { type: QuestionType; prompt: string; image_url?: string | null; payload: any }): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabase()!
  const { count } = await sb.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('quiz_id', quizId)
  await sb.from('quiz_questions').insert({ quiz_id: quizId, type: q.type, prompt: q.prompt, image_url: q.image_url ?? null, payload: q.payload, position: count ?? 0 })
}
export async function updateQuestion(id: string, q: { type: QuestionType; prompt: string; image_url?: string | null; payload: any }): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase()!.from('quiz_questions').update({ type: q.type, prompt: q.prompt, image_url: q.image_url ?? null, payload: q.payload }).eq('id', id)
}
export async function deleteQuestion(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase()!.from('quiz_questions').delete().eq('id', id)
}

/** Califica en el servidor (nunca confiar en el cliente) y registra el intento. */
export async function gradeAndRecord(userId: string, quizId: string, answers: Record<string, any>): Promise<{ score: number; total: number; results: Record<string, boolean> }> {
  const quiz = await getQuiz(quizId)
  if (!quiz) return { score: 0, total: 0, results: {} }
  const results: Record<string, boolean> = {}
  let score = 0
  for (const q of quiz.questions) {
    const ok = gradeQuestion(q.type, q.payload, answers[q.id])
    results[q.id] = ok
    if (ok) score++
  }
  const total = quiz.questions.length
  if (isSupabaseConfigured()) {
    try { await getSupabase()!.from('quiz_attempts').insert({ user_id: userId, quiz_id: quizId, score, total }) } catch { /* noop */ }
  }
  return { score, total, results }
}

// ── Versión "para jugar": sin respuestas, con opciones barajadas ───
export interface PlayerQuestion {
  id: string; type: QuestionType; prompt: string; image_url: string | null; view: any
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
/** Convierte las preguntas a una forma segura para el cliente (sin filtrar la respuesta correcta). */
export function toPlayerQuestions(quiz: QuizWithQuestions): PlayerQuestion[] {
  return quiz.questions.map(q => {
    const p = q.payload ?? {}
    let view: any = {}
    switch (q.type) {
      case 'multiple_choice': case 'image': case 'math_latex':
        view = { options: p.options ?? [], optionImages: p.optionImages ?? [] }; break
      case 'fill_blank':
        view = { count: (q.prompt.match(/___/g) ?? []).length || (p.blanks ?? []).length }; break
      case 'match':
        view = {
          lefts: (p.pairs ?? []).map((x: any) => x.left),
          rights: shuffle((p.pairs ?? []).map((x: any, i: number) => ({ text: x.right, orig: i }))),
        }; break
      case 'order':
        view = { items: shuffle((p.items ?? []).map((t: string, i: number) => ({ text: t, orig: i }))) }; break
      default:
        view = {}
    }
    return { id: q.id, type: q.type, prompt: q.prompt, image_url: q.image_url, view }
  })
}
