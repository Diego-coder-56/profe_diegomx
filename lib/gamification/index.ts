// lib/gamification/index.ts — servicios de gamificación (servidor)
// Desacoplado de la UI. Si Supabase no está configurado, devuelve defaults
// y las mutaciones no hacen nada (la app sigue funcionando).
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { levelInfo, XP_RULES, type XpAction, type LevelInfo } from './levels'

export interface GameState {
  configured: boolean
  totalXp: number
  level: LevelInfo
  currentStreak: number
  bestStreak: number
  weeklyXp: number
  weeklyActiveDays: number       // días distintos con actividad en los últimos 7 días
  rank: number | null            // posición global (1 = primero), null si no hay datos
  totalStudents: number | null   // total de estudiantes con actividad (denominador del ranking)
  achievements: { code: string; name: string; emoji: string; earned_at: string }[]
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000)
}

async function ensureStats(userId: string, email?: string, fullName?: string) {
  const sb = getSupabase()!
  const { data } = await sb.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
  if (data) return data
  const row = { user_id: userId, email: email ?? null, full_name: fullName ?? null, total_xp: 0, current_streak: 0, best_streak: 0, last_activity: null }
  await sb.from('user_stats').upsert(row, { onConflict: 'user_id' })
  return row as typeof row & { total_xp: number; current_streak: number; best_streak: number; last_activity: string | null }
}

/** Mantiene/avanza la racha. Llamar cuando hay actividad válida (video/quiz/login). */
export async function touchStreak(userId: string, email?: string, fullName?: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    const sb = getSupabase()!
    const stats = await ensureStats(userId, email, fullName)
    const today = todayStr()
    if (stats.last_activity === today) return
    let current = 1
    if (stats.last_activity) {
      const gap = daysBetween(stats.last_activity, today)
      current = gap === 1 ? (stats.current_streak || 0) + 1 : 1
    }
    const best = Math.max(stats.best_streak || 0, current)
    await sb.from('user_stats').update({ current_streak: current, best_streak: best, last_activity: today, updated_at: new Date().toISOString() }).eq('user_id', userId)
    await maybeAwardStreakAchievements(userId, current)
  } catch { /* la racha nunca debe romper la acción principal */ }
}

async function maybeAwardStreakAchievements(userId: string, streak: number): Promise<void> {
  const sb = getSupabase()!
  const tiers = [
    { code: 'streak_7', min: 7 }, { code: 'streak_15', min: 15 }, { code: 'streak_30', min: 30 },
    { code: 'streak_60', min: 60 }, { code: 'streak_100', min: 100 },
  ]
  const earned = tiers.filter(t => streak >= t.min).map(t => ({ user_id: userId, code: t.code }))
  if (earned.length) await sb.from('user_achievements').upsert(earned, { onConflict: 'user_id,code' })
}

/** Otorga una cantidad arbitraria de XP (núcleo). Usado por retos y acciones. */
export async function grantXp(userId: string, amount: number, action: string, opts?: { email?: string; fullName?: string }): Promise<void> {
  if (!isSupabaseConfigured() || amount <= 0) return
  try {
    const sb = getSupabase()!
    const stats = await ensureStats(userId, opts?.email, opts?.fullName)
    await sb.from('xp_events').insert({ user_id: userId, action, xp: amount })
    await sb.from('user_stats').update({ total_xp: (stats.total_xp || 0) + amount, updated_at: new Date().toISOString() }).eq('user_id', userId)
    await touchStreak(userId, opts?.email, opts?.fullName)
    await maybeAwardXpAchievements(userId, (stats.total_xp || 0) + amount)
  } catch { /* no romper el flujo */ }
}

/** Otorga XP por una acción según las reglas (video/quiz/flashcards/etc.). */
export async function awardXp(userId: string, action: XpAction, opts?: { email?: string; fullName?: string }): Promise<void> {
  await grantXp(userId, XP_RULES[action], action, opts)
}

async function maybeAwardXpAchievements(userId: string, totalXp: number): Promise<void> {
  const sb = getSupabase()!
  const milestones: { code: string; min: number }[] = [
    { code: 'xp_100', min: 100 },
    { code: 'xp_500', min: 500 },
    { code: 'xp_1000', min: 1000 },
  ]
  const earned = milestones.filter(m => totalXp >= m.min).map(m => ({ user_id: userId, code: m.code }))
  if (earned.length) await sb.from('user_achievements').upsert(earned, { onConflict: 'user_id,code' })
}

export async function getUserGameState(userId: string, email?: string, fullName?: string): Promise<GameState> {
  const empty: GameState = { configured: false, totalXp: 0, level: levelInfo(0), currentStreak: 0, bestStreak: 0, weeklyXp: 0, weeklyActiveDays: 0, rank: null, totalStudents: null, achievements: [] }
  if (!isSupabaseConfigured()) return empty
  try {
    const sb = getSupabase()!
    const stats = await ensureStats(userId, email, fullName)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [{ data: weekRows }, { count: ahead }, { count: totalStudents }, { data: ach }] = await Promise.all([
      sb.from('xp_events').select('xp, created_at').eq('user_id', userId).gte('created_at', weekAgo),
      sb.from('user_stats').select('*', { count: 'exact', head: true }).gt('total_xp', stats.total_xp || 0),
      sb.from('user_stats').select('*', { count: 'exact', head: true }),
      sb.from('user_achievements').select('code, earned_at, achievements(name, emoji)').eq('user_id', userId).order('earned_at', { ascending: false }),
    ])

    const weeklyXp = (weekRows ?? []).reduce((s: number, r: any) => s + (r.xp || 0), 0)
    const weeklyActiveDays = new Set((weekRows ?? []).map((r: any) => String(r.created_at).slice(0, 10))).size
    const achievements = (ach ?? []).map((a: any) => ({ code: a.code, name: a.achievements?.name ?? a.code, emoji: a.achievements?.emoji ?? '🏅', earned_at: a.earned_at }))

    return {
      configured: true,
      totalXp: stats.total_xp || 0,
      level: levelInfo(stats.total_xp || 0),
      currentStreak: stats.current_streak || 0,
      bestStreak: stats.best_streak || 0,
      weeklyXp,
      weeklyActiveDays,
      rank: (ahead ?? 0) + 1,
      totalStudents: totalStudents ?? null,
      achievements,
    }
  } catch {
    return empty
  }
}

