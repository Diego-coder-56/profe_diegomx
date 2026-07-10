// lib/tutor.ts — IA Tutor con proveedores GRATUITOS (Groq o Google Gemini).
// Detecta automáticamente la API key disponible. Todas son gratis de obtener:
//   • Groq:   https://console.groq.com  (gratis, muy rápido)  → GROQ_API_KEY
//   • Gemini: https://aistudio.google.com/apikey (gratis)     → GEMINI_API_KEY
//   • Anthropic (de pago, opcional)                           → ANTHROPIC_API_KEY
export type TutorMode = 'resolver' | 'explicar' | 'pasos' | 'otro'

const SYSTEM_BASE =
  'Eres "Profe Diego", un tutor experto que prepara estudiantes mexicanos para exámenes de admisión (ECOEMS, IPN, UNAM, UAM). ' +
  'Respondes en español claro y motivador, a nivel preparatoria. Para matemáticas, escribe las fórmulas en LaTeX entre signos $.'

const MODE_PROMPT: Record<TutorMode, string> = {
  resolver: 'Resuelve el siguiente problema y da la RESPUESTA FINAL de forma clara y breve.',
  explicar: 'Explica el siguiente problema o concepto de forma sencilla, con una analogía si ayuda. No te alargues.',
  pasos:    'Resuelve el siguiente problema PASO A PASO, numerando cada paso y explicando el porqué.',
  otro:     'Genera UN ejercicio NUEVO similar al siguiente (mismo tema y dificultad) e incluye su solución al final.',
}

type Provider = 'groq' | 'gemini' | 'anthropic'
function provider(): Provider | null {
  if (process.env.GROQ_API_KEY) return 'groq'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}
export function isTutorConfigured(): boolean { return provider() !== null }

export async function askTutor(question: string, mode: TutorMode): Promise<{ ok: boolean; text: string }> {
  if (!question.trim()) return { ok: false, text: 'Escribe una pregunta o ejercicio.' }
  const p = provider()
  if (!p) return { ok: false, text: 'El Tutor IA aún no está configurado. Agrega una API key gratuita (GROQ_API_KEY o GEMINI_API_KEY) en el servidor.' }
  const system = `${SYSTEM_BASE}\n\nTarea: ${MODE_PROMPT[mode]}`
  try {
    if (p === 'groq')   return await callGroq(system, question)
    if (p === 'gemini') return await callGemini(system, question)
    return await callAnthropic(system, question)
  } catch {
    return { ok: false, text: 'Ocurrió un error al consultar al tutor. Intenta de nuevo.' }
  }
}

async function callGroq(system: string, question: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [{ role: 'system', content: system }, { role: 'user', content: question }],
    }),
  })
  if (!res.ok) return { ok: false, text: `No se pudo contactar al tutor (Groq ${res.status}).` }
  const data = await res.json()
  return { ok: true, text: (data?.choices?.[0]?.message?.content ?? 'Sin respuesta.').trim() }
}

async function callGemini(system: string, question: string) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
    }),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    const msg = detail?.error?.message ?? ''
    return { ok: false, text: `No se pudo contactar al tutor (Gemini ${res.status}). ${msg}`.trim() }
  }
  const data = await res.json()
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((x: any) => x.text ?? '').join('').trim()
  return { ok: true, text: text || 'Sin respuesta.' }
}

async function callAnthropic(system: string, question: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY as string, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.TUTOR_MODEL || 'claude-3-5-sonnet-20241022', max_tokens: 1024, system, messages: [{ role: 'user', content: question }] }),
  })
  if (!res.ok) return { ok: false, text: `No se pudo contactar al tutor (Anthropic ${res.status}).` }
  const data = await res.json()
  return { ok: true, text: (data?.content ?? []).map((b: any) => (b.type === 'text' ? b.text : '')).join('\n').trim() || 'Sin respuesta.' }
}
