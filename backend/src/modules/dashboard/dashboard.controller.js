import * as dashboardService from './dashboard.service.js';

export async function getDashboard(req, res) {
  res.json({ data: await dashboardService.getDashboard(req.user.id) });
}

export async function getSummary(req, res) {
  res.json({ data: await dashboardService.getSummary(req.user.id) });
}

export async function getActivity(req, res) {
  res.json({ data: await dashboardService.getActivity(req.user.id) });
}