export interface RankRow { user_id: string; name: string; weeklyXp: number }

/** Ranking global por XP total acumulado. */
export async function getGlobalRanking(limit = 10): Promise<{ user_id: string; name: string; xp: number }[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb = getSupabase()!
    const { data } = await sb.from('user_stats').select('user_id, full_name, email, total_xp').order('total_xp', { ascending: false }).limit(limit)
    return (data ?? []).map((r: any) => ({ user_id: r.user_id, name: r.full_name || r.email || 'Alumno', xp: r.total_xp || 0 }))
  } catch {
    return []
  }
}

/** Top de la semana por XP de los últimos 7 días (req. 16). */
export async function getWeeklyRanking(limit = 10): Promise<RankRow[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb = getSupabase()!
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    // agregación en cliente del servidor (suficiente hasta migrar a una vista SQL/materializada)
    const { data } = await sb.from('xp_events').select('user_id, xp, created_at').gte('created_at', weekAgo)
    const totals = new Map<string, number>()
    for (const r of (data ?? []) as any[]) totals.set(r.user_id, (totals.get(r.user_id) || 0) + (r.xp || 0))
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
    if (!top.length) return []
    const { data: names } = await sb.from('user_stats').select('user_id, full_name, email').in('user_id', top.map(t => t[0]))
    const nameMap = new Map((names ?? []).map((n: any) => [n.user_id, n.full_name || n.email || 'Alumno']))
    return top.map(([user_id, weeklyXp]) => ({ user_id, name: nameMap.get(user_id) ?? 'Alumno', weeklyXp }))
  } catch {
    return []
  }
}

// ── Logros con estado (para la página de Logros) ───────────────────
export interface AchievementStatus {
  code: string; name: string; description: string | null; emoji: string
  threshold: number | null; earned: boolean; earned_at: string | null
}
export async function getAchievementsWithStatus(userId: string): Promise<AchievementStatus[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb = getSupabase()!
    const [{ data: all }, { data: mine }] = await Promise.all([
      sb.from('achievements').select('*').order('threshold', { ascending: true, nullsFirst: true }),
      sb.from('user_achievements').select('code, earned_at').eq('user_id', userId),
    ])
    const earned = new Map((mine ?? []).map((m: any) => [m.code, m.earned_at]))
    return (all ?? []).map((a: any) => ({
      code: a.code, name: a.name, description: a.description, emoji: a.emoji ?? '🏅', threshold: a.threshold,
      earned: earned.has(a.code), earned_at: earned.get(a.code) ?? null,
    }))
  } catch { return [] }
}

// ── Estadísticas del alumno (para la página de Estadísticas) ───────
export interface UserStats {
  totalXp: number; level: number
  quizzes: number; flashcards: number; lessonsDone: number
  byAction: { action: string; count: number; xp: number }[]
  daily: { date: string; xp: number }[]    // últimos 84 días
  activeDays: number
}
export async function getUserStats(userId: string): Promise<UserStats> {
  const empty: UserStats = { totalXp: 0, level: 1, quizzes: 0, flashcards: 0, lessonsDone: 0, byAction: [], daily: [], activeDays: 0 }
  if (!isSupabaseConfigured()) return empty
  try {
    const sb = getSupabase()!
    const since = new Date(Date.now() - 84 * 86400000).toISOString()
    const [{ data: stats }, { data: events }, { count: quizzes }, { count: flashcards }] = await Promise.all([
      sb.from('user_stats').select('total_xp').eq('user_id', userId).maybeSingle(),
      sb.from('xp_events').select('action, xp, created_at').eq('user_id', userId).gte('created_at', since),
      sb.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      sb.from('flashcard_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])
    const byActionMap = new Map<string, { count: number; xp: number }>()
    const dailyMap = new Map<string, number>()
    let lessons = 0
    for (const e of (events ?? []) as any[]) {
      const cur = byActionMap.get(e.action) ?? { count: 0, xp: 0 }
      cur.count++; cur.xp += e.xp || 0; byActionMap.set(e.action, cur)
      const d = String(e.created_at).slice(0, 10)
      dailyMap.set(d, (dailyMap.get(d) || 0) + (e.xp || 0))
      if (e.action === 'video') lessons++
    }
    // serie diaria continua de 84 días
    const daily: { date: string; xp: number }[] = []
    for (let i = 83; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      daily.push({ date: d, xp: dailyMap.get(d) || 0 })
    }
    return {
      totalXp: stats?.total_xp || 0,
      level: levelInfo(stats?.total_xp || 0).level,
      quizzes: quizzes ?? 0,
      flashcards: flashcards ?? 0,
      lessonsDone: lessons,
      byAction: [...byActionMap.entries()].map(([action, v]) => ({ action, ...v })).sort((a, b) => b.xp - a.xp),
      daily,
      activeDays: dailyMap.size,
    }
  } catch { return empty }
}
