import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminController from './admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/moderation', asyncHandler(adminController.listModerationItems));
router.patch('/moderation/:id', asyncHandler(adminController.updateModerationItem));

export default router;

