-- Moragas: Migrar lógica de Netlify Functions a RPCs SECURITY DEFINER
-- Reemplaza todas las funciones serverless con RPCs directos a Supabase

-- Requiere pgcrypto para sha256 y gen_random_bytes
create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- HELPERS
-- ============================================================

-- Hash deterministico: sha256 en hexadecimal
create or replace function moragas.hash_key(key_text text)
returns text
language sql
immutable
as $$
  select encode(digest(key_text::bytea, 'sha256'), 'hex');
$$;

-- Generar clave aleatoria de 8 digitos
create or replace function moragas.random_8digit_key()
returns text
language sql
as $$
  select lpad(floor(random() * 100000000)::text, 8, '0');
$$;

-- Validar sesion y devolver info del usuario
-- retorna json: { key_id, display_name, role } o null
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
    'role', ak.role
  ) into v
  from moragas.sessions s
  join moragas.access_keys ak on ak.id = s.access_key_id
  where s.token = session_token
    and ak.is_active = true;

  if v is null then return null; end if;

  -- actualizar last_used_at
  update moragas.sessions set last_used_at = now()
  where token = session_token;

  return v;
end;
$$;

-- Validar sesion admin, retorna key_id o lanza error
create or replace function moragas.require_admin(session_token text)
returns uuid
language plpgsql
security definer
as $$
declare
  v json;
begin
  v := moragas.get_session(session_token);
  if v is null then
    raise exception using errcode = 'AUTH1', message = 'Sesión inválida o expirada';
  end if;
  if v->>'role' != 'admin' then
    raise exception using errcode = 'AUTH2', message = 'No autorizado';
  end if;
  return (v->>'keyId')::uuid;
end;
$$;

-- ============================================================
-- RPC #1: LOGIN
-- ============================================================
create or replace function moragas.login_with_key(p_key text)
returns json
language plpgsql
security definer
as $$
declare
  v_hash text;
  v_ak   record;
  v_token text;
begin
  v_hash := moragas.hash_key(p_key);

  select id, display_name, role into v_ak
  from moragas.access_keys
  where key_hash = v_hash and is_active = true;

  if not found then
    raise exception using errcode = 'AUTH3', message = 'Clave inválida o desactivada';
  end if;

  v_token := extensions.gen_random_uuid()::text;

  insert into moragas.sessions (access_key_id, token)
  values (v_ak.id, v_token);

  update moragas.access_keys set last_used_at = now()
  where id = v_ak.id;

  return json_build_object(
    'keyId', v_ak.id,
    'displayName', v_ak.display_name,
    'role', v_ak.role,
    'token', v_token
  );
end;
$$;

-- ============================================================
-- RPC #2: LOGOUT
-- ============================================================
create or replace function moragas.logout(p_token text)
returns void
language plpgsql
security definer
as $$
begin
  delete from moragas.sessions where token = p_token;
end;
$$;

