-- supabase/migrations/0003_streak_rewards.sql
-- Recompensas por racha (días consecutivos). Idempotente.
insert into public.achievements (code, name, description, emoji, threshold) values
  ('streak_7',   'Constancia',        'Insignia por 7 días de racha',     '🔥', 7),
  ('streak_15',  'Marco Exclusivo',   'Marco de perfil por 15 días',      '🖼️', 15),
  ('streak_30',  'Certificado',       'Certificado por 30 días de racha', '📜', 30),
  ('streak_60',  'Material Premium',  'Material premium por 60 días',     '🎁', 60),
  ('streak_100', 'Avatar Exclusivo',  'Avatar exclusivo por 100 días',    '🧑‍🚀', 100)
on conflict (code) do update
  set name = excluded.name, description = excluded.description,
      emoji = excluded.emoji, threshold = excluded.threshold;
