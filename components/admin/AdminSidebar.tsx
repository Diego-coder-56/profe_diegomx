'use client'
// components/admin/AdminSidebar.tsx
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, BookOpen, LogOut,
  Menu, X, ShieldCheck, GraduationCap, Ticket, ListChecks, CreditCard
} from 'lucide-react'
import { signOut } from '@/lib/actions'

const NAV = [
  { href: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, teacher: false },
  { href: '/admin/usuarios',  label: 'Usuarios',   icon: Users,           teacher: false },
  { href: '/admin/pagos',     label: 'Pagos',      icon: CreditCard,      teacher: false },
  { href: '/admin/cursos',    label: 'Cursos',     icon: BookOpen,        teacher: true },
  { href: '/admin/quizzes',   label: 'Quizzes',    icon: ListChecks,      teacher: true },
  { href: '/admin/profesores', label: 'Profesores', icon: GraduationCap,  teacher: false },
  { href: '/admin/cupones',   label: 'Cupones',    icon: Ticket,          teacher: true },
]

interface Props {
  userName: string
  role?: string
}

export default function AdminSidebar({ userName, role = 'admin' }: Props) {
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)
  const items = NAV.filter(n => role === 'admin' || n.teacher)
  const homeHref = role === 'admin' ? '/admin' : '/admin/cursos'

  const NavLinks = () => (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-100 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-50">
          <Link href={homeHref} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
              <Image
                src="/logo.png"
                alt="Profe Diego MX"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-[13px] leading-tight">Profe Diego MX</p>
              <div className="flex items-center gap-1">
                <ShieldCheck size={10} className="text-brand-600" />
                <p className="text-[10px] text-brand-600 font-bold">Admin</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLinks />
        </nav>

        {/* Usuario + logout */}
        <div className="px-3 py-4 border-t border-slate-50">
          <div className="px-3 py-2 mb-2">
            <p className="text-[11px] text-slate-400 font-medium">Conectado como</p>
            <p className="text-[13px] text-slate-700 font-semibold truncate">{userName}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[14px] text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-100 h-14 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setOpen(v => !v)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Profe Diego MX"
            width={22}
            height={22}
            className="object-contain"
          />
          <span className="font-extrabold text-slate-900 text-[14px]">Profe Diego MX</span>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-[11px] font-bold">
          <ShieldCheck size={11} /> Admin
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col">
            <div className="px-5 py-5 border-b border-slate-50 flex items-center justify-between">
              <Link href={homeHref} onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Profe Diego MX" width={26} height={26} className="object-contain" />
                <span className="font-extrabold text-slate-900 text-[14px]">Profe Diego MX</span>
              </Link>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              <NavLinks />
            </nav>
            <div className="px-3 py-4 border-t border-slate-50">
              <form action={signOut}>
                <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[14px] text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium">
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
