-- 0009_quiz_timer.sql — Temporizador opcional por quiz. Idempotente.
alter table public.quizzes add column if not exists time_limit_sec integer;  -- null = sin límite
