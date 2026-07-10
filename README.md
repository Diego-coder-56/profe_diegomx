# Profe Diego MX — v2 (sin Supabase)

Plataforma educativa con Next.js 14, sin dependencia de Supabase.  
**Base de datos**: Netlify Blobs en producción / archivo JSON local en desarrollo.  
**Autenticación**: JWT propio con `jose` + contraseñas hasheadas con `bcryptjs`.

## Deploy en Netlify (5 minutos)

1. Sube el proyecto a GitHub
2. Conéctalo en [app.netlify.com](https://app.netlify.com)
3. En **Site settings → Environment variables**, agrega:

   | Variable          | Valor                              |
   |-------------------|------------------------------------|
   | `JWT_SECRET`      | string secreto (mín. 32 chars)     |
   | `ADMIN_EMAIL`     | correo del admin inicial           |
   | `ADMIN_PASSWORD`  | contraseña del admin inicial       |

4. ¡Despliega! No necesitas configurar ningún servicio externo.

> Al primer request, el sistema crea automáticamente la base de datos,  
> los cursos de ejemplo y la cuenta de admin.

## Desarrollo local

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Los datos se guardan en `.data/db.json` (ignorado por git).

## Estructura

```
lib/
  db.ts       — capa de datos (Netlify Blobs / JSON local)
  auth.ts     — JWT + bcrypt
  session.ts  — cookies de sesión
  actions.ts  — Server Actions
app/
  api/auth/   — endpoints de login/register/logout
  admin/      — panel de administrador
  dashboard/  — área de alumnos
```

## Agregar lecciones a un curso

Desde el panel de admin → Cursos, o directamente via la función `upsertLesson` de `lib/db.ts`.

## Cambiar el número de WhatsApp

Busca `525574818256` en los componentes y reemplaza.
