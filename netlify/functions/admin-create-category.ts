import type { Handler } from '@netlify/functions';
import { supabase, ok, err, verifySession } from './_shared';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

    const { token, name, type, color, icon } = JSON.parse(event.body || '{}');
    if (!token) return err(401, 'Token requerido');

    const session = await verifySession(token);
    if (!session) return err(401, 'Sesión inválida');
    if (session.role !== 'admin') return err(403, 'Solo admin puede crear categorías');

    if (!name || typeof name !== 'string' || !name.trim()) {
      return err(400, 'Nombre requerido');
    }
    if (!type || !['ingreso', 'egreso'].includes(type)) {
      return err(400, 'Tipo debe ser ingreso o egreso');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), type, color: color || '#6b7280', icon: icon || 'circle' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return err(409, `Ya existe una categoría "${name.trim()}" de tipo ${type}`);
      }
      return err(500, `Error al crear categoría: ${error.message}`);
    }

    return ok({ data });
  } catch (e) {
    console.error('admin-create-category error:', e);
    return err(500, 'Error interno');
  }
};
