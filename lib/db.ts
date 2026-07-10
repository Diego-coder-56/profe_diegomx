/**
 * lib/db.ts
 * ──────────────────────────────────────────────────────────────────
 * Capa de base de datos sin Supabase.
 *
 * EN PRODUCCIÓN (Netlify):  usa @netlify/blobs  (cero setup externo)
 * EN DESARROLLO LOCAL:      usa .data/db.json   (npm run dev funciona directo)
 *
 * Estructura de claves en el store:
 *   user:{id}                 → StoredUser
 *   user-email:{email}        → string (id del usuario)
 *   users-index               → string[] (todos los IDs)
 *   course:{id}               → Course
 *   course-slug:{slug}        → string (id del curso)
 *   courses-index             → string[] (todos los IDs)
 *   lesson:{id}               → Lesson
 *   lessons-by-course:{cid}   → string[] (IDs de lecciones del curso)
 *   access:{uid}:{cid}        → CourseAccess
 *   access-by-user:{uid}      → string[] (courseIds del usuario)
 *   progress:{uid}:{lid}      → LessonProgress
 *   seeded                    → "1" (flag para no re-sembrar)
 */

import type { Profile, Course, Lesson, CourseAccess, LessonProgress } from '@/types'
import fs from 'fs'
import path from 'path'

// ── Stored user incluye el hash de contraseña ──────────────────────
export interface StoredUser extends Profile {
  password_hash: string
}

// ─────────────────────────────────────────────────────────────────
// Adaptador de almacenamiento (Netlify Blobs vs archivo local)
// ─────────────────────────────────────────────────────────────────

const IS_NETLIFY = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY
const LOCAL_DB = path.join(process.cwd(), '.data', 'db.json')

// ── Local (desarrollo) ─────────────────────────────────────────────
function ensureLocal() {
  const dir = path.dirname(LOCAL_DB)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(LOCAL_DB)) fs.writeFileSync(LOCAL_DB, '{}', 'utf-8')
}
function lGet(key: string): unknown | null {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  return key in db ? db[key] : null
}
function lSet(key: string, val: unknown) {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  db[key] = val
  fs.writeFileSync(LOCAL_DB, JSON.stringify(db, null, 2), 'utf-8')
}
function lDel(key: string) {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  delete db[key]
  fs.writeFileSync(LOCAL_DB, JSON.stringify(db, null, 2), 'utf-8')
}
function lList(prefix: string): string[] {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  return Object.keys(db).filter(k => k.startsWith(prefix))
}

// ── Unificado ──────────────────────────────────────────────────────
async function kGet<T>(key: string): Promise<T | null> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    return (await store.get(key, { type: 'json' })) as T | null
  }
  return lGet(key) as T | null
}
async function kSet(key: string, val: unknown): Promise<void> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    await store.setJSON(key, val)
    return
  }
  lSet(key, val)
}
async function kDel(key: string): Promise<void> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    await store.delete(key)
    return
  }
  lDel(key)
}
async function kList(prefix: string): Promise<string[]> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    const result = await store.list({ prefix })
    return result.blobs.map((b: { key: string }) => b.key)
  }
  return lList(prefix)
}

// ─────────────────────────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<StoredUser | null> {
  return kGet<StoredUser>(`user:${id}`)
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const id = await kGet<string>(`user-email:${email.toLowerCase()}`)
  if (!id) return null
  return getUserById(id)
}

export async function createUser(user: StoredUser): Promise<void> {
  await kSet(`user:${user.id}`, user)
  await kSet(`user-email:${user.email.toLowerCase()}`, user.id)
  // actualizar índice
  const idx = (await kGet<string[]>('users-index')) ?? []
  if (!idx.includes(user.id)) idx.push(user.id)
  await kSet('users-index', idx)
}

export async function updateUser(id: string, data: Partial<StoredUser>): Promise<void> {
  const user = await getUserById(id)
  if (!user) throw new Error('Usuario no encontrado')
  const updated: StoredUser = { ...user, ...data, id, updated_at: new Date().toISOString() }
  await kSet(`user:${id}`, updated)
}

