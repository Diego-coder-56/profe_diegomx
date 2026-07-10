/**
 * lib/jwt.ts
 * Solo verificación de JWT con jose — compatible con Edge Runtime.
 * NO importar bcryptjs aquí.
 */
import { jwtVerify } from 'jose'
import type { SessionPayload } from './auth'

function secret() {
  const s = process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'
  return new TextEncoder().encode(s)
}

export async function verifyTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return {
      sub:   payload.sub as string,
      email: payload.email as string,
      role:  payload.role  as string,
    }
  } catch {
    return null
  }
}
