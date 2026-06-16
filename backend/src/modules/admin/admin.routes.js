import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminController from './admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/moderation', asyncHandler(adminController.listModerationItems));
router.patch('/moderation/:id', asyncHandler(adminController.updateModerationItem));
router.get('/publications', asyncHandler(adminController.listPublications));
router.get('/comments', asyncHandler(adminController.listComments));
router.delete('/comments/:id', asyncHandler(adminController.deleteComment));
router.get('/users', asyncHandler(adminController.listUsers));
router.post('/users', asyncHandler(adminController.createUser));
router.patch('/users/:id/status', asyncHandler(adminController.updateUserStatus));
router.get('/summary', asyncHandler(adminController.getSummary));

export default router;

