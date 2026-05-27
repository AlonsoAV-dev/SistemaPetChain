import { createRecord, findById, list, updateRecord } from '../../data/store.js';
import { httpError } from '../../utils/httpError.js';

export function getAdoptionPets({ query, status } = {}) {
  return list('adoptionPets').filter((pet) => {
    const matchesQuery = query
      ? `${pet.name} ${pet.type} ${pet.personality}`.toLowerCase().includes(query.toLowerCase())
      : true;
    const matchesStatus = status ? pet.status.toLowerCase() === status.toLowerCase() : true;

    return matchesQuery && matchesStatus;
  });
}

export function createAdoptionPet(payload, user) {
  return createRecord('adoptionPets', {
    name: payload.name,
    type: payload.type,
    age: payload.age,
    status: payload.status ?? 'En adopcion',
    contactName: payload.contactName ?? user.name,
    personality: payload.personality,
    imageUrl: payload.imageUrl ?? null,
    createdBy: user.id,
  });
}

export function updateAdoptionPet(id, payload) {
  const pet = findById('adoptionPets', id);

  if (!pet) {
    throw httpError(404, 'Mascota en adopcion no encontrada.');
  }

  return updateRecord('adoptionPets', id, payload);
}

