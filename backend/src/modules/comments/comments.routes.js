import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as commentsController from './comments.controller.js';

const router = Router();

router.get('/publication/:publicationId', asyncHandler(commentsController.listComments));
router.post(
  '/publication/:publicationId',
  requireAuth,
  asyncHandler(commentsController.createComment),
);
router.patch('/:id', requireAuth, asyncHandler(commentsController.updateComment));
router.delete('/:id', requireAuth, asyncHandler(commentsController.deleteComment));

export default router;
