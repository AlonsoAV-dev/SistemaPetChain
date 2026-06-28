import { query, withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { createPublication } from '../../utils/publications.js';
import { optionalText, validateText, validateUrl } from '../../utils/validation.js';

const selectActions = `
  SELECT
    p.id,
    p.owner_id,
    p.title,
    p.description,
    p.moderation_status,
    p.rejection_reason,
    p.points_awarded,
    p.reviewed_at,
    p.created_at,
    u.name AS author_name,
    rap.category,
    rap.action_date,
    rap.location,
    rap.evidence_url,
    point_rule.min_points,
    point_rule.max_points,
    (SELECT mr.scoring_reason
     FROM public.moderation_reviews mr
     WHERE mr.publication_id = p.id AND mr.decision = 'approved'
     ORDER BY mr.created_at DESC
     LIMIT 1) AS scoring_reason,
    (SELECT count(*)::integer FROM public.publication_likes pl WHERE pl.publication_id = p.id) AS likes
  FROM public.publications p
  JOIN public.users u ON u.id = p.owner_id
  JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
  LEFT JOIN public.responsible_action_point_rules point_rule ON point_rule.category = rap.category
`;

function mapAction(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    authorName: row.author_name,
    category: row.category,
    description: row.description,
    points: row.points_awarded,
    minPoints: row.min_points,
    maxPoints: row.max_points,
    scoringReason: row.scoring_reason,
    likes: row.likes,
    actionDate: row.action_date,
    location: row.location,
    evidenceUrl: row.evidence_url,
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function getActions({ query: search, category } = {}) {
  const values = [];
  const filters = [`p.moderation_status = 'approved'`];

  if (search) {
    values.push(`%${String(search).trim()}%`);
    filters.push(
      `(p.title ILIKE $${values.length} OR u.name ILIKE $${values.length} OR rap.category ILIKE $${values.length})`,
    );
  }

  if (category) {
    values.push(String(category).trim());
    filters.push(`rap.category ILIKE $${values.length}`);
  }

  const result = await query(
    `${selectActions} WHERE ${filters.join(' AND ')} ORDER BY p.approved_at DESC`,
    values,
  );
  return result.rows.map(mapAction);
}

export async function getMyActions(userId) {
  const result = await query(
    `${selectActions} WHERE p.owner_id = $1 ORDER BY p.created_at DESC`,
    [userId],
  );
  return result.rows.map(mapAction);
}

export async function getAction(id, user) {
  const values = [id];
  let access = `p.moderation_status = 'approved'`;
  if (user) {
    values.push(user.id, user.role === 'admin');
    access = `(p.moderation_status = 'approved' OR p.owner_id = $2 OR $3 = true)`;
  }
  const result = await query(`${selectActions} WHERE p.id = $1 AND ${access}`, values);
  if (!result.rows[0]) throw httpError(404, 'Accion responsable no encontrada.');
  return mapAction(result.rows[0]);
}

export async function createAction(payload, user) {
  const title = validateText(payload.title, 'Titulo', { min: 4, max: 160 });
  const category = validateText(payload.category, 'Categoria', { min: 2, max: 80 });
  const description = validateText(payload.description, 'Descripcion', { min: 10, max: 3000 });
  const actionDate = payload.actionDate ?? new Date().toISOString().slice(0, 10);
  const location = optionalText(payload.location, 'Ubicacion', 180);
  const evidenceUrl = validateUrl(payload.evidenceUrl, 'URL de evidencia');
  if (!evidenceUrl) throw httpError(400, 'Debes adjuntar una evidencia fotografica.');

  const categoryRule = await query(
    `SELECT category
     FROM public.responsible_action_point_rules
     WHERE category = $1 AND enabled = true AND available_for_submission = true`,
    [category],
  );
  if (!categoryRule.rows[0]) throw httpError(400, 'Selecciona una categoria de accion valida.');

  return withTransaction(async (client) => {
    const publicationId = await createPublication(client, {
      owner: user,
      type: 'responsible_action',
      title,
      description,
      autoApproveAdmin: false,
    });

    await client.query(
      `INSERT INTO public.responsible_action_publications (
         publication_id, category, action_date, location, evidence_url
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [publicationId, category, actionDate, location, evidenceUrl],
    );

    const result = await client.query(`${selectActions} WHERE p.id = $1`, [publicationId]);
    return mapAction(result.rows[0]);
  });
}

export async function updateAction(id, payload, user) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `${selectActions} WHERE p.id = $1 AND p.owner_id = $2 FOR UPDATE OF p, rap`,
      [id, user.id],
    );

    if (!current.rows[0]) {
      throw httpError(404, 'Accion no encontrada o no pertenece al usuario.');
    }

    const row = current.rows[0];
    const title =
      payload.title === undefined
        ? row.title
        : validateText(payload.title, 'Titulo', { min: 4, max: 160 });
    const description =
      payload.description === undefined
        ? row.description
        : validateText(payload.description, 'Descripcion', { min: 10, max: 3000 });

    if (payload.category) {
      const categoryRule = await client.query(
        `SELECT category
         FROM public.responsible_action_point_rules
         WHERE category = $1 AND enabled = true AND available_for_submission = true`,
        [validateText(payload.category, 'Categoria', { min: 2, max: 80 })],
      );
      if (!categoryRule.rows[0]) throw httpError(400, 'Selecciona una categoria de accion valida.');
    }

    await client.query(
      `UPDATE public.publications
       SET title = $3, description = $4
       WHERE id = $1 AND owner_id = $2`,
      [id, user.id, title, description],
    );

    await client.query(
      `UPDATE public.responsible_action_publications
       SET category = COALESCE($2, category),
           action_date = COALESCE($3, action_date),
           location = COALESCE($4, location),
           evidence_url = COALESCE($5, evidence_url)
       WHERE publication_id = $1`,
      [
        id,
        payload.category
          ? validateText(payload.category, 'Categoria', { min: 2, max: 80 })
          : null,
        payload.actionDate ?? null,
        optionalText(payload.location, 'Ubicacion', 180),
        payload.evidenceUrl === undefined
          ? null
          : validateUrl(payload.evidenceUrl, 'URL de evidencia'),
      ],
    );
    const result = await client.query(`${selectActions} WHERE p.id = $1`, [id]);
    return mapAction(result.rows[0]);
  });
}

export async function likeAction(id, userId) {
  const publication = await query(
    `SELECT id
     FROM public.publications
     WHERE id = $1 AND type = 'responsible_action' AND moderation_status = 'approved'`,
    [id],
  );

  if (!publication.rows[0]) return null;

  await query(
    `INSERT INTO public.publication_likes (publication_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [id, userId],
  );

  const result = await query(`${selectActions} WHERE p.id = $1`, [id]);
  return mapAction(result.rows[0]);
}

export async function deleteAction(id, user) {
  const result = await query(
    `DELETE FROM public.publications
     WHERE id = $1 AND owner_id = $2 AND type = 'responsible_action'
     RETURNING id`,
    [id, user.id],
  );

  if (!result.rows[0]) {
    throw httpError(404, 'Accion no encontrada o no pertenece al usuario.');
  }
}
