import type { Handler } from '@netlify/functions';
import { supabase, ok, err, verifySession, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  try {
    if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

    const { token, categoryId } = JSON.parse(event.body || '{}');
    if (!token) return err(401, 'Token requerido');

    if (!categoryId) return err(400, 'ID de categoría requerido');

    // Get category info
    const { data: cat, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (catError || !cat) return err(404, 'Categoría no encontrada');

    // Check if any transactions reference this category
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat.name)
      .eq('type', cat.type);

    if (countError) return err(500, `Error al verificar transacciones: ${countError.message}`);

    if (count && count > 0) {
      // Get total amount
      const { data: totalData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('category', cat.name)
        .eq('type', cat.type);

      const total = (totalData || []).reduce((s, t) => s + Number(t.amount), 0);

      return err(409, `No se puede eliminar "${cat.name}": tiene ${count} transacción(es) por $${total.toLocaleString('es-CL')}. Reasigna o elimina esas transacciones primero.`);
    }

    const { error: delError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (delError) return err(500, `Error al eliminar categoría: ${delError.message}`);

    return ok({ data: { deleted: true } });
  } catch (e) {
    console.error('admin-delete-category error:', e);
    return err(500, 'Error interno');
  }
};
