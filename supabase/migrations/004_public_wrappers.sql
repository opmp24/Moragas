-- Public wrapper functions for moragas schema RPCs
-- Supabase JS client looks in public schema by default

-- HASH
create or replace function public.hash_key(key_text text)
returns text language sql immutable
as $$ select moragas.hash_key(key_text) $$;

-- RANDOM 8-DIGIT KEY
create or replace function public.random_8digit_key()
returns text language sql
as $$ select moragas.random_8digit_key() $$;

-- LOGIN
create or replace function public.login_with_key(p_key text)
returns json language sql security definer
as $$ select moragas.login_with_key(p_key) $$;

-- LOGOUT
create or replace function public.logout(p_token text)
returns void language sql security definer
as $$ select moragas.logout(p_token) $$;

-- GET ME
create or replace function public.get_me(p_token text)
returns json language sql security definer
as $$ select moragas.get_me(p_token) $$;

-- GET TRANSACTIONS
create or replace function public.get_transactions(p_token text)
returns json language sql security definer
as $$ select moragas.get_transactions(p_token) $$;

-- GET MONTHLY SUMMARY
create or replace function public.get_monthly_summary_rpc(p_token text)
returns json language sql security definer
as $$ select moragas.get_monthly_summary_rpc(p_token) $$;

-- GET CATEGORY SUMMARY
create or replace function public.get_category_summary_rpc(p_token text)
returns json language sql security definer
as $$ select moragas.get_category_summary_rpc(p_token) $$;

-- CREATE TRANSACTION
create or replace function public.create_transaction(
  p_token text, p_type text, p_amount numeric,
  p_category text, p_description text, p_user_name text
)
returns json language sql security definer
as $$ select moragas.create_transaction(p_token, p_type, p_amount, p_category, p_description, p_user_name) $$;

-- ADMIN LIST KEYS
create or replace function public.admin_list_keys(p_token text)
returns json language sql security definer
as $$ select moragas.admin_list_keys(p_token) $$;

-- ADMIN CREATE KEY
create or replace function public.admin_create_key(p_token text, p_display_name text)
returns json language sql security definer
as $$ select moragas.admin_create_key(p_token, p_display_name) $$;

-- ADMIN REVOKE KEY
create or replace function public.admin_revoke_key(p_token text, p_key_id uuid)
returns void language sql security definer
as $$ select moragas.admin_revoke_key(p_token, p_key_id) $$;

-- ADMIN GET CATEGORIES
create or replace function public.admin_get_categories(p_token text)
returns json language sql security definer
as $$ select moragas.admin_get_categories(p_token) $$;

-- ADMIN CREATE CATEGORY
create or replace function public.admin_create_category(
  p_token text, p_name text, p_type text,
  p_color text, p_icon text
)
returns json language sql security definer
as $$ select moragas.admin_create_category(p_token, p_name, p_type, p_color, p_icon) $$;

-- ADMIN UPDATE CATEGORY
create or replace function public.admin_update_category(
  p_token text, p_category_id uuid, p_name text, p_type text,
  p_color text, p_icon text
)
returns json language sql security definer
as $$ select moragas.admin_update_category(p_token, p_category_id, p_name, p_type, p_color, p_icon) $$;

-- ADMIN DELETE CATEGORY
create or replace function public.admin_delete_category(p_token text, p_category_id uuid)
returns void language sql security definer
as $$ select moragas.admin_delete_category(p_token, p_category_id) $$;

-- GRANTS
grant execute on all functions in schema public to anon, authenticated;
