import { query } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { mapPublicationStatus, mapUser } from '../../utils/mappers.js';
import { hashPassword } from '../../utils/password.js';
import { validateEmail, validatePassword, validateText } from '../../utils/validation.js';
import {
  drawRewardPeriod,
  getAdminRewardPeriods,
  updateRewardPeriod,
} from '../responsibleActions/rewards.service.js';

function mapModerationItem(row) {
  const typeLabels = {
    lost_pet: 'Mascotas perdidas',
    adoption: 'Adopciones',
    responsible_action: 'Acciones responsables',
  };

  return {
    id: row.id,
    title: row.title,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    status: mapPublicationStatus(row.moderation_status),
    type: row.type,
    typeLabel: typeLabels[row.type] ?? row.type,
    description: row.description,
    ownerId: row.owner_id,
    category: row.category,
    evidenceUrl: row.evidence_url,
    minPoints: row.min_points,
    maxPoints: row.max_points,
    monthlyLimit: row.monthly_reward_limit,
    createdAt: row.created_at,
  };
}

export async function getModerationItems() {
  const result = await query(
    `SELECT
       p.id, p.type, p.title, p.description, p.created_at,
       p.moderation_status, p.owner_id,
       u.name AS owner_name, u.email AS owner_email,
       rap.category, rap.evidence_url,
       action_rule.min_points, action_rule.max_points, action_rule.monthly_reward_limit
     FROM public.publications p
     JOIN public.users u ON u.id = p.owner_id
     LEFT JOIN public.responsible_action_publications rap ON rap.publication_id = p.id
     LEFT JOIN public.responsible_action_point_rules action_rule
       ON action_rule.category = rap.category AND action_rule.enabled = true
     WHERE p.moderation_status = 'pending'
     ORDER BY p.created_at ASC`,
  );
  return result.rows.map(mapModerationItem);
}

export async function updateModerationItem(id, payload, adminId) {
  const rawDecision = String(payload.decision ?? payload.status ?? '').trim().toLowerCase();
  const decisionMap = {
    aprobado: 'approved',
    approved: 'approved',
    rechazado: 'rejected',
    rejected: 'rejected',
  };
  const decision = decisionMap[rawDecision];

  if (!decision) {
    throw httpError(400, 'La decision debe ser approved/aprobado o rejected/rechazado.');
  }

  const reason = payload.reason ? String(payload.reason).trim() : null;
  const points = payload.points === undefined || payload.points === null || payload.points === ''
    ? null
    : Number(payload.points);
  const pointReason = payload.pointReason ? String(payload.pointReason).trim() : null;

  if (points !== null && !Number.isInteger(points)) {
    throw httpError(400, 'Los puntos deben ser un numero entero.');
  }

  const result = await query(
    `SELECT *
     FROM public.review_publication(
       $1, $2, $3::public.moderation_decision, $4, $5::smallint, $6
     )`,
    [id, adminId, decision, reason, points, pointReason],
  );
  const row = result.rows[0];

  if (!row) {
    throw httpError(404, 'Publicacion no encontrada.');
  }

  return {
    id: row.id,
    title: row.title,
    status: mapPublicationStatus(row.moderation_status),
    type: row.type,
    description: row.description,
    pointsAwarded: row.points_awarded,
    reviewedAt: row.reviewed_at,
  };
}

