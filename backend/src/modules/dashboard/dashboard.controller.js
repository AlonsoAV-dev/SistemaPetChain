import * as dashboardService from './dashboard.service.js';

export function getDashboard(_req, res) {
  res.json({ data: dashboardService.getDashboard() });
}

export function getSummary(_req, res) {
  res.json({ data: dashboardService.getSummary() });
}

export function getActivity(_req, res) {
  res.json({ data: dashboardService.getActivity() });
}

