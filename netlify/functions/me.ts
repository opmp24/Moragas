import type { Handler } from '@netlify/functions';
import { verifySession, getToken, ok, err, corsPreflight} from './_shared';

export const handler: Handler = async (event) => {
  const cors = corsPreflight(event);
  if (cors) return cors;

  const token = getToken(event);
  if (!token) return err(401, 'Token requerido');

  const session = await verifySession(token);
  if (!session) return err(401, 'Sesión inválida o expirada');

  return ok(session);
};
