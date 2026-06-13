-- Moragas 009: App branding configuration
-- Tabla para personalizar nombre, color e icono desde Admin

create table if not exists moragas.app_config (
  id uuid primary key default gen_random_uuid(),
  app_name text not null default 'Moragas',
  primary_color text not null default '#065f46',
  updated_at timestamptz default now(),
  updated_by uuid references moragas.access_keys(id)
);

-- Fila única (solo una fila de configuración)
insert into moragas.app_config (app_name, primary_color)
values ('Moragas', '#065f46');

-- RPC pública: obtener config (sin auth, usado en login page)
create or replace function public.get_app_config()
returns json
language sql
security definer
as $$
  select row_to_json(t) from moragas.app_config t limit 1;
$$;

-- RPC admin: actualizar config
create or replace function moragas.admin_update_app_config(
  p_token text,
  p_app_name text default null,
  p_primary_color text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_admin_id uuid;
  v_row record;
begin
  v_admin_id := moragas.require_admin(p_token);

  if p_app_name is not null and trim(p_app_name) = '' then
    raise exception using errcode = 'VAL1', message = 'El nombre no puede estar vacío';
  end if;
  if p_primary_color is not null and p_primary_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception using errcode = 'VAL2', message = 'Color inválido (formato #RRGGBB)';
  end if;

  update moragas.app_config
  set
    app_name = coalesce(p_app_name, app_name),
    primary_color = coalesce(p_primary_color, primary_color),
    updated_at = now(),
    updated_by = v_admin_id
  where id = (select id from moragas.app_config limit 1)
  returning * into v_row;

  return row_to_json(v_row);
end;
$$;

-- Wrapper público
create or replace function public.admin_update_app_config(
  p_token text, p_app_name text default null, p_primary_color text default null
)
returns json language sql security definer
as $$ select moragas.admin_update_app_config(p_token, p_app_name, p_primary_color) $$;

grant execute on function public.get_app_config() to anon, authenticated;
grant execute on function public.admin_update_app_config(text, text, text) to anon, authenticated;
