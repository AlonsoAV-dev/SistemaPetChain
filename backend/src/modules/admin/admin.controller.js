import * as adminService from './admin.service.js';

export async function listModerationItems(_req, res) {
  res.json({ data: await adminService.getModerationItems() });
}

export async function updateModerationItem(req, res) {
  const data = await adminService.updateModerationItem(
    req.params.id,
    req.body,
    req.user.id,
  );

  res.json({ data });
}

export async function listPublications(req, res) {
  res.json({ data: await adminService.listPublications(req.query) });
}

export async function listComments(req, res) {
  res.json({ data: await adminService.listComments(req.query) });
}

export async function deleteComment(req, res) {
  await adminService.deleteComment(req.params.id);
  res.status(204).end();
}

export async function correctPublicationPoints(req, res) {
  res.json({ data: await adminService.correctPublicationPoints(req.params.id, req.body, req.user.id) });
}

export async function listUsers(req, res) {
  res.json({ data: await adminService.listUsers(req.query) });
}

export async function createUser(req, res) {
  res.status(201).json({ data: await adminService.createUser(req.body) });
}

export async function updateUserStatus(req, res) {
  const data = await adminService.updateUserStatus(
    req.params.id,
    req.body?.status,
    req.user.id,
  );
  res.json({ data });
}

export async function getSummary(_req, res) {
  res.json({ data: await adminService.getSummary() });
}

export async function listRewardPeriods(_req, res) {
  res.json({ data: await adminService.listRewardPeriods() });
}

export async function updateRewardPeriod(req, res) {
  res.json({ data: await adminService.editRewardPeriod(req.params.id, req.body) });
}

export async function drawRewardPeriod(req, res) {
  res.json({ data: await adminService.runRewardDraw(req.params.id, req.user.id) });
}

