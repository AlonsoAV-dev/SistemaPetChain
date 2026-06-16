import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as eventsController from './events.controller.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(eventsController.listEvents));
router.get('/:id', optionalAuth, asyncHandler(eventsController.getEvent));
router.post('/', requireAuth, requireAdmin, asyncHandler(eventsController.createEvent));
router.post('/:id/attend', requireAuth, asyncHandler(eventsController.attendEvent));

export default router;

