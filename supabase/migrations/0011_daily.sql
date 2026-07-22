-- 0011_daily.sql — Reto diario (uno por alumno por día). Idempotente.
create table if not exists public.daily_challenges (
  user_id    text not null,
  day        date not null,
  score      integer not null default 0,
  total      integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists idx_daily_user on public.daily_challenges (user_id, day desc);
