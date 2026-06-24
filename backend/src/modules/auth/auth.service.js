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
  const updates = [];
  const values = [userId];

  if (payload.name !== undefined) {
    values.push(validateText(payload.name, 'Nombre', { min: 2, max: 120 }));
    updates.push(`name = $${values.length}`);
  }

  if (payload.email !== undefined) {
    values.push(validateEmail(payload.email));
    updates.push(`email = $${values.length}`);
  }

  if (payload.avatarUrl !== undefined) {
    values.push(validateUrl(payload.avatarUrl, 'URL de avatar'));
    updates.push(`avatar_url = $${values.length}`);
  }

  if (updates.length === 0) {
    const current = await query(
      `SELECT id, name, email, role, status, avatar_url, created_at, updated_at
       FROM public.users
       WHERE id = $1`,
      [userId],
    );
    const currentUser = mapUser(current.rows[0]);
    if (!currentUser) throw httpError(404, 'Usuario no encontrado.');
    return currentUser;
  }

  try {
    const result = await query(
      `UPDATE public.users
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING id, name, email, role, status, avatar_url, created_at, updated_at`,
      values,
    );
    const updatedUser = mapUser(result.rows[0]);

    if (!updatedUser) {
      throw httpError(404, 'Usuario no encontrado.');
    }

    return updatedUser;
  } catch (error) {
    if (error.code === '23505') {
      throw httpError(409, 'Ya existe una cuenta con ese correo.');
    }
    throw error;
  }
}

export async function updatePassword(userId, payload) {
  const currentPassword = String(payload.currentPassword ?? '');
  const newPassword = validatePassword(payload.newPassword);

  if (currentPassword === newPassword) {
    throw httpError(400, 'La nueva contrasena debe ser diferente a la actual.');
  }

  const result = await query(
    `SELECT password_hash
     FROM public.users
     WHERE id = $1 AND status = 'active'`,
    [userId],
  );
  const row = result.rows[0];

  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    throw httpError(401, 'La contrasena actual no es correcta.');
  }

  await query(
    `UPDATE public.users
     SET password_hash = $2
     WHERE id = $1`,
    [userId, hashPassword(newPassword)],
  );

  return { changed: true };
}

