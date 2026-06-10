import type { Handler } from '@netlify/functions';
import { supabase, verifySession, getToken, ok, err } from './_shared';

export const handler: Handler = async (event) => {
  const token = getToken(event);
  if (!token) return err(401, 'Token requerido');

  const session = await verifySession(token);
  if (!session) return err(401, 'Sesión inválida');

  const url = new URL(event.rawUrl);
  const summaryType = url.searchParams.get('summary');

  if (summaryType === 'monthly') {
    const { data, error } = await supabase.rpc('get_monthly_summary');
    if (error) return err(500, 'Error al obtener resumen mensual');
    return ok({ data });
  }

  if (summaryType === 'category') {
    const { data, error } = await supabase.rpc('get_category_summary');
    if (error) return err(500, 'Error al obtener resumen por categoría');
    return ok({ data });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return err(500, 'Error al obtener transacciones');
  return ok({ data });
};
