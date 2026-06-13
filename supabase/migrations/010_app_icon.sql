-- Moragas 010: App icon selection (from category icons)

alter table moragas.app_config add column if not exists app_icon text not null default 'wallet';

create or replace function moragas.admin_update_app_config(
  p_token text,
  p_app_name text default null,
  p_primary_color text default null,
  p_app_icon text default null
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
    app_icon = coalesce(p_app_icon, app_icon),
    updated_at = now(),
    updated_by = v_admin_id
  where id = (select id from moragas.app_config limit 1)
  returning * into v_row;

  return row_to_json(v_row);
end;
$$;

create or replace function public.admin_update_app_config(
  p_token text, p_app_name text default null, p_primary_color text default null, p_app_icon text default null
)
returns json language sql security definer
as $$ select moragas.admin_update_app_config(p_token, p_app_name, p_primary_color, p_app_icon) $$;

grant execute on function public.admin_update_app_config(text, text, text, text) to anon, authenticated;