export async function listPublications({ type, status, query: search } = {}) {
  const values = [];
  const filters = [];

  if (type) {
    values.push(String(type).trim());
    filters.push(`p.type = $${values.length}::public.publication_type`);
  }

  if (status) {
    values.push(String(status).trim());
    filters.push(`p.moderation_status = $${values.length}::public.moderation_status`);
  }

  if (search) {
    values.push(`%${String(search).trim()}%`);
    filters.push(
      `(p.title ILIKE $${values.length} OR u.name ILIKE $${values.length} OR u.email ILIKE $${values.length})`,
    );
  }

  const result = await query(
    `SELECT
       p.id, p.type, p.title, p.description, p.moderation_status,
       p.rejection_reason, p.points_awarded, p.created_at, p.reviewed_at,
       u.name AS owner_name, u.email AS owner_email,
       (SELECT count(*)::integer FROM public.comments c WHERE c.publication_id = p.id) AS comments_count
     FROM public.publications p
     JOIN public.users u ON u.id = p.owner_id
     ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
     ORDER BY p.created_at DESC`,
    values,
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    status: mapPublicationStatus(row.moderation_status),
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason,
    pointsAwarded: row.points_awarded,
    commentsCount: row.comments_count,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}

export async function listComments({ query: search } = {}) {
  const values = [];
  const filters = [];

  if (search) {
    values.push(`%${String(search).trim()}%`);
    filters.push(
      `(c.body ILIKE $${values.length} OR u.name ILIKE $${values.length} OR p.title ILIKE $${values.length})`,
    );
  }

  const result = await query(
    `SELECT
       c.id, c.body, c.created_at, c.updated_at,
       u.id AS author_id, u.name AS author_name, u.email AS author_email,
       p.id AS publication_id, p.title AS publication_title, p.type AS publication_type
     FROM public.comments c
     JOIN public.users u ON u.id = c.author_id
     JOIN public.publications p ON p.id = c.publication_id
     ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
     ORDER BY c.created_at DESC`,
    values,
  );

  return result.rows.map((row) => ({
    id: row.id,
    body: row.body,
    authorId: row.author_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    publicationId: row.publication_id,
    publicationTitle: row.publication_title,
    publicationType: row.publication_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteComment(id) {
  const result = await query(
    `DELETE FROM public.comments WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!result.rows[0]) throw httpError(404, 'Comentario no encontrado.');
}

export async function listUsers({ query: search } = {}) {
  const values = [];
  const filters = [];

  if (search) {
    values.push(`%${String(search).trim()}%`);
    filters.push(`(u.name ILIKE $1 OR u.email ILIKE $1)`);
  }

  const result = await query(
    `SELECT
       u.id, u.name, u.email, u.role, u.status, u.avatar_url, u.created_at,
       (SELECT count(*)::integer FROM public.publications p WHERE p.owner_id = u.id) AS publications_count,
       COALESCE((SELECT points FROM public.user_point_balances b WHERE b.user_id = u.id), 0) AS points
     FROM public.users u
     ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
     ORDER BY u.created_at DESC`,
    values,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url,
    publicationsCount: row.publications_count,
    points: row.points,
    createdAt: row.created_at,
  }));
}

export async function createUser(payload) {
  const name = validateText(payload.name, 'Nombre', { min: 2, max: 120 });
  const email = validateEmail(payload.email);
  const password = validatePassword(payload.password);
  const role = String(payload.role ?? 'user').trim().toLowerCase();

  if (!['user', 'admin'].includes(role)) {
    throw httpError(400, 'El rol debe ser user o admin.');
  }

  try {
    const result = await query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4::public.user_role)
       RETURNING id, name, email, role, status, avatar_url, created_at, updated_at`,
      [name, email, hashPassword(password), role],
    );
    return mapUser(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw httpError(409, 'Ya existe una cuenta con ese correo.');
    }
    throw error;
  }
}

export async function updateUserStatus(id, status, adminId) {
  if (id === adminId) {
    throw httpError(400, 'No puedes suspender tu propia cuenta.');
  }

  if (!['active', 'suspended'].includes(status)) {
    throw httpError(400, 'Estado de usuario invalido.');
  }

  const result = await query(
    `UPDATE public.users
     SET status = $2
     WHERE id = $1 AND role = 'user'
     RETURNING id, name, email, role, status, avatar_url, created_at`,
    [id, status],
  );

  if (!result.rows[0]) {
    throw httpError(404, 'Usuario no encontrado o no modificable.');
  }

  return result.rows[0];
}

export async function getSummary() {
  const result = await query(
    `SELECT
       (SELECT count(*)::integer FROM public.users) AS users,
       (SELECT count(*)::integer FROM public.publications WHERE moderation_status = 'pending') AS pending,
       (SELECT count(*)::integer FROM public.publications WHERE moderation_status = 'approved') AS approved,
       (SELECT count(*)::integer FROM public.publications WHERE moderation_status = 'rejected') AS rejected,
       (SELECT count(*)::integer FROM public.comments) AS comments`,
  );
  return result.rows[0];
}

export async function listRewardPeriods() {
  return getAdminRewardPeriods();
}

export async function editRewardPeriod(id, payload) {
  return updateRewardPeriod(id, payload);
}

export async function runRewardDraw(id, adminId) {
  return drawRewardPeriod(id, adminId);
}
