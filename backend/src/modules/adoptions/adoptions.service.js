import { query, withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/httpError.js';
import {
  createPublication,
  normalizeImageUrls,
  replacePublicationMedia,
  restoreAdminApproval,
} from '../../utils/publications.js';
import { optionalText, validateText } from '../../utils/validation.js';

const selectAdoptions = `
  SELECT
    p.id, p.owner_id, p.description, p.moderation_status,
    p.rejection_reason, p.created_at, p.updated_at,
    u.name AS owner_name, u.avatar_url AS owner_avatar_url,
    ap.pet_name, ap.species, ap.age_label, ap.breed, ap.sex,
    ap.personality, ap.contact_name, ap.contact_phone, ap.image_url,
    ap.adoption_status, ap.vaccinated, ap.sterilized,
    COALESCE(
      (SELECT json_agg(pm.url ORDER BY pm.sort_order, pm.created_at)
       FROM public.publication_media pm WHERE pm.publication_id = p.id),
      '[]'::json
    ) AS images
  FROM public.publications p
  JOIN public.users u ON u.id = p.owner_id
  JOIN public.adoption_publications ap ON ap.publication_id = p.id
`;

function mapAdoption(row) {
  const statusLabels = {
    available: 'En adopcion',
    reserved: 'Reservado',
    adopted: 'Adoptado',
    closed: 'Cerrado',
  };
  const images = Array.isArray(row.images) ? row.images : [];

  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatarUrl: row.owner_avatar_url,
    name: row.pet_name,
    type: row.species,
    age: row.age_label,
    breed: row.breed,
    sex: row.sex,
    status: statusLabels[row.adoption_status] ?? row.adoption_status,
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    personality: row.personality,
    description: row.description,
    imageUrl: images[0] ?? row.image_url,
    images: images.length ? images : [row.image_url].filter(Boolean),
    vaccinated: row.vaccinated,
    sterilized: row.sterilized,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAdoptionPets({ query: search, status } = {}) {
  const values = [];
  const filters = [`p.moderation_status = 'approved'`];

  if (search) {
    values.push(`%${String(search).trim()}%`);
    filters.push(
      `(ap.pet_name ILIKE $${values.length} OR ap.species ILIKE $${values.length}
        OR ap.personality ILIKE $${values.length} OR ap.breed ILIKE $${values.length})`,
    );
  }

  if (status) {
    const statusMap = {
      'en adopcion': 'available', reservado: 'reserved',
      adoptado: 'adopted', cerrado: 'closed',
    };
    const normalizedStatus = String(status).toLowerCase();
    values.push(statusMap[normalizedStatus] ?? normalizedStatus);
    filters.push(`ap.adoption_status = $${values.length}`);
  }

  const result = await query(
    `${selectAdoptions} WHERE ${filters.join(' AND ')} ORDER BY p.approved_at DESC`,
    values,
  );
  return result.rows.map(mapAdoption);
}

export async function getAdoptionPet(id, user) {
  const values = [id];
  let access = `p.moderation_status = 'approved'`;
  if (user) {
    values.push(user.id, user.role === 'admin');
    access = `(p.moderation_status = 'approved' OR p.owner_id = $2 OR $3 = true)`;
  }

  const result = await query(`${selectAdoptions} WHERE p.id = $1 AND ${access}`, values);
  if (!result.rows[0]) throw httpError(404, 'Publicacion de adopcion no encontrada.');
  return mapAdoption(result.rows[0]);
}

export async function getMyAdoptionPets(userId) {
  const result = await query(
    `${selectAdoptions} WHERE p.owner_id = $1 ORDER BY p.created_at DESC`,
    [userId],
  );
  return result.rows.map(mapAdoption);
}

export async function createAdoptionPet(payload, user) {
  const name = validateText(payload.name, 'Nombre', { min: 2, max: 100 });
  const species = validateText(payload.type, 'Tipo', { min: 2, max: 60 });
  const age = validateText(payload.age, 'Edad', { min: 1, max: 60 });
  const personality = validateText(payload.personality, 'Personalidad', { min: 3, max: 1000 });
  const description = validateText(
    payload.description ?? `Mascota ${species} disponible para adopcion responsable.`,
    'Descripcion',
    { min: 10, max: 3000 },
  );
  const contactName = optionalText(payload.contactName, 'Nombre de contacto', 120) ?? user.name;
  const contactPhone = validateText(payload.contactPhone, 'Telefono', { min: 6, max: 30 });
  const images = normalizeImageUrls(payload);

  return withTransaction(async (client) => {
    const publicationId = await createPublication(client, {
      owner: user,
      type: 'adoption',
      title: `Adopcion: ${name}`,
      description,
    });

    await client.query(
      `INSERT INTO public.adoption_publications (
         publication_id, pet_name, species, age_label, breed, sex, personality,
         contact_name, contact_phone, image_url, vaccinated, sterilized
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        publicationId, name, species, age,
        optionalText(payload.breed, 'Raza', 100),
        optionalText(payload.sex, 'Sexo', 20),
        personality, contactName, contactPhone, images[0],
        Boolean(payload.vaccinated), Boolean(payload.sterilized),
      ],
    );
    await replacePublicationMedia(client, publicationId, images);

    const result = await client.query(`${selectAdoptions} WHERE p.id = $1`, [publicationId]);
    return mapAdoption(result.rows[0]);
  });
}

export async function updateAdoptionPet(id, payload, user) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `${selectAdoptions} WHERE p.id = $1 AND p.owner_id = $2 FOR UPDATE`,
      [id, user.id],
    );
    if (!current.rows[0]) {
      throw httpError(404, 'Adopcion no encontrada o no pertenece al usuario.');
    }

    const row = current.rows[0];
    const name = payload.name === undefined
      ? row.pet_name
      : validateText(payload.name, 'Nombre', { min: 2, max: 100 });
    const description = payload.description === undefined
      ? row.description
      : validateText(payload.description, 'Descripcion', { min: 10, max: 3000 });
    const statusMap = {
      'en adopcion': 'available', available: 'available',
      reservado: 'reserved', reserved: 'reserved',
      adoptado: 'adopted', adopted: 'adopted',
      cerrado: 'closed', closed: 'closed',
    };
    const adoptionStatus = payload.status
      ? statusMap[String(payload.status).trim().toLowerCase()]
      : null;
    if (payload.status && !adoptionStatus) throw httpError(400, 'Estado de adopcion invalido.');

    await client.query(
      `UPDATE public.publications SET title = $3, description = $4
       WHERE id = $1 AND owner_id = $2`,
      [id, user.id, `Adopcion: ${name}`, description],
    );
    await client.query(
      `UPDATE public.adoption_publications
       SET pet_name = $2, species = COALESCE($3, species),
           age_label = COALESCE($4, age_label), breed = COALESCE($5, breed),
           sex = COALESCE($6, sex), personality = COALESCE($7, personality),
           contact_name = COALESCE($8, contact_name),
           contact_phone = COALESCE($9, contact_phone),
           image_url = COALESCE($10, image_url),
           adoption_status = COALESCE($11, adoption_status),
           vaccinated = COALESCE($12, vaccinated),
           sterilized = COALESCE($13, sterilized)
       WHERE publication_id = $1`,
      [
        id, name,
        payload.type ? validateText(payload.type, 'Tipo', { min: 2, max: 60 }) : null,
        payload.age ? validateText(payload.age, 'Edad', { min: 1, max: 60 }) : null,
        optionalText(payload.breed, 'Raza', 100),
        optionalText(payload.sex, 'Sexo', 20),
        payload.personality
          ? validateText(payload.personality, 'Personalidad', { min: 3, max: 1000 })
          : null,
        optionalText(payload.contactName, 'Nombre de contacto', 120),
        payload.contactPhone
          ? validateText(payload.contactPhone, 'Telefono', { min: 6, max: 30 })
          : null,
        Array.isArray(payload.imageUrls) && payload.imageUrls.length
          ? normalizeImageUrls(payload, row.image_url)[0]
          : null,
        adoptionStatus,
        payload.vaccinated === undefined ? null : Boolean(payload.vaccinated),
        payload.sterilized === undefined ? null : Boolean(payload.sterilized),
      ],
    );

    if (Array.isArray(payload.imageUrls)) {
      await replacePublicationMedia(client, id, normalizeImageUrls(payload, row.image_url));
    }
    await restoreAdminApproval(client, id, user);

    const result = await client.query(`${selectAdoptions} WHERE p.id = $1`, [id]);
    return mapAdoption(result.rows[0]);
  });
}

export async function deleteAdoptionPet(id, user) {
  const result = await query(
    `DELETE FROM public.publications
     WHERE id = $1 AND owner_id = $2 AND type = 'adoption'
     RETURNING id`,
    [id, user.id],
  );
  if (!result.rows[0]) {
    throw httpError(404, 'Adopcion no encontrada o no pertenece al usuario.');
  }
}
