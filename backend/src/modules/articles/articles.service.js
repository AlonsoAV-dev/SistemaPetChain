import { query } from '../../config/database.js';

export async function getArticles({ category } = {}) {
  const values = [];
  const filters = ['published = true'];

  if (category) {
    values.push(String(category).trim());
    filters.push(`category ILIKE $${values.length}`);
  }

  const result = await query(
    `SELECT id, category, title, description, content, image_url, published_at, created_at
     FROM public.articles
     WHERE ${filters.join(' AND ')}
     ORDER BY published_at DESC NULLS LAST`,
    values,
  );

  return result.rows.map((article) => ({
    id: article.id,
    category: article.category,
    title: article.title,
    description: article.description,
    content: article.content,
    imageUrl: article.image_url,
    publishedAt: article.published_at,
    createdAt: article.created_at,
  }));
}

export async function getArticle(id) {
  const result = await query(
    `SELECT id, category, title, description, content, image_url, published_at, created_at
     FROM public.articles
     WHERE id = $1 AND published = true`,
    [id],
  );
  const article = result.rows[0];

  if (!article) return null;

  return {
    id: article.id,
    category: article.category,
    title: article.title,
    description: article.description,
    content: article.content,
    imageUrl: article.image_url,
    publishedAt: article.published_at,
    createdAt: article.created_at,
  };
}
