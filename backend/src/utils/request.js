import { httpError } from './httpError.js';

export function requireFields(body, fields) {
  const missing = fields.filter((field) => !body?.[field]);

  if (missing.length > 0) {
    throw httpError(400, 'Faltan campos requeridos.', { missing });
  }
}

