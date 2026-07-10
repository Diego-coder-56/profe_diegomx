'use server'
/**
 * lib/actions.ts — Server Actions (sin Supabase)
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession, SESSION_COOKIE } from '@/lib/session'
import { awardXp } from '@/lib/gamification'
import { reviewCard, type Grade } from '@/lib/flashcards'
import {
  getUserById, updateUser, listUsers,
  grantAccess, revokeAccess, getUserCourseIds,
  markLessonComplete as dbMarkLessonComplete,
  upsertCourse as dbUpsertCourse,
} from '@/lib/db'
import type { Role } from '@/types'

// ── Helper admin ────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  if (session.role !== 'admin') throw new Error('Sin permisos de administrador')
  return session
}

// ── Cambiar rol ─────────────────────────────────────────────────
export async function updateUserRole(userId: string, newRole: Role) {
  await requireAdmin()
  await updateUser(userId, { role: newRole })
  revalidatePath('/admin')
  return { success: true }
}

// ── Activar / desactivar ────────────────────────────────────────
export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin()
  await updateUser(userId, { is_active: isActive })
  revalidatePath('/admin')
  return { success: true }
}

// ── Dar acceso a un curso ───────────────────────────────────────
export async function grantCourseAccess(userId: string, courseId: string) {
  const admin = await requireAdmin()
  await grantAccess(userId, courseId, admin.sub)
  revalidatePath('/admin')
  return { success: true }
}

// ── Quitar acceso a un curso ────────────────────────────────────
export async function revokeCourseAccess(userId: string, courseId: string) {
  await requireAdmin()
  await revokeAccess(userId, courseId)
  revalidatePath('/admin')
  return { success: true }
}

// ── Marcar lección como completada (alumno) ─────────────────────
export async function markLessonComplete(lessonId: string) {  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  await dbMarkLessonComplete(session.sub, lessonId)
  await awardXp(session.sub, 'video', { email: session.email })   // +20 XP (gamificación)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function reviewFlashcard(cardId: string, grade: Grade) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  const interval = await reviewCard(session.sub, cardId, grade)
  await awardXp(session.sub, 'flashcards', { email: session.email })   // +15 XP
  return { success: true, interval }
}

// ── Crear / actualizar curso ────────────────────────────────────
export async function upsertCourse(data: {
  id?: string
  title: string
  description?: string
  slug: string
  category?: string
  price?: number
  thumbnail?: string
  is_published?: boolean
}) {
  const s = await requireTeacherOrAdmin()
  await dbUpsertCourse(data)
  await audit(s, data.id ? 'course.updated' : 'course.created', 'course', data.id ?? null, data.title)
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

// ── Cerrar sesión ───────────────────────────────────────────────
export async function signOut() {
  cookies().set({ name: SESSION_COOKIE, value: '', maxAge: 0, path: '/' })
  redirect('/')
}

// ── Asignaturas ─────────────────────────────────────────────────
import {
  upsertSubject as dbUpsertSubject,
  deleteSubject as dbDeleteSubject,
  upsertLesson as dbUpsertLesson,
  upsertMaterial as dbUpsertMaterial,
  deleteMaterial as dbDeleteMaterial,
  upsertExam as dbUpsertExam,
  upsertQuestion as dbUpsertQuestion,
  deleteQuestion as dbDeleteQuestion,
  saveExamAttempt,
} from '@/lib/db'

export async function upsertSubject(data: {
  id?: string; course_id: string; title: string; description?: string; position: number
}) {
  await requireTeacherOrAdmin()
  await dbUpsertSubject({ ...data, description: data.description ?? null })
  revalidatePath('/admin/cursos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSubject(id: string, courseId: string) {
  await requireTeacherOrAdmin()
  await dbDeleteSubject(id, courseId)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function upsertLesson(data: {
  id?: string; course_id: string; subject_id?: string | null
  title: string; description?: string; video_url?: string
  duration_sec?: number; position: number; is_free?: boolean
}) {
  const s = await requireTeacherOrAdmin()
  await dbUpsertLesson({
    course_id: data.course_id,
    subject_id: data.subject_id ?? null,
    title: data.title,
    description: data.description ?? null,
    video_url: data.video_url ?? null,
    duration_sec: data.duration_sec ?? 0,
    position: data.position,
    is_free: data.is_free ?? false,
    ...(data.id ? { id: data.id } : {}),
  })
  await audit(s, data.id ? 'lesson.updated' : 'lesson.created', 'lesson', data.id ?? null, data.title)
  revalidatePath('/admin/cursos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function upsertMaterial(data: {
  id?: string; lesson_id: string; title: string; url: string
  type: 'pdf' | 'doc' | 'zip' | 'link' | 'other'
}) {
  await requireTeacherOrAdmin()
  await dbUpsertMaterial(data)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function deleteMaterial(id: string, lessonId: string) {
  await requireTeacherOrAdmin()
  await dbDeleteMaterial(id, lessonId)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function upsertExam(data: {
  id?: string; course_id: string; title: string; description?: string
  duration_min?: number; pass_score?: number; is_published?: boolean
}) {
  await requireTeacherOrAdmin()
  await dbUpsertExam({ ...data, description: data.description ?? null,
    duration_min: data.duration_min ?? 60, pass_score: data.pass_score ?? 70,
    is_published: data.is_published ?? false })
  revalidatePath('/admin/cursos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function upsertQuestion(data: {
  id?: string; exam_id: string; question: string; options: string[]
  correct_index: number; explanation?: string; position: number
}) {
  await requireTeacherOrAdmin()
  await dbUpsertQuestion({ ...data, explanation: data.explanation ?? null })
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function deleteQuestion(id: string, examId: string) {
  await requireTeacherOrAdmin()
  await dbDeleteQuestion(id, examId)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function submitExamAttempt(data: {
  exam_id: string; answers: number[]; score: number
}) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  const attempt = await saveExamAttempt({
    exam_id: data.exam_id, user_id: session.sub,
    score: data.score, answers: data.answers,
    completed_at: new Date().toISOString(),
  })
  await awardXp(session.sub, 'quiz', { email: session.email })   // +50 XP (gamificación)
  revalidatePath('/dashboard')
  return { success: true, attempt }
}

// ═════════════════════════════════════════════════════════════════
// FASE 2 — Server Actions: soft-delete, reordenar, cupones,
//          profesores y auditoría (todas protegidas por admin)
// ═════════════════════════════════════════════════════════════════
import { headers } from 'next/headers'
import {
  softDeleteCourse as dbSoftDeleteCourse,
  restoreCourse as dbRestoreCourse,
  softDeleteLesson as dbSoftDeleteLesson,
  restoreLesson as dbRestoreLesson,
  reorderLesson as dbReorderLesson,
  upsertCoupon as dbUpsertCoupon,
  deleteCoupon as dbDeleteCoupon,
  validateCoupon as dbValidateCoupon,
  upsertTeacher as dbUpsertTeacher,
  setTeacherActive as dbSetTeacherActive,
  addAuditLog,
} from '@/lib/db'

function clientIp(): string | null {
  const h = headers()
  return h.get('x-nf-client-connection-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || null
}

async function audit(session: { sub: string; email: string }, action: string, entity: string, entityId?: string | null, detail?: string) {
  try {
    await addAuditLog({
      user_id: session.sub, user_email: session.email,
      action, entity, entity_id: entityId ?? null, ip: clientIp(), detail: detail ?? null,
    })
  } catch { /* la auditoría nunca debe romper la acción principal */ }
}

