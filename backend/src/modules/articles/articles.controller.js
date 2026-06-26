import * as articlesService from './articles.service.js';
import { httpError } from '../../utils/httpError.js';

export async function listArticles(req, res) {
  const data = await articlesService.getArticles(req.query, req.user);

  res.json({ data });
}

export async function getArticle(req, res) {
  const data = await articlesService.getArticle(req.params.id, req.user);
  if (!data) throw httpError(404, 'Articulo no encontrado.');
  res.json({ data });
}

export async function createArticle(req, res) {
  const data = await articlesService.createArticle(req.body, req.user);
  res.status(201).json({ data });
}

export async function updateArticle(req, res) {
  const data = await articlesService.updateArticle(req.params.id, req.body);
  res.json({ data });
}

export async function deleteArticle(req, res) {
  await articlesService.deleteArticle(req.params.id);
  res.status(204).end();
}

