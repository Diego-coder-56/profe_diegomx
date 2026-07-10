'use client'
// app/login/page.tsx — sin Supabase, usa /api/auth
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error al iniciar sesión')
        router.replace(data.role === 'admin' ? '/admin' : '/dashboard')
        router.refresh()
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error al registrarse')
        setSuccess('¡Cuenta creada! Ya puedes iniciar sesión.')
        setMode('login')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-brand-600 mb-5 transition-colors">
          <ArrowLeft size={13} /> Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-50 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm">
                <Image src="/logo.png" alt="Profe Diego MX" width={36} height={36} className="object-contain" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Profe Diego MX</h1>
            <p className="text-slate-400 text-[13px] mt-0.5">
              {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratis'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(''); setSuccess('') }}
                className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
                  mode === tab ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="px-8 py-7 flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="text-[12px] font-semibold text-slate-600 mb-1.5 block">Nombre completo</label>
                <div className="relative">
                  <UserPlus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre" required
                    className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all bg-slate-50 placeholder:text-slate-400" />
                </div>
              </div>
            )}
            <div>
              <label className="text-[12px] font-semibold text-slate-600 mb-1.5 block">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required
                  className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all bg-slate-50 placeholder:text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-600 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all bg-slate-50 placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-[13px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="text-emerald-700 text-[13px] bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {success}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-xl font-bold text-[14px] shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 mt-1">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
