import { query } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { mapUser } from '../../utils/mappers.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/token.js';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateText,
  validateUrl,
} from '../../utils/validation.js';

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const result = await query(
    `SELECT id, name, email, password_hash, role, status, avatar_url, created_at, updated_at
     FROM public.users
     WHERE email = $1`,
    [normalizedEmail],
  );
  const row = result.rows[0];

  if (!row || !verifyPassword(String(password ?? ''), row.password_hash)) {
    throw httpError(401, 'Credenciales invalidas.');
  }

  if (row.status !== 'active') {
    throw httpError(403, 'La cuenta se encuentra suspendida.');
  }

  const user = mapUser(row);
  return {
    user,
    token: signToken({ sub: user.id, role: user.role }),
  };
}

export async function register({ name, email, password }) {
  const validName = validateText(name, 'Nombre', { min: 2, max: 120 });
  const validEmail = validateEmail(email);
  const validPassword = validatePassword(password);

  try {
    const result = await query(
      `INSERT INTO public.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, status, avatar_url, created_at, updated_at`,
      [validName, validEmail, hashPassword(validPassword)],
    );
    const user = mapUser(result.rows[0]);

    return {
      user,
      token: signToken({ sub: user.id, role: user.role }),
    };
  } catch (error) {
    if (error.code === '23505') {
      throw httpError(409, 'Ya existe una cuenta con ese correo.');
    }
    throw error;
  }
}

export async function updateProfile(userId, payload) {
  const avatarUrl = validateUrl(payload.avatarUrl, 'URL de avatar');
  const result = await query(
    `UPDATE public.users
     SET avatar_url = $2
     WHERE id = $1
     RETURNING id, name, email, role, status, avatar_url, created_at, updated_at`,
    [userId, avatarUrl],
  );
  const updatedUser = mapUser(result.rows[0]);

  if (!updatedUser) {
    throw httpError(404, 'Usuario no encontrado.');
  }

  return updatedUser;
}

