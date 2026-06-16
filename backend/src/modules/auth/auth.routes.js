import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authController from './auth.controller.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos de acceso. Intenta nuevamente mas tarde.' } },
});

router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/register', authLimiter, asyncHandler(authController.register));
router.get('/me', requireAuth, asyncHandler(authController.me));
router.patch('/me', requireAuth, asyncHandler(authController.updateProfile));

export default router;