// ── Cursos: eliminar (soft) / restaurar ─────────────────────────
export async function softDeleteCourse(courseId: string) {
  const s = await requireTeacherOrAdmin()
  await dbSoftDeleteCourse(courseId)
  await audit(s, 'course.deleted', 'course', courseId)
  revalidatePath('/admin'); revalidatePath('/admin/cursos'); revalidatePath('/')
  return { success: true }
}
export async function restoreCourse(courseId: string) {
  const s = await requireTeacherOrAdmin()
  await dbRestoreCourse(courseId)
  await audit(s, 'course.restored', 'course', courseId)
  revalidatePath('/admin'); revalidatePath('/admin/cursos'); revalidatePath('/')
  return { success: true }
}

// ── Lecciones: eliminar (soft) / restaurar / reordenar ──────────
export async function softDeleteLesson(lessonId: string) {
  const s = await requireTeacherOrAdmin()
  await dbSoftDeleteLesson(lessonId)
  await audit(s, 'lesson.deleted', 'lesson', lessonId)
  revalidatePath('/admin/cursos'); revalidatePath('/dashboard')
  return { success: true }
}
export async function restoreLesson(lessonId: string) {
  const s = await requireTeacherOrAdmin()
  await dbRestoreLesson(lessonId)
  await audit(s, 'lesson.restored', 'lesson', lessonId)
  revalidatePath('/admin/cursos')
  return { success: true }
}
export async function reorderLesson(courseId: string, lessonId: string, direction: -1 | 1) {
  const s = await requireTeacherOrAdmin()
  await dbReorderLesson(courseId, lessonId, direction)
  await audit(s, 'lesson.reordered', 'lesson', lessonId, `dir=${direction}`)
  revalidatePath('/admin/cursos'); revalidatePath('/dashboard')
  return { success: true }
}

