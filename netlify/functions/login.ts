import type { Handler } from '@netlify/functions';
import { supabase, ok, err, hashKey, ADMIN_MASTER_KEY, randomKey, corsPreflight} from './_shared';
import crypto from 'crypto';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

  const { key } = JSON.parse(event.body || '{}');
  if (!key) return err(400, 'Clave requerida');

  // Check master admin key first
  if (key === ADMIN_MASTER_KEY) {
    // Find or create the master admin
    const { data: existing } = await supabase
      .from('access_keys')
      .select('*')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (existing) {
      const token = crypto.randomUUID();
      await supabase.from('sessions').insert({ access_key_id: existing.id, token });
      await supabase.from('access_keys').update({ last_used_at: new Date().toISOString() }).eq('id', existing.id);
      return ok({ keyId: existing.id, displayName: existing.display_name, role: 'admin', token });
    }

    // Create admin if none exists
    const { data: newAdmin, error: createErr } = await supabase
      .from('access_keys')
      .insert({ display_name: 'Admin', role: 'admin', key_hash: hashKey(key) })
      .select()
      .single();

    if (createErr || !newAdmin) return err(500, 'Error al crear admin');
    const token = crypto.randomUUID();
    await supabase.from('sessions').insert({ access_key_id: newAdmin.id, token });
    return ok({ keyId: newAdmin.id, displayName: newAdmin.display_name, role: 'admin', token });
  }

  // Look up the key
  const keyHash = hashKey(key);
  const { data: accessKey, error: findErr } = await supabase
    .from('access_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (findErr || !accessKey) return err(401, 'Clave inválida o desactivada');

  const token = crypto.randomUUID();
  const { error: sessionErr } = await supabase
    .from('sessions')
    .insert({ access_key_id: accessKey.id, token });

  if (sessionErr) return err(500, 'Error al crear sesión');

  await supabase.from('access_keys').update({ last_used_at: new Date().toISOString() }).eq('id', accessKey.id);

  return ok({
    keyId: accessKey.id,
    displayName: accessKey.display_name,
    role: accessKey.role,
    token,
  });
};
