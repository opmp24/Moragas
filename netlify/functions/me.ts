import type { Handler } from '@netlify/functions';
import { verifySession, getToken, ok, err } from './_shared';

export const handler: Handler = async (event) => {
  const token = getToken(event);
  if (!token) return err(401, 'Token requerido');

  const session = await verifySession(token);
  if (!session) return err(401, 'Sesión inválida o expirada');

  return ok(session);
};
