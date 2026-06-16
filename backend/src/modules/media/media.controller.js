import * as mediaService from './media.service.js';

export async function uploadImage(req, res) {
  const data = await mediaService.uploadImage(req.file, req.user, req.body?.folder);
  res.status(201).json({ data });
}
