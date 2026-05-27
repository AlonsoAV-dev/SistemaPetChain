import { createRecord, findUserByEmail, publicUser, updateRecord } from '../../data/store.js';
import { httpError } from '../../utils/httpError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/token.js';

export function login({ email, password }) {
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw httpError(401, 'Credenciales invalidas.');
  }

  return {
    user: publicUser(user),
    token: signToken({ sub: user.id, role: user.role }),
  };
}

export function register({ name, email, password }) {
  const existingUser = findUserByEmail(email);

  if (existingUser) {
    throw httpError(409, 'Ya existe una cuenta con ese correo.');
  }

  const user = createRecord('users', {
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'user',
    avatarUrl: null,
  });

  return {
    user: publicUser(user),
    token: signToken({ sub: user.id, role: user.role }),
  };
}

export function updateProfile(userId, payload) {
  const avatarUrl = typeof payload.avatarUrl === 'string' ? payload.avatarUrl.trim() : payload.avatarUrl;

  if (avatarUrl !== null && avatarUrl !== undefined && typeof avatarUrl !== 'string') {
    throw httpError(400, 'Avatar invalido.');
  }

  const updatedUser = updateRecord('users', userId, {
    avatarUrl: avatarUrl ? avatarUrl : null,
  });

  if (!updatedUser) {
    throw httpError(404, 'Usuario no encontrado.');
  }

  return publicUser(updatedUser);
}

