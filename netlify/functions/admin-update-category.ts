import type { Handler } from '@netlify/functions';
import { supabase, ok, err, verifySession, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  try {
    if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

    const { token, categoryId, name, type, color, icon } = JSON.parse(event.body || '{}');
    if (!token) return err(401, 'Token requerido');

    const session = await verifySession(token);
    if (!session) return err(401, 'Sesión inválida');
    if (session.role !== 'admin') return err(403, 'Solo admin puede editar categorías');

    if (!categoryId) return err(400, 'ID de categoría requerido');
    if (!name || typeof name !== 'string' || !name.trim()) {
      return err(400, 'Nombre requerido');
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name: name.trim(), type, color: color || '#6b7280', icon: icon || 'circle' })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return err(409, `Ya existe una categoría "${name.trim()}" de tipo ${type}`);
      }
      return err(500, `Error al actualizar categoría: ${error.message}`);
    }

    return ok({ data });
  } catch (e) {
    console.error('admin-update-category error:', e);
    return err(500, 'Error interno');
  }
};
