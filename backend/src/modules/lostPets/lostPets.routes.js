import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as lostPetsController from './lostPets.controller.js';

const router = Router();

router.get('/', asyncHandler(lostPetsController.listLostPets));
router.post('/', requireAuth, asyncHandler(lostPetsController.createLostPet));
router.patch('/:id', requireAuth, asyncHandler(lostPetsController.updateLostPet));

export default router;

