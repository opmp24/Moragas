-- Moragas 008: Admin reset key function
-- Genera nueva clave de 8 dígitos para un usuario existente

create or replace function moragas.admin_reset_key(
  p_token text,
  p_key_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_plain_key text;
  v_user record;
begin
  perform moragas.require_admin(p_token);

  if p_key_id is null then
    raise exception using errcode = 'VAL1', message = 'ID de clave requerido';
  end if;

  -- Verificar que existe
  select * into v_user from moragas.access_keys where id = p_key_id;
  if not found then
    raise exception using errcode = 'NFND', message = 'Usuario no encontrado';
  end if;

  -- Generar nueva clave
  v_plain_key := moragas.random_8digit_key();

  -- Actualizar hash
  update moragas.access_keys
  set key_hash = moragas.hash_key(v_plain_key), is_active = true
  where id = p_key_id;

  -- Invalidar sesiones existentes
  delete from moragas.sessions where access_key_id = p_key_id;

  return json_build_object('key', v_plain_key, 'id', p_key_id);
end;
$$;

-- Wrapper público
create or replace function public.admin_reset_key(p_token text, p_key_id uuid)
returns json language sql security definer
as $$ select moragas.admin_reset_key(p_token, p_key_id) $$;

grant execute on function public.admin_reset_key(text, uuid) to anon, authenticated;
