/**
 * middleware.ts — protección de rutas con JWT (sin Supabase)
 * Edge Runtime: NO importar lib/session.ts ni lib/auth.ts (usan bcrypt/next/headers)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt'

// Definido aquí directamente para no importar lib/session.ts en Edge
const SESSION_COOKIE = 'pdmx_session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null
  const session = token ? await verifyTokenEdge(token) : null

  const isAdmin     = pathname.startsWith('/admin')
  const isMaestro   = pathname.startsWith('/maestro')
  const isDashboard = pathname.startsWith('/dashboard')
  const isLogin     = pathname === '/login'

  // Secciones del panel permitidas a profesores (lo demás es solo admin).
  const teacherAllowed = ['/admin/cursos', '/admin/quizzes', '/admin/cupones']
  const isTeacherAllowedAdmin = teacherAllowed.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!session && (isAdmin || isMaestro || isDashboard)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL(
      session.role === 'admin' ? '/admin' : session.role === 'teacher' ? '/admin/cursos' : '/dashboard',
      request.url
    ))
  }

  // Estudiantes nunca entran al panel.
  if (session && isAdmin && session.role !== 'admin' && session.role !== 'teacher') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Profesores: solo Cursos, Quizzes y Cupones. Cualquier otra ruta del panel → Cursos.
  if (session && isAdmin && session.role === 'teacher' && !isTeacherAllowedAdmin) {
    return NextResponse.redirect(new URL('/admin/cursos', request.url))
  }

  // Compatibilidad: la antigua zona /maestro ahora vive dentro del panel.
  if (session && isMaestro) {
    if (session.role !== 'admin' && session.role !== 'teacher') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/admin/quizzes', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
