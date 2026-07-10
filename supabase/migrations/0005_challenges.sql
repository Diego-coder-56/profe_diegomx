-- supabase/migrations/0005_challenges.sql
-- Retos: registro de reclamos para no otorgar XP dos veces. Idempotente.
create table if not exists public.challenge_claims (
  user_id       text not null,
  challenge_key text not null,
  period_key    text not null,            -- 'YYYY-MM-DD' (diario) o 'YYYY-Www' (semanal)
  claimed_at    timestamptz not null default now(),
  primary key (user_id, challenge_key, period_key)
);
create index if not exists idx_challenge_claims_user on public.challenge_claims (user_id);
