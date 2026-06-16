import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { storageClient } from '../../config/storage.js';
import { httpError } from '../../utils/httpError.js';

const extensionByMime = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function uploadImage(file, user, folder = 'publications') {
  if (!storageClient) {
    throw httpError(503, 'Supabase Storage no esta configurado.');
  }

  if (!file) {
    throw httpError(400, 'Debes seleccionar una imagen.');
  }

  const extension = extensionByMime[file.mimetype];
  if (!extension) {
    throw httpError(400, 'Solo se permiten imagenes JPEG, PNG o WEBP.');
  }

  const allowedFolders = new Set(['avatars', 'publications', 'evidence']);
  const safeFolder = allowedFolders.has(folder) ? folder : 'publications';
  const objectPath = `${safeFolder}/${user.id}/${randomUUID()}.${extension}`;

  const { error } = await storageClient.storage
    .from(env.storageBucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw httpError(502, `No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = storageClient.storage.from(env.storageBucket).getPublicUrl(objectPath);

  return {
    path: objectPath,
    url: data.publicUrl,
    bucket: env.storageBucket,
  };
}
