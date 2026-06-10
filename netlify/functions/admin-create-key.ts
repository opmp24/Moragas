import type { Handler } from '@netlify/functions';
import { supabase, verifySession, ok, err, hashKey, randomKey } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

  const { token, displayName } = JSON.parse(event.body || '{}');
  if (!token) return err(401, 'Token requerido');
  if (!displayName?.trim()) return err(400, 'Nombre requerido');

  const session = await verifySession(token);
  if (!session || session.role !== 'admin') return err(403, 'No autorizado');

  const key = randomKey();
  const keyHash = hashKey(key);

  const { data: newKey, error: createErr } = await supabase
    .from('access_keys')
    .insert({
      display_name: displayName.trim(),
      role: 'user',
      key_hash: keyHash,
      created_by: session.keyId,
    })
    .select()
    .single();

  if (createErr || !newKey) return err(500, 'Error al crear clave');

  return ok({ key, id: newKey.id });
};
