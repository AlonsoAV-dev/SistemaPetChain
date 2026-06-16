import * as adoptionsService from './adoptions.service.js';
import { requireFields } from '../../utils/request.js';

export async function listAdoptions(req, res) {
  const data = await adoptionsService.getAdoptionPets(req.query);

  res.json({ data });
}

export async function getAdoption(req, res) {
  res.json({ data: await adoptionsService.getAdoptionPet(req.params.id, req.user) });
}

export async function listMyAdoptions(req, res) {
  const data = await adoptionsService.getMyAdoptionPets(req.user.id);
  res.json({ data });
}

export async function createAdoption(req, res) {
  requireFields(req.body, ['name', 'type', 'age', 'personality', 'contactPhone']);
  const data = await adoptionsService.createAdoptionPet(req.body, req.user);

  res.status(201).json({ data });
}

export async function updateAdoption(req, res) {
  const data = await adoptionsService.updateAdoptionPet(req.params.id, req.body, req.user);

  res.json({ data });
}

export async function deleteAdoption(req, res) {
  await adoptionsService.deleteAdoptionPet(req.params.id, req.user);
  res.status(204).end();
}

