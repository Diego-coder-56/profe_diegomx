// lib/payments.ts — Pagos, membresías, bloqueo automático y métricas. Solo servidor.
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { listUsers } from '@/lib/db'

export type MembershipStatus = 'sin_membresia' | 'active' | 'expiring' | 'expired'

export interface Membership {
  user_id: string; start_date: string | null; last_payment_date: string | null
  due_date: string | null; monthly_amount: number | null
}
export interface Payment {
  id: string; user_id: string; amount: number; method: string | null; concept: string | null
  period_month: string | null; paid_at: string; due_date: string | null; notes: string | null; receipt_url: string | null
}

function today(): string { return new Date().toISOString().slice(0, 10) }
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000)
}

/** Estado vivo de la membresía a partir de la fecha de vencimiento. */
export function statusOf(due_date: string | null): { status: MembershipStatus; daysLeft: number | null } {
  if (!due_date) return { status: 'sin_membresia', daysLeft: null }
  const left = daysBetween(today(), due_date)
  if (left < 0) return { status: 'expired', daysLeft: left }
  if (left < 7) return { status: 'expiring', daysLeft: left }
  return { status: 'active', daysLeft: left }
}

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  sin_membresia: 'Sin membresía', active: 'Al corriente', expiring: 'Próximo a vencer', expired: 'Vencido',
}

export async function getMembership(userId: string): Promise<Membership | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data } = await getSupabase()!.from('memberships').select('*').eq('user_id', userId).maybeSingle()
    return (data as Membership) ?? null
  } catch { return null }
}

export async function listPayments(userId: string): Promise<Payment[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await getSupabase()!.from('payments').select('*').eq('user_id', userId).order('paid_at', { ascending: false })
    return (data ?? []).map((p: any) => ({ ...p, amount: Number(p.amount) })) as Payment[]
  } catch { return [] }
}

/** ¿El alumno está bloqueado por vencimiento? (solo si tiene membresía vencida). */
export async function isBlocked(userId: string): Promise<boolean> {
  const m = await getMembership(userId)
  return statusOf(m?.due_date ?? null).status === 'expired'
}

/** Registra un pago, extiende la membresía y reactiva la cuenta. */
export async function recordPayment(userId: string, data: {
  amount: number; method?: string; concept?: string; months?: number; paid_at?: string; notes?: string; receipt_url?: string
}): Promise<{ ok: boolean; reactivated: boolean }> {
  if (!isSupabaseConfigured()) return { ok: false, reactivated: false }
  try {
    const sb = getSupabase()!
    const months = data.months && data.months > 0 ? data.months : 1
    const paidAt = data.paid_at || today()
    const existing = await getMembership(userId)
    const wasExpired = statusOf(existing?.due_date ?? null).status === 'expired'
    // Extiende desde el vencimiento vigente si aún no vence; si ya venció, desde hoy.
    const base = existing?.due_date && !wasExpired ? existing.due_date : paidAt
    const newDue = addMonths(base, months)

    await sb.from('memberships').upsert({
      user_id: userId,
      start_date: existing?.start_date ?? paidAt,
      last_payment_date: paidAt,
      due_date: newDue,
      monthly_amount: data.amount / months,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await sb.from('payments').insert({
      user_id: userId, amount: data.amount, method: data.method ?? null, concept: data.concept ?? null,
      period_month: paidAt.slice(0, 7), paid_at: paidAt, due_date: newDue,
      notes: data.notes ?? null, receipt_url: data.receipt_url ?? null,
    })

    await sb.from('notifications').insert({
      user_id: userId, title: wasExpired ? 'Cuenta reactivada' : 'Pago registrado',
      message: wasExpired ? `Tu acceso fue reactivado. Próximo pago: ${newDue}.` : `Recibimos tu pago. Vence el ${newDue}.`,
    })
    return { ok: true, reactivated: wasExpired }
  } catch {
    return { ok: false, reactivated: false }
  }
}

// ── Vista de administración ────────────────────────────────────────
export interface StudentRow {
  id: string; name: string; email: string; role: string; is_active: boolean
  due_date: string | null; status: MembershipStatus; daysLeft: number | null; lastPayment: string | null
}

export async function listStudentsWithMembership(): Promise<StudentRow[]> {
  const users = await listUsers()
  const students = users.filter(u => u.role === 'student')
  let memberships: Record<string, Membership> = {}
  if (isSupabaseConfigured() && students.length) {
    try {
      const { data } = await getSupabase()!.from('memberships').select('*').in('user_id', students.map(s => s.id))
      for (const m of (data ?? []) as Membership[]) memberships[m.user_id] = m
    } catch { /* noop */ }
  }
  return students.map(u => {
    const m = memberships[u.id]
    const { status, daysLeft } = statusOf(m?.due_date ?? null)
    return { id: u.id, name: u.full_name ?? '—', email: u.email, role: u.role, is_active: u.is_active, due_date: m?.due_date ?? null, status, daysLeft, lastPayment: m?.last_payment_date ?? null }
  })
}

export interface PaymentStats {
  totalStudents: number; activeStudents: number; blockedStudents: number
  pending: number; expiring: number; incomeMonth: number; incomeYear: number
  upcoming: { name: string; due_date: string; daysLeft: number }[]
  byMonth: { month: string; total: number }[]
}
export async function getPaymentStats(): Promise<PaymentStats> {
  const rows = await listStudentsWithMembership()
  const empty: PaymentStats = { totalStudents: rows.length, activeStudents: 0, blockedStudents: 0, pending: 0, expiring: 0, incomeMonth: 0, incomeYear: 0, upcoming: [], byMonth: [] }
  const activeStudents = rows.filter(r => r.status === 'active' || r.status === 'expiring').length
  const blockedStudents = rows.filter(r => r.status === 'expired').length
  const pending = rows.filter(r => r.status === 'expired' || r.status === 'sin_membresia').length
  const expiring = rows.filter(r => r.status === 'expiring').length
  const upcoming = rows.filter(r => r.status === 'expiring' && r.due_date)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
    .slice(0, 8).map(r => ({ name: r.name, due_date: r.due_date as string, daysLeft: r.daysLeft ?? 0 }))

  let incomeMonth = 0, incomeYear = 0
  const byMonthMap = new Map<string, number>()
  if (isSupabaseConfigured()) {
    try {
      const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
      const { data } = await getSupabase()!.from('payments').select('amount, paid_at').gte('paid_at', yearAgo)
      const tMonth = today().slice(0, 7); const tYear = today().slice(0, 4)
      for (const p of (data ?? []) as any[]) {
        const amt = Number(p.amount) || 0
        if (String(p.paid_at).slice(0, 7) === tMonth) incomeMonth += amt
        if (String(p.paid_at).slice(0, 4) === tYear) incomeYear += amt
        const mk = String(p.paid_at).slice(0, 7)
        byMonthMap.set(mk, (byMonthMap.get(mk) || 0) + amt)
      }
    } catch { /* noop */ }
  }
  const byMonth = [...byMonthMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, total]) => ({ month, total }))
  return { ...empty, activeStudents, blockedStudents, pending, expiring, incomeMonth, incomeYear, upcoming, byMonth }
}
