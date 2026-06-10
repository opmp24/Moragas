import type { UserSession, AccessKey, Transaction, MonthlySummary, CategorySummary } from '../types';

const BASE = '/.netlify/functions';

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
  return req(`${BASE}/admin-list-keys?token=${encodeURIComponent(token)}`);
}

export function getTransactions(token: string): Promise<Transaction[]> {
  return req(`${BASE}/transactions?token=${encodeURIComponent(token)}`);
}

export function getMonthlySummary(token: string): Promise<MonthlySummary[]> {
  return req(`${BASE}/transactions/summary/monthly?token=${encodeURIComponent(token)}`);
}

export function getCategorySummary(token: string): Promise<CategorySummary[]> {
  return req(`${BASE}/transactions/summary/category?token=${encodeURIComponent(token)}`);
}
