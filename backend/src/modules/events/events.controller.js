import * as eventsService from './events.service.js';
import { requireFields } from '../../utils/request.js';

export function listEvents(_req, res) {
  res.json({ data: eventsService.getEvents() });
}

export function createEvent(req, res) {
  requireFields(req.body, ['title', 'date', 'location']);
  const data = eventsService.createEvent(req.body);

  res.status(201).json({ data });
}

