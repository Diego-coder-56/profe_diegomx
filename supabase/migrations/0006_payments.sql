-- supabase/migrations/0006_payments.sql
-- Pagos, membresías y notificaciones. Idempotente. Aditivo: referencia el id de
-- usuario actual (Netlify Blobs) sin migrar ni tocar los usuarios existentes.

create table if not exists public.memberships (
  user_id            text primary key,
  start_date         date,
  last_payment_date  date,
  due_date           date,                 -- vencimiento de la vigencia actual
  monthly_amount     numeric(10,2),
  updated_at         timestamptz not null default now()
);

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  amount        numeric(10,2) not null,
  method        text,                       -- efectivo | transferencia | tarjeta | oxxo | otro
  concept       text,
  period_month  text,                       -- 'YYYY-MM' que cubre el pago
  paid_at       date not null default current_date,
  due_date      date,                       -- vigencia que otorga este pago
  notes         text,
  receipt_url   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_payments_user on public.payments (user_id, paid_at desc);
create index if not exists idx_payments_paid_at on public.payments (paid_at desc);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  title       text not null,
  message     text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
