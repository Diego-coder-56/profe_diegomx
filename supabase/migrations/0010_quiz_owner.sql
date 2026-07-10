-- 0010_quiz_owner.sql — Propietario del quiz (para zona de profesores). Idempotente.
alter table public.quizzes add column if not exists created_by text;  -- null = oficial/admin
create index if not exists idx_quizzes_created_by on public.quizzes (created_by);
