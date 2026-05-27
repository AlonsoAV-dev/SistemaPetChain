import * as adminService from './admin.service.js';

export function listModerationItems(_req, res) {
  res.json({ data: adminService.getModerationItems() });
}

export function updateModerationItem(req, res) {
  const data = adminService.updateModerationItem(req.params.id, req.body);

  res.json({ data });
}

