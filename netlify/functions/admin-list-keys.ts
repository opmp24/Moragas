import type { Handler } from '@netlify/functions';
import { supabase, verifySession, getToken, ok, err, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  const token = getToken(event);
  if (!token) return err(401, 'Token requerido');

  const session = await verifySession(token);
  if (!session || session.role !== 'admin') return err(403, 'No autorizado');

  const { data, error } = await supabase
    .from('access_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return err(500, 'Error al listar claves');

  return ok({ data });
};
