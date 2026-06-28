import { query, withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import {
  optionalText,
  parseDate,
  validateEmail,
  validateText,
  validateUrl,
} from '../../utils/validation.js';

function detailPath(type, publicationId) {
  if (type === 'adoption') return `/app/adopciones/${publicationId}`;
  if (type === 'lost_pet') return `/app/mascotas-perdidas/${publicationId}`;
  if (type === 'responsible_action') return `/app/acciones/${publicationId}`;
  return '/app';
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.notification_type,
    title: row.title,
    message: row.message,
    publicationId: row.publication_id,
    publicationType: row.publication_type,
    path: detailPath(row.publication_type, row.publication_id),
    actorName: row.actor_name,
    read: Boolean(row.read_at),
    createdAt: row.created_at,
  };
}

function mapAdoptionRequest(row) {
  return {
    id: row.id,
    publicationId: row.publication_id,
    publicationTitle: row.publication_title,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    housing: row.housing,
    experience: row.experience,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLostReport(row) {
  return {
    id: row.id,
    publicationId: row.publication_id,
    publicationTitle: row.publication_title,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    reportType: row.report_type,
    location: row.location,
    seenAt: row.seen_at,
    description: row.description,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    evidenceUrls: row.evidence_urls ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotifications(userId) {
  const result = await query(
    `SELECT n.*, p.type AS publication_type, actor.name AS actor_name
     FROM public.notifications n
     LEFT JOIN public.publications p ON p.id = n.publication_id
     LEFT JOIN public.users actor ON actor.id = n.actor_id
     WHERE n.recipient_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [userId],
  );
  return result.rows.map(mapNotification);
}

export async function markNotificationRead(id, userId) {
  const result = await query(
    `UPDATE public.notifications SET read_at = COALESCE(read_at, now())
     WHERE id = $1 AND recipient_id = $2
     RETURNING *`,
    [id, userId],
  );
  if (!result.rows[0]) throw httpError(404, 'Notificacion no encontrada.');
  return { id: result.rows[0].id, read: true };
}

export async function createAdoptionRequest(publicationId, payload, user) {
  const fullName = validateText(payload.fullName ?? user.name, 'Nombre', { min: 2, max: 120 });
  const email = validateEmail(payload.email ?? user.email);
  const phone = validateText(payload.phone, 'Telefono', { min: 6, max: 30 });
  const city = validateText(payload.city, 'Ciudad o distrito', { min: 2, max: 120 });
  const housing = validateText(payload.housing, 'Tipo de vivienda', { min: 2, max: 120 });
  const experience = optionalText(payload.experience, 'Experiencia', 2000);
  const message = validateText(payload.message, 'Mensaje', { min: 10, max: 2000 });

  try {
    return await withTransaction(async (client) => {
      const publication = await client.query(
        `SELECT p.id, p.owner_id, p.title, ap.adoption_status
         FROM public.publications p
         JOIN public.adoption_publications ap ON ap.publication_id = p.id
         WHERE p.id = $1 AND p.moderation_status = 'approved'
         FOR UPDATE`,
        [publicationId],
      );
      const item = publication.rows[0];
      if (!item) throw httpError(404, 'Publicacion de adopcion no encontrada.');
      if (item.owner_id === user.id) throw httpError(400, 'No puedes solicitar tu propia publicacion.');
      if (item.adoption_status !== 'available') {
        throw httpError(409, 'Esta mascota ya no esta disponible para nuevas solicitudes.');
      }

      const result = await client.query(
        `INSERT INTO public.adoption_requests (
           publication_id, requester_id, full_name, email, phone, city,
           housing, experience, message
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [publicationId, user.id, fullName, email, phone, city, housing, experience, message],
      );

      await client.query(
        `INSERT INTO public.notifications (
           recipient_id, actor_id, publication_id, notification_type, title, message
         )
         VALUES ($1, $2, $3, 'adoption_request', 'Nueva solicitud de adopcion', $4)`,
        [item.owner_id, user.id, publicationId, `${fullName} desea adoptar. Telefono: ${phone}.`],
      );

      return mapAdoptionRequest({
        ...result.rows[0],
        publication_title: item.title,
        requester_name: user.name,
      });
    });
  } catch (error) {
    if (error.code === '23505') {
      throw httpError(409, 'Ya tienes una solicitud activa para esta mascota.');
    }
    throw error;
  }
}

export async function listAdoptionRequests(publicationId, user) {
  const result = await query(
    `SELECT ar.*, p.title AS publication_title, requester.name AS requester_name
     FROM public.adoption_requests ar
     JOIN public.publications p ON p.id = ar.publication_id
     JOIN public.users requester ON requester.id = ar.requester_id
     WHERE ar.publication_id = $1
       AND (p.owner_id = $2 OR $3 = true)
     ORDER BY ar.created_at DESC`,
    [publicationId, user.id, user.role === 'admin'],
  );
  return result.rows.map(mapAdoptionRequest);
}

export async function updateAdoptionRequest(id, status, user) {
  const allowed = new Set(['pending', 'contacted', 'accepted', 'rejected', 'cancelled']);
  if (!allowed.has(status)) throw httpError(400, 'Estado de solicitud invalido.');

  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE public.adoption_requests ar
       SET status = $2
       FROM public.publications p
       WHERE ar.id = $1 AND p.id = ar.publication_id
         AND (p.owner_id = $3 OR $4 = true)
       RETURNING ar.*, p.title AS publication_title`,
      [id, status, user.id, user.role === 'admin'],
    );
    const item = result.rows[0];
    if (!item) throw httpError(404, 'Solicitud no encontrada.');

    if (status === 'accepted') {
      await client.query(
        `UPDATE public.adoption_publications
         SET adoption_status = 'reserved'
         WHERE publication_id = $1`,
        [item.publication_id],
      );
    }

    await client.query(
      `INSERT INTO public.notifications (
         recipient_id, actor_id, publication_id, notification_type, title, message
       )
       VALUES ($1, $2, $3, 'adoption_request_status', 'Actualizacion de solicitud', $4)`,
      [
        item.requester_id,
        user.id,
        item.publication_id,
        `Tu solicitud para "${item.publication_title}" ahora esta: ${status}.`,
      ],
    );

    return mapAdoptionRequest(item);
  });
}

export async function createLostPetReport(publicationId, payload, user) {
  const reportType = payload.reportType === 'found' ? 'found' : 'sighting';
  const location = validateText(payload.location, 'Lugar', { min: 3, max: 200 });
  const seenAt = parseDate(payload.seenAt, 'Fecha y hora');
  const description = validateText(payload.description, 'Descripcion', { min: 10, max: 2000 });
  const contactName = validateText(payload.contactName ?? user.name, 'Nombre de contacto', {
    min: 2,
    max: 120,
  });
  const contactPhone = validateText(payload.contactPhone, 'Telefono', { min: 6, max: 30 });
  const evidenceUrls = Array.isArray(payload.evidenceUrls)
    ? [...new Set(payload.evidenceUrls.map((url) => validateUrl(url, 'URL de evidencia')))]
    : [];
  if (evidenceUrls.length === 0) throw httpError(400, 'Adjunta al menos una foto como evidencia.');
  if (evidenceUrls.length > 6) throw httpError(400, 'Puedes adjuntar como maximo 6 fotos.');

  return withTransaction(async (client) => {
    const publication = await client.query(
      `SELECT p.id, p.owner_id, p.title, lp.search_status
       FROM public.publications p
       JOIN public.lost_pet_publications lp ON lp.publication_id = p.id
       WHERE p.id = $1 AND p.moderation_status = 'approved'
       FOR UPDATE`,
      [publicationId],
    );
    const item = publication.rows[0];
    if (!item) throw httpError(404, 'Publicacion de mascota perdida no encontrada.');
    if (item.owner_id === user.id) throw httpError(400, 'Usa la edicion del caso para marcar tu mascota como encontrada.');
    if (item.search_status !== 'active') throw httpError(409, 'Este caso ya no recibe nuevos reportes.');

    const result = await client.query(
      `INSERT INTO public.lost_pet_reports (
         publication_id, reporter_id, report_type, location, seen_at,
         description, contact_name, contact_phone, evidence_urls
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        publicationId, user.id, reportType, location, seenAt,
        description, contactName, contactPhone, evidenceUrls,
      ],
    );

    await client.query(
      `INSERT INTO public.notifications (
         recipient_id, actor_id, publication_id, notification_type, title, message
       )
       VALUES ($1, $2, $3, 'lost_pet_report', $4, $5)`,
      [
        item.owner_id,
        user.id,
        publicationId,
        reportType === 'found' ? 'Alguien encontro a tu mascota' : 'Nuevo avistamiento',
        `${contactName} envio fotos y datos desde ${location}. Telefono: ${contactPhone}.`,
      ],
    );

    return mapLostReport({
      ...result.rows[0],
      publication_title: item.title,
      reporter_name: user.name,
    });
  });
}