export async function listUsers(): Promise<StoredUser[]> {
  const idx = (await kGet<string[]>('users-index')) ?? []
  const users = await Promise.all(idx.map(id => getUserById(id)))
  return users.filter(Boolean) as StoredUser[]
}

// ─────────────────────────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────────────────────────

export async function getCourseById(id: string): Promise<Course | null> {
  return kGet<Course>(`course:${id}`)
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const id = await kGet<string>(`course-slug:${slug}`)
  if (!id) return null
  return getCourseById(id)
}

export async function listCourses(publishedOnly = false, includeDeleted = false): Promise<Course[]> {
  const idx = (await kGet<string[]>('courses-index')) ?? []
  const courses = await Promise.all(idx.map(id => getCourseById(id)))
  let all = courses.filter(Boolean) as Course[]
  if (!includeDeleted) all = all.filter(c => !c.deleted)   // compatibilidad: ausente = no borrado
  return publishedOnly ? all.filter(c => c.is_published) : all
}

export async function upsertCourse(data: Partial<Course> & { id?: string; slug: string; title: string }): Promise<Course> {
  const existing = data.id ? await getCourseById(data.id) : null
  const now = new Date().toISOString()
  const course: Course = {
    id: data.id ?? crypto.randomUUID(),
    title: data.title,
    description: data.description ?? null,
    slug: data.slug,
    thumbnail: data.thumbnail ?? null,
    category: data.category ?? null,
    price: data.price ?? 0,
    is_published: data.is_published ?? false,
    color: data.color ?? existing?.color ?? null,
    deleted: existing?.deleted ?? false,
    deleted_at: existing?.deleted_at ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  }
  await kSet(`course:${course.id}`, course)
  await kSet(`course-slug:${course.slug}`, course.id)
  const idx = (await kGet<string[]>('courses-index')) ?? []
  if (!idx.includes(course.id)) {
    idx.push(course.id)
    await kSet('courses-index', idx)
  }
  return course
}

// ─────────────────────────────────────────────────────────────────
// LECCIONES
// ─────────────────────────────────────────────────────────────────

export async function getLessonById(id: string): Promise<Lesson | null> {
  return kGet<Lesson>(`lesson:${id}`)
}

export async function getLessonsByCourse(courseId: string, includeDeleted = false): Promise<Lesson[]> {
  const ids = (await kGet<string[]>(`lessons-by-course:${courseId}`)) ?? []
  const lessons = await Promise.all(ids.map(id => getLessonById(id)))
  let all = lessons.filter(Boolean) as Lesson[]
  if (!includeDeleted) all = all.filter(l => !l.deleted)   // compatibilidad: ausente = no borrado
  return all.sort((a, b) => a.position - b.position)
}

export async function upsertLesson(data: Omit<Lesson, 'created_at'> & { id?: string }): Promise<Lesson> {
  const existing = data.id ? await getLessonById(data.id) : null
  const now = new Date().toISOString()
  const lesson: Lesson = {
    id: data.id ?? crypto.randomUUID(),
    course_id: data.course_id,
    subject_id: data.subject_id ?? existing?.subject_id ?? null,
    title: data.title,
    description: data.description ?? null,
    video_url: data.video_url ?? null,
    duration_sec: data.duration_sec ?? 0,
    position: data.position,
    is_free: data.is_free ?? false,
    deleted: existing?.deleted ?? false,
    deleted_at: existing?.deleted_at ?? null,
    created_at: existing?.created_at ?? now,
  }
  await kSet(`lesson:${lesson.id}`, lesson)
  // actualizar índice del curso
  const ids = (await kGet<string[]>(`lessons-by-course:${lesson.course_id}`)) ?? []
  if (!ids.includes(lesson.id)) {
    ids.push(lesson.id)
    await kSet(`lessons-by-course:${lesson.course_id}`, ids)
  }
  return lesson
}

// ─────────────────────────────────────────────────────────────────
// ACCESO A CURSOS
// ─────────────────────────────────────────────────────────────────

export async function hasAccess(userId: string, courseId: string): Promise<boolean> {
  const rec = await kGet(`access:${userId}:${courseId}`)
  return rec !== null
}

