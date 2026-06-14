-- Moragas 013: RPCs para editar y eliminar transacciones (admin only)

create or replace function moragas.admin_update_transaction(
  p_token text,
  p_transaction_id uuid,
  p_type text default null,
  p_category text default null,
  p_description text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v record;
begin
  perform moragas.require_admin(p_token);

  if p_transaction_id is null then
    raise exception using errcode = 'VAL1', message = 'ID de transacción requerido';
  end if;

  update moragas.transactions
  set
    type = coalesce(p_type, type),
    category = coalesce(lower(trim(p_category)), category),
    description = coalesce(p_description, description)
  where id = p_transaction_id
  returning * into v;

  if not found then
    raise exception using errcode = 'NFND', message = 'Transacción no encontrada';
  end if;

  return row_to_json(v);
end;
$$;

create or replace function moragas.admin_delete_transaction(
  p_token text,
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  perform moragas.require_admin(p_token);

  if p_transaction_id is null then
    raise exception using errcode = 'VAL1', message = 'ID de transacción requerido';
  end if;

  delete from moragas.transactions where id = p_transaction_id;

  if not found then
    raise exception using errcode = 'NFND', message = 'Transacción no encontrada';
  end if;
end;
$$;

-- Public wrappers
create or replace function public.admin_update_transaction(
  p_token text, p_transaction_id uuid,
  p_type text default null, p_category text default null,
  p_description text default null
)
returns json language sql security definer
as $$ select moragas.admin_update_transaction(p_token, p_transaction_id, p_type, p_category, p_description) $$;

create or replace function public.admin_delete_transaction(
  p_token text, p_transaction_id uuid
)
returns void language sql security definer
as $$ select moragas.admin_delete_transaction(p_token, p_transaction_id) $$;
