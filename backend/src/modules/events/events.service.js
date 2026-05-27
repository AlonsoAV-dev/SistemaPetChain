import { createRecord, list } from '../../data/store.js';

export function getEvents() {
  return list('events');
}

export function createEvent(payload) {
  return createRecord('events', {
    title: payload.title,
    date: payload.date,
    location: payload.location,
    participants: Number(payload.participants ?? 0),
  });
}

