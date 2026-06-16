import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as articlesController from './articles.controller.js';

const router = Router();

router.get('/', asyncHandler(articlesController.listArticles));
router.get('/:id', asyncHandler(articlesController.getArticle));

export default router;

