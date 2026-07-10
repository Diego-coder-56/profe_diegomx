/**
 * lib/session.ts
 * Helpers para leer / escribir la cookie de sesión JWT en Server Components y API Routes.
 * Solo usar desde Node.js runtime (NO desde middleware/Edge).
 */
import { cookies } from 'next/headers'
import { verifyToken, type SessionPayload } from './auth'

export const SESSION_COOKIE = 'pdmx_session'

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function sessionCookieOptions(token: string) {
  return {
    name:     SESSION_COOKIE,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  }
}
