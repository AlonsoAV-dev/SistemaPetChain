import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as lostPetsController from './lostPets.controller.js';

const router = Router();

router.get('/', asyncHandler(lostPetsController.listLostPets));
router.get('/mine', requireAuth, asyncHandler(lostPetsController.listMyLostPets));
router.get('/:id', optionalAuth, asyncHandler(lostPetsController.getLostPet));
router.post('/', requireAuth, asyncHandler(lostPetsController.createLostPet));
router.patch('/:id', requireAuth, asyncHandler(lostPetsController.updateLostPet));
router.delete('/:id', requireAuth, asyncHandler(lostPetsController.deleteLostPet));

export default router;

