import * as interactionsService from './interactions.service.js';

export async function listNotifications(req, res) {
  res.json({ data: await interactionsService.listNotifications(req.user.id) });
}

export async function markNotificationRead(req, res) {
  res.json({
    data: await interactionsService.markNotificationRead(req.params.id, req.user.id),
  });
}

export async function createAdoptionRequest(req, res) {
  res.status(201).json({
    data: await interactionsService.createAdoptionRequest(
      req.params.publicationId,
      req.body,
      req.user,
    ),
  });
}

export async function listAdoptionRequests(req, res) {
  res.json({
    data: await interactionsService.listAdoptionRequests(
      req.params.publicationId,
      req.user,
    ),
  });
}

export async function updateAdoptionRequest(req, res) {
  res.json({
    data: await interactionsService.updateAdoptionRequest(
      req.params.id,
      req.body?.status,
      req.user,
    ),
  });
}

export async function createLostPetReport(req, res) {
  res.status(201).json({
    data: await interactionsService.createLostPetReport(
      req.params.publicationId,
      req.body,
      req.user,
    ),
  });
}

export async function listLostPetReports(req, res) {
  res.json({
    data: await interactionsService.listLostPetReports(
      req.params.publicationId,
      req.user,
    ),
  });
}

export async function updateLostPetReport(req, res) {
  res.json({
    data: await interactionsService.updateLostPetReport(
      req.params.id,
      req.body?.status,
      req.user,
    ),
  });
}
