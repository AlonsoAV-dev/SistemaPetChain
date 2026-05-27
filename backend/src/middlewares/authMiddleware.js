import { findUserById } from '../data/store.js';
import { httpError } from '../utils/httpError.js';
import { verifyToken } from '../utils/token.js';

export function requireAuth(req, _res, next) {
  const authorization = req.headers.authorization ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(httpError(401, 'Autenticacion requerida.'));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = findUserById(payload.sub);

    if (!user) {
      throw httpError(401, 'Usuario no encontrado.');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    next(httpError(403, 'Permisos insuficientes.'));
    return;
  }

  next();
}

