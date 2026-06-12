-- Moragas 007: Permitir a usuarios regulares leer transacciones/resúmenes
-- Cambia RPCs de solo-lectura de require_admin a require_active_user

-- Helper: validar sesión activa (cualquier rol activo, no solo admin)
create or replace function moragas.require_active_user(session_token text)
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
  return (v->>'keyId')::uuid;
end;
$$;

-- RPC #4: GET TRANSACTIONS
create or replace function moragas.get_transactions(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_active_user(p_token);
  return (select json_agg(t order by t.created_at desc)
          from moragas.transactions t);
end;
$$;

-- RPC #5: GET MONTHLY SUMMARY
create or replace function moragas.get_monthly_summary_rpc(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_active_user(p_token);
  return (select json_agg(m order by m.month asc)
          from moragas.get_monthly_summary() m);
end;
$$;

-- RPC #6: GET CATEGORY SUMMARY
create or replace function moragas.get_category_summary_rpc(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_active_user(p_token);
  return (select json_agg(c order by c.total desc)
          from moragas.get_category_summary() c);
end;
$$;

-- RPC #11: ADMIN GET CATEGORIES (usado por todos los usuarios en el Dashboard)
create or replace function moragas.admin_get_categories(p_token text)
returns json
language plpgsql
security definer
as $$
begin
  perform moragas.require_active_user(p_token);
  return (select json_agg(c order by c.type, c.name)
          from moragas.categories c);
end;
$$;

-- Los wrappers públicos (public.*) delegan a moragas.* automáticamente
