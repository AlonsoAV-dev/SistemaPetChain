import { query } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { optionalText, validateText, validateUrl } from '../../utils/validation.js';

function normalizeSources(sources = []) {
  if (!Array.isArray(sources)) return [];

  return sources
    .map((source, index) => ({
      label: validateText(source?.label ?? source?.title, `Fuente ${index + 1}`, { min: 2, max: 140 }),
      url: validateUrl(source?.url, `URL de fuente ${index + 1}`),
    }))
    .filter((source) => source.label && source.url)
    .slice(0, 8);
}

function mapArticle(article) {
  return {
    id: article.id,
    category: article.category,
    title: article.title,
    description: article.description,
    content: article.content,
    imageUrl: article.image_url,
    sources: article.sources ?? [],
    published: article.published,
    publishedAt: article.published_at,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  };
}

export async function getArticles({ category, all } = {}, user = null) {
  const values = [];
  const includeAll = user?.role === 'admin' && String(all) === 'true';
  const filters = includeAll ? [] : ['published = true'];

  if (category) {
    values.push(String(category).trim());
    filters.push(`category ILIKE $${values.length}`);
  }

  const result = await query(
    `SELECT id, category, title, description, content, image_url, sources, published, published_at, created_at, updated_at
     FROM public.articles
     ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
     ORDER BY published_at DESC NULLS LAST`,
    values,
  );

  return result.rows.map(mapArticle);
}

export async function getArticle(id, user = null) {
  const result = await query(
    `SELECT id, category, title, description, content, image_url, sources, published, published_at, created_at, updated_at
     FROM public.articles
     WHERE id = $1 AND (published = true OR $2 = true)`,
    [id, user?.role === 'admin'],
  );
  const article = result.rows[0];

  return article ? mapArticle(article) : null;
}

export async function createArticle(payload, admin) {
  const category = validateText(payload.category, 'Categoria', { min: 2, max: 80 });
  const title = validateText(payload.title, 'Titulo', { min: 4, max: 180 });
  const description = validateText(payload.description, 'Descripcion', { min: 10, max: 600 });
  const content = validateText(payload.content, 'Contenido', { min: 20, max: 12000 });
  const imageUrl = optionalText(payload.imageUrl, 'Imagen', 2000);
  const sources = normalizeSources(payload.sources);
  const published = payload.published !== false;

  const result = await query(
    `INSERT INTO public.articles (
       author_admin_id, category, title, description, content, image_url,
       sources, published, published_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, CASE WHEN $8 THEN now() ELSE NULL END)
     RETURNING id, category, title, description, content, image_url, sources, published, published_at, created_at, updated_at`,
    [admin.id, category, title, description, content, imageUrl, JSON.stringify(sources), published],
  );

  return mapArticle(result.rows[0]);
}

export async function updateArticle(id, payload) {
  const category = validateText(payload.category, 'Categoria', { min: 2, max: 80 });
  const title = validateText(payload.title, 'Titulo', { min: 4, max: 180 });
  const description = validateText(payload.description, 'Descripcion', { min: 10, max: 600 });
  const content = validateText(payload.content, 'Contenido', { min: 20, max: 12000 });
  const imageUrl = optionalText(payload.imageUrl, 'Imagen', 2000);
  const sources = normalizeSources(payload.sources);
  const published = payload.published !== false;

  const result = await query(
    `UPDATE public.articles
     SET category = $2,
         title = $3,
         description = $4,
         content = $5,
         image_url = $6,
         sources = $7::jsonb,
         published = $8,
         published_at = CASE
           WHEN $8 = true AND published_at IS NULL THEN now()
           WHEN $8 = false THEN NULL
           ELSE published_at
         END
     WHERE id = $1
     RETURNING id, category, title, description, content, image_url, sources, published, published_at, created_at, updated_at`,
    [id, category, title, description, content, imageUrl, JSON.stringify(sources), published],
  );

  const article = result.rows[0];
  if (!article) throw httpError(404, 'Articulo no encontrado.');

  return mapArticle(article);
}

export async function deleteArticle(id) {
  const result = await query(
    `DELETE FROM public.articles WHERE id = $1 RETURNING id`,
    [id],
  );

  if (!result.rows[0]) throw httpError(404, 'Articulo no encontrado.');
}
