import { query } from '../config/database.js';
import { httpError } from '../utils/httpError.js';
import { mapUser } from '../utils/mappers.js';
import { verifyToken } from '../utils/token.js';

export async function requireAuth(req, _res, next) {
  const authorization = req.headers.authorization ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(httpError(401, 'Autenticacion requerida.'));
    return;
  }

  try {
    const payload = verifyToken(token);
    const result = await query(
      `SELECT id, name, email, role, status, avatar_url, created_at, updated_at
       FROM public.users
       WHERE id = $1`,
      [payload.sub],
    );
    const user = mapUser(result.rows[0]);

    if (!user || user.status !== 'active') {
      throw httpError(401, 'Usuario no disponible.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  const authorization = req.headers.authorization ?? '';
  if (!authorization) {
    next();
    return;
  }

  requireAuth(req, _res, next);
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    next(httpError(403, 'Permisos insuficientes.'));
    return;
  }

  next();
}

export function requireUser(req, _res, next) {
  if (req.user?.role !== 'user') {
    next(httpError(403, 'Los administradores no pueden editar publicaciones.'));
    return;
  }

  next();
}

