import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adoptionsController from './adoptions.controller.js';

const router = Router();

router.get('/', asyncHandler(adoptionsController.listAdoptions));
router.get('/mine', requireAuth, asyncHandler(adoptionsController.listMyAdoptions));
router.get('/:id', optionalAuth, asyncHandler(adoptionsController.getAdoption));
router.post('/', requireAuth, asyncHandler(adoptionsController.createAdoption));
router.patch('/:id', requireAuth, asyncHandler(adoptionsController.updateAdoption));
router.delete('/:id', requireAuth, asyncHandler(adoptionsController.deleteAdoption));

export default router;

