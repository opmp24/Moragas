import { createClient } from '@supabase/supabase-js';
import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export const ADMIN_MASTER_KEY = process.env.ADMIN_MASTER_KEY || 'MoragasAdmin2024';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export function respond(status: number, data: Record<string, unknown>): HandlerResponse {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

export function ok(data: Record<string, unknown>) {
  return respond(200, data);
}

export function err(status: number, message: string) {
  return respond(status, { error: message });
}

export function getToken(event: HandlerEvent): string | null {
  const url = new URL(event.rawUrl);
  const token = url.searchParams.get('token');
  return token;
}

// Verify a session token and return the associated user info
export async function verifySession(token: string) {
  const { data: raw, error } = await supabase
    .from('sessions')
    .select('id, access_key_id, last_used_at, access_keys!inner(id, display_name, role, is_active)')
    .eq('token', token)
    .single();

  if (error || !raw) return null;

  const ak = Array.isArray(raw.access_keys) ? raw.access_keys[0] : raw.access_keys;
  if (!ak || !ak.is_active) return null;

  await supabase.from('sessions').update({ last_used_at: new Date().toISOString() }).eq('id', raw.id);

  return {
    keyId: raw.access_key_id,
    displayName: ak.display_name,
    role: ak.role as 'admin' | 'user',
    token,
  };
}

export function randomKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let key = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 3) key += '-';
  }
  return key;
}

export function hashKey(key: string): string {
  // Simple hash for key lookups (not cryptographic, fine for this use case)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}
