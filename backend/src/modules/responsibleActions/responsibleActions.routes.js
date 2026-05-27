import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as actionsController from './responsibleActions.controller.js';

const router = Router();

router.get('/', asyncHandler(actionsController.listActions));
router.post('/', requireAuth, asyncHandler(actionsController.createAction));
router.post('/:id/like', requireAuth, asyncHandler(actionsController.likeAction));

export default router;

