import type { Handler } from '@netlify/functions';
import { supabase, verifySession, getToken, ok, err, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  const token = getToken(event);
  if (!token) return err(401, 'Token requerido');

  const session = await verifySession(token);
  if (!session) return err(401, 'Sesión inválida');

  const { data, error } = await supabase.rpc('get_category_summary');
  if (error) return err(500, 'Error al obtener resumen');
  return ok({ data });
};
