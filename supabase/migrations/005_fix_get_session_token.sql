-- Fix: get_session debe retornar el token para que get_me lo incluya
-- Sin esto, despues de recargar la pagina user.token es undefined

create or replace function moragas.get_session(session_token text)
returns json
language plpgsql
security definer
as $$
declare
  v json;
begin
  select json_build_object(
    'keyId', ak.id,
    'displayName', ak.display_name,
    'role', ak.role,
    'token', s.token
  ) into v
  from moragas.sessions s
  join moragas.access_keys ak on ak.id = s.access_key_id
  where s.token = session_token
    and ak.is_active = true;

  if v is null then return null; end if;

  update moragas.sessions set last_used_at = now()
  where token = session_token;

  return v;
end;
$$;
