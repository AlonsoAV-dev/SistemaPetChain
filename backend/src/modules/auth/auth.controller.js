import * as authService from './auth.service.js';
import { requireFields } from '../../utils/request.js';
import { httpError } from '../../utils/httpError.js';

export function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const data = authService.login(req.body);

  res.json({ data });
}

export function register(req, res) {
  requireFields(req.body, ['name', 'email', 'password']);
  const data = authService.register(req.body);

  res.status(201).json({ data });
}

export function me(req, res) {
  res.json({ data: req.user });
}

export function updateProfile(req, res) {
  const { avatarUrl } = req.body ?? {};

  if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
    throw httpError(400, 'Avatar invalido.');
  }

  const data = authService.updateProfile(req.user.id, { avatarUrl });
  res.json({ data });
}

