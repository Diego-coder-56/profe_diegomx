// lib/challenges.ts — Retos diarios y semanales (progreso real + reclamo único)
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { grantXp } from '@/lib/gamification'

export type Scope = 'daily' | 'weekly'
export interface ChallengeDef { key: string; scope: Scope; title: string; emoji: string; goal: number; xp: number }

export const CHALLENGES: ChallengeDef[] = [
  { key: 'daily_quiz',       scope: 'daily',  title: 'Completa 1 quiz hoy',        emoji: '📝', goal: 1,   xp: 100 },
  { key: 'daily_flashcards', scope: 'daily',  title: 'Repasa 10 flashcards hoy',   emoji: '🧠', goal: 10,  xp: 60  },
  { key: 'daily_active',     scope: 'daily',  title: 'Estudia hoy (mantén racha)', emoji: '🔥', goal: 1,   xp: 30  },
  { key: 'weekly_xp',        scope: 'weekly', title: 'Gana 300 XP esta semana',    emoji: '⭐', goal: 300, xp: 150 },
  { key: 'weekly_days',      scope: 'weekly', title: 'Estudia 5 días esta semana', emoji: '📅', goal: 5,   xp: 200 },
]

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function isoWeekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
export function periodKey(scope: Scope): string { return scope === 'daily' ? todayStr() : isoWeekKey() }

export interface ChallengeState extends ChallengeDef { current: number; complete: boolean; claimed: boolean }

export async function computeChallenges(userId: string): Promise<ChallengeState[]> {
  if (!isSupabaseConfigured()) return CHALLENGES.map(c => ({ ...c, current: 0, complete: false, claimed: false }))
  try {
    const sb = getSupabase()!
    const today = todayStr()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const [{ data: events }, { data: claims }] = await Promise.all([
      sb.from('xp_events').select('action, xp, created_at').eq('user_id', userId).gte('created_at', weekAgo),
      sb.from('challenge_claims').select('challenge_key, period_key').eq('user_id', userId),
    ])
    const ev = (events ?? []) as any[]
    const todayEv = ev.filter(e => String(e.created_at).slice(0, 10) === today)
    const quizToday = todayEv.filter(e => e.action === 'quiz').length
    const fcToday = todayEv.filter(e => e.action === 'flashcards').length
    const activeToday = todayEv.length > 0 ? 1 : 0
    const weeklyXp = ev.reduce((s, e) => s + (e.xp || 0), 0)
    const weeklyDays = new Set(ev.map(e => String(e.created_at).slice(0, 10))).size
    const claimSet = new Set((claims ?? []).map((c: any) => `${c.challenge_key}:${c.period_key}`))

    const metric: Record<string, number> = {
      daily_quiz: quizToday, daily_flashcards: fcToday, daily_active: activeToday,
      weekly_xp: weeklyXp, weekly_days: weeklyDays,
    }
    return CHALLENGES.map(c => {
      const current = metric[c.key] ?? 0
      return { ...c, current, complete: current >= c.goal, claimed: claimSet.has(`${c.key}:${periodKey(c.scope)}`) }
    })
  } catch {
    return CHALLENGES.map(c => ({ ...c, current: 0, complete: false, claimed: false }))
  }
}

/** Reclama un reto completado: registra el reclamo (único por periodo) y otorga XP. */
export async function claimChallenge(userId: string, key: string, email?: string): Promise<{ ok: boolean; xp?: number; reason?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'no-config' }
  const def = CHALLENGES.find(c => c.key === key)
  if (!def) return { ok: false, reason: 'not-found' }
  try {
    const states = await computeChallenges(userId)
    const st = states.find(s => s.key === key)
    if (!st || !st.complete) return { ok: false, reason: 'incomplete' }
    if (st.claimed) return { ok: false, reason: 'already' }
    const sb = getSupabase()!
    const { error } = await sb.from('challenge_claims').insert({ user_id: userId, challenge_key: key, period_key: periodKey(def.scope) })
    if (error) return { ok: false, reason: 'already' }
    await grantXp(userId, def.xp, 'challenge', { email })
    return { ok: true, xp: def.xp }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
