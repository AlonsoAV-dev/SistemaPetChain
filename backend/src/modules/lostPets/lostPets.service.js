import { query, withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import {
  createPublication,
  normalizeImageUrls,
  replacePublicationMedia,
  restoreAdminApproval,
} from '../../utils/publications.js';
import { optionalText, parseDate, validateText } from '../../utils/validation.js';

const selectLostPets = `
  SELECT
    p.id, p.owner_id, p.title, p.description, p.moderation_status,
    p.rejection_reason, p.created_at, p.updated_at,
    u.name AS owner_name, u.avatar_url AS owner_avatar_url,
    lp.pet_name, lp.species, lp.breed, lp.sex, lp.size, lp.zone,
    lp.search_status, lp.contact_name, lp.contact_phone,
    lp.last_seen_at, lp.image_url,
    COALESCE(
      (SELECT json_agg(pm.url ORDER BY pm.sort_order, pm.created_at)
       FROM public.publication_media pm WHERE pm.publication_id = p.id),
      '[]'::json
    ) AS images
  FROM public.publications p
  JOIN public.users u ON u.id = p.owner_id
  JOIN public.lost_pet_publications lp ON lp.publication_id = p.id
`;

function mapLostPet(row) {
  const statusLabels = { active: 'Activo', found: 'Encontrado', closed: 'Cerrado' };
  const images = Array.isArray(row.images) ? row.images : [];

  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatarUrl: row.owner_avatar_url,
    name: row.pet_name,
    type: row.species,
    breed: row.breed,
    sex: row.sex,
    size: row.size,
    zone: row.zone,
    status: statusLabels[row.search_status] ?? row.search_status,
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    lastSeen: row.last_seen_at,
    description: row.description,
    imageUrl: images[0] ?? row.image_url,
    images: images.length ? images : [row.image_url].filter(Boolean),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLostPets({ query: search, status } = {}) {
  const values = [];
  const filters = [`p.moderation_status = 'approved'`];

  if (search) {
    values.push(`%${String(search).trim()}%`);
    filters.push(
      `(lp.pet_name ILIKE $${values.length} OR lp.species ILIKE $${values.length}
        OR lp.zone ILIKE $${values.length} OR lp.breed ILIKE $${values.length})`,
    );
  }

  if (status) {
    const statusMap = { activo: 'active', encontrado: 'found', cerrado: 'closed' };
    const normalizedStatus = String(status).toLowerCase();
    values.push(statusMap[normalizedStatus] ?? normalizedStatus);
    filters.push(`lp.search_status = $${values.length}`);
  }

  const result = await query(
    `${selectLostPets} WHERE ${filters.join(' AND ')} ORDER BY p.approved_at DESC`,
    values,
  );
  return result.rows.map(mapLostPet);
}

export async function getLostPet(id, user) {
  const values = [id];
  let access = `p.moderation_status = 'approved'`;

  if (user) {
    values.push(user.id, user.role === 'admin');
    access = `(p.moderation_status = 'approved' OR p.owner_id = $2 OR $3 = true)`;
  }

  const result = await query(
    `${selectLostPets} WHERE p.id = $1 AND ${access}`,
    values,
  );
  if (!result.rows[0]) throw httpError(404, 'Publicacion de mascota perdida no encontrada.');
  return mapLostPet(result.rows[0]);
}

export async function getMyLostPets(userId) {
  const result = await query(
    `${selectLostPets} WHERE p.owner_id = $1 ORDER BY p.created_at DESC`,
    [userId],
  );
  return result.rows.map(mapLostPet);
}

export async function createLostPet(payload, user) {
  const name = validateText(payload.name, 'Nombre', { min: 2, max: 100 });
  const species = validateText(payload.type, 'Tipo', { min: 2, max: 60 });
  const zone = validateText(payload.zone, 'Zona', { min: 2, max: 160 });
  const description = validateText(payload.description, 'Descripcion', { min: 10, max: 3000 });
  const lastSeenAt = parseDate(payload.lastSeen, 'Ultima vez visto');
  const contactName = optionalText(payload.contactName, 'Nombre de contacto', 120) ?? user.name;
  const contactPhone = validateText(payload.contactPhone, 'Telefono', { min: 6, max: 30 });
  const images = normalizeImageUrls(payload);

  return withTransaction(async (client) => {
    const publicationId = await createPublication(client, {
      owner: user,
      type: 'lost_pet',
      title: `Mascota perdida: ${name}`,
      description,
    });

    await client.query(
      `INSERT INTO public.lost_pet_publications (
         publication_id, pet_name, species, breed, sex, size, zone, last_seen_at,
         contact_name, contact_phone, image_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        publicationId,
        name,
        species,
        optionalText(payload.breed, 'Raza', 100),
        optionalText(payload.sex, 'Sexo', 20),
        optionalText(payload.size, 'Tamano', 30),
        zone,
        lastSeenAt,
        contactName,
        contactPhone,
        images[0],
      ],
    );
    await replacePublicationMedia(client, publicationId, images);

    const result = await client.query(`${selectLostPets} WHERE p.id = $1`, [publicationId]);
    return mapLostPet(result.rows[0]);
  });
}

export async function updateLostPet(id, payload, user) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `${selectLostPets} WHERE p.id = $1 AND p.owner_id = $2 FOR UPDATE`,
      [id, user.id],
    );
    if (!current.rows[0]) {
      throw httpError(404, 'Mascota perdida no encontrada o no pertenece al usuario.');
    }

    const row = current.rows[0];
    const name = payload.name === undefined
      ? row.pet_name
      : validateText(payload.name, 'Nombre', { min: 2, max: 100 });
    const description = payload.description === undefined
      ? row.description
      : validateText(payload.description, 'Descripcion', { min: 10, max: 3000 });
    const statusMap = {
      activo: 'active', active: 'active', encontrado: 'found',
      found: 'found', cerrado: 'closed', closed: 'closed',
    };
    const searchStatus = payload.status
      ? statusMap[String(payload.status).trim().toLowerCase()]
      : null;
    if (payload.status && !searchStatus) throw httpError(400, 'Estado de busqueda invalido.');

    await client.query(
      `UPDATE public.publications SET title = $3, description = $4
       WHERE id = $1 AND owner_id = $2`,
      [id, user.id, `Mascota perdida: ${name}`, description],
    );
    await client.query(
      `UPDATE public.lost_pet_publications
       SET pet_name = $2, species = COALESCE($3, species),
           breed = COALESCE($4, breed), sex = COALESCE($5, sex),
           size = COALESCE($6, size), zone = COALESCE($7, zone),
           last_seen_at = COALESCE($8, last_seen_at),
           contact_name = COALESCE($9, contact_name),
           contact_phone = COALESCE($10, contact_phone),
           image_url = COALESCE($11, image_url),
           search_status = COALESCE($12, search_status)
       WHERE publication_id = $1`,
      [
        id,
        name,
        payload.type ? validateText(payload.type, 'Tipo', { min: 2, max: 60 }) : null,
        optionalText(payload.breed, 'Raza', 100),
        optionalText(payload.sex, 'Sexo', 20),
        optionalText(payload.size, 'Tamano', 30),
        payload.zone ? validateText(payload.zone, 'Zona', { min: 2, max: 160 }) : null,
        payload.lastSeen ? parseDate(payload.lastSeen, 'Ultima vez visto') : null,
        optionalText(payload.contactName, 'Nombre de contacto', 120),
        payload.contactPhone
          ? validateText(payload.contactPhone, 'Telefono', { min: 6, max: 30 })
          : null,
        Array.isArray(payload.imageUrls) && payload.imageUrls.length
          ? normalizeImageUrls(payload, row.image_url)[0]
          : null,
        searchStatus,
      ],
    );

    if (Array.isArray(payload.imageUrls)) {
      await replacePublicationMedia(client, id, normalizeImageUrls(payload, row.image_url));
    }
    await restoreAdminApproval(client, id, user);

    const result = await client.query(`${selectLostPets} WHERE p.id = $1`, [id]);
    return mapLostPet(result.rows[0]);
  });
}

export async function deleteLostPet(id, user) {
  const result = await query(
    `DELETE FROM public.publications
     WHERE id = $1 AND owner_id = $2 AND type = 'lost_pet'
     RETURNING id`,
    [id, user.id],
  );
  if (!result.rows[0]) {
    throw httpError(404, 'Mascota perdida no encontrada o no pertenece al usuario.');
  }
}
