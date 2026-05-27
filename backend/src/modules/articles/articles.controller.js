import * as articlesService from './articles.service.js';

export function listArticles(req, res) {
  const data = articlesService.getArticles(req.query);

  res.json({ data });
}

