// lib/daily.ts — Reto diario tipo Duolingo (tema del día del temario IPN + mini-quiz por IA)
import temario from '@/data/ipn-temario.json'
import { askTutor } from '@/lib/tutor'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

export interface DailyTopic { subjectKey: string; subjectLabel: string; emoji: string; topic: string; dayIndex: number }
export interface DailyQuestion { prompt: string; options: string[]; correct: number }

// Lista plana de todos los temas (materia + tema), en orden estable.
function allTopics(): DailyTopic[] {
  const out: DailyTopic[] = []
  const d = temario as any
  for (const key of Object.keys(d)) {
    if (key === '_meta') continue
    const s = d[key]
    for (const topic of s.temas as string[]) {
      out.push({ subjectKey: key, subjectLabel: s.label, emoji: s.emoji, topic, dayIndex: out.length })
    }
  }
  return out
}

/** Días transcurridos desde una fecha ancla (para rotar el tema cada día, igual para todos). */
function dayNumber(): string {
  return new Date().toISOString().slice(0, 10)   // YYYY-MM-DD
}
function daysSinceEpoch(): number {
  return Math.floor(Date.parse(dayNumber() + 'T00:00:00Z') / 86400000)
}

/** El tema del día: rota por todo el temario, el mismo para todos los alumnos ese día. */
export function getDailyTopic(): DailyTopic {
  const topics = allTopics()
  const idx = daysSinceEpoch() % topics.length
  return topics[idx]
}

/** ¿El alumno ya completó el reto de HOY? */
export async function hasDoneToday(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const sb = getSupabase()!
    const { data } = await sb.from('daily_challenges').select('day').eq('user_id', userId).eq('day', dayNumber()).maybeSingle()
    return Boolean(data)
  } catch { return false }
}

/** Marca el reto de hoy como completado (una sola vez por día). */
export async function markDoneToday(userId: string, score: number, total: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const sb = getSupabase()!
    const { error } = await sb.from('daily_challenges').insert({ user_id: userId, day: dayNumber(), score, total })
    return !error   // error de clave duplicada = ya lo había hecho
  } catch { return false }
}

/** Genera 4 preguntas de opción múltiple sobre el tema del día usando el Tutor IA. */
export async function generateDailyQuestions(topic: DailyTopic): Promise<DailyQuestion[]> {
  const prompt =
    `Genera EXACTAMENTE 4 preguntas de opción múltiple para examen de admisión al IPN sobre el tema "${topic.topic}" (${topic.subjectLabel}). ` +
    `Nivel bachillerato. Devuelve SOLO un arreglo JSON válido, sin texto adicional, sin markdown, con este formato exacto: ` +
    `[{"prompt":"...","options":["a","b","c","d"],"correct":0}]. ` +
    `"correct" es el índice (0-3) de la opción correcta. Las preguntas deben ser claras y con una sola respuesta correcta.`
  try {
    const r = await askTutor(prompt, 'resolver')
    if (!r.ok) return []
    const raw = r.text.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = raw.indexOf('['); const end = raw.lastIndexOf(']')
    if (start < 0 || end < 0) return []
    const arr = JSON.parse(raw.slice(start, end + 1))
    return (Array.isArray(arr) ? arr : [])
      .filter((q: any) => q && typeof q.prompt === 'string' && Array.isArray(q.options) && q.options.length >= 2)
      .slice(0, 4)
      .map((q: any) => ({
        prompt: String(q.prompt),
        options: q.options.map((o: any) => String(o)),
        correct: Math.max(0, Math.min(q.options.length - 1, Number(q.correct) || 0)),
      }))
  } catch {
    return []
  }
}
