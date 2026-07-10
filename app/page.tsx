export const dynamic = 'force-dynamic'
// app/page.tsx — Landing Page Premium · Profe Diego MX
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import CourseCard from '@/components/ui/CourseCard'
import Counter from '@/components/marketing/Counter'
import FreeSimulator from '@/components/marketing/FreeSimulator'
import Testimonials from '@/components/marketing/Testimonials'
import FAQ from '@/components/marketing/FAQ'
import PerfRadar from '@/components/marketing/PerfRadar'
import LiveActivity from '@/components/marketing/LiveActivity'
import {
  ArrowRight, Rocket, Target, BrainCircuit, Trophy, Radar as RadarIcon,
  ListChecks, Check, X, Medal, Flame, GraduationCap, Sparkles, BookOpen,
} from 'lucide-react'
import { listCourses, seedIfNeeded } from '@/lib/db'
import type { Course } from '@/types'

async function getCourses(): Promise<Course[]> {
  await seedIfNeeded()
  return listCourses(true)
}

const METRICS = [
  { value: 3000, prefix: '+', suffix: '', label: 'Reactivos', icon: ListChecks },
  { value: 120,  prefix: '+', suffix: '', label: 'Simuladores', icon: Target },
  { value: 500,  prefix: '+', suffix: '', label: 'Alumnos', icon: GraduationCap },
  { value: 95,   prefix: '',  suffix: '%', label: 'Satisfacción', icon: Trophy },
]

const COMPARISON = [
  { feature: 'Inteligencia Artificial', us: true, them: false },
  { feature: 'Simuladores', us: true, them: true },
  { feature: 'Ranking semanal', us: true, them: false },
  { feature: 'Radar de desempeño', us: true, them: false },
  { feature: 'Apoyo por WhatsApp', us: true, them: false },
  { feature: 'Explicación por reactivo', us: true, them: false },
]

const RANKING = [
  { pos: 1, name: 'Sofía H.', score: 982, courses: 5 },
  { pos: 2, name: 'Diego A.', score: 957, courses: 4 },
  { pos: 3, name: 'Mariana L.', score: 931, courses: 6 },
  { pos: 4, name: 'Emilio R.', score: 910, courses: 3 },
  { pos: 5, name: 'Valeria S.', score: 894, courses: 4 },
  { pos: 6, name: 'Ángel P.', score: 877, courses: 5 },
  { pos: 7, name: 'Renata M.', score: 860, courses: 3 },
  { pos: 8, name: 'Iker G.', score: 845, courses: 4 },
  { pos: 9, name: 'Camila V.', score: 829, courses: 2 },
  { pos: 10, name: 'Bruno T.', score: 812, courses: 3 },
]

const BADGES = [
  { emoji: '🏅', name: 'Matemáticas Master', desc: '90%+ en simuladores de mate' },
  { emoji: '🧪', name: 'Química Expert', desc: 'Domina la tabla periódica' },
  { emoji: '🎯', name: 'Simulador Perfecto', desc: '100% en un simulador completo' },
  { emoji: '🔥', name: '30 Días Consecutivos', desc: 'Constancia de un mes' },
]

const RESULTS = [
  { value: 120, label: 'Alumnos aceptados', highlight: true },
  { value: 48, label: 'IPN' },
  { value: 39, label: 'UNAM' },
  { value: 21, label: 'UAM' },
  { value: 12, label: 'Otros' },
]

const DASHBOARD_PREVIEW = [
  { icon: BookOpen, title: 'Mis Cursos', desc: 'Todo tu material en un solo lugar' },
  { icon: BrainCircuit, title: 'Práctica con IA', desc: 'Refuerza tus puntos débiles' },
  { icon: Trophy, title: 'Ranking', desc: 'Compite con otros aspirantes' },
  { icon: RadarIcon, title: 'Radar de desempeño', desc: 'Visualiza tu nivel por materia' },
  { icon: Target, title: 'Simuladores', desc: 'Reactivos tipo examen real' },
  { icon: Medal, title: 'Insignias', desc: 'Logros por tu esfuerzo' },
]

