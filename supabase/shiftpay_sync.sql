-- AkihiroLabs — ShiftPay account sync
-- One row per job / shift / template / tax / profile / goals, owned by the signed-in user.
-- updated_at  = when the item was edited (set by the app, decides which edit wins)
-- synced_at   = when the server received it (set here, used by devices to fetch "what's new")

create table if not exists public.shiftpay_items (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('job','shift','template','tax','profile','goals')),
  id          text not null check (char_length(id) between 1 and 80),
  data        jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now(),
  synced_at   timestamptz not null default now(),
  primary key (user_id, kind, id),
  check (deleted or data is not null),
  check (data is null or pg_column_size(data) < 20000)
);

create index if not exists shiftpay_items_sync_idx on public.shiftpay_items(user_id, synced_at);

create or replace function public.shiftpay_items_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists shiftpay_items_touch on public.shiftpay_items;
create trigger shiftpay_items_touch before insert or update on public.shiftpay_items
  for each row execute function public.shiftpay_items_touch();

alter table public.shiftpay_items enable row level security;

drop policy if exists shiftpay_items_own on public.shiftpay_items;
create policy shiftpay_items_own on public.shiftpay_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
