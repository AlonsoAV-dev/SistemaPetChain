import { httpError } from './httpError.js';
import { validateUrl } from './validation.js';

export async function createPublication(
  client,
  { owner, type, title, description, autoApproveAdmin = true },
) {
  const isAdmin = owner.role === 'admin' && autoApproveAdmin;
  const result = await client.query(
    `INSERT INTO public.publications (
       owner_id, type, title, description, moderation_status,
       reviewed_by, reviewed_at, approved_at, points_processed_at
     )
     VALUES (
       $1, $2::public.publication_type, $3, $4,
       CASE WHEN $5 THEN 'approved'::public.moderation_status ELSE 'pending'::public.moderation_status END,
       CASE WHEN $5::boolean THEN $1::uuid ELSE NULL::uuid END,
       CASE WHEN $5 THEN now() ELSE NULL END,
       CASE WHEN $5 THEN now() ELSE NULL END,
       CASE WHEN $5 THEN now() ELSE NULL END
     )
     RETURNING id`,
    [owner.id, type, title, description, isAdmin],
  );

  return result.rows[0].id;
}

export function normalizeImageUrls(payload, fallbackUrl = null) {
  const rawUrls = Array.isArray(payload.imageUrls)
    ? payload.imageUrls
    : [payload.imageUrl ?? fallbackUrl].filter(Boolean);
  const urls = [...new Set(rawUrls.map((url) => validateUrl(url, 'URL de imagen')).filter(Boolean))];

  if (urls.length === 0) {
    throw httpError(400, 'Debes adjuntar al menos una imagen.');
  }

  if (urls.length > 6) {
    throw httpError(400, 'Puedes adjuntar como maximo 6 imagenes.');
  }

  return urls;
}

export async function replacePublicationMedia(client, publicationId, urls) {
  await client.query(
    `DELETE FROM public.publication_media WHERE publication_id = $1`,
    [publicationId],
  );

  for (const [index, url] of urls.entries()) {
    await client.query(
      `INSERT INTO public.publication_media (publication_id, url, sort_order)
       VALUES ($1, $2, $3)`,
      [publicationId, url, index],
    );
  }
}

export async function restoreAdminApproval(client, publicationId, user) {
  if (user.role !== 'admin') return;

  await client.query(
    `UPDATE public.publications
     SET moderation_status = 'approved',
         rejection_reason = NULL,
         reviewed_by = $2,
         reviewed_at = now(),
         approved_at = COALESCE(approved_at, now()),
         points_processed_at = COALESCE(points_processed_at, now())
     WHERE id = $1 AND owner_id = $2`,
    [publicationId, user.id],
  );
}
