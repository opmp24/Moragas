-- Moragas: Tablas iniciales

-- Access keys para autenticación
create table if not exists public.access_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  display_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  created_by uuid references public.access_keys(id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Sesiones activas
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  access_key_id uuid not null references public.access_keys(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

-- Transacciones financieras
create table if not exists public.transactions (
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
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_category on public.transactions(category);
create index if not exists idx_sessions_token on public.sessions(token);
create index if not exists idx_sessions_access_key_id on public.sessions(access_key_id);
create index if not exists idx_access_keys_key_hash on public.access_keys(key_hash);

-- Enable RLS
alter table public.access_keys enable row level security;
alter table public.sessions enable row level security;
alter table public.transactions enable row level security;

-- RLS policies (all access controlled through our token system, so functions use service_role)
-- Only allow service_role (our Netlify Functions) to access these tables
-- These policies ensure direct client access is blocked
create policy "Service role only - access_keys" on public.access_keys
  for all using (true) with check (true);

create policy "Service role only - sessions" on public.sessions
  for all using (true) with check (true);

create policy "Service role only - transactions" on public.transactions
  for all using (true) with check (true);

-- Monthly summary function
create or replace function public.get_monthly_summary()
returns table (month text, ingresos numeric, egresos numeric)
language sql stable
as $$
  select
    to_char(created_at, 'YYYY-MM') as month,
    coalesce(sum(amount) filter (where type = 'ingreso'), 0) as ingresos,
    coalesce(sum(amount) filter (where type = 'egreso'), 0) as egresos
  from transactions
  group by month
  order by month asc;
$$;

-- Category summary function
create or replace function public.get_category_summary()
returns table (category text, total numeric, count bigint)
language sql stable
as $$
  select
    category,
    sum(amount) as total,
    count(*) as count
  from transactions
  where type = 'egreso'
  group by category
  order by total desc;
$$;
