-- Moragas: Categorías con color e ícono

create table if not exists Moragas.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('ingreso', 'egreso')),
  color text not null default '#6b7280',
  icon text not null default 'circle',
  created_at timestamptz not null default now()
);

create unique index if not exists idx_categories_name_type on Moragas.categories(name, type);

-- Default categories
insert into Moragas.categories (name, type, color, icon) values
  ('Ingreso', 'ingreso', '#10b981', 'trending-up'),
  ('Arriendo', 'egreso', '#ef4444', 'home'),
  ('Alimento', 'egreso', '#f59e0b', 'utensils-crossed'),
  ('Transporte', 'egreso', '#3b82f6', 'car'),
  ('Otros', 'egreso', '#8b5cf6', 'more-horizontal')
on conflict (name, type) do nothing;

-- RLS
alter table Moragas.categories enable row level security;

drop policy if exists "Service role only - categories" on Moragas.categories;
create policy "Service role only - categories" on Moragas.categories
  for all using (true) with check (true);

grant all privileges on all tables in schema Moragas to service_role;