export async function grantAccess(userId: string, courseId: string, grantedBy: string): Promise<void> {
  const rec: CourseAccess = {
    id: crypto.randomUUID(),
    user_id: userId,
    course_id: courseId,
    granted_by: grantedBy,
    granted_at: new Date().toISOString(),
    expires_at: null,
  }
  await kSet(`access:${userId}:${courseId}`, rec)
  // índice por usuario
  const ids = (await kGet<string[]>(`access-by-user:${userId}`)) ?? []
  if (!ids.includes(courseId)) {
    ids.push(courseId)
    await kSet(`access-by-user:${userId}`, ids)
  }
}

export async function revokeAccess(userId: string, courseId: string): Promise<void> {
  await kDel(`access:${userId}:${courseId}`)
  const ids = (await kGet<string[]>(`access-by-user:${userId}`)) ?? []
  await kSet(`access-by-user:${userId}`, ids.filter(id => id !== courseId))
}

export async function getUserCourseIds(userId: string): Promise<string[]> {
  return (await kGet<string[]>(`access-by-user:${userId}`)) ?? []
}

export async function countAllAccess(): Promise<number> {
  const keys = await kList('access:')
  // filtrar solo las claves de formato access:{uid}:{cid} (no access-by-user:)
  return keys.filter(k => k.startsWith('access:') && !k.startsWith('access-by-user:')).length
}

// ─────────────────────────────────────────────────────────────────
// PROGRESO DE LECCIONES
// ─────────────────────────────────────────────────────────────────

export async function getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  return kGet<LessonProgress>(`progress:${userId}:${lessonId}`)
}

export async function getLessonsProgress(userId: string, lessonIds: string[]): Promise<LessonProgress[]> {
  const all = await Promise.all(lessonIds.map(lid => getLessonProgress(userId, lid)))
  return all.filter(Boolean) as LessonProgress[]
}

export async function markLessonComplete(userId: string, lessonId: string): Promise<void> {
  const existing = await getLessonProgress(userId, lessonId)
  const rec: LessonProgress = {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    watched_sec: existing?.watched_sec ?? 0,
    completed_at: new Date().toISOString(),
  }
  await kSet(`progress:${userId}:${lessonId}`, rec)
}

// ─────────────────────────────────────────────────────────────────
// SEED INICIAL (cursos de ejemplo + admin)
// ─────────────────────────────────────────────────────────────────

export async function seedIfNeeded(): Promise<void> {
  const already = await kGet<string>('seeded')
  if (already) return

  // Cursos de ejemplo
  const seedCourses = [
    { title: 'Admisión IPN',  description: 'Preparación completa para el examen de admisión al IPN.', slug: 'admision-ipn',  category: 'IPN',          price: 1299, is_published: true  },
    { title: 'Admisión UNAM', description: 'Curso intensivo para el CENEVAL / COMIPEMS orientado a UNAM.', slug: 'admision-unam', category: 'UNAM',         price: 1299, is_published: true  },
    { title: 'Cálculo I',     description: 'Límites, derivadas e integrales desde cero.',            slug: 'calculo-i',      category: 'Cálculo',       price:  999, is_published: true  },
    { title: 'Álgebra',       description: 'Ecuaciones, sistemas y polinomios a fondo.',              slug: 'algebra',         category: 'Matemáticas',  price:  799, is_published: true  },
    { title: 'Física I',      description: 'Mecánica, cinemática y dinámica.',                        slug: 'fisica-i',        category: 'Física',        price:  999, is_published: true  },
    { title: 'Química',       description: 'Química inorgánica y orgánica básica.',                   slug: 'quimica',         category: 'Química',       price:  799, is_published: true  },
  ]
  for (const c of seedCourses) await upsertCourse(c)

  // Admin por defecto
  const { hashPassword } = await import('./auth')
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@profediegomx.com'
  const adminPass  = process.env.ADMIN_PASSWORD ?? 'admin123'
  const existing   = await getUserByEmail(adminEmail)
  if (!existing) {
    const admin: StoredUser = {
      id:            crypto.randomUUID(),
      email:         adminEmail,
      full_name:     'Profe Diego',
      role:          'admin',
      is_active:     true,
      avatar_url:    null,
      password_hash: await hashPassword(adminPass),
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    }
    await createUser(admin)
  }

  await kSet('seeded', '1')
}

