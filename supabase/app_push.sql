-- AkihiroLabs — shared Web Push for apps without login (ShiftPay, …)
-- Lives in the same Supabase project as ByteBell. Only the app-push Edge Function
-- (service role) reads/writes this table — RLS is on with no policies.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.app_push (
  id          uuid primary key default gen_random_uuid(),
  app         text not null check (app in ('shiftpay')),
  endpoint    text not null unique check (char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  tz          text not null default 'Asia/Tokyo',
  -- One-off reminders the app schedules: [{ "at": ISO-UTC, "title": "...", "body": "...", "tag": "..." }]
  events      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists app_push_app_idx on public.app_push(app);
alter table public.app_push enable row level security;

-- Dedup log (one row per reminder sent)
create table if not exists public.app_push_log (
  log_key    text primary key,
  created_at timestamptz not null default now()
);
alter table public.app_push_log enable row level security;

-- Run every minute
select cron.unschedule('akihirolabs-app-push') where exists (select 1 from cron.job where jobname = 'akihirolabs-app-push');
select cron.schedule(
  'akihirolabs-app-push',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://hweiqfojjyqivcfswqxj.supabase.co/functions/v1/app-push',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"action":"tick"}'::jsonb
  );
  delete from public.app_push_log where created_at < now() - interval '3 days';
  $$
);
