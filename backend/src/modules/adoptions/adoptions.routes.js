import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adoptionsController from './adoptions.controller.js';

const router = Router();

router.get('/', asyncHandler(adoptionsController.listAdoptions));
router.post('/', requireAuth, asyncHandler(adoptionsController.createAdoption));
router.patch('/:id', requireAuth, asyncHandler(adoptionsController.updateAdoption));

export default router;

