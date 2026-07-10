// lib/flashcards.ts — repetición espaciada (algoritmo SM-2, estilo Anki)
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

export type Grade = 'again' | 'hard' | 'good' | 'easy'
// Calidad SM-2 por botón: Muy difícil(again) Difícil(hard) Fácil(good) Muy fácil(easy)
const QUALITY: Record<Grade, number> = { again: 2, hard: 3, good: 4, easy: 5 }

export interface DueCard {
  id: string; subject: string; front: string; back: string; hint: string | null
  isNew: boolean
}
interface Schedule { ease_factor: number; interval_days: number; repetitions: number; due_date: string }

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function addDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

/** Núcleo SM-2: a partir del estado previo y la calificación, calcula el siguiente repaso. */
export function scheduleNext(
  prev: { ease_factor?: number; interval_days?: number; repetitions?: number },
  grade: Grade,
): Schedule {
  const q = QUALITY[grade]
  let ef = prev.ease_factor ?? 2.5
  let reps = prev.repetitions ?? 0
  let interval = prev.interval_days ?? 0

  // Ajuste del factor de facilidad
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ef < 1.3) ef = 1.3

  if (q < 3) {
    // Falló: reinicia y repasa pronto
    reps = 0
    interval = 1
  } else {
    if (reps === 0) interval = 1
    else if (reps === 1) interval = 6
    else interval = Math.round(interval * ef)
    reps += 1
  }
  return { ease_factor: Math.round(ef * 100) / 100, interval_days: interval, repetitions: reps, due_date: addDays(interval) }
}

/** Tarjetas pendientes hoy: nuevas (sin repaso) + vencidas. Incluye oficiales,
 *  las propias del alumno y las compartidas por otros. Filtra por materia opcional. */
export async function getDueCards(userId: string, limit = 20, subject?: string): Promise<DueCard[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb = getSupabase()!
    const today = todayStr()
    let cardsQuery = sb.from('flashcards').select('id, subject, front, back, hint').eq('active', true)
      .or(`created_by.is.null,created_by.eq.${userId},shared.eq.true`)
    if (subject) cardsQuery = cardsQuery.eq('subject', subject)
    const [{ data: cards }, { data: reviews }] = await Promise.all([
      cardsQuery,
      sb.from('flashcard_reviews').select('card_id, due_date').eq('user_id', userId),
    ])
    const reviewMap = new Map((reviews ?? []).map((r: any) => [r.card_id, r.due_date]))
    const due: DueCard[] = []
    const fresh: DueCard[] = []
    for (const c of (cards ?? []) as any[]) {
      const d = reviewMap.get(c.id)
      const card: DueCard = { id: c.id, subject: c.subject, front: c.front, back: c.back, hint: c.hint, isNew: !d }
      if (!d) fresh.push(card)
      else if (d <= today) due.push(card)
    }
    return [...due, ...fresh].slice(0, limit)
  } catch {
    return []
  }
}

/** Registra una calificación y reprograma la tarjeta. Devuelve días al próximo repaso. */
export async function reviewCard(userId: string, cardId: string, grade: Grade): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  try {
    const sb = getSupabase()!
    const { data: prev } = await sb.from('flashcard_reviews').select('ease_factor, interval_days, repetitions').eq('user_id', userId).eq('card_id', cardId).maybeSingle()
    const next = scheduleNext(prev ?? {}, grade)
    await sb.from('flashcard_reviews').upsert({
      user_id: userId, card_id: cardId,
      ease_factor: next.ease_factor, interval_days: next.interval_days,
      repetitions: next.repetitions, due_date: next.due_date,
      last_grade: QUALITY[grade], reviewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,card_id' })
    return next.interval_days
  } catch {
    return 0
  }
}

export async function getDeckStats(userId: string): Promise<{ due: number; total: number }> {
  if (!isSupabaseConfigured()) return { due: 0, total: 0 }
  try {
    const sb = getSupabase()!
    const today = todayStr()
    const [{ count: total }, { count: dueReviews }, { count: reviewed }] = await Promise.all([
      sb.from('flashcards').select('*', { count: 'exact', head: true }).eq('active', true),
      sb.from('flashcard_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId).lte('due_date', today),
      sb.from('flashcard_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])
    const newCards = Math.max(0, (total ?? 0) - (reviewed ?? 0))
    return { due: (dueReviews ?? 0) + newCards, total: total ?? 0 }
  } catch {
    return { due: 0, total: 0 }
  }
}

// ── Mazos por materia ──────────────────────────────────────────────
export interface Deck { subject: string; total: number; due: number }
export async function listDecks(userId: string): Promise<Deck[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb = getSupabase()!
    const today = todayStr()
    const [{ data: cards }, { data: reviews }] = await Promise.all([
      sb.from('flashcards').select('id, subject').eq('active', true).or(`created_by.is.null,created_by.eq.${userId},shared.eq.true`),
      sb.from('flashcard_reviews').select('card_id, due_date').eq('user_id', userId),
    ])
    const dueMap = new Map((reviews ?? []).map((r: any) => [r.card_id, r.due_date]))
    const map = new Map<string, { total: number; due: number }>()
    for (const c of (cards ?? []) as any[]) {
      const e = map.get(c.subject) ?? { total: 0, due: 0 }
      e.total++
      const d = dueMap.get(c.id)
      if (!d || d <= today) e.due++
      map.set(c.subject, e)
    }
    return [...map.entries()].map(([subject, v]) => ({ subject, ...v })).sort((a, b) => a.subject.localeCompare(b.subject))
  } catch { return [] }
}

// ── Flashcards creadas por el alumno ───────────────────────────────
export interface MyCard { id: string; subject: string; front: string; back: string; hint: string | null; shared: boolean }
export async function listMyFlashcards(userId: string): Promise<MyCard[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await getSupabase()!.from('flashcards').select('id, subject, front, back, hint, shared').eq('created_by', userId).order('subject')
    return (data ?? []) as MyCard[]
  } catch { return [] }
}
export async function createUserFlashcard(userId: string, data: { subject: string; front: string; back: string; hint?: string; shared?: boolean }): Promise<void> {
  if (!isSupabaseConfigured()) return
  const id = `u-${userId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`
  await getSupabase()!.from('flashcards').insert({
    id, subject: data.subject.trim() || 'General', front: data.front.trim(), back: data.back.trim(),
    hint: data.hint?.trim() || null, active: true, created_by: userId, shared: data.shared ?? false,
  })
}
export async function deleteUserFlashcard(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase()!.from('flashcards').delete().eq('id', id).eq('created_by', userId)
}
export async function setFlashcardShared(userId: string, id: string, shared: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase()!.from('flashcards').update({ shared }).eq('id', id).eq('created_by', userId)
}
