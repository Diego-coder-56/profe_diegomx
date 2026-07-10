'use client'
// components/marketing/FreeSimulator.tsx — Simulador gratis (10 preguntas reales)
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles, Lock } from 'lucide-react'

type Q = { materia: string; emoji: string; question: string; options: string[]; correct_index: number; explanation: string }

const QUESTIONS: Q[] = [{"materia": "Matemáticas", "emoji": "📐", "question": "¿Cuánto es 15% de 200?", "options": ["25", "30", "35", "40"], "correct_index": 1, "explanation": "El 15% de 200 = 0.15 × 200 = 30."}, {"materia": "Español", "emoji": "📝", "question": "¿Qué tipo de palabra es 'rápidamente'?", "options": ["Adjetivo", "Adverbio", "Sustantivo", "Conjunción"], "correct_index": 1, "explanation": "Las palabras terminadas en '-mente' son adverbios de modo."}, {"materia": "Física", "emoji": "⚛️", "question": "¿Cuál es la unidad de fuerza en el Sistema Internacional?", "options": ["Pascal", "Joule", "Newton", "Watt"], "correct_index": 2, "explanation": "La fuerza se mide en Newtons (N) en el SI. 1 N = 1 kg·m/s²."}, {"materia": "Química", "emoji": "🧪", "question": "¿Cuál es el símbolo del sodio?", "options": ["So", "Sd", "Na", "N"], "correct_index": 2, "explanation": "El sodio tiene símbolo Na, del latín 'Natrium'."}, {"materia": "Biología", "emoji": "🧬", "question": "¿Cuál es la unidad básica de la vida?", "options": ["Tejido", "Órgano", "Célula", "Átomo"], "correct_index": 2, "explanation": "La célula es la unidad estructural y funcional de todos los seres vivos."}, {"materia": "Álgebra", "emoji": "🔢", "question": "Simplifica: 3x + 5x - 2x", "options": ["6x", "8x", "10x", "5x"], "correct_index": 0, "explanation": "Se suman los coeficientes de términos semejantes: 3 + 5 - 2 = 6, resultado: 6x."}, {"materia": "Historia", "emoji": "🏛️", "question": "¿En qué año se consumó la Independencia de México?", "options": ["1810", "1821", "1824", "1800"], "correct_index": 1, "explanation": "La Independencia de México se consumó el 27 de septiembre de 1821 con la entrada del Ejército Trigarante a la Ciudad de México."}, {"materia": "Cálculo", "emoji": "∫", "question": "¿Cuál es la derivada de f(x) = x³?", "options": ["3x²", "x²", "3x", "x³/3"], "correct_index": 0, "explanation": "Regla de la potencia: d/dx(xⁿ) = n·xⁿ⁻¹. Para n=3: 3x²."}, {"materia": "Admisión IPN", "emoji": "🎓", "question": "En el examen del IPN, si un tren viaja a 80 km/h y otro a 100 km/h en dirección contraria, ¿en cuánto tiempo se encuentran si parten de puntos separados 360 km?", "options": ["2 h", "2.5 h", "3 h", "4 h"], "correct_index": 0, "explanation": "Velocidad relativa = 80+100 = 180 km/h. Tiempo = 360/180 = 2 horas."}, {"materia": "Admisión UNAM", "emoji": "🦁", "question": "En el EXANI-I de la UNAM, ¿cuántos reactivos tiene aproximadamente el examen de selección?", "options": ["100", "120", "128", "150"], "correct_index": 2, "explanation": "El examen de selección de la UNAM (CCH/ENP) consta de 128 reactivos de opción múltiple."}]

export default function FreeSimulator() {
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const q = QUESTIONS[i]
  const score = answers.reduce((acc, a, idx) => acc + (a === QUESTIONS[idx].correct_index ? 1 : 0), 0)

  function choose(idx: number) {
    if (picked !== null) return
    setPicked(idx)
  }
  function next() {
    const ans = [...answers, picked ?? -1]
    setAnswers(ans)
    setPicked(null)
    if (i + 1 >= QUESTIONS.length) setDone(true)
    else setI(i + 1)
  }
  function reset() {
    setStarted(false); setI(0); setPicked(null); setAnswers([]); setDone(false)
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-8 sm:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-[13px] font-semibold mb-6">
          <Sparkles size={15} /> 100% gratis, sin registro
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Prueba 10 preguntas GRATIS</h3>
        <p className="mt-3 text-slate-500">Reactivos reales de IPN, UNAM y bachillerato. Mide tu nivel en 2 minutos.</p>
        <button onClick={() => setStarted(true)}
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
          🎯 Probar Simulador Gratis <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((score / QUESTIONS.length) * 100)
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-8 sm:p-12 text-center">
        <div className="text-6xl font-black text-brand-600">{score}<span className="text-2xl text-slate-300">/{QUESTIONS.length}</span></div>
        <p className="mt-2 text-slate-500">{pct}% de aciertos</p>
        <p className="mt-4 text-lg font-bold text-slate-900">
          {pct >= 70 ? '¡Vas muy bien! 🎉' : pct >= 40 ? '¡Buen comienzo! 💪' : 'Hay mucho por mejorar 📚'}
        </p>
        <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100">
          <div className="flex items-center justify-center gap-2 text-brand-700 font-bold mb-2"><Lock size={16} /> Desbloquea todos los simuladores</div>
          <p className="text-[14px] text-slate-600">Regístrate para acceder a +3000 reactivos, simuladores completos, ranking y seguimiento personalizado.</p>
          <Link href="/login" className="mt-5 inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg transition-all">
            Crear cuenta gratis <ArrowRight size={16} />
          </Link>
        </div>
        <button onClick={reset} className="mt-5 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-[14px] font-medium">
          <RotateCcw size={14} /> Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[13px] font-semibold text-slate-400">Pregunta {i + 1} de {QUESTIONS.length}</span>
        <span className="text-[13px] font-bold text-brand-600">{q.emoji} {q.materia}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${((i) / QUESTIONS.length) * 100}%` }} />
      </div>
      <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-6">{q.question}</h4>
      <div className="space-y-3">
        {q.options.map((opt, idx) => {
          const isCorrect = idx === q.correct_index
          const isPicked = idx === picked
          let cls = 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'
          if (picked !== null) {
            if (isCorrect) cls = 'border-green-400 bg-green-50'
            else if (isPicked) cls = 'border-red-300 bg-red-50'
            else cls = 'border-slate-200 opacity-60'
          }
          return (
            <button key={idx} onClick={() => choose(idx)} disabled={picked !== null}
              className={`w-full flex items-center justify-between text-left px-5 py-4 rounded-2xl border-2 font-medium text-slate-700 transition-all ${cls}`}>
              <span>{opt}</span>
              {picked !== null && isCorrect && <CheckCircle2 size={20} className="text-green-500 shrink-0" />}
              {picked !== null && isPicked && !isCorrect && <XCircle size={20} className="text-red-400 shrink-0" />}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className="mt-5 p-4 bg-slate-50 rounded-2xl text-[14px] text-slate-600 animate-fade-in">
          <span className="font-bold text-slate-800">Explicación: </span>{q.explanation}
        </div>
      )}
      {picked !== null && (
        <button onClick={next}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
          {i + 1 >= QUESTIONS.length ? 'Ver mi resultado' : 'Siguiente pregunta'} <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}
