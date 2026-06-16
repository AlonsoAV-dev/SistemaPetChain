import { requireFields } from '../../utils/request.js';
import * as commentsService from './comments.service.js';

export async function listComments(req, res) {
  res.json({ data: await commentsService.listComments(req.params.publicationId) });
}

export async function createComment(req, res) {
  requireFields(req.body, ['body']);
  const data = await commentsService.createComment(
    req.params.publicationId,
    req.body,
    req.user,
  );
  res.status(201).json({ data });
}

export async function updateComment(req, res) {
  requireFields(req.body, ['body']);
  const data = await commentsService.updateComment(req.params.id, req.body, req.user);
  res.json({ data });
}

export async function deleteComment(req, res) {
  await commentsService.deleteComment(req.params.id, req.user);
  res.status(204).end();
}
