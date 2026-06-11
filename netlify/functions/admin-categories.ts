import type { Handler } from '@netlify/functions';
import { supabase, ok, err, getToken, verifySession, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  try {
    const token = getToken(event);
    if (!token) return err(401, 'Token requerido');

    const session = await verifySession(token);
    if (!session) return err(401, 'Sesión inválida');
    if (session.role !== 'admin') return err(403, 'Solo admin puede gestionar categorías');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) return err(500, `Error al obtener categorías: ${error.message}`);

    return ok({ data });
  } catch (e) {
    console.error('admin-categories error:', e);
    return err(500, 'Error interno');
  }
};
