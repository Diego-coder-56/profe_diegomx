export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUser } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { seedIfNeeded } from '@/lib/db'
import type { StoredUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await seedIfNeeded()
    const { email, password, full_name } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })

    const existing = await getUserByEmail(email)
    if (existing) return NextResponse.json({ error: 'Ya existe una cuenta con ese correo.' }, { status: 409 })

    const now = new Date().toISOString()
    const user: StoredUser = {
      id:            crypto.randomUUID(),
      email:         email.toLowerCase().trim(),
      full_name:     full_name?.trim() || null,
      role:          'student',
      is_active:     true,
      avatar_url:    null,
      password_hash: await hashPassword(password),
      created_at:    now,
      updated_at:    now,
    }
    await createUser(user)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
