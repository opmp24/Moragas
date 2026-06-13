-- Moragas 012: RPC para insertar transaccion desde el bot de Telegram
-- Sin require_admin porque el bot usa service_role key via Edge Function

create or replace function moragas.bot_insert_transaction(
  p_type text,
  p_amount numeric,
  p_category text,
  p_description text default '',
  p_user_name text default null,
  p_raw_message text default '',
  p_telegram_message_id bigint default null
)
returns json
language plpgsql
security definer
as $$
declare
  v record;
begin
  if p_type not in ('ingreso', 'egreso') then
    raise exception using errcode = 'VAL1', message = 'Tipo debe ser ingreso o egreso';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = 'VAL2', message = 'Monto inválido';
  end if;
  if p_category is null or trim(p_category) = '' then
    raise exception using errcode = 'VAL3', message = 'Categoría requerida';
  end if;

  insert into moragas.transactions (type, amount, category, description, user_name, raw_message, telegram_message_id, created_at)
  values (
    p_type,
    round(p_amount),
    lower(trim(p_category)),
    coalesce(p_description, ''),
    p_user_name,
    coalesce(p_raw_message, ''),
    p_telegram_message_id,
    now()
  )
  returning * into v;

  return row_to_json(v);
end;
$$;

-- Solo accesible desde service_role (no public wrapper, no grant to anon/authenticated)
