import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as mediaController from './media.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

router.post(
  '/images',
  requireAuth,
  upload.single('image'),
  asyncHandler(mediaController.uploadImage),
);

export default router;