// ─────────────────────────────────────────────────────────────────
// ASIGNATURAS (SUBJECTS / MÓDULOS)
// ─────────────────────────────────────────────────────────────────

import type { Subject, LessonMaterial, Exam, ExamQuestion, ExamAttempt } from '@/types'

export async function getSubjectsByCourse(courseId: string): Promise<Subject[]> {
  const ids = (await kGet<string[]>(`subjects-by-course:${courseId}`)) ?? []
  const subjects = await Promise.all(ids.map(id => kGet<Subject>(`subject:${id}`)))
  const all = subjects.filter(Boolean) as Subject[]
  return all.sort((a, b) => a.position - b.position)
}

export async function upsertSubject(data: Omit<Subject, 'created_at'> & { id?: string }): Promise<Subject> {
  const existing = data.id ? await kGet<Subject>(`subject:${data.id}`) : null
  const now = new Date().toISOString()
  const subject: Subject = {
    id: data.id ?? crypto.randomUUID(),
    course_id: data.course_id,
    title: data.title,
    description: data.description ?? null,
    position: data.position,
    created_at: (existing as Subject | null)?.created_at ?? now,
  }
  await kSet(`subject:${subject.id}`, subject)
  const ids = (await kGet<string[]>(`subjects-by-course:${subject.course_id}`)) ?? []
  if (!ids.includes(subject.id)) {
    ids.push(subject.id)
    await kSet(`subjects-by-course:${subject.course_id}`, ids)
  }
  return subject
}

export async function deleteSubject(id: string, courseId: string): Promise<void> {
  await kDel(`subject:${id}`)
  const ids = (await kGet<string[]>(`subjects-by-course:${courseId}`)) ?? []
  await kSet(`subjects-by-course:${courseId}`, ids.filter(i => i !== id))
}

// ─────────────────────────────────────────────────────────────────
// MATERIAL DE LECCIONES
// ─────────────────────────────────────────────────────────────────

export async function getMaterialsByLesson(lessonId: string): Promise<LessonMaterial[]> {
  const ids = (await kGet<string[]>(`materials-by-lesson:${lessonId}`)) ?? []
  const mats = await Promise.all(ids.map(id => kGet<LessonMaterial>(`material:${id}`)))
  return (mats.filter(Boolean) as LessonMaterial[])
}

export async function upsertMaterial(data: Omit<LessonMaterial, 'created_at'> & { id?: string }): Promise<LessonMaterial> {
  const now = new Date().toISOString()
  const mat: LessonMaterial = {
    id: data.id ?? crypto.randomUUID(),
    lesson_id: data.lesson_id,
    title: data.title,
    url: data.url,
    type: data.type,
    created_at: now,
  }
  await kSet(`material:${mat.id}`, mat)
  const ids = (await kGet<string[]>(`materials-by-lesson:${mat.lesson_id}`)) ?? []
  if (!ids.includes(mat.id)) {
    ids.push(mat.id)
    await kSet(`materials-by-lesson:${mat.lesson_id}`, ids)
  }
  return mat
}

export async function deleteMaterial(id: string, lessonId: string): Promise<void> {
  await kDel(`material:${id}`)
  const ids = (await kGet<string[]>(`materials-by-lesson:${lessonId}`)) ?? []
  await kSet(`materials-by-lesson:${lessonId}`, ids.filter(i => i !== id))
}

// ─────────────────────────────────────────────────────────────────
// EXÁMENES SIMULACRO
// ─────────────────────────────────────────────────────────────────

export async function getExamsByCourse(courseId: string): Promise<Exam[]> {
  const ids = (await kGet<string[]>(`exams-by-course:${courseId}`)) ?? []
  const exams = await Promise.all(ids.map(id => kGet<Exam>(`exam:${id}`)))
  return (exams.filter(Boolean) as Exam[])
}

