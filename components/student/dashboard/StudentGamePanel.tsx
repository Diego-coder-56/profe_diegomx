'use client'
// components/student/dashboard/StudentGamePanel.tsx
// Dashboard del alumno: bienvenida, racha, XP, nivel, ranking,
// progreso semanal, "continuar estudiando" y accesos rápidos.
import { motion } from 'framer-motion'
import Link from 'next/link'
import Counter from '@/components/marketing/Counter'
import {
  Flame, Star, Trophy, ArrowRight, BookOpen, Layers, ListChecks,
  Target, Medal, BarChart3, Award, Lock, BrainCircuit, CreditCard, UserCircle,
} from 'lucide-react'
import type { GameState } from '@/lib/gamification'

const WEEK_TARGET_DAYS = 7

export default function StudentGamePanel({
  name, state, continueCourse,
}: {
  name: string
  state: GameState
  continueCourse: { slug: string; title: string } | null
}) {
  const days = Math.min(WEEK_TARGET_DAYS, state.weeklyActiveDays)
  const weekPct = Math.round((days / WEEK_TARGET_DAYS) * 100)

  const stats = [
    { icon: Flame,  tint: 'from-orange-400 to-red-500',  label: 'Racha actual', value: <><Counter to={state.currentStreak} /> días</>, sub: state.bestStreak ? `Mejor: ${state.bestStreak}` : null },
    { icon: Star,   tint: 'from-amber-400 to-yellow-500', label: 'XP',           value: <><Counter to={state.totalXp} /> XP</>, sub: state.weeklyXp ? `+${state.weeklyXp} esta semana` : null },
    { icon: Award,  tint: 'from-brand-400 to-brand-700',  label: 'Nivel',        value: <>Nivel {state.level.level}</>, sub: `${state.level.progressPct}% al siguiente` },
    { icon: Trophy, tint: 'from-violet-400 to-purple-600', label: 'Ranking',     value: state.rank ? <>#{state.rank}</> : <>—</>, sub: state.totalStudents ? `de ${state.totalStudents.toLocaleString('es-MX')} estudiantes` : null },
  ]

  return (
    <div className="mb-10">
      {/* Bienvenida */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">Hola {name} <span>👋</span></h1>

      {/* 4 tarjetas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 sm:p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.tint} flex items-center justify-center mb-3 shadow-sm`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-[12px] text-slate-400 leading-none">{s.label}</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 leading-tight">{s.value}</p>
            {s.sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Progreso semanal */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-emerald-500" />
            <p className="font-bold text-slate-900 text-[14px]">Progreso semanal</p>
          </div>
          <p className="text-[13px] font-bold text-slate-700">
            Meta: <span className="text-emerald-600">{days}/{WEEK_TARGET_DAYS} días</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${weekPct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <span className="text-[13px] font-black text-slate-700 tabular-nums w-10 text-right">{weekPct}%</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {weekPct >= 100 ? '¡Meta semanal cumplida! 🎉' : `Estudia hoy para no perder tu racha 🔥`}
        </p>
      </div>

      {/* Botón grande: Continuar estudiando */}
      {continueCourse ? (
        <Link href={`/dashboard/curso/${continueCourse.slug}`}
          className="group flex items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl shadow-lg shadow-brand-600/20 p-5 sm:p-6 text-white hover:shadow-xl transition-all mb-8">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><BookOpen size={24} /></div>
            <div className="min-w-0">
              <p className="text-[12px] text-blue-100">Continuar estudiando</p>
              <p className="font-extrabold text-[17px] sm:text-[19px] truncate">{continueCourse.title}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-[14px] px-5 py-2.5 rounded-xl shrink-0 group-hover:gap-3 transition-all">
            Continuar <ArrowRight size={16} />
          </span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-400 mb-8">
          <BookOpen size={20} /><span className="text-[14px]">Cuando tengas un curso activo aparecerá aquí para continuar.</span>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickTile icon={BookOpen}     label="Cursos"       href="#mis-cursos" />
        <QuickTile icon={Layers}       label="Flashcards"   href="/dashboard/flashcards" />
        <QuickTile icon={ListChecks}   label="Quiz"         href="/dashboard/quiz" />
        <QuickTile icon={Target}       label="Retos"        href="/dashboard/retos" />
        <QuickTile icon={Trophy}       label="Ranking"      href="/dashboard/ranking" />
        <QuickTile icon={BarChart3}    label="Estadísticas" href="/dashboard/estadisticas" />
        <QuickTile icon={Medal}        label="Logros"       href="/dashboard/logros" />
        <QuickTile icon={BrainCircuit} label="Tutor IA"     href="/dashboard/tutor" />
        <QuickTile icon={CreditCard}   label="Mi membresía" href="/dashboard/membresia" />
        <QuickTile icon={UserCircle}   label="Mi perfil"    href="/dashboard/perfil" />
      </div>
    </div>
  )
}

function QuickTile({ icon: Icon, label, href, soon }: { icon: any; label: string; href?: string; soon?: boolean }) {
  const inner = (
    <div className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all h-full
      ${soon ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 text-slate-700'}`}>
      {soon && (
        <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[8px] font-bold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">
          <Lock size={7} /> PRONTO
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${soon ? 'bg-slate-100' : 'bg-brand-50'}`}>
        <Icon size={18} className={soon ? 'text-slate-300' : 'text-brand-600'} />
      </div>
      <span className="text-[12px] font-semibold text-center">{label}</span>
    </div>
  )
  if (soon || !href) return <div aria-disabled className="cursor-default">{inner}</div>
  return <a href={href}>{inner}</a>
}
