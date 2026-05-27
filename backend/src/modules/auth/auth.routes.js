import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.get('/me', requireAuth, asyncHandler(authController.me));
router.patch('/me', requireAuth, asyncHandler(authController.updateProfile));

export default router;