export async function getExamById(id: string): Promise<Exam | null> {
  return kGet<Exam>(`exam:${id}`)
}

export async function upsertExam(data: Omit<Exam, 'created_at'> & { id?: string }): Promise<Exam> {
  const existing = data.id ? await kGet<Exam>(`exam:${data.id}`) : null
  const now = new Date().toISOString()
  const exam: Exam = {
    id: data.id ?? crypto.randomUUID(),
    course_id: data.course_id,
    title: data.title,
    description: data.description ?? null,
    duration_min: data.duration_min ?? 60,
    pass_score: data.pass_score ?? 70,
    is_published: data.is_published ?? false,
    created_at: (existing as Exam | null)?.created_at ?? now,
  }
  await kSet(`exam:${exam.id}`, exam)
  const ids = (await kGet<string[]>(`exams-by-course:${exam.course_id}`)) ?? []
  if (!ids.includes(exam.id)) {
    ids.push(exam.id)
    await kSet(`exams-by-course:${exam.course_id}`, ids)
  }
  return exam
}

// ─────────────────────────────────────────────────────────────────
// PREGUNTAS DE EXAMEN
// ─────────────────────────────────────────────────────────────────

export async function getQuestionsByExam(examId: string): Promise<ExamQuestion[]> {
  const ids = (await kGet<string[]>(`questions-by-exam:${examId}`)) ?? []
  const qs = await Promise.all(ids.map(id => kGet<ExamQuestion>(`question:${id}`)))
  const all = (qs.filter(Boolean) as ExamQuestion[])
  return all.sort((a, b) => a.position - b.position)
}

export async function upsertQuestion(data: Omit<ExamQuestion, never> & { id?: string }): Promise<ExamQuestion> {
  const q: ExamQuestion = {
    id: data.id ?? crypto.randomUUID(),
    exam_id: data.exam_id,
    question: data.question,
    options: data.options,
    correct_index: data.correct_index,
    explanation: data.explanation ?? null,
    position: data.position,
  }
  await kSet(`question:${q.id}`, q)
  const ids = (await kGet<string[]>(`questions-by-exam:${q.exam_id}`)) ?? []
  if (!ids.includes(q.id)) {
    ids.push(q.id)
    await kSet(`questions-by-exam:${q.exam_id}`, ids)
  }
  return q
}

export async function deleteQuestion(id: string, examId: string): Promise<void> {
  await kDel(`question:${id}`)
  const ids = (await kGet<string[]>(`questions-by-exam:${examId}`)) ?? []
  await kSet(`questions-by-exam:${examId}`, ids.filter(i => i !== id))
}

// ─────────────────────────────────────────────────────────────────
// INTENTOS DE EXAMEN
// ─────────────────────────────────────────────────────────────────

export async function saveExamAttempt(attempt: Omit<ExamAttempt, 'id'>): Promise<ExamAttempt> {
  const rec: ExamAttempt = { id: crypto.randomUUID(), ...attempt }
  await kSet(`attempt:${rec.id}`, rec)
  const ids = (await kGet<string[]>(`attempts-by-user-exam:${rec.user_id}:${rec.exam_id}`)) ?? []
  ids.push(rec.id)
  await kSet(`attempts-by-user-exam:${rec.user_id}:${rec.exam_id}`, ids)
  return rec
}

export async function getAttemptsByUserExam(userId: string, examId: string): Promise<ExamAttempt[]> {
  const ids = (await kGet<string[]>(`attempts-by-user-exam:${userId}:${examId}`)) ?? []
  const attempts = await Promise.all(ids.map(id => kGet<ExamAttempt>(`attempt:${id}`)))
  return (attempts.filter(Boolean) as ExamAttempt[]).sort((a, b) =>
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )
}

// ═════════════════════════════════════════════════════════════════
// FASE 2 — Soft-delete, reordenar, cupones, auditoría, profesores
// ═════════════════════════════════════════════════════════════════

import type { Coupon, AuditLog, Teacher } from '@/types'

