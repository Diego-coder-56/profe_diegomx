export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'
import { sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import { seedIfNeeded } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await seedIfNeeded()
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 })

    const user = await getUserByEmail(email)
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })

    const token = await createToken({ sub: user.id, email: user.email, role: user.role })
    const res = NextResponse.json({ role: user.role })
    res.cookies.set(sessionCookieOptions(token))
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