// ── Cupones ─────────────────────────────────────────────────────
export async function upsertCoupon(data: {
  code: string; discount_percent: number; active?: boolean; max_uses?: number | null; expires_at?: string | null
}) {
  const s = await requireTeacherOrAdmin()
  const c = await dbUpsertCoupon(data)
  await audit(s, 'coupon.upserted', 'coupon', c.code, `${c.discount_percent}%`)
  revalidatePath('/admin/cupones')
  return { success: true, coupon: c }
}
export async function deleteCoupon(code: string) {
  const s = await requireTeacherOrAdmin()
  await dbDeleteCoupon(code)
  await audit(s, 'coupon.deleted', 'coupon', code)
  revalidatePath('/admin/cupones')
  return { success: true }
}
/** Pública: valida un cupón sin requerir admin (para el checkout/registro). */
export async function validateCoupon(code: string) {
  return dbValidateCoupon(code)
}

// ── Profesores ──────────────────────────────────────────────────
export async function upsertTeacher(data: {
  id?: string; name: string; email: string; photo_url?: string | null; bio?: string | null; active?: boolean
}) {
  const s = await requireAdmin()
  const t = await dbUpsertTeacher(data)
  await audit(s, data.id ? 'teacher.updated' : 'teacher.created', 'teacher', t.id)
  revalidatePath('/admin/profesores')
  return { success: true, teacher: t }
}
export async function setTeacherActive(id: string, active: boolean) {
  const s = await requireAdmin()
  await dbSetTeacherActive(id, active)
  await audit(s, active ? 'teacher.activated' : 'teacher.deactivated', 'teacher', id)
  revalidatePath('/admin/profesores')
  return { success: true }
}

// ═════════════════════════════════════════════════════════════════
// Constructor de Quiz — Server Actions
// ═════════════════════════════════════════════════════════════════
import {
  createQuiz as qCreate, updateQuiz as qUpdate, deleteQuiz as qDelete,
  addQuestion as qAddQ, updateQuestion as qUpdateQ, deleteQuestion as qDeleteQ,
  gradeAndRecord, getQuizOwner, type QuestionType,
} from '@/lib/quiz'

// Profesores y admin pueden construir quizzes.
async function requireTeacherOrAdmin() {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  if (session.role !== 'admin' && session.role !== 'teacher') throw new Error('Sin permisos')
  return session
}
// El profesor solo edita sus propios quizzes; el admin, todos.
async function assertCanEditQuiz(session: { sub: string; role: string }, quizId: string) {
  if (session.role === 'admin') return
  const owner = await getQuizOwner(quizId)
  if (owner !== session.sub) throw new Error('Solo puedes editar tus propios quizzes')
}