export async function listLostPetReports(publicationId, user) {
  const result = await query(
    `SELECT lr.*, p.title AS publication_title, reporter.name AS reporter_name
     FROM public.lost_pet_reports lr
     JOIN public.publications p ON p.id = lr.publication_id
     JOIN public.users reporter ON reporter.id = lr.reporter_id
     WHERE lr.publication_id = $1
       AND (p.owner_id = $2 OR $3 = true)
     ORDER BY lr.created_at DESC`,
    [publicationId, user.id, user.role === 'admin'],
  );
  return result.rows.map(mapLostReport);
}

export async function updateLostPetReport(id, status, user) {
  const allowed = new Set(['pending', 'contacted', 'verified', 'dismissed']);
  if (!allowed.has(status)) throw httpError(400, 'Estado de reporte invalido.');

  const result = await query(
    `UPDATE public.lost_pet_reports lr
     SET status = $2
     FROM public.publications p
     WHERE lr.id = $1 AND p.id = lr.publication_id
       AND (p.owner_id = $3 OR $4 = true)
     RETURNING lr.*, p.title AS publication_title`,
    [id, status, user.id, user.role === 'admin'],
  );
  if (!result.rows[0]) throw httpError(404, 'Reporte no encontrado.');
  return mapLostReport(result.rows[0]);
}
