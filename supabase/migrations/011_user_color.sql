-- Moragas 011: user_color for access_keys
-- Permite asignar un color a cada usuario para identificarlo en la UI

alter table moragas.access_keys add column if not exists user_color text;

-- ============================================================
-- Nuevo RPC: admin_update_key — actualiza nombre y/o color
-- ============================================================
create or replace function moragas.admin_update_key(
  p_token text,
  p_key_id uuid,
  p_display_name text default null,
  p_user_color text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_record record;
begin
  perform moragas.require_admin(p_token);

  if p_key_id is null then
    raise exception using errcode = 'VAL1', message = 'ID de clave requerido';
  end if;

  update moragas.access_keys
  set
    display_name = coalesce(p_display_name, display_name),
    user_color   = coalesce(p_user_color, user_color)
  where id = p_key_id
  returning * into v_record;

  if not found then
    raise exception using errcode = 'NFND', message = 'Usuario no encontrado';
  end if;

  return row_to_json(v_record);
end;
$$;

create or replace function public.admin_update_key(p_token text, p_key_id uuid, p_display_name text default null, p_user_color text default null)
returns json language sql security definer
as $$ select moragas.admin_update_key(p_token, p_key_id, p_display_name, p_user_color) $$;

grant execute on function public.admin_update_key(text, uuid, text, text) to anon, authenticated;
