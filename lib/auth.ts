/**
 * lib/auth.ts
 * JWT (jose) + bcrypt — sin Supabase
 */
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export interface SessionPayload {
  sub:   string   // user id
  email: string
  role:  string
}

function secret() {
  const s = process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'
  return new TextEncoder().encode(s)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
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
