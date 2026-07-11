'use client'
// components/admin/UserManagementClient.tsx
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronDown, ToggleLeft, ToggleRight,
  BookOpen, ShieldCheck, User, Mail, Plus, X, Check
} from 'lucide-react'
import {
  updateUserRole, toggleUserActive,
  grantCourseAccess, revokeCourseAccess, createUserAction
} from '@/lib/actions'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface Props {
  profiles: Profile[]
  courses: { id: string; title: string; category: string | null }[]
  allAccess: { user_id: string; course_id: string }[]
}

export default function UserManagementClient({ profiles, courses, allAccess }: Props) {
  const [search, setSearch]          = useState('')
  const [expandedId, setExpandedId]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast]            = useState<{ msg: string; type?: 'success' | 'error' } | null>(null)
  const [newModal, setNewModal]      = useState(false)
  const [nf, setNf]                  = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [nErr, setNErr]              = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const createUser = () => {
    setNErr('')
    startTransition(async () => {
      const r = await createUserAction({
        full_name: nf.full_name, email: nf.email, password: nf.password, role: nf.role as any,
      })
      if (!r.ok) { setNErr(r.error ?? 'No se pudo crear el usuario.'); return }
      setNewModal(false)
      setNf({ full_name: '', email: '', password: '', role: 'student' })
      showToast('Usuario creado correctamente')
    })
  }

  const filtered = profiles.filter(p =>
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const getUserCourseIds = (userId: string) =>
    allAccess.filter(a => a.user_id === userId).map(a => a.course_id)

  return (
    <div className="relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: 12 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-6 right-6 z-50 px-4 py-2.5 text-white text-[13px] font-medium rounded-xl shadow-lg ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-slate-900'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Nuevo usuario */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all shadow-card"
          />
        </div>
        <button onClick={() => { setNErr(''); setNewModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[14px] shadow-sm shrink-0 transition-colors">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Modal: crear usuario */}
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !isPending && setNewModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Nuevo usuario</h3>
              <button onClick={() => setNewModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Nombre completo</label>
                <input value={nf.full_name} onChange={e => setNf({ ...nf, full_name: e.target.value })} placeholder="Ana López"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Correo</label>
                <input value={nf.email} onChange={e => setNf({ ...nf, email: e.target.value })} placeholder="ana@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Contraseña (mínimo 6 caracteres)</label>
                <input value={nf.password} onChange={e => setNf({ ...nf, password: e.target.value })} placeholder="Contraseña con la que entrará"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
                <p className="text-[11px] text-slate-400 mt-1">Compártesela al alumno; él podrá usarla para entrar.</p>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Rol</label>
                <select value={nf.role} onChange={e => setNf({ ...nf, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] bg-white focus:outline-none focus:border-brand-400">
                  <option value="student">Alumno</option>
                  <option value="teacher">Profesor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {nErr && <p className="text-[13px] text-red-500">{nErr}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setNewModal(false)} disabled={isPending} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[14px] hover:bg-slate-50">Cancelar</button>
              <button onClick={createUser} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] disabled:opacity-60">
                <Check size={16} /> {isPending ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[2.5fr_1fr_1fr_auto] px-5 py-3 border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Usuario</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Cursos</span>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.map(profile => {
            const userCourseIds = getUserCourseIds(profile.id)
            const isExpanded    = expandedId === profile.id

            return (
              <div key={profile.id}>
                {/* Row */}
                <div className="px-5 py-3.5 flex flex-wrap sm:grid sm:grid-cols-[2.5fr_1fr_1fr_auto] items-center gap-3">

                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-[11px] font-bold shrink-0">
                      {getInitials(profile.full_name, profile.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate flex items-center gap-1.5">
                        {profile.full_name ?? '—'}
                        {profile.role === 'admin' && (
                          <ShieldCheck size={12} className="text-brand-500 shrink-0" />
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <Mail size={10} className="shrink-0" /> {profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Rol */}
                  <div>
                    <select
                      defaultValue={profile.role}
                      onChange={e => {
                        startTransition(async () => {
                          await updateUserRole(profile.id, e.target.value as 'student' | 'admin')
                          showToast(`Rol actualizado a ${e.target.value === 'admin' ? 'Administrador' : 'Alumno'}`)
                        })
                      }}
                      disabled={isPending}
                      className="text-[12px] font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer disabled:opacity-50 hover:border-brand-300 transition-colors"
                    >
                      <option value="student">Alumno</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Activo toggle */}
                  <div>
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          await toggleUserActive(profile.id, !profile.is_active)
                          showToast(`Usuario ${!profile.is_active ? 'activado' : 'desactivado'}`)
                        })
                      }}
                      disabled={isPending}
                      className="flex items-center gap-1.5 text-[12px] disabled:opacity-50 hover:opacity-80 transition-opacity"
                    >
                      {profile.is_active
                        ? <ToggleRight size={22} className="text-emerald-500" />
                        : <ToggleLeft  size={22} className="text-slate-300" />
                      }
                      <span className={`font-medium ${profile.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {profile.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </div>

                  {/* Expandir cursos */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-brand-100"
                  >
                    <BookOpen size={13} />
                    <span className="hidden sm:inline">Cursos</span>
                    {userCourseIds.length > 0 && (
                      <span className="bg-brand-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                        {userCourseIds.length}
                      </span>
                    )}
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Panel cursos */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden bg-slate-50 border-t border-slate-100"
                    >
                      <div className="px-5 py-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Acceso a cursos
                        </p>
                        {courses.length === 0 ? (
                          <p className="text-[13px] text-slate-400">No hay cursos publicados.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {courses.map(course => {
                              const has = userCourseIds.includes(course.id)
                              return (
                                <button
                                  key={course.id}
                                  onClick={() => {
                                    startTransition(async () => {
                                      if (has) {
                                        await revokeCourseAccess(profile.id, course.id)
                                        showToast('Acceso revocado')
                                      } else {
                                        await grantCourseAccess(profile.id, course.id)
                                        showToast('Acceso otorgado ✓')
                                      }
                                    })
                                  }}
                                  disabled={isPending}
                                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium border transition-all text-left disabled:opacity-60 ${
                                    has
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    has ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    {has ? '✓' : '+'}
                                  </span>
                                  <span className="truncate">{course.title}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <User size={32} className="text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-[14px]">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
