import { query, withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import { optionalText, parseDate, validateText, validateUrl } from '../../utils/validation.js';

const selectEvents = `
  SELECT
    e.*,
    creator.name AS creator_name,
    (SELECT count(*)::integer
     FROM public.event_registrations er
     WHERE er.event_id = e.id) AS participants,
    CASE
      WHEN $1::uuid IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.event_registrations er
        WHERE er.event_id = e.id AND er.user_id = $1::uuid
      )
    END AS is_registered
  FROM public.events e
  JOIN public.users creator ON creator.id = e.created_by_admin_id
`;

function mapEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    capacity: row.capacity,
    participants: row.participants,
    isRegistered: Boolean(row.is_registered),
    externalUrl: row.external_url,
    creatorName: row.creator_name,
    published: row.published,
    cancelled: row.cancelled,
    createdAt: row.created_at,
  };
}

export async function getEvents(userId = null) {
  const result = await query(
    `${selectEvents}
     WHERE e.published = true AND e.cancelled = false
     ORDER BY e.starts_at ASC`,
    [userId],
  );
  return result.rows.map(mapEvent);
}

export async function getEvent(id, userId = null) {
  const result = await query(
    `${selectEvents}
     WHERE e.id = $2 AND e.published = true AND e.cancelled = false`,
    [userId, id],
  );

  if (!result.rows[0]) throw httpError(404, 'Evento no encontrado.');
  return mapEvent(result.rows[0]);
}

export async function createEvent(payload, admin) {
  const title = validateText(payload.title, 'Titulo', { min: 4, max: 180 });
  const description = validateText(
    payload.description ?? 'Evento comunitario de PetChain.',
    'Descripcion',
    { min: 10, max: 3000 },
  );
  const startsAt = parseDate(payload.date, 'Fecha');
  const endsAt = payload.endsAt ? parseDate(payload.endsAt, 'Fecha de finalizacion') : null;
  const location = validateText(payload.location, 'Ubicacion', { min: 2, max: 200 });
  const capacity = payload.capacity === undefined || payload.capacity === ''
    ? null
    : Number(payload.capacity);
  const externalUrl = validateUrl(payload.externalUrl, 'Link del evento');

  if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
    throw httpError(400, 'La capacidad debe ser un numero entero positivo.');
  }

  const result = await query(
    `INSERT INTO public.events (
       created_by_admin_id, title, description, starts_at, ends_at,
       location, capacity, external_url, published
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     RETURNING *, 0::integer AS participants, false AS is_registered, $9::text AS creator_name`,
    [admin.id, title, description, startsAt, endsAt, location, capacity, externalUrl, admin.name],
  );
  return mapEvent(result.rows[0]);
}

export async function registerAttendance(id, user) {
  return withTransaction(async (client) => {
    const eventResult = await client.query(
      `SELECT
         e.*,
         (SELECT count(*)::integer FROM public.event_registrations er WHERE er.event_id = e.id) AS participants
       FROM public.events e
       WHERE e.id = $1 AND e.published = true AND e.cancelled = false
       FOR UPDATE`,
      [id],
    );
    const event = eventResult.rows[0];
    if (!event) throw httpError(404, 'Evento no encontrado.');

    if (event.starts_at < new Date()) {
      throw httpError(409, 'No puedes registrarte en un evento que ya empezó.');
    }

    if (event.capacity && event.participants >= event.capacity) {
      throw httpError(409, 'El evento ya alcanzó su capacidad.');
    }

    await client.query(
      `INSERT INTO public.event_registrations (event_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, user.id],
    );

    const result = await client.query(
      `${selectEvents} WHERE e.id = $2`,
      [user.id, id],
    );
    return mapEvent(result.rows[0]);
  });
}