export default async function LandingPage() {
  const courses = await getCourses()

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">

        {/* ── HERO PREMIUM ─────────────────────────────────────── */}
        <section className="relative flex items-center bg-[#f8fafc] overflow-hidden pt-28 pb-20 sm:pt-32">
          <div className="absolute inset-0 bg-hero-grid pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-sky-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-[13px] font-semibold mb-8 animate-fade-in">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-slow" />
                Plataforma educativa #1 para exámenes de admisión
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight animate-slide-up">
                Prepárate para{' '}
                <span className="text-brand-600">ECOEMS, UNAM e IPN</span>{' '}
                con IA, Simuladores y Clases Especializadas
              </h1>
              <p className="mt-8 text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '120ms' }}>
                Miles de reactivos, simuladores inteligentes, seguimiento personalizado y clases impartidas por expertos.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Link href="/login" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-[15px] shadow-lg hover:shadow-blue-500/25 transition-all duration-200 active:scale-95">
                  <Rocket size={17} /> Comenzar Ahora
                </Link>
                <a href="#simulador" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-semibold text-[15px] border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200">
                  <Target size={17} className="text-brand-600" /> Probar Simulador Gratis
                </a>
              </div>

              {/* Métricas */}
              <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '350ms' }}>
                {METRICS.map(({ value, prefix, suffix, label, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card px-4 py-6 flex flex-col items-center gap-2">
                    <Icon size={20} className="text-brand-600" />
                    <p className="text-3xl font-extrabold text-slate-900">
                      <Counter to={value} prefix={prefix} suffix={suffix} />
                    </p>
                    <p className="text-[13px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ACTIVIDAD EN TIEMPO REAL ─────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LiveActivity />
          </div>
        </section>

        {/* ── DASHBOARD PREVIEW ────────────────────────────────── */}
        <section className="py-24 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Todo en una plataforma</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Una experiencia de estudio completa</h2>
              <p className="mt-3 text-slate-500 max-w-xl mx-auto">Cursos, inteligencia artificial, ranking, radar y simuladores — diseñados para llevarte a tu examen con ventaja.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DASHBOARD_PREVIEW.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-600 transition-colors">
                    <Icon size={22} className="text-brand-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="text-[14px] text-slate-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SIMULADOR GRATIS ─────────────────────────────────── */}
        <section id="simulador" className="py-24 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Pruébalo ahora</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Simulador gratis</h2>
            </div>
            <FreeSimulator />
          </div>
        </section>

        {/* ── CURSOS ───────────────────────────────────────────── */}
        <section id="cursos" className="py-24 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Catálogo completo</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Nuestros cursos</h2>
              <p className="mt-3 text-slate-500 max-w-xl mx-auto">Contenido diseñado específicamente para los exámenes de admisión más exigentes de México.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
            <div className="mt-12 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/25 transition-all duration-200">
                Ver todos los cursos <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── COMPARATIVA ──────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Por qué elegirnos</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Profe Diego vs. otros</h2>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-card">
              <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 border-b border-slate-200 text-[13px] sm:text-[14px] font-bold text-slate-500">
                <div className="px-5 sm:px-8 py-4">Característica</div>
                <div className="px-4 sm:px-8 py-4 text-center text-brand-700">Profe Diego</div>
                <div className="px-4 sm:px-8 py-4 text-center">Otros</div>
              </div>
              {COMPARISON.map((row, idx) => (
                <div key={row.feature} className={`grid grid-cols-[1fr_auto_auto] items-center text-[14px] ${idx % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
                  <div className="px-5 sm:px-8 py-4 font-medium text-slate-700">{row.feature}</div>
                  <div className="px-4 sm:px-8 py-4 flex justify-center">
                    {row.us
                      ? <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><Check size={16} className="text-green-600" /></span>
                      : <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} className="text-slate-400" /></span>}
                  </div>
                  <div className="px-4 sm:px-8 py-4 flex justify-center">
                    {row.them
                      ? <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><Check size={16} className="text-green-600" /></span>
                      : <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} className="text-slate-400" /></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RANKING + RADAR ──────────────────────────────────── */}
        <section className="py-24 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            {/* Ranking */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Trophy size={22} className="text-amber-500" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">🥇 Top 10 de la Semana</h2>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
                {RANKING.map((r) => {
                  const medal = r.pos === 1 ? '🥇' : r.pos === 2 ? '🥈' : r.pos === 3 ? '🥉' : null
                  return (
                    <div key={r.pos} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className={`w-8 text-center font-bold ${r.pos <= 3 ? 'text-xl' : 'text-slate-400'}`}>{medal ?? r.pos}</div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                        {r.name.split(' ').map(p => p[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{r.name}</p>
                        <p className="text-[12px] text-slate-400">{r.courses} cursos completados</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-brand-600 tabular-nums">{r.score}</p>
                        <p className="text-[11px] text-slate-400">pts</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Radar */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <RadarIcon size={22} className="text-brand-600" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Radar de desempeño</h2>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-8">
                <PerfRadar />
                <p className="text-center text-[14px] text-slate-500 mt-4">
                  Visualiza tu nivel por materia y enfoca tu estudio donde más lo necesitas. Se calcula con tus resultados reales en simuladores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── INSIGNIAS ────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Gana logros</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Insignias por tu esfuerzo</h2>
              <p className="mt-3 text-slate-500 max-w-xl mx-auto">Mantente motivado desbloqueando insignias mientras avanzas en tu preparación.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BADGES.map((b) => (
                <div key={b.name} className="bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200 p-6 text-center shadow-card hover:shadow-card-hover transition-all">
                  <div className="text-5xl mb-3">{b.emoji}</div>
                  <h3 className="font-bold text-slate-900 text-[15px]">{b.name}</h3>
                  <p className="text-[13px] text-slate-500 mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RESULTADOS ───────────────────────────────────────── */}
        <section className="py-24 bg-brand-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-grid opacity-10 pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-blue-200 font-semibold text-[13px] uppercase tracking-widest mb-3">Casos reales</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Nuestros resultados</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {RESULTS.map((r) => (
                <div key={r.label} className={`rounded-2xl p-6 text-center ${r.highlight ? 'bg-white col-span-2 lg:col-span-1' : 'bg-brand-700/40 border border-brand-500/40'}`}>
                  <p className={`text-4xl font-black ${r.highlight ? 'text-brand-600' : 'text-white'}`}>
                    <Counter to={r.value} />
                  </p>
                  <p className={`text-[13px] mt-1 font-medium ${r.highlight ? 'text-slate-500' : 'text-blue-100'}`}>{r.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIOS ──────────────────────────────────────── */}
        <section className="py-24 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Lo que dicen</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Historias de ingreso</h2>
            </div>
            <Testimonials />
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Dudas</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Preguntas frecuentes</h2>
            </div>
            <FAQ />
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────────────────── */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600 rounded-full blur-[140px] opacity-30 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[13px] font-semibold mb-6">
              <Sparkles size={15} /> Tu lugar te está esperando
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">¿Listo para ingresar?</h2>
            <p className="text-slate-300 text-[16px] mb-8">Únete a cientos de alumnos que ya aprobaron su examen con Profe Diego MX.</p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all active:scale-95">
                <Rocket size={17} /> Comenzar Ahora
              </Link>
              <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all">
                <Flame size={17} className="text-orange-500" /> Hablar con el profe
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="bg-slate-950 text-slate-400 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Profe Diego MX" width={32} height={32} className="object-contain opacity-90" />
              <span className="font-bold text-white text-[15px]">Profe Diego MX</span>
            </div>
            <p className="text-[13px]">© {new Date().getFullYear()} Profe Diego MX. Todos los derechos reservados.</p>
          </div>
        </footer>
      </main>
      <WhatsAppButton />
    </>
  )
}
