import * as authService from './auth.service.js';
import { requireFields } from '../../utils/request.js';
import { httpError } from '../../utils/httpError.js';

export async function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const data = await authService.login(req.body);

  res.json({ data });
}

export async function register(req, res) {
  requireFields(req.body, ['name', 'email', 'password']);
  const data = await authService.register(req.body);

  res.status(201).json({ data });
}

export function me(req, res) {
  res.json({ data: req.user });
}

export async function updateProfile(req, res) {
  const { avatarUrl, email, name } = req.body ?? {};

  if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
    throw httpError(400, 'Avatar invalido.');
  }

  if (email !== undefined && typeof email !== 'string') {
    throw httpError(400, 'Correo invalido.');
  }

  if (name !== undefined && typeof name !== 'string') {
    throw httpError(400, 'Nombre invalido.');
  }

  const data = await authService.updateProfile(req.user.id, { avatarUrl, email, name });
  res.json({ data });
}

export async function updatePassword(req, res) {
  requireFields(req.body, ['currentPassword', 'newPassword']);
  const data = await authService.updatePassword(req.user.id, req.body);

  res.json({ data });
}
