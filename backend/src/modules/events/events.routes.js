import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as eventsController from './events.controller.js';

const router = Router();

router.get('/', asyncHandler(eventsController.listEvents));
router.post('/', requireAuth, requireAdmin, asyncHandler(eventsController.createEvent));

export default router;

