import * as actionsService from './responsibleActions.service.js';
import { httpError } from '../../utils/httpError.js';
import { requireFields } from '../../utils/request.js';

export async function listActions(req, res) {
  const data = await actionsService.getActions(req.query);

  res.json({ data });
}

export async function listMyActions(req, res) {
  const data = await actionsService.getMyActions(req.user.id);
  res.json({ data });
}

export async function getAction(req, res) {
  res.json({ data: await actionsService.getAction(req.params.id, req.user) });
}

export async function createAction(req, res) {
  requireFields(req.body, ['title', 'category', 'description']);
  const data = await actionsService.createAction(req.body, req.user);

  res.status(201).json({ data });
}

export async function updateAction(req, res) {
  const data = await actionsService.updateAction(req.params.id, req.body, req.user);
  res.json({ data });
}

export async function likeAction(req, res) {
  const data = await actionsService.likeAction(req.params.id, req.user.id);

  if (!data) {
    throw httpError(404, 'Accion responsable no encontrada.');
  }

  res.json({ data });
}

export async function deleteAction(req, res) {
  await actionsService.deleteAction(req.params.id, req.user);
  res.status(204).end();
}

