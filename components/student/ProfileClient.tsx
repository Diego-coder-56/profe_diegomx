'use client'
// components/student/ProfileClient.tsx — perfil personalizable del alumno
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateMyProfileAction } from '@/lib/actions'
import { User, Save, Check, Image as ImageIcon, Instagram, Facebook, Music2 } from 'lucide-react'

export interface ProfileData {
  full_name: string; email: string; avatar_url: string
  phone: string; city: string; bio: string; school: string; target_exam: string
  instagram: string; tiktok: string; facebook: string
}

const EXAMS = ['', 'COMIPEMS', 'IPN', 'UNAM', 'UAM', 'ECOEMS', 'Otro']

export default function ProfileClient({ initial }: { initial: ProfileData }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [f, setF] = useState<ProfileData>(initial)
  const [saved, setSaved] = useState(false)

  const set = (k: keyof ProfileData, v: string) => { setF(p => ({ ...p, [k]: v })); setSaved(false) }
  const initials = (f.full_name || f.email).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  function save() {
    start(async () => {
      await updateMyProfileAction({
        full_name: f.full_name, avatar_url: f.avatar_url, phone: f.phone, city: f.city,
        bio: f.bio, school: f.school, target_exam: f.target_exam,
        instagram: f.instagram, tiktok: f.tiktok, facebook: f.facebook,
      })
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Foto */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <p className="font-bold text-slate-900 text-[15px] mb-4">Foto de perfil</p>
        <div className="flex items-center gap-5">
          {f.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-100"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials || <User size={26} />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">URL de tu foto</label>
            <input value={f.avatar_url} onChange={e => set('avatar_url', e.target.value)}
              placeholder="https://... (pega el link de tu foto)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ImageIcon size={11} /> Sube tu foto a un servicio como imgbb.com o postimages.org y pega aquí el enlace.
            </p>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-4">
        <p className="font-bold text-slate-900 text-[15px]">Datos personales</p>
        <Field label="Nombre completo" value={f.full_name} onChange={v => set('full_name', v)} />
        <div>
          <label className="block text-[13px] font-semibold text-slate-600 mb-1">Correo</label>
          <input value={f.email} disabled className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-[14px]" />
          <p className="text-[11px] text-slate-400 mt-1">El correo no se puede cambiar. Pídeselo a tu profe si necesitas otro.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Teléfono" value={f.phone} onChange={v => set('phone', v)} placeholder="55 1234 5678" />
          <Field label="Ciudad" value={f.city} onChange={v => set('city', v)} placeholder="Ecatepec, Edomex" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Escuela / plantel deseado" value={f.school} onChange={v => set('school', v)} placeholder="Ej. CECyT 9" />
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">Examen que presentas</label>
            <select value={f.target_exam} onChange={e => set('target_exam', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] bg-white focus:outline-none focus:border-brand-400">
              {EXAMS.map(x => <option key={x} value={x}>{x || 'Selecciona…'}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-slate-600 mb-1">Sobre mí</label>
          <textarea value={f.bio} onChange={e => set('bio', e.target.value)} rows={3} maxLength={280}
            placeholder="Cuéntanos algo de ti: qué quieres estudiar, tu meta…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 resize-none" />
          <p className="text-[11px] text-slate-400 mt-1 text-right">{f.bio.length}/280</p>
        </div>
      </div>

      {/* Redes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-4">
        <p className="font-bold text-slate-900 text-[15px]">Redes sociales <span className="text-slate-400 font-normal text-[13px]">(opcional)</span></p>
        <IconField icon={Instagram} label="Instagram" value={f.instagram} onChange={v => set('instagram', v)} placeholder="@tuusuario" />
        <IconField icon={Music2} label="TikTok" value={f.tiktok} onChange={v => set('tiktok', v)} placeholder="@tuusuario" />
        <IconField icon={Facebook} label="Facebook" value={f.facebook} onChange={v => set('facebook', v)} placeholder="tu perfil" />
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all active:scale-95 disabled:opacity-60">
          <Save size={17} /> {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && !pending && (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[14px]">
            <Check size={17} /> ¡Guardado!
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
    </div>
  )
}
function IconField({ icon: Icon, label, value, onChange, placeholder }: { icon: any; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><Icon size={16} className="text-slate-400" /></div>
      <div className="flex-1">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:border-brand-400" />
      </div>
    </div>
  )
}
