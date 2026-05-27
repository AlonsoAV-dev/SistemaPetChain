import { list } from '../../data/store.js';

export function getArticles({ category } = {}) {
  return list('articles').filter((article) =>
    category ? article.category.toLowerCase() === category.toLowerCase() : true,
  );
}

