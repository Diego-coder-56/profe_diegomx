-- 0008_flashcards_user.sql — Flashcards creadas por alumnos y compartidas. Idempotente.
alter table public.flashcards add column if not exists created_by text;     -- null = oficial
alter table public.flashcards add column if not exists shared boolean not null default false;
create index if not exists idx_flashcards_created_by on public.flashcards (created_by);
create index if not exists idx_flashcards_shared on public.flashcards (shared) where shared = true;