// ── SOFT-DELETE DE CURSOS ──────────────────────────────────────────
export async function softDeleteCourse(id: string): Promise<void> {
  const c = await getCourseById(id)
  if (!c) return
  await kSet(`course:${id}`, { ...c, deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
}
export async function restoreCourse(id: string): Promise<void> {
  const c = await getCourseById(id)
  if (!c) return
  await kSet(`course:${id}`, { ...c, deleted: false, deleted_at: null, updated_at: new Date().toISOString() })
}

// ── SOFT-DELETE + REORDENAR LECCIONES ──────────────────────────────
export async function softDeleteLesson(id: string): Promise<void> {
  const l = await getLessonById(id)
  if (!l) return
  await kSet(`lesson:${id}`, { ...l, deleted: true, deleted_at: new Date().toISOString() })
}
export async function restoreLesson(id: string): Promise<void> {
  const l = await getLessonById(id)
  if (!l) return
  await kSet(`lesson:${id}`, { ...l, deleted: false, deleted_at: null })
}
/** Mueve una lección hacia arriba (-1) o abajo (+1) intercambiando posiciones. */
export async function reorderLesson(courseId: string, lessonId: string, direction: -1 | 1): Promise<void> {
  const lessons = await getLessonsByCourse(courseId)          // ya ordenadas, sin borradas
  const idx = lessons.findIndex(l => l.id === lessonId)
  if (idx === -1) return
  const swapWith = idx + direction
  if (swapWith < 0 || swapWith >= lessons.length) return
  const a = lessons[idx], b = lessons[swapWith]
  const posA = a.position, posB = b.position
  await kSet(`lesson:${a.id}`, { ...a, position: posB })
  await kSet(`lesson:${b.id}`, { ...b, position: posA })
}

// ── CUPONES ────────────────────────────────────────────────────────
export async function getCoupon(code: string): Promise<Coupon | null> {
  return kGet<Coupon>(`coupon:${code.toUpperCase()}`)
}
export async function listCoupons(): Promise<Coupon[]> {
  const idx = (await kGet<string[]>('coupons-index')) ?? []
  const items = await Promise.all(idx.map(code => getCoupon(code)))
  return items.filter(Boolean) as Coupon[]
}
export async function upsertCoupon(data: {
  code: string; discount_percent: number; active?: boolean
  max_uses?: number | null; expires_at?: string | null
}): Promise<Coupon> {
  const code = data.code.toUpperCase().trim()
  const existing = await getCoupon(code)
  const coupon: Coupon = {
    code,
    discount_percent: Math.max(0, Math.min(100, data.discount_percent)),
    active: data.active ?? existing?.active ?? true,
    max_uses: data.max_uses ?? existing?.max_uses ?? null,
    used_count: existing?.used_count ?? 0,
    expires_at: data.expires_at ?? existing?.expires_at ?? null,
    created_at: existing?.created_at ?? new Date().toISOString(),
  }
  await kSet(`coupon:${code}`, coupon)
  const idx = (await kGet<string[]>('coupons-index')) ?? []
  if (!idx.includes(code)) { idx.push(code); await kSet('coupons-index', idx) }
  return coupon
}
export async function deleteCoupon(code: string): Promise<void> {
  const c = code.toUpperCase()
  await kDel(`coupon:${c}`)
  const idx = (await kGet<string[]>('coupons-index')) ?? []
  await kSet('coupons-index', idx.filter(x => x !== c))
}
/** Valida un cupón y devuelve el % de descuento, o un error legible. */
export async function validateCoupon(code: string): Promise<{ valid: boolean; discount_percent: number; reason?: string }> {
  const c = await getCoupon(code)
  if (!c) return { valid: false, discount_percent: 0, reason: 'Cupón no encontrado' }
  if (!c.active) return { valid: false, discount_percent: 0, reason: 'Cupón inactivo' }
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { valid: false, discount_percent: 0, reason: 'Cupón expirado' }
  if (c.max_uses !== null && c.used_count >= c.max_uses) return { valid: false, discount_percent: 0, reason: 'Cupón agotado' }
  return { valid: true, discount_percent: c.discount_percent }
}
export async function redeemCoupon(code: string): Promise<void> {
  const c = await getCoupon(code)
  if (!c) return
  await kSet(`coupon:${c.code}`, { ...c, used_count: c.used_count + 1 })
}

// ── AUDITORÍA ──────────────────────────────────────────────────────
export async function addAuditLog(entry: {
  user_id?: string | null; user_email?: string | null
  action: string; entity: string; entity_id?: string | null
  ip?: string | null; detail?: string | null
}): Promise<void> {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    user_id: entry.user_id ?? null,
    user_email: entry.user_email ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entity_id ?? null,
    ip: entry.ip ?? null,
    detail: entry.detail ?? null,
    created_at: new Date().toISOString(),
  }
  await kSet(`audit:${log.id}`, log)
  const idx = (await kGet<string[]>('audit-index')) ?? []
  idx.push(log.id)
  // conservar solo los últimos 500 IDs en el índice para no crecer sin límite
  const trimmed = idx.slice(-500)
  await kSet('audit-index', trimmed)
}
export async function listAuditLogs(limit = 50): Promise<AuditLog[]> {
  const idx = (await kGet<string[]>('audit-index')) ?? []
  const recent = idx.slice(-limit).reverse()
  const logs = await Promise.all(recent.map(id => kGet<AuditLog>(`audit:${id}`)))
  return logs.filter(Boolean) as AuditLog[]
}

// ── PROFESORES ─────────────────────────────────────────────────────
export async function getTeacherById(id: string): Promise<Teacher | null> {
  return kGet<Teacher>(`teacher:${id}`)
}
export async function listTeachers(includeInactive = true): Promise<Teacher[]> {
  const idx = (await kGet<string[]>('teachers-index')) ?? []
  const items = await Promise.all(idx.map(id => getTeacherById(id)))
  const all = items.filter(Boolean) as Teacher[]
  return includeInactive ? all : all.filter(t => t.active)
}
export async function upsertTeacher(data: {
  id?: string; name: string; email: string; photo_url?: string | null; bio?: string | null; active?: boolean
}): Promise<Teacher> {
  const existing = data.id ? await getTeacherById(data.id) : null
  const now = new Date().toISOString()
  const teacher: Teacher = {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    email: data.email,
    photo_url: data.photo_url ?? existing?.photo_url ?? null,
    bio: data.bio ?? existing?.bio ?? null,
    active: data.active ?? existing?.active ?? true,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  }
  await kSet(`teacher:${teacher.id}`, teacher)
  const idx = (await kGet<string[]>('teachers-index')) ?? []
  if (!idx.includes(teacher.id)) { idx.push(teacher.id); await kSet('teachers-index', idx) }
  return teacher
}
/** Desactiva sin borrar (req. 7). */
export async function setTeacherActive(id: string, active: boolean): Promise<void> {
  const t = await getTeacherById(id)
  if (!t) return
  await kSet(`teacher:${id}`, { ...t, active, updated_at: new Date().toISOString() })
}

// ── ESTADÍSTICAS PARA EL DASHBOARD ADMIN (req. 5) ──────────────────
export async function getAdminStats(): Promise<{
  users: { total: number; active: number; admins: number; teachers: number; students: number }
  courses: { published: number; drafts: number; deleted: number; total: number }
  platform: { lessons: number; exams: number; questions: number; coupons: number }
}> {
  const users = await listUsers()
  const allCourses = await listCourses(false, true)   // incluye borrados
  const lessonKeys = await kList('lesson:')
  const examKeys = await kList('exam:')
  const questionKeys = await kList('question:')
  const couponIdx = (await kGet<string[]>('coupons-index')) ?? []

  return {
    users: {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      admins: users.filter(u => u.role === 'admin').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      students: users.filter(u => u.role === 'student').length,
    },
    courses: {
      published: allCourses.filter(c => c.is_published && !c.deleted).length,
      drafts: allCourses.filter(c => !c.is_published && !c.deleted).length,
      deleted: allCourses.filter(c => c.deleted).length,
      total: allCourses.length,
    },
    platform: {
      lessons: lessonKeys.length,
      exams: examKeys.length,
      questions: questionKeys.length,
      coupons: couponIdx.length,
    },
  }
}
