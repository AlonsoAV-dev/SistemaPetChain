import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as actionsController from './responsibleActions.controller.js';

const router = Router();

router.get('/', asyncHandler(actionsController.listActions));
router.get('/mine', requireAuth, asyncHandler(actionsController.listMyActions));
router.get('/:id', optionalAuth, asyncHandler(actionsController.getAction));
router.post('/', requireAuth, asyncHandler(actionsController.createAction));
router.patch('/:id', requireAuth, asyncHandler(actionsController.updateAction));
router.delete('/:id', requireAuth, asyncHandler(actionsController.deleteAction));
router.post('/:id/like', requireAuth, asyncHandler(actionsController.likeAction));

export default router;

