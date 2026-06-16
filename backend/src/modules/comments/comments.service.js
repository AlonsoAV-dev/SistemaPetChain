import { query } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { validateText } from '../../utils/validation.js';

function mapComment(row) {
  return {
    id: row.id,
    publicationId: row.publication_id,
    publicationTitle: row.publication_title,
    publicationType: row.publication_type,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listComments(publicationId) {
  const result = await query(
    `SELECT
       c.*,
       u.name AS author_name,
       p.title AS publication_title,
       p.type AS publication_type
     FROM public.comments c
     JOIN public.users u ON u.id = c.author_id
     JOIN public.publications p ON p.id = c.publication_id
     WHERE c.publication_id = $1 AND p.moderation_status = 'approved'
     ORDER BY c.created_at ASC`,
    [publicationId],
  );
  return result.rows.map(mapComment);
}

export async function createComment(publicationId, payload, user) {
  const body = validateText(payload.body, 'Comentario', { min: 1, max: 1000 });
  const publication = await query(
    `SELECT id
     FROM public.publications
     WHERE id = $1 AND moderation_status = 'approved'`,
    [publicationId],
  );

  if (!publication.rows[0]) {
    throw httpError(404, 'Publicacion no encontrada o aun no aprobada.');
  }

  const result = await query(
    `INSERT INTO public.comments (publication_id, author_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [publicationId, user.id, body],
  );

  return {
    ...mapComment({
      ...result.rows[0],
      author_name: user.name,
      publication_title: null,
      publication_type: null,
    }),
  };
}

export async function updateComment(id, payload, user) {
  const body = validateText(payload.body, 'Comentario', { min: 1, max: 1000 });
  const result = await query(
    `UPDATE public.comments
     SET body = $3
     WHERE id = $1 AND author_id = $2
     RETURNING *`,
    [id, user.id, body],
  );

  if (!result.rows[0]) {
    throw httpError(404, 'Comentario no encontrado o no pertenece al usuario.');
  }

  return mapComment({
    ...result.rows[0],
    author_name: user.name,
    publication_title: null,
    publication_type: null,
  });
}

export async function deleteComment(id, user) {
  const result = await query(
    `DELETE FROM public.comments
     WHERE id = $1 AND author_id = $2
     RETURNING id`,
    [id, user.id],
  );

  if (!result.rows[0]) {
    throw httpError(404, 'Comentario no encontrado o no pertenece al usuario.');
  }
}
