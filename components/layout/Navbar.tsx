'use client'
// components/layout/Navbar.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-white rounded-xl shadow-card border border-slate-100 flex items-center justify-center group-hover:shadow-card-hover transition-shadow">
            <Image
              src="/logo.png"
              alt="Profe Diego MX"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-[16px] text-slate-900 tracking-tight">
            Profe Diego <span className="text-brand-600">MX</span>
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-7">
          <a href="#cursos"   className="text-[14px] text-slate-500 hover:text-slate-900 font-medium transition-colors">Cursos</a>
          <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
             className="text-[14px] text-slate-500 hover:text-slate-900 font-medium transition-colors">Contacto</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[14px] shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
          >
            Acceder <ArrowRight size={14} />
          </Link>

          {/* Mobile burger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <nav className="flex flex-col px-4 py-4 gap-1">
            <a href="#cursos"
               onClick={() => setMobileOpen(false)}
               className="px-3 py-2.5 text-[15px] text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors">
              Cursos
            </a>
            <a href="https://wa.me/525574818256" target="_blank" rel="noopener noreferrer"
               className="px-3 py-2.5 text-[15px] text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors">
              Contacto por WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
