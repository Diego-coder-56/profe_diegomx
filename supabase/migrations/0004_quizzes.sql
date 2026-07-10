-- supabase/migrations/0004_quizzes.sql
-- Constructor de Quiz: 8 tipos de pregunta (polimórfico vía JSONB). Idempotente.

create table if not exists public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  subject      text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  type        text not null,          -- multiple_choice | true_false | open | fill_blank | match | order | image | math_latex
  prompt      text not null,
  image_url   text,
  payload     jsonb not null default '{}'::jsonb,  -- opciones, respuestas, pares, etc. según el tipo
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_quiz_questions_quiz on public.quiz_questions (quiz_id, position);

create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  score       integer not null,
  total       integer not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_quiz_attempts_user on public.quiz_attempts (user_id, created_at desc);
