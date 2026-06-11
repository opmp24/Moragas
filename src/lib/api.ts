import type { UserSession, AccessKey, Transaction, MonthlySummary, CategorySummary, Category } from '../types';
import { supabase } from './supabase';

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args || {});
  if (error) throw new Error(error.message);
  return data as T;
}

function jsonArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  return JSON.parse(data as string) as T[];
}

function jsonObject<T>(data: unknown): T {
  if (data && typeof data === 'object') return data as T;
  return JSON.parse(data as string) as T;
}

export async function login(key: string): Promise<UserSession> {
  return rpc<UserSession>('login_with_key', { p_key: key });
}

export async function logout(token: string): Promise<void> {
  await rpc('logout', { p_token: token });
}

export async function me(token: string): Promise<UserSession> {
  const data = await rpc('get_me', { p_token: token });
  return jsonObject<UserSession>(data);
}

export async function adminCreateKey(token: string, displayName: string): Promise<{ key: string; id: string }> {
  const data = await rpc('admin_create_key', { p_token: token, p_display_name: displayName });
  return jsonObject<{ key: string; id: string }>(data);
}

export async function adminRevokeKey(token: string, keyId: string): Promise<void> {
  await rpc('admin_revoke_key', { p_token: token, p_key_id: keyId });
}

export async function adminListKeys(token: string): Promise<AccessKey[]> {
  const data = await rpc('admin_list_keys', { p_token: token });
  return jsonArray<AccessKey>(data);
}

export async function getTransactions(token: string): Promise<Transaction[]> {
  const data = await rpc('get_transactions', { p_token: token });
  return jsonArray<Transaction>(data);
}

export async function getMonthlySummary(token: string): Promise<MonthlySummary[]> {
  const data = await rpc('get_monthly_summary_rpc', { p_token: token });
  return jsonArray<MonthlySummary>(data);
}

export async function getCategorySummary(token: string): Promise<CategorySummary[]> {
  const data = await rpc('get_category_summary_rpc', { p_token: token });
  return jsonArray<CategorySummary>(data);
}

export async function adminCreateTransaction(
  token: string,
  data: { type: 'ingreso' | 'egreso'; amount: number; category: string; description?: string; user_name?: string }
): Promise<Transaction> {
  const result = await rpc('create_transaction', {
    p_token: token,
    p_type: data.type,
    p_amount: data.amount,
    p_category: data.category,
    p_description: data.description || '',
    p_user_name: data.user_name || null,
  });
  return jsonObject<Transaction>(result);
}

export async function getCategories(token: string): Promise<Category[]> {
  const data = await rpc('admin_get_categories', { p_token: token });
  return jsonArray<Category>(data);
}

export async function adminCreateCategory(
  token: string,
  data: { name: string; type: 'ingreso' | 'egreso'; color: string; icon: string }
): Promise<Category> {
  const result = await rpc('admin_create_category', {
    p_token: token,
    p_name: data.name,
    p_type: data.type,
    p_color: data.color,
    p_icon: data.icon,
  });
  return jsonObject<Category>(result);
}

export async function adminDeleteCategory(token: string, categoryId: string): Promise<void> {
  await rpc('admin_delete_category', { p_token: token, p_category_id: categoryId });
}

export async function adminUpdateCategory(
  token: string,
  categoryId: string,
  data: { name: string; type: 'ingreso' | 'egreso'; color: string; icon: string }
): Promise<Category> {
  const result = await rpc('admin_update_category', {
    p_token: token,
    p_category_id: categoryId,
    p_name: data.name,
    p_type: data.type,
    p_color: data.color,
    p_icon: data.icon,
  });
  return jsonObject<Category>(result);
}