export async function createQuizAction(data: { title: string; description?: string; subject?: string }) {
  const s = await requireTeacherOrAdmin()
  const id = await qCreate({ ...data, createdBy: s.sub })
  await audit(s, 'quiz.created', 'quiz', id, data.title)
  revalidatePath('/admin/quizzes'); revalidatePath('/maestro/quizzes')
  return { success: true, id }
}
export async function updateQuizAction(id: string, data: { title?: string; description?: string; subject?: string; is_published?: boolean; time_limit_sec?: number | null }) {
  const s = await requireTeacherOrAdmin()
  await assertCanEditQuiz(s, id)
  await qUpdate(id, data)
  await audit(s, 'quiz.updated', 'quiz', id)
  revalidatePath('/admin/quizzes'); revalidatePath(`/admin/quizzes/${id}`); revalidatePath('/maestro/quizzes'); revalidatePath(`/maestro/quizzes/${id}`); revalidatePath('/dashboard/quiz')
  return { success: true }
}
export async function deleteQuizAction(id: string) {
  const s = await requireTeacherOrAdmin()
  await assertCanEditQuiz(s, id)
  await qDelete(id)
  await audit(s, 'quiz.deleted', 'quiz', id)
  revalidatePath('/admin/quizzes'); revalidatePath('/maestro/quizzes')
  return { success: true }
}
export async function addQuestionAction(quizId: string, q: { type: QuestionType; prompt: string; image_url?: string | null; payload: any }) {
  const s = await requireTeacherOrAdmin()
  await assertCanEditQuiz(s, quizId)
  await qAddQ(quizId, q)
  revalidatePath(`/admin/quizzes/${quizId}`); revalidatePath(`/maestro/quizzes/${quizId}`)
  return { success: true }
}
export async function updateQuestionAction(quizId: string, id: string, q: { type: QuestionType; prompt: string; image_url?: string | null; payload: any }) {
  const s = await requireTeacherOrAdmin()
  await assertCanEditQuiz(s, quizId)
  await qUpdateQ(id, q)
  revalidatePath(`/admin/quizzes/${quizId}`); revalidatePath(`/maestro/quizzes/${quizId}`)
  return { success: true }
}
export async function deleteQuestionAction(quizId: string, id: string) {
  const s = await requireTeacherOrAdmin()
  await assertCanEditQuiz(s, quizId)
  await qDeleteQ(id)
  revalidatePath(`/admin/quizzes/${quizId}`); revalidatePath(`/maestro/quizzes/${quizId}`)
  return { success: true }
}

/** El alumno envía respuestas; se califican en el servidor y se otorga XP. */
export async function submitQuizAction(quizId: string, answers: Record<string, any>) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  const result = await gradeAndRecord(session.sub, quizId, answers)
  await awardXp(session.sub, 'quiz', { email: session.email })   // +50 XP
  return { success: true, ...result }
}

import { claimChallenge } from '@/lib/challenges'
export async function claimChallengeAction(key: string) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  const r = await claimChallenge(session.sub, key, session.email)
  revalidatePath('/dashboard/retos'); revalidatePath('/dashboard')
  return r
}

import { askTutor, type TutorMode } from '@/lib/tutor'
export async function tutorAskAction(question: string, mode: TutorMode) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  return askTutor(question, mode)
}

import { recordPayment } from '@/lib/payments'
export async function recordPaymentAction(userId: string, data: {
  amount: number; method?: string; concept?: string; months?: number; paid_at?: string; notes?: string
}) {
  const s = await requireAdmin()
  const r = await recordPayment(userId, data)
  await audit(s, 'payment.recorded', 'payment', userId, `$${data.amount}`)
  revalidatePath('/admin/pagos'); revalidatePath('/dashboard'); revalidatePath('/dashboard/membresia')
  return r
}

import { createUserFlashcard, deleteUserFlashcard, setFlashcardShared } from '@/lib/flashcards'
export async function createMyFlashcardAction(data: { subject: string; front: string; back: string; hint?: string; shared?: boolean }) {
  const s = await getSession(); if (!s) throw new Error('No autenticado')
  await createUserFlashcard(s.sub, data)
  revalidatePath('/dashboard/flashcards/mis'); revalidatePath('/dashboard/flashcards')
  return { success: true }
}
export async function deleteMyFlashcardAction(id: string) {
  const s = await getSession(); if (!s) throw new Error('No autenticado')
  await deleteUserFlashcard(s.sub, id)
  revalidatePath('/dashboard/flashcards/mis')
  return { success: true }
}
export async function shareMyFlashcardAction(id: string, shared: boolean) {
  const s = await getSession(); if (!s) throw new Error('No autenticado')
  await setFlashcardShared(s.sub, id, shared)
  revalidatePath('/dashboard/flashcards/mis')
  return { success: true }
}
