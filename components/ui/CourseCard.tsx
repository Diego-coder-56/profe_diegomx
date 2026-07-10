// components/ui/CourseCard.tsx
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Course } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  'IPN':         'bg-red-50 text-red-600 border-red-100',
  'UNAM':        'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Cálculo':     'bg-purple-50 text-purple-600 border-purple-100',
  'Matemáticas': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Física':      'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Química':     'bg-orange-50 text-orange-600 border-orange-100',
}

const CATEGORY_BG: Record<string, string> = {
  'IPN':         'from-red-400 to-red-600',
  'UNAM':        'from-yellow-400 to-orange-500',
  'Cálculo':     'from-purple-500 to-indigo-600',
  'Matemáticas': 'from-indigo-400 to-blue-600',
  'Física':      'from-emerald-400 to-teal-600',
  'Química':     'from-orange-400 to-red-500',
}

interface Props {
  course: Course
  showEnroll?: boolean
}

export default function CourseCard({ course, showEnroll = true }: Props) {
  const catColor = CATEGORY_COLORS[course.category ?? ''] ?? 'bg-slate-50 text-slate-600 border-slate-100'
  const catGrad  = CATEGORY_BG[course.category ?? ''] ?? 'from-brand-500 to-brand-700'

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Thumbnail / Header decorativo */}
      <div className={`h-36 bg-gradient-to-br ${catGrad} relative overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-10 bg-hero-grid" />
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
          <BookOpen size={28} className="text-white" />
        </div>
        {/* Burbuja decorativa */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
      </div>

      {/* Contenido */}
      <div className="flex-1 p-5 flex flex-col gap-3">
        {/* Categoría */}
        {course.category && (
          <span className={`inline-flex w-fit px-2.5 py-1 text-[11px] font-bold rounded-lg border ${catColor}`}>
            {course.category}
          </span>
        )}

        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-[16px] leading-snug mb-1 group-hover:text-brand-600 transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
              {course.description}
            </p>
          )}
        </div>

        {/* Precio + CTA */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50">
          <p className="text-[18px] font-extrabold text-slate-900">
            {formatPrice(course.price)}
          </p>
          {showEnroll && (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 hover:bg-brand-600 text-brand-600 hover:text-white rounded-xl text-[13px] font-semibold transition-all duration-200"
            >
              Inscribirme <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
