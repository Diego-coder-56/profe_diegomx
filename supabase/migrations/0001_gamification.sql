-- supabase/migrations/0001_gamification.sql
-- FASE 0 — Fundación de datos para gamificación (XP, racha, ranking, logros).
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr varias veces.
-- No toca los datos existentes en Netlify Blobs; el user_id referencia el id del
-- perfil actual del alumno (mismo identificador), sin migrar nada por ahora.

-- ── Estadísticas y racha por usuario ───────────────────────────────
create table if not exists public.user_stats (
  user_id         text primary key,
  email           text,
  full_name       text,
  total_xp        integer     not null default 0,
  current_streak  integer     not null default 0,
  best_streak     integer     not null default 0,
  last_activity   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_user_stats_total_xp on public.user_stats (total_xp desc);

-- ── Bitácora de XP (cada acción suma un evento) ────────────────────
create table if not exists public.xp_events (
  id          bigint generated always as identity primary key,
  user_id     text        not null,
  action      text        not null,   -- video | quiz | flashcards | daily_login | challenge
  xp          integer     not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_xp_events_user_created on public.xp_events (user_id, created_at desc);
create index if not exists idx_xp_events_created on public.xp_events (created_at desc);

-- ── Catálogo de logros + logros obtenidos ──────────────────────────
create table if not exists public.achievements (
  code        text primary key,
  name        text not null,
  description text,
  emoji       text,
  threshold   integer
);

create table if not exists public.user_achievements (
  user_id    text        not null,
  code       text        not null references public.achievements(code),
  earned_at  timestamptz not null default now(),
  primary key (user_id, code)
);
create index if not exists idx_user_achievements_user on public.user_achievements (user_id);

-- ── Semillas de logros (ampliable a 100+) ──────────────────────────
insert into public.achievements (code, name, description, emoji, threshold) values
  ('first_quiz',  'Primer Quiz',        'Completaste tu primer quiz',          '🎯', null),
  ('xp_100',      'Despegando',         'Alcanzaste 100 XP',                   '⚡', 100),
  ('xp_500',      'Imparable',          'Alcanzaste 500 XP',                   '🚀', 500),
  ('xp_1000',     'Leyenda',            'Alcanzaste 1000 XP',                  '👑', 1000),
  ('streak_7',    '7 Días Seguidos',    'Una semana de constancia',            '🔥', 7),
  ('streak_30',   '30 Días Seguidos',   'Un mes sin fallar',                   '🏆', 30),
  ('streak_100',  '100 Días Seguidos',  'Cien días de disciplina',            '💎', 100),
  ('mate_master', 'Matemáticas Master', '90%+ en simuladores de matemáticas',  '🏅', null),
  ('quim_expert', 'Química Expert',      'Dominio de química',                  '🧪', null),
  ('sim_perfect', 'Simulador Perfecto', '100% en un simulador completo',       '🎖️', null)
on conflict (code) do nothing;

-- Nota: RLS se deja deshabilitado porque el acceso es vía service-role desde el
-- servidor (Server Components/Actions). Si en el futuro se expone al cliente,
-- habilitar RLS y políticas por user_id.
