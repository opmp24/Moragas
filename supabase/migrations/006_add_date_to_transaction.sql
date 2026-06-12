-- Add optional date parameter to create_transaction

create or replace function moragas.create_transaction(
  p_token text,
  p_type text,
  p_amount numeric,
  p_category text,
  p_description text default '',
  p_user_name text default null,
  p_date timestamptz default null
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

  insert into moragas.transactions (type, amount, category, description, user_name, raw_message, created_at)
  values (
    p_type,
    round(p_amount),
    lower(p_category),
    coalesce(p_description, ''),
    p_user_name,
    '[Admin] ' || p_type || ' ' || p_amount || ' ' || p_category || case when p_description != '' then ' - ' || p_description else '' end,
    coalesce(p_date, now())
  )
  returning * into v;

  return row_to_json(v);
end;
$$;

-- Update public wrapper
drop function if exists public.create_transaction(text,text,numeric,text,text,text,timestamptz);
create or replace function public.create_transaction(
  p_token text, p_type text, p_amount numeric,
  p_category text, p_description text, p_user_name text,
  p_date timestamptz default null
)
returns json language sql security definer
as $$ select moragas.create_transaction(p_token, p_type, p_amount, p_category, p_description, p_user_name, p_date) $$;
