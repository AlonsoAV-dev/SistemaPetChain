import * as lostPetsService from './lostPets.service.js';
import { requireFields } from '../../utils/request.js';

export function listLostPets(req, res) {
  const data = lostPetsService.getLostPets(req.query);

  res.json({ data });
}

export function createLostPet(req, res) {
  requireFields(req.body, ['name', 'type', 'zone', 'lastSeen', 'description']);
  const data = lostPetsService.createLostPet(req.body, req.user);

  res.status(201).json({ data });
}

export function updateLostPet(req, res) {
  const data = lostPetsService.updateLostPet(req.params.id, req.body);

  res.json({ data });
}

