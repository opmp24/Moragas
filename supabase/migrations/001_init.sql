-- Moragas: Tablas iniciales

create schema if not exists Moragas;

-- Access keys para autenticación
create table if not exists Moragas.access_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  display_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  created_by uuid references Moragas.access_keys(id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Sesiones activas
create table if not exists Moragas.sessions (
  id uuid primary key default gen_random_uuid(),
  access_key_id uuid not null references Moragas.access_keys(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

-- Transacciones financieras
create table if not exists Moragas.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ingreso', 'egreso')),
  amount numeric(12, 0) not null check (amount > 0),
  description text not null default '',
  category text not null,
  user_name text,
  raw_message text not null,
  telegram_message_id bigint,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_transactions_created_at on Moragas.transactions(created_at desc);
create index if not exists idx_transactions_type on Moragas.transactions(type);
create index if not exists idx_transactions_category on Moragas.transactions(category);
create index if not exists idx_sessions_token on Moragas.sessions(token);
create index if not exists idx_sessions_access_key_id on Moragas.sessions(access_key_id);
create index if not exists idx_access_keys_key_hash on Moragas.access_keys(key_hash);

-- Enable RLS
alter table Moragas.access_keys enable row level security;
alter table Moragas.sessions enable row level security;
alter table Moragas.transactions enable row level security;

-- RLS policies (drop first for idempotent re-runs)
drop policy if exists "Service role only - access_keys" on Moragas.access_keys;
create policy "Service role only - access_keys" on Moragas.access_keys
  for all using (true) with check (true);

drop policy if exists "Service role only - sessions" on Moragas.sessions;
create policy "Service role only - sessions" on Moragas.sessions
  for all using (true) with check (true);

drop policy if exists "Service role only - transactions" on Moragas.transactions;
create policy "Service role only - transactions" on Moragas.transactions
  for all using (true) with check (true);

-- Monthly summary function
create or replace function Moragas.get_monthly_summary()
returns table (month text, ingresos numeric, egresos numeric)
language sql stable
as $$
  select
    to_char(created_at, 'YYYY-MM') as month,
    coalesce(sum(amount) filter (where type = 'ingreso'), 0) as ingresos,
    coalesce(sum(amount) filter (where type = 'egreso'), 0) as egresos
  from Moragas.transactions
  group by month
  order by month asc;
$$;

-- Category summary function
create or replace function Moragas.get_category_summary()
returns table (category text, total numeric, count bigint)
language sql stable
as $$
  select
    category,
    sum(amount) as total,
    count(*) as count
  from Moragas.transactions
  where type = 'egreso'
  group by category
    order by total desc;
$$;

-- Grant permissions for API access
grant usage on schema Moragas to service_role, anon, authenticated;
grant all privileges on all tables in schema Moragas to service_role;
grant all privileges on all routines in schema Moragas to service_role;
grant usage, select on all sequences in schema Moragas to service_role;
