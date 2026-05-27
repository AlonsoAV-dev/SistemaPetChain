import * as adoptionsService from './adoptions.service.js';
import { requireFields } from '../../utils/request.js';

export function listAdoptions(req, res) {
  const data = adoptionsService.getAdoptionPets(req.query);

  res.json({ data });
}

export function createAdoption(req, res) {
  requireFields(req.body, ['name', 'type', 'age', 'personality']);
  const data = adoptionsService.createAdoptionPet(req.body, req.user);

  res.status(201).json({ data });
}

export function updateAdoption(req, res) {
  const data = adoptionsService.updateAdoptionPet(req.params.id, req.body);

  res.json({ data });
}

