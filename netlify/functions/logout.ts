import type { Handler } from '@netlify/functions';
import { supabase, ok, err, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

  const { token } = JSON.parse(event.body || '{}');
  if (!token) return err(400, 'Token requerido');

  await supabase.from('sessions').delete().eq('token', token);
  return ok({ success: true });
};
