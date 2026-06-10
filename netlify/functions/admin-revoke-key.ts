import type { Handler } from '@netlify/functions';
import { supabase, verifySession, ok, err } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

  const { token, keyId } = JSON.parse(event.body || '{}');
  if (!token) return err(401, 'Token requerido');
  if (!keyId) return err(400, 'ID de clave requerido');

  const session = await verifySession(token);
  if (!session || session.role !== 'admin') return err(403, 'No autorizado');

  const { error } = await supabase
    .from('access_keys')
    .update({ is_active: false })
    .eq('id', keyId);

  if (error) return err(500, 'Error al revocar clave');

  // Delete all sessions for this key
  await supabase.from('sessions').delete().eq('access_key_id', keyId);

  return ok({ success: true });
};
