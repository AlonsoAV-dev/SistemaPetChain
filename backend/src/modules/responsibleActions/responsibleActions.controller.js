import * as actionsService from './responsibleActions.service.js';
import { httpError } from '../../utils/httpError.js';
import { requireFields } from '../../utils/request.js';

export function listActions(req, res) {
  const data = actionsService.getActions(req.query);

  res.json({ data });
}

export function createAction(req, res) {
  requireFields(req.body, ['title', 'category', 'description']);
  const data = actionsService.createAction(req.body, req.user);

  res.status(201).json({ data });
}

export function likeAction(req, res) {
  const data = actionsService.likeAction(req.params.id);

  if (!data) {
    throw httpError(404, 'Accion responsable no encontrada.');
  }

  res.json({ data });
}

