import * as eventsService from './events.service.js';
import { requireFields } from '../../utils/request.js';

export async function listEvents(req, res) {
  res.json({ data: await eventsService.getEvents(req.user?.id ?? null) });
}

export async function getEvent(req, res) {
  res.json({ data: await eventsService.getEvent(req.params.id, req.user?.id ?? null) });
}

export async function createEvent(req, res) {
  requireFields(req.body, ['title', 'date', 'location']);
  const data = await eventsService.createEvent(req.body, req.user);

  res.status(201).json({ data });
}

export async function attendEvent(req, res) {
  res.json({ data: await eventsService.registerAttendance(req.params.id, req.user) });
}

