import type { Handler } from '@netlify/functions';
import { supabase, ok, err, verifySession, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  try {
    if (event.httpMethod !== 'POST') return err(405, 'Método no permitido');

    const { token, type, amount, category, description, user_name } = JSON.parse(event.body || '{}');
    if (!token) return err(401, 'Token requerido');

    const session = await verifySession(token);
    if (!session) return err(401, 'Sesión inválida');
    if (session.role !== 'admin') return err(403, 'Solo admin puede crear transacciones');

    if (!type || !['ingreso', 'egreso'].includes(type)) {
      return err(400, 'Tipo debe ser ingreso o egreso');
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return err(400, 'Monto inválido');
    }
    if (!category || typeof category !== 'string') {
      return err(400, 'Categoría requerida');
    }

    const { data, error } = await supabase.from('transactions').insert({
      type,
      amount: Math.round(amount),
      category: category.toLowerCase(),
      description: description || '',
      user_name: user_name || null,
      raw_message: `[Admin] ${type} ${amount} ${category}${description ? ` - ${description}` : ''}`,
      telegram_message_id: null,
    }).select().single();

    if (error) return err(500, `Error al guardar: ${error.message}`);

    return ok({ data });
  } catch (e) {
    console.error('admin-create-transaction error:', e);
    return err(500, 'Error interno');
  }
};
