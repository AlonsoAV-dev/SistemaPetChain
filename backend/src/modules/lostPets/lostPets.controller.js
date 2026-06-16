import * as lostPetsService from './lostPets.service.js';
import { requireFields } from '../../utils/request.js';

export async function listLostPets(req, res) {
  const data = await lostPetsService.getLostPets(req.query);

  res.json({ data });
}

export async function getLostPet(req, res) {
  res.json({ data: await lostPetsService.getLostPet(req.params.id, req.user) });
}

export async function listMyLostPets(req, res) {
  const data = await lostPetsService.getMyLostPets(req.user.id);
  res.json({ data });
}

export async function createLostPet(req, res) {
  requireFields(req.body, ['name', 'type', 'zone', 'lastSeen', 'description', 'contactPhone']);
  const data = await lostPetsService.createLostPet(req.body, req.user);

  res.status(201).json({ data });
}

export async function updateLostPet(req, res) {
  const data = await lostPetsService.updateLostPet(req.params.id, req.body, req.user);

  res.json({ data });
}

export async function deleteLostPet(req, res) {
  await lostPetsService.deleteLostPet(req.params.id, req.user);
  res.status(204).end();
}