-- ============================================================
-- RPC #3: ME (validar sesion y devolver info)
-- ============================================================
create or replace function moragas.get_me(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v json;
begin
  v := moragas.get_session(p_token);
  if v is null then
    raise exception using errcode = 'AUTH1', message = 'Sesión inválida o expirada';
  end if;
  return v;
end;
$$;

-- ============================================================
-- RPC #4: GET TRANSACTIONS
-- ============================================================
create or replace function moragas.get_transactions(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);
  return (select json_agg(t order by t.created_at desc)
          from moragas.transactions t);
end;
$$;

-- ============================================================
-- RPC #5: GET MONTHLY SUMMARY
-- ============================================================
create or replace function moragas.get_monthly_summary_rpc(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);
  return (select json_agg(m order by m.month asc)
          from moragas.get_monthly_summary() m);
end;
$$;

-- ============================================================
-- RPC #6: GET CATEGORY SUMMARY
-- ============================================================
create or replace function moragas.get_category_summary_rpc(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);
  return (select json_agg(c order by c.total desc)
          from moragas.get_category_summary() c);
end;
$$;

-- ============================================================
-- RPC #7: CREATE TRANSACTION
-- ============================================================
create or replace function moragas.create_transaction(
  p_token text,
  p_type text,
  p_amount numeric,
  p_category text,
  p_description text default '',
  p_user_name text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v record;
begin
  perform moragas.require_admin(p_token);

  if p_type not in ('ingreso', 'egreso') then
    raise exception using errcode = 'VAL1', message = 'Tipo debe ser ingreso o egreso';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = 'VAL2', message = 'Monto inválido';
  end if;
  if p_category is null or p_category = '' then
    raise exception using errcode = 'VAL3', message = 'Categoría requerida';
  end if;

  insert into moragas.transactions (type, amount, category, description, user_name, raw_message)
  values (
    p_type,
    round(p_amount),
    lower(p_category),
    coalesce(p_description, ''),
    p_user_name,
    '[Admin] ' || p_type || ' ' || p_amount || ' ' || p_category || case when p_description != '' then ' - ' || p_description else '' end
  )
  returning * into v;

  return row_to_json(v);
end;
$$;

-- ============================================================
-- RPC #8: ADMIN - LIST KEYS
-- ============================================================
create or replace function moragas.admin_list_keys(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);
  return (select json_agg(k order by k.created_at desc)
          from moragas.access_keys k);
end;
$$;

-- ============================================================
-- RPC #9: ADMIN - CREATE KEY (8 digitos)
-- ============================================================
create or replace function moragas.admin_create_key(
  p_token text,
  p_display_name text
)
returns json
language plpgsql
security definer
as $$
declare
  v_admin_id uuid;
  v_plain_key text;
  v_new_id uuid;
begin
  v_admin_id := moragas.require_admin(p_token);

  if p_display_name is null or trim(p_display_name) = '' then
    raise exception using errcode = 'VAL1', message = 'Nombre requerido';
  end if;

  v_plain_key := moragas.random_8digit_key();

  insert into moragas.access_keys (key_hash, display_name, role, created_by)
  values (moragas.hash_key(v_plain_key), trim(p_display_name), 'user', v_admin_id)
  returning id into v_new_id;

  return json_build_object('key', v_plain_key, 'id', v_new_id);
end;
$$;

-- ============================================================
-- RPC #10: ADMIN - REVOKE KEY
-- ============================================================
create or replace function moragas.admin_revoke_key(
  p_token text,
  p_key_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);

  if p_key_id is null then
    raise exception using errcode = 'VAL1', message = 'ID de clave requerido';
  end if;

  update moragas.access_keys set is_active = false
  where id = p_key_id;

  delete from moragas.sessions where access_key_id = p_key_id;
end;
$$;

-- ============================================================
-- RPC #11: ADMIN - GET CATEGORIES
-- ============================================================
create or replace function moragas.admin_get_categories(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);
  return (select json_agg(c order by c.type, c.name)
          from moragas.categories c);
end;
$$;

-- ============================================================
-- RPC #12: ADMIN - CREATE CATEGORY
-- ============================================================
create or replace function moragas.admin_create_category(
  p_token text,
  p_name text,
  p_type text,
  p_color text default '#6b7280',
  p_icon text default 'circle'
)
returns json
language plpgsql
security definer
as $$
declare
  v record;
begin
  perform moragas.require_admin(p_token);

  if p_name is null or trim(p_name) = '' then
    raise exception using errcode = 'VAL1', message = 'Nombre requerido';
  end if;
  if p_type not in ('ingreso', 'egreso') then
    raise exception using errcode = 'VAL2', message = 'Tipo debe ser ingreso o egreso';
  end if;

  insert into moragas.categories (name, type, color, icon)
  values (trim(p_name), p_type, p_color, p_icon)
  returning * into v;

  return row_to_json(v);
exception
  when unique_violation then
    raise exception using errcode = 'DUPE', message = 'Ya existe una categoría "' || trim(p_name) || '" de tipo ' || p_type;
end;
$$;

-- ============================================================
-- RPC #13: ADMIN - UPDATE CATEGORY
-- ============================================================
create or replace function moragas.admin_update_category(
  p_token text,
  p_category_id uuid,
  p_name text,
  p_type text,
  p_color text default '#6b7280',
  p_icon text default 'circle'
)
returns json
language plpgsql
security definer
as $$
declare
  v record;
begin
  perform moragas.require_admin(p_token);

  if p_category_id is null then
    raise exception using errcode = 'VAL1', message = 'ID de categoría requerido';
  end if;
  if p_name is null or trim(p_name) = '' then
    raise exception using errcode = 'VAL2', message = 'Nombre requerido';
  end if;

  update moragas.categories
  set name = trim(p_name), type = p_type, color = p_color, icon = p_icon
  where id = p_category_id
  returning * into v;

  return row_to_json(v);
exception
  when unique_violation then
    raise exception using errcode = 'DUPE', message = 'Ya existe una categoría "' || trim(p_name) || '" de tipo ' || p_type;
end;
$$;

-- ============================================================
-- RPC #14: ADMIN - DELETE CATEGORY
-- ============================================================
create or replace function moragas.admin_delete_category(
  p_token text,
  p_category_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_cat record;
  v_tx_count bigint;
  v_tx_total numeric;
begin
  perform moragas.require_admin(p_token);

  -- Obtener info de la categoria
  select * into v_cat from moragas.categories where id = p_category_id;
  if not found then
    raise exception using errcode = 'NFND', message = 'Categoría no encontrada';
  end if;

  -- Verificar transacciones que usan esta categoria
  select count(*), coalesce(sum(amount), 0) into v_tx_count, v_tx_total
  from moragas.transactions
  where category = v_cat.name and type = v_cat.type;

  if v_tx_count > 0 then
    raise exception using errcode = 'CONF', message = 'No se puede eliminar "' || v_cat.name || '": tiene ' || v_tx_count || ' transacción(es) por $' || trim(to_char(v_tx_total, '999G999G999')) || '. Reasigna o elimina esas transacciones primero.';
  end if;

  delete from moragas.categories where id = p_category_id;
end;
$$;

-- ============================================================
-- DATOS INICIALES: Admin key de 8 digitos
-- ============================================================

-- Eliminar claves existentes (migracion a nuevo formato)
delete from moragas.sessions;
delete from moragas.access_keys;

-- Insertar admin key: 48291637
insert into moragas.access_keys (key_hash, display_name, role, is_active)
values (moragas.hash_key('48291637'), 'Admin', 'admin', true);

-- ============================================================
-- PERMISOS
-- ============================================================
grant all privileges on all routines in schema moragas to service_role;
grant usage on schema moragas to anon, authenticated;
grant execute on all functions in schema moragas to anon, authenticated;
