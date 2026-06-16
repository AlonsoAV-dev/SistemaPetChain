import * as articlesService from './articles.service.js';
import { httpError } from '../../utils/httpError.js';

export async function listArticles(req, res) {
  const data = await articlesService.getArticles(req.query);

  res.json({ data });
}

export async function getArticle(req, res) {
  const data = await articlesService.getArticle(req.params.id);
  if (!data) throw httpError(404, 'Articulo no encontrado.');
  res.json({ data });
}

