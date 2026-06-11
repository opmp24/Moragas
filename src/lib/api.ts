import type { UserSession, AccessKey, Transaction, MonthlySummary, CategorySummary, Category } from '../types';

const BASE = 'https://moragas.netlify.app/.netlify/functions';

async function req<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de conexión');
  return data;
}

// For endpoints that wrap the result in { data: ... }
async function reqData<T>(url: string, body?: unknown): Promise<T> {
  const res = await req<{ data: T }>(url, body);
  return res.data;
}

export function login(key: string): Promise<UserSession> {
  return req(`${BASE}/login`, { key });
}

export function logout(token: string): Promise<void> {
  return req(`${BASE}/logout`, { token });
}

export function me(token: string): Promise<UserSession> {
  return req(`${BASE}/me?token=${encodeURIComponent(token)}`);
}

export function adminCreateKey(token: string, displayName: string): Promise<{ key: string; id: string }> {
  return req(`${BASE}/admin-create-key`, { token, displayName });
}

export function adminRevokeKey(token: string, keyId: string): Promise<void> {
  return req(`${BASE}/admin-revoke-key`, { token, keyId });
}

export function adminListKeys(token: string): Promise<AccessKey[]> {
  return reqData(`${BASE}/admin-list-keys?token=${encodeURIComponent(token)}`);
}

export function getTransactions(token: string): Promise<Transaction[]> {
  return reqData(`${BASE}/transactions?token=${encodeURIComponent(token)}`);
}

export function getMonthlySummary(token: string): Promise<MonthlySummary[]> {
  return reqData(`${BASE}/transactions?token=${encodeURIComponent(token)}&summary=monthly`);
}

export function getCategorySummary(token: string): Promise<CategorySummary[]> {
  return reqData(`${BASE}/transactions?token=${encodeURIComponent(token)}&summary=category`);
}

export function adminCreateTransaction(
  token: string,
  data: { type: 'ingreso' | 'egreso'; amount: number; category: string; description?: string; user_name?: string }
): Promise<Transaction> {
  return reqData(`${BASE}/admin-create-transaction`, { token, ...data });
}

export function getCategories(token: string): Promise<Category[]> {
  return reqData(`${BASE}/admin-categories?token=${encodeURIComponent(token)}`);
}

export function adminCreateCategory(
  token: string,
  data: { name: string; type: 'ingreso' | 'egreso'; color: string; icon: string }
): Promise<Category> {
  return reqData(`${BASE}/admin-create-category`, { token, ...data });
}

export function adminDeleteCategory(
  token: string,
  categoryId: string
): Promise<void> {
  return req(`${BASE}/admin-delete-category`, { token, categoryId });
}

export function adminUpdateCategory(
  token: string,
  categoryId: string,
  data: { name: string; type: 'ingreso' | 'egreso'; color: string; icon: string }
): Promise<Category> {
  return reqData(`${BASE}/admin-update-category`, { token, categoryId, ...data });
}
