import { createRecord, findById, list, updateRecord } from '../../data/store.js';
import { httpError } from '../../utils/httpError.js';

export function getLostPets({ query, status } = {}) {
  return list('lostPets').filter((pet) => {
    const matchesQuery = query
      ? `${pet.name} ${pet.type} ${pet.zone}`.toLowerCase().includes(query.toLowerCase())
      : true;
    const matchesStatus = status ? pet.status.toLowerCase() === status.toLowerCase() : true;

    return matchesQuery && matchesStatus;
  });
}

export function createLostPet(payload, user) {
  return createRecord('lostPets', {
    name: payload.name,
    type: payload.type,
    zone: payload.zone,
    status: payload.status ?? 'Activo',
    contactName: payload.contactName ?? user.name,
    contactPhone: payload.contactPhone ?? null,
    lastSeen: payload.lastSeen,
    description: payload.description,
    imageUrl: payload.imageUrl ?? null,
    createdBy: user.id,
  });
}

export function updateLostPet(id, payload) {
  const pet = findById('lostPets', id);

  if (!pet) {
    throw httpError(404, 'Mascota perdida no encontrada.');
  }

  return updateRecord('lostPets', id, payload);
}

