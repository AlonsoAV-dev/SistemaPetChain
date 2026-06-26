import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as articlesController from './articles.controller.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(articlesController.listArticles));
router.get('/:id', optionalAuth, asyncHandler(articlesController.getArticle));
router.post('/', requireAuth, requireAdmin, asyncHandler(articlesController.createArticle));
router.patch('/:id', requireAuth, requireAdmin, asyncHandler(articlesController.updateArticle));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(articlesController.deleteArticle));

export default router;

